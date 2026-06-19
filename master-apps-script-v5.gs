/**
 * Edura V4 Master License Server + Admin/Employee Backend
 *
 * Setup:
 * 1. Buat Google Sheet baru.
 * 2. Extensions -> Apps Script.
 * 3. Paste file ini.
 * 4. Save.
 * 5. Jalankan setupMasterSheet() sekali.
 * 6. Deploy -> New deployment -> Web app.
 *    Execute as: Me
 *    Who has access: Anyone with the link
 * 7. Web App URL itulah LICENSE SERVER URL.
 */
function setupMasterSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lic = getSheet(ss, '_licenses');
  lic.clear();
  lic.appendRow(['licenseCode','schoolName','schoolCode','status','plan','expiresAt','createdAt','notes']);
  lic.appendRow(['EDUPAY-DEMO-0001','Sekolah Demo','DEMO','active','starter','2099-12-31',new Date().toISOString(),'Lisensi contoh']);
  const db = getSheet(ss, '_database');
  db.clear();
  db.appendRow(['licenseCode','schoolCode','payload','updatedAt']);
  const log = getSheet(ss, '_log');
  log.clear();
  log.appendRow(['timestamp','licenseCode','action','status']);
}
function doGet(e) {
  const action = String(e.parameter.action || '').toLowerCase();
  if (action === 'loadadmin') return handleLoadAdmin(e);
  if (action === 'loademployee') return handleLoadEmployee(e);
  // Employee PWA uses JSONP for these actions so the browser can receive a fast ok/error response.
  if (action === 'employeecheckin') return jsonp(e, employeeCheckCore(e, 'checkin'));
  if (action === 'employeecheckout') return jsonp(e, employeeCheckCore(e, 'checkout'));
  if (action === 'employeerequest') return jsonp(e, employeeRequestCore(e));
  if (action === 'employeechangepassword') return jsonp(e, employeeChangePasswordCore(e));
  return jsonp(e, {ok:false,error:'Unknown GET action'});
}
function doPost(e) {
  const action = String(e.parameter.action || '').toLowerCase();
  if (action === 'saveadmin') return handleSaveAdmin(e);
  if (action === 'employeecheckin') return handleEmployeeCheck(e, 'checkin');
  if (action === 'employeecheckout') return handleEmployeeCheck(e, 'checkout');
  if (action === 'employeerequest') return handleEmployeeRequest(e);
  if (action === 'changeadmincredential') return handleChangeAdminCredential(e);
  return json({ok:false,error:'Unknown POST action'});
}
function handleLoadAdmin(e) {
  try {
    const license = validateLicense(clean(e.parameter.licenseCode));
    const rec = getPayload(license.licenseCode);
    writeLog(license.licenseCode, 'loadAdmin', 'OK');
    return jsonp(e, {ok:true, license:publicLicense(license), data:rec ? JSON.parse(rec.payload) : null, updatedAt: rec ? rec.updatedAt : null});
  } catch (err) { return jsonp(e, {ok:false,error:String(err.message || err)}); }
}

function normalizeDataBeforeSave(data) {
  data = data || {};
  data.employees = data.employees || [];
  const validEmployees = {};
  data.employees.forEach(e => { if (e && e.id) validEmployees[e.id] = true; });

  // Hapus record absensi milik karyawan yang sudah dihapus permanen.
  data.attendanceRecords = data.attendanceRecords || {};
  Object.keys(data.attendanceRecords).forEach(date => {
    Object.keys(data.attendanceRecords[date] || {}).forEach(empId => {
      if (!validEmployees[empId]) delete data.attendanceRecords[date][empId];
    });
    if (Object.keys(data.attendanceRecords[date] || {}).length === 0) delete data.attendanceRecords[date];
  });

  // Hapus request izin/sakit milik karyawan yang sudah dihapus permanen.
  data.attendanceRequests = (data.attendanceRequests || []).filter(r => validEmployees[r.employeeId]);

  // Hapus item payroll draft/final milik karyawan yang sudah dihapus permanen.
  data.locks = data.locks || {};
  Object.keys(data.locks).forEach(month => {
    data.locks[month].items = (data.locks[month].items || []).filter(item => validEmployees[item.id]);
  });
  return data;
}

function mergeServerLiveData(current, incoming) {
  if (!current) return incoming || {};
  incoming = incoming || {};
  const out = incoming;

  // Employee PWA dapat menulis absensi kapan saja. Admin yang sedang membuka data lama
  // tidak boleh menimpa absensi terbaru ketika autosync. Karena itu record server digabung,
  // kecuali admin memang memberi tombstone/hapus eksplisit.
  out.attendanceRecords = mergeAttendanceRecords(current.attendanceRecords || {}, incoming.attendanceRecords || {}, incoming._deletedAttendance || []);

  // Request izin/sakit juga digabung berdasarkan id, agar request dari karyawan tidak hilang
  // saat admin autosync dari cache lama.
  const reqMap = {};
  (current.attendanceRequests || []).forEach(r => { if (r && r.id) reqMap[r.id] = r; });
  (incoming.attendanceRequests || []).forEach(r => { if (r && r.id) reqMap[r.id] = Object.assign({}, reqMap[r.id] || {}, r); });
  out.attendanceRequests = Object.keys(reqMap).map(k => reqMap[k]);

  // Jika karyawan baru saja ganti password, jangan kembalikan hash lama dari admin cache.
  const curEmp = {};
  (current.employees || []).forEach(e => { if (e && e.id) curEmp[e.id] = e; });
  out.employees = (incoming.employees || []).map(e => {
    const old = curEmp[e.id];
    if (old && old.passwordChangedAt && (!e.passwordChangedAt || new Date(old.passwordChangedAt) > new Date(e.passwordChangedAt))) {
      e.employeePinHash = old.employeePinHash;
      e.passwordChangedAt = old.passwordChangedAt;
    }
    return e;
  });
  return out;
}

function mergeAttendanceRecords(existing, incoming, deleted) {
  const merged = JSON.parse(JSON.stringify(existing || {}));
  Object.keys(incoming || {}).forEach(date => {
    merged[date] = merged[date] || {};
    Object.keys(incoming[date] || {}).forEach(empId => {
      const inc = incoming[date][empId];
      const cur = merged[date][empId];
      if (!cur) { merged[date][empId] = inc; return; }
      const ti = new Date(inc.updatedAt || 0).getTime();
      const tc = new Date(cur.updatedAt || 0).getTime();
      if (!cur.updatedAt || ti >= tc) merged[date][empId] = Object.assign({}, cur, inc);
    });
  });
  (deleted || []).forEach(item => {
    const key = typeof item === 'string' ? item : (item.key || (item.date + '|' + item.employeeId));
    const parts = String(key).split('|');
    const date = parts[0], empId = parts[1];
    if (date && empId && merged[date]) {
      delete merged[date][empId];
      if (Object.keys(merged[date]).length === 0) delete merged[date];
    }
  });
  return merged;
}

function handleSaveAdmin(e) {
  try {
    const license = validateLicense(clean(e.parameter.licenseCode));
    const payload = e.parameter.payload || '';
    if (!payload) throw new Error('Missing payload');
    const incoming = JSON.parse(payload);
    const currentRec = getPayload(license.licenseCode);
    const current = currentRec && currentRec.payload ? JSON.parse(currentRec.payload) : null;
    let data = normalizeDataBeforeSave(mergeServerLiveData(current, incoming));
    savePayload(license, JSON.stringify(data));
    writeMirrorTabs(license, data);
    writeLog(license.licenseCode, 'saveAdmin', 'OK');
    return json({ok:true,updatedAt:new Date().toISOString()});
  } catch (err) { return json({ok:false,error:String(err.message || err)}); }
}
function handleLoadEmployee(e) {
  try {
    const license = validateLicense(clean(e.parameter.licenseCode));
    const nip = clean(e.parameter.nip);
    const pinHash = clean(e.parameter.pinHash);
    const data = loadDataOrFail(license.licenseCode);
    const emp = findEmployee(data, nip, pinHash);
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const month = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');
    const records = data.attendanceRecords || {};
    const todayRecord = records[today] ? records[today][emp.id] || null : null;
    const history = [];
    Object.keys(records).sort().reverse().slice(0, 45).forEach(date => {
      const r = records[date][emp.id];
      if (r) history.push(Object.assign({date:date}, r));
    });
    const slip = getEmployeeSlip(data, emp.id, month);
    writeLog(license.licenseCode, 'loadEmployee', 'OK ' + nip);
    return jsonp(e, {ok:true, school:(data.settings||{}).school, employee:publicEmployee(emp, data), todayRecord, history, slip, attendanceRules:data.attendanceRules || {}});
  } catch (err) { return jsonp(e, {ok:false,error:String(err.message || err)}); }
}
function handleEmployeeCheck(e, mode) {
  return json(employeeCheckCore(e, mode));
}
function employeeCheckCore(e, mode) {
  try {
    const license = validateLicense(clean(e.parameter.licenseCode));
    const data = loadDataOrFail(license.licenseCode);
    const emp = findEmployee(data, clean(e.parameter.nip), clean(e.parameter.pinHash));
    const lat = Number(e.parameter.lat), lng = Number(e.parameter.lng), accuracy = Number(e.parameter.accuracy || 9999);
    const rules = data.attendanceRules || {};
    if (!lat || !lng) throw new Error('Koordinat GPS tidak valid');
    const locations = getAttendanceLocations(rules);
    if (!locations.length) throw new Error('Titik lokasi absensi belum diatur admin');
    const checked = locations.map(loc => Object.assign({}, loc, {distance: distanceMeters(lat, lng, Number(loc.lat), Number(loc.lng))})).sort((a,b)=>a.distance-b.distance);
    const nearest = checked[0];
    const dist = nearest.distance;
    const allowed = checked.find(loc => loc.distance <= Number(loc.radiusMeters || rules.radiusMeters || 80));
    const activeLoc = allowed || nearest;
    const now = new Date();
    const date = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const time = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm');
    data.attendanceRecords = data.attendanceRecords || {};
    data.attendanceRecords[date] = data.attendanceRecords[date] || {};
    let rec = data.attendanceRecords[date][emp.id] || {date:date, source:'employee'};
    if (accuracy > Number(activeLoc.maxAccuracyMeters || rules.maxAccuracyMeters || 150)) throw new Error('Akurasi GPS terlalu rendah: ' + Math.round(accuracy) + 'm. Pindah ke area terbuka lalu coba lagi.');
    if (!allowed) throw new Error('Di luar semua titik absensi. Titik terdekat: ' + activeLoc.name + ', jarak Anda: ' + Math.round(dist) + 'm, radius yang diizinkan: ' + Number(activeLoc.radiusMeters || rules.radiusMeters || 80) + 'm.');
    if (mode === 'checkin') {
      if (rec.checkInTime || rec.status === 'hadir') throw new Error('Anda sudah check-in hari ini. Jika datanya salah, minta admin menghapus status absensi hari ini terlebih dahulu.');
      if (rec.status === 'izin' || rec.status === 'sakit' || rec.status === 'alpha') throw new Error('Status hari ini sudah ' + rec.status + '. Jika ingin check-in, minta admin menghapus status tersebut terlebih dahulu.');
      rec.status = 'hadir';
      rec.hadirCount = 1;
      rec.isLate = compareTime(time, rules.lateAfter || '07:15') > 0;
      rec.checkInTime = time;
      rec.checkInLat = lat;
      rec.checkInLng = lng;
      rec.distanceMeters = dist;
      rec.accuracy = accuracy;
      rec.locationId = activeLoc.id || '';
      rec.locationName = activeLoc.name || rules.name || 'Lokasi';
      rec.updatedAt = new Date().toISOString();
      rec.updatedBy = 'employee';
      rec.message = rec.isLate ? 'Check-in berhasil, status telat.' : 'Check-in berhasil, hadir 1 kali.';
    } else {
      if (!rec.checkInTime && rules.requireCheckInBeforeCheckout !== false) throw new Error('Belum check-in, tidak bisa check-out');
      if (rec.checkOutTime) throw new Error('Anda sudah check-out hari ini. Jika datanya salah, minta admin menghapus/koreksi absensi.');
      rec.checkOutTime = time;
      rec.checkOutLat = lat;
      rec.checkOutLng = lng;
      rec.checkoutDistanceMeters = dist;
      rec.checkoutAccuracy = accuracy;
      rec.checkoutLocationId = activeLoc.id || '';
      rec.checkoutLocationName = activeLoc.name || rules.name || 'Lokasi';
      rec.updatedAt = new Date().toISOString();
      rec.updatedBy = 'employee';
      rec.checkoutMessage = 'Check-out berhasil.';
    }
    data.attendanceRecords[date][emp.id] = rec;
    savePayload(license, JSON.stringify(data));
    writeMirrorTabs(license, data);
    writeLog(license.licenseCode, 'employee_' + mode, 'OK ' + emp.nip);
    return {ok:true, record:rec, distanceMeters:dist, accuracy:accuracy};
  } catch (err) { return {ok:false,error:String(err.message || err)}; }
}
function handleEmployeeRequest(e) {
  return json(employeeRequestCore(e));
}
function employeeRequestCore(e) {
  try {
    const license = validateLicense(clean(e.parameter.licenseCode));
    const data = loadDataOrFail(license.licenseCode);
    const emp = findEmployee(data, clean(e.parameter.nip), clean(e.parameter.pinHash));
    const type = clean(e.parameter.type);
    const date = clean(e.parameter.date);
    const reason = clean(e.parameter.reason);
    if (type !== 'izin' && type !== 'sakit') throw new Error('Type must be izin/sakit');
    if (!date || !reason) throw new Error('Tanggal dan alasan wajib');
    data.attendanceRequests = data.attendanceRequests || [];
    const needs = type === 'izin' ? (data.attendanceRules||{}).leaveNeedsApproval !== false : (data.attendanceRules||{}).sickNeedsApproval !== false;
    const req = {id:'req_'+Date.now(), employeeId:emp.id, nip:emp.nip, type, date, reason, proof:clean(e.parameter.proof), status: needs ? 'pending' : 'approved', createdAt:new Date().toISOString()};
    data.attendanceRequests.push(req);
    if (!needs) {
      data.attendanceRecords = data.attendanceRecords || {};
      data.attendanceRecords[date] = data.attendanceRecords[date] || {};
      data.attendanceRecords[date][emp.id] = {status:type, date:date, reason:reason, approvalStatus:'auto-approved', source:'request', updatedAt:new Date().toISOString(), updatedBy:'employee'};
    }
    savePayload(license, JSON.stringify(data));
    writeMirrorTabs(license, data);
    writeLog(license.licenseCode, 'employee_request', 'OK ' + emp.nip);
    return {ok:true, request:req};
  } catch (err) { return {ok:false,error:String(err.message || err)}; }
}

function employeeChangePasswordCore(e) {
  try {
    const license = validateLicense(clean(e.parameter.licenseCode));
    const data = loadDataOrFail(license.licenseCode);
    const emp = findEmployee(data, clean(e.parameter.nip), clean(e.parameter.pinHash));
    const newHash = clean(e.parameter.newHash);
    if (!newHash) throw new Error('Password baru kosong');
    const target = (data.employees || []).find(x => x.id === emp.id);
    target.employeePinHash = newHash;
    target.passwordChangedAt = new Date().toISOString();
    savePayload(license, JSON.stringify(data));
    writeMirrorTabs(license, data);
    writeLog(license.licenseCode, 'employee_change_password', 'OK ' + emp.nip);
    return {ok:true, message:'Password berhasil diganti. Silakan login ulang dengan password baru.'};
  } catch (err) { return {ok:false,error:String(err.message || err)}; }
}

function getAttendanceLocations(rules) {
  rules = rules || {};
  let locs = Array.isArray(rules.locations) ? rules.locations.filter(l => l && l.active !== false && l.lat && l.lng) : [];
  if (!locs.length && rules.lat && rules.lng) locs = [{id:'primary', name:rules.name || 'Sekolah', lat:rules.lat, lng:rules.lng, radiusMeters:rules.radiusMeters, maxAccuracyMeters:rules.maxAccuracyMeters, active:true}];
  return locs;
}

function handleChangeAdminCredential(e) {
  try {
    const license = validateLicense(clean(e.parameter.licenseCode));
    const data = loadDataOrFail(license.licenseCode);
    data.settings = data.settings || {};
    if (clean(data.settings.adminUser) !== clean(e.parameter.oldUser)) throw new Error('Username lama salah');
    if (clean(data.settings.adminHash) !== clean(e.parameter.oldHash)) throw new Error('PIN lama salah');
    data.settings.adminUser = clean(e.parameter.newUser);
    data.settings.adminHash = clean(e.parameter.newHash);
    savePayload(license, JSON.stringify(data));
    writeLog(license.licenseCode, 'changeAdminCredential', 'OK');
    return json({ok:true});
  } catch (err) { return json({ok:false,error:String(err.message || err)}); }
}
function validateLicense(code) {
  const lic = getLicense(code);
  if (!lic) throw new Error('License not found');
  if (String(lic.status).toLowerCase() !== 'active') throw new Error('License inactive');
  if (lic.expiresAt) {
    const exp = new Date(lic.expiresAt);
    if (!isNaN(exp.getTime()) && exp < new Date()) throw new Error('License expired');
  }
  return lic;
}
function getLicense(code) {
  const sh = getSheet(SpreadsheetApp.getActiveSpreadsheet(), '_licenses');
  const values = sh.getDataRange().getValues();
  const headers = values[0] || [];
  for (let i=1;i<values.length;i++) {
    const row = toObj(headers, values[i]);
    if (clean(row.licenseCode) === code) return row;
  }
  return null;
}
function publicLicense(l) { return {licenseCode:l.licenseCode, schoolName:l.schoolName, schoolCode:l.schoolCode, status:l.status, plan:l.plan, expiresAt:l.expiresAt}; }
function getPayload(code) {
  const sh = getSheet(SpreadsheetApp.getActiveSpreadsheet(), '_database');
  const values = sh.getDataRange().getValues();
  const headers = values[0] || [];
  for (let i=1;i<values.length;i++) {
    const row = toObj(headers, values[i]);
    if (clean(row.licenseCode) === code) return row;
  }
  return null;
}
function loadDataOrFail(code) {
  const rec = getPayload(code);
  if (!rec || !rec.payload) throw new Error('Database belum ada. Admin harus login dan Sync dulu.');
  return JSON.parse(rec.payload);
}
function savePayload(license, payload) {
  const sh = getSheet(SpreadsheetApp.getActiveSpreadsheet(), '_database');
  ensureHeaders(sh, ['licenseCode','schoolCode','payload','updatedAt']);
  const values = sh.getDataRange().getValues();
  let row = -1;
  for (let i=1;i<values.length;i++) if (clean(values[i][0]) === clean(license.licenseCode)) row = i+1;
  const data = [license.licenseCode, license.schoolCode, payload, new Date().toISOString()];
  if (row === -1) sh.appendRow(data); else sh.getRange(row,1,1,data.length).setValues([data]);
}
function findEmployee(data, login, pinHash) {
  const needle = clean(login).toLowerCase();
  const emp = (data.employees || []).find(e => {
    const aliases = [e.loginName, e.name, e.nip].map(x => clean(x).toLowerCase()).filter(Boolean);
    return aliases.includes(needle) && clean(e.employeePinHash) === pinHash && e.status !== 'Nonaktif';
  });
  if (!emp) throw new Error('Nama/Login/PIN karyawan salah atau nonaktif');
  return emp;
}
function publicEmployee(e, data) {
  data = data || {};
  const pos = (data.positions || []).find(p => p.id === e.position) || {};
  const grade = (data.grades || []).find(g => g.id === e.grade) || {};
  return {
    id:e.id, name:e.name, loginName:e.loginName || e.name, nip:e.nip, nik:e.nik, npwp:e.npwp, bpjs:e.bpjs,
    position:e.position, positionName:pos.name || e.position,
    grade:e.grade, gradeName:grade.name || e.grade,
    status:e.status, join:e.join, contract:e.contract,
    bank:e.bank, phone:e.phone, note:e.note,
    years:yearsWorked(e.join)
  };
}
function getEmployeeSlip(data, empId, month) {
  if (!data.locks || !data.locks[month]) return null;
  if (!data.sentSlips || !data.sentSlips[month] || data.sentSlips[month][empId] !== true) return null;
  const p = (data.locks[month].items || []).find(x => x.id === empId);
  return p ? Object.assign({month, sent:true}, p) : null;
}
function writeMirrorTabs(license, data) {
  data = normalizeDataBeforeSave(data || {});
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const prefix = String(license.schoolCode || 'SCHOOL').replace(/[^\w]/g,'_').slice(0,20);
  writeTable(ss, prefix + '_employees', data.employees || []);
  writeTable(ss, prefix + '_positions', data.positions || []);
  writeTable(ss, prefix + '_grades', data.grades || []);
  writeTable(ss, prefix + '_components', data.components || []);
  writeTable(ss, prefix + '_locations', getAttendanceLocations(data.attendanceRules || {}));
  writeTable(ss, prefix + '_requests', data.attendanceRequests || []);
  writeAttendance(ss, prefix + '_attendance', data.attendanceRecords || {}, data.employees || []);
  writeSentSlips(ss, prefix + '_sent_slips', data.sentSlips || {}, data.employees || []);
}
function writeSentSlips(ss, name, sentSlips, employees) {
  const rows = [];
  Object.keys(sentSlips || {}).forEach(month => Object.keys(sentSlips[month] || {}).forEach(empId => {
    const e = employees.find(x => x.id === empId) || {};
    rows.push({month:month, employeeId:empId, name:e.name, nip:e.nip, sent:sentSlips[month][empId] === true});
  }));
  writeTable(ss, name, rows);
}
function writeAttendance(ss, name, records, employees) {
  const rows = [];
  Object.keys(records).forEach(date => Object.keys(records[date]).forEach(empId => {
    const e = employees.find(x => x.id === empId) || {};
    rows.push(Object.assign({date, employeeId:empId, name:e.name, nip:e.nip}, records[date][empId]));
  }));
  writeTable(ss, name, rows);
}
function writeTable(ss, name, rows) {
  const sh = getSheet(ss, name); sh.clear();
  if (!rows.length) { sh.getRange(1,1).setValue('No data'); return; }
  const flat = rows.map(r => flatten(r));
  const headers = Array.from(new Set(flat.flatMap(r => Object.keys(r))));
  sh.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold');
  sh.getRange(2,1,flat.length,headers.length).setValues(flat.map(r => headers.map(h => r[h] ?? '')));
  sh.autoResizeColumns(1, headers.length);
}

function yearsWorked(joinDate) {
  if (!joinDate) return 0;
  const start = new Date(joinDate);
  const now = new Date();
  if (isNaN(start.getTime())) return 0;
  let years = now.getFullYear() - start.getFullYear();
  const monthDiff = now.getMonth() - start.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < start.getDate())) years--;
  return Math.max(0, years);
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R=6371000, toRad=x=>x*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function compareTime(a,b) { return String(a).localeCompare(String(b)); }
function writeLog(code, action, status) { const sh=getSheet(SpreadsheetApp.getActiveSpreadsheet(), '_log'); ensureHeaders(sh,['timestamp','licenseCode','action','status']); sh.appendRow([new Date().toISOString(), code, action, status]); }
function getSheet(ss, name) { return ss.getSheetByName(name) || ss.insertSheet(name); }
function ensureHeaders(sh, headers) { if (sh.getLastRow() === 0) sh.appendRow(headers); }
function toObj(headers, row) { const o={}; headers.forEach((h,i)=>o[h]=row[i]); return o; }
function flatten(obj, prefix, out) { out=out||{}; prefix=prefix||''; Object.keys(obj||{}).forEach(k=>{ const v=obj[k], key=prefix?prefix+'.'+k:k; if (v && typeof v==='object' && !Array.isArray(v)) flatten(v,key,out); else out[key]=Array.isArray(v)?JSON.stringify(v):v; }); return out; }
function clean(v) { return String(v || '').trim(); }
function json(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function jsonp(e, obj) { const cb = e.parameter.callback || 'callback'; return ContentService.createTextOutput(cb + '(' + JSON.stringify(obj) + ');').setMimeType(ContentService.MimeType.JAVASCRIPT); }
