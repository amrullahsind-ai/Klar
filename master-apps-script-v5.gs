/**
 * Edura V6.1 - Apps Script License Server
 * Deploy: Execute as: Me, Who has access: Anyone with the link.
 * Supports: admin load/save, employee login by NIP/Login/Nama/Kode, check-in/out, request, change password.
 */
const DB_SHEET = '_database';
const LICENSE_SHEET = '_licenses';
const LOG_SHEET = '_logs';
const DEFAULT_LICENSE = 'EDUPAY-DEMO-0001';

function doGet(e){
  const p = e.parameter || {};
  const cb = p.callback || 'callback';
  let out;
  try { out = route_(p, false); }
  catch(err){ out = {ok:false, error:String(err && err.message || err)}; }
  return ContentService.createTextOutput(cb + '(' + JSON.stringify(out) + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function doPost(e){
  const p = Object.assign({}, e.parameter || {});
  try { route_(p, true); }
  catch(err){ log_('post_error', '', String(err && err.message || err)); }
  return HtmlService.createHtmlOutput('<script>try{parent.postMessage({ok:true},"*")}catch(e){}</script>OK');
}
function route_(p, post){
  const action = p.action || 'loadAdmin';
  const licenseCode = String(p.licenseCode || DEFAULT_LICENSE).trim();
  ensure_();
  if(action === 'loadAdmin') return loadAdmin_(licenseCode);
  if(action === 'saveAdmin') return saveAdmin_(licenseCode, p.payload || '{}');
  if(action === 'loadEmployee') return loadEmployee_(licenseCode, p);
  if(action === 'employeeChangePassword') return employeeChangePassword_(licenseCode, p);
  if(action === 'employeeCheckIn') return employeeCheckIn_(licenseCode, p);
  if(action === 'employeeCheckOut') return employeeCheckOut_(licenseCode, p);
  if(action === 'employeeRequest') return employeeRequest_(licenseCode, p);
  if(action === 'deleteEmployee') return deleteEmployee_(licenseCode, p.employeeId);
  return {ok:false, error:'Action tidak dikenal: ' + action};
}
function ss_(){ return SpreadsheetApp.getActiveSpreadsheet(); }
function sh_(name){ return ss_().getSheetByName(name) || ss_().insertSheet(name); }
function ensure_(){
  const db = sh_(DB_SHEET); if(db.getLastRow() === 0) db.appendRow(['licenseCode','payload','updatedAt']);
  const li = sh_(LICENSE_SHEET); if(li.getLastRow() === 0) li.appendRow(['licenseCode','schoolName','status','plan','expiresAt','notes']);
  const logs = sh_(LOG_SHEET); if(logs.getLastRow() === 0) logs.appendRow(['time','action','licenseCode','message']);
}
function dbRow_(licenseCode){
  const db = sh_(DB_SHEET), vals = db.getDataRange().getValues();
  for(let i=1;i<vals.length;i++) if(String(vals[i][0]).trim() === licenseCode) return i+1;
  return 0;
}
function loadPayload_(licenseCode){
  const row = dbRow_(licenseCode); if(!row) return null;
  const raw = sh_(DB_SHEET).getRange(row,2).getValue();
  if(!raw) return null;
  return JSON.parse(raw);
}
function savePayload_(licenseCode, data){
  const db = sh_(DB_SHEET); let row = dbRow_(licenseCode);
  if(!row){ db.appendRow([licenseCode, JSON.stringify(data), new Date()]); row = db.getLastRow(); }
  else db.getRange(row, 2, 1, 2).setValues([[JSON.stringify(data), new Date()]]);
  return row;
}
function loadAdmin_(licenseCode){
  let data = loadPayload_(licenseCode);
  if(!data) return {ok:true, license:{licenseCode,status:'active'}, data:null, message:'Database baru. Sync dari admin untuk mengisi data.'};
  return {ok:true, license:{licenseCode,status:'active'}, data};
}
function saveAdmin_(licenseCode, payload){
  const data = JSON.parse(payload || '{}');
  data._serverUpdatedAt = new Date().toISOString();
  savePayload_(licenseCode, data);
  log_('saveAdmin', licenseCode, 'payload saved');
  return {ok:true, message:'Data tersimpan'};
}
function norm_(s){ return String(s||'').trim().toLowerCase().replace(/\s+/g,' '); }
function flex_(s){ return norm_(s).replace(/[^a-z0-9]/g,''); }
function findEmployee_(db, login){
  const q = norm_(login), f = flex_(login);
  const emps = db.employees || [];
  return emps.find(e => flex_(e.nip)===f || flex_(e.loginName)===f || flex_(e.name)===f || flex_(e.slipCode)===f || norm_(e.nip)===q || norm_(e.loginName)===q || norm_(e.name)===q || norm_(e.slipCode)===q);
}
function checkEmployee_(db,p){
  const emp = findEmployee_(db, p.nip || p.login || p.username || '');
  if(!emp) throw new Error('Karyawan tidak ditemukan. Coba login pakai NIP/Login/Nama/Kode yang tertulis di Admin.');
  if(String(emp.status||'Aktif').toLowerCase()==='nonaktif') throw new Error('Akun karyawan nonaktif.');
  const expected = emp.employeePinHash || '';
  if(expected && String(p.pinHash||'') !== String(expected)) throw new Error('Username atau password salah. Untuk karyawan hasil import, default biasanya 1234.');
  return emp;
}
function withDB_(licenseCode, fn){
  const db = loadPayload_(licenseCode); if(!db) throw new Error('Database belum ada. Sync dari Admin dulu.');
  const result = fn(db) || {};
  savePayload_(licenseCode, db);
  return result;
}
function empView_(db, emp, p){
  const d = today_();
  const recs = db.attendanceRecords || {}; const todayRecord = (recs[d]||{})[emp.id] || null;
  const pos = (db.positions||[]).find(x=>x.id===emp.position) || {}; const gr = (db.grades||[]).find(x=>x.id===emp.grade) || {};
  const hist = Object.keys(recs).sort().reverse().slice(0,40).map(date=>Object.assign({date}, (recs[date]||{})[emp.id]||{})).filter(x=>x.status);
  const slip = latestSlip_(db, emp.id);
  return {ok:true, employee:Object.assign({}, emp, {positionName:pos.name||'', gradeName:gr.name||'', years:years_(emp.join, emp.yearsImported)}), school:(db.settings||{}).school||'Edura', todayRecord, history:hist, slip, todayRequest:(db.attendanceRequests||[]).find(r=>r.employeeId===emp.id && r.date===d && r.status==='pending') || null, deviceStatus:'aktif'};
}
function loadEmployee_(licenseCode,p){ const db=loadPayload_(licenseCode); if(!db) throw new Error('Database belum ada. Sync dari Admin dulu.'); const emp=checkEmployee_(db,p); return empView_(db,emp,p); }
function employeeChangePassword_(licenseCode,p){ return withDB_(licenseCode, db=>{ const emp=checkEmployee_(db,p); emp.employeePinHash = p.newHash; emp.updatedAt = new Date().toISOString(); log_('employeeChangePassword', licenseCode, emp.name); return {ok:true,message:'Password berhasil diganti'}; }); }
function employeeCheckIn_(licenseCode,p){ return withDB_(licenseCode, db=>{ const emp=checkEmployee_(db,p); const d=today_(); db.attendanceRecords=db.attendanceRecords||{}; db.attendanceRecords[d]=db.attendanceRecords[d]||{}; if(db.attendanceRecords[d][emp.id] && db.attendanceRecords[d][emp.id].checkInTime) throw new Error('Sudah check-in hari ini.'); const r={status:'hadir',date:d,checkInTime:time_(),lat:Number(p.lat||0),lng:Number(p.lng||0),accuracy:Number(p.accuracy||0),source:'employee',message:'Check-in berhasil'}; db.attendanceRecords[d][emp.id]=r; return {ok:true,record:r}; }); }
function employeeCheckOut_(licenseCode,p){ return withDB_(licenseCode, db=>{ const emp=checkEmployee_(db,p); const d=today_(); db.attendanceRecords=db.attendanceRecords||{}; db.attendanceRecords[d]=db.attendanceRecords[d]||{}; const r=db.attendanceRecords[d][emp.id]; if(!r || !r.checkInTime) throw new Error('Belum check-in.'); if(r.checkOutTime) throw new Error('Sudah check-out.'); r.checkOutTime=time_(); r.checkoutLat=Number(p.lat||0); r.checkoutLng=Number(p.lng||0); r.checkoutAccuracy=Number(p.accuracy||0); r.checkoutMessage='Check-out berhasil'; return {ok:true,record:r}; }); }
function employeeRequest_(licenseCode,p){ return withDB_(licenseCode, db=>{ const emp=checkEmployee_(db,p); db.attendanceRequests=db.attendanceRequests||[]; const r={id:'req_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),employeeId:emp.id,employeeName:emp.name,date:p.date||today_(),type:p.type||'izin',status:'pending',reason:p.reason||'',proof:p.proof||'',createdAt:new Date().toISOString()}; db.attendanceRequests.push(r); return {ok:true,record:r,message:'Pengajuan dikirim'}; }); }
function deleteEmployee_(licenseCode, empId){ return withDB_(licenseCode, db=>{ db._deletedEmployees=db._deletedEmployees||[]; if(empId && db._deletedEmployees.indexOf(empId)<0) db._deletedEmployees.push(empId); db.employees=(db.employees||[]).filter(e=>e.id!==empId); Object.keys(db.attendanceRecords||{}).forEach(d=>{ if(db.attendanceRecords[d]) delete db.attendanceRecords[d][empId]; }); db.attendanceRequests=(db.attendanceRequests||[]).filter(r=>r.employeeId!==empId); db.deviceRequests=(db.deviceRequests||[]).filter(r=>r.employeeId!==empId); Object.keys(db.locks||{}).forEach(m=>{ if(db.locks[m]&&db.locks[m].items) db.locks[m].items=db.locks[m].items.filter(x=>x.id!==empId); }); Object.keys(db.sentSlips||{}).forEach(m=>{ if(db.sentSlips[m]) delete db.sentSlips[m][empId]; }); return {ok:true,message:'Karyawan dihapus'}; }); }
function latestSlip_(db, empId){ const sent=db.sentSlips||{}, locks=db.locks||{}; const months=Object.keys(sent).sort().reverse(); for(const m of months){ if(sent[m] && sent[m][empId] && locks[m] && locks[m].items){ const it=locks[m].items.find(x=>x.id===empId); if(it) return Object.assign({month:m}, it); } } return null; }
function today_(){ return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'yyyy-MM-dd'); }
function time_(){ return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'HH:mm'); }
function years_(join, imported){ if(imported) return imported; if(!join) return 0; const a=new Date(join), b=new Date(); let y=b.getFullYear()-a.getFullYear(); if(b.getMonth()<a.getMonth() || (b.getMonth()===a.getMonth() && b.getDate()<a.getDate())) y--; return Math.max(0,y); }
function log_(action, licenseCode, message){ try{ sh_(LOG_SHEET).appendRow([new Date(), action, licenseCode, message]); }catch(e){} }
