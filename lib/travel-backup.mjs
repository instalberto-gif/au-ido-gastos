import {myMapsLinks} from './my-maps.mjs';
import {preparePrivateImport} from './travel-people.mjs';
export const TRAVEL_BACKUP='au-ido-viajes-backup-v1';
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function validateTravelData(data){
 if(!data||typeof data!=='object'||Array.isArray(data)||typeof data.nombre!=='string'||!data.nombre.trim()||data.nombre.length>160)throw Error('Cada viaje debe tener un nombre de hasta 160 caracteres.');
 if(new TextEncoder().encode(JSON.stringify(data)).length>450000)throw Error('Un viaje supera el límite de 450 KB.');
 const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 if(['inicio','fin'].some(k=>data[k]&&!validDate(data[k]))||data.inicio&&data.fin&&data.fin<data.inicio)throw Error('Revisa las fechas del viaje.');
 if(data.rutas!==undefined&&(!Array.isArray(data.rutas)||data.rutas.length>1000||data.rutas.some(r=>!r||typeof r.nombre!=='string'||!Array.isArray(r.coords)||r.coords.some(p=>!Array.isArray(p)||p.length!==2||!Number.isFinite(p[0])||!Number.isFinite(p[1])||Math.abs(p[0])>90||Math.abs(p[1])>180))))throw Error('La copia contiene rutas no válidas.');
 if(data.waypoints!==undefined&&(!Array.isArray(data.waypoints)||data.waypoints.length>3000||data.waypoints.some(p=>!p||typeof p.nombre!=='string'||!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||Math.abs(p.lat)>90||Math.abs(p.lon)>180)))throw Error('La copia contiene puntos no válidos.');
 if(data.presupuestoCentimos!==undefined&&data.presupuestoCentimos!==null&&(!Number.isSafeInteger(data.presupuestoCentimos)||data.presupuestoCentimos<0||data.presupuestoCentimos>999999999))throw Error('Presupuesto no válido.');
 if(data.participantes!==undefined&&!(typeof data.participantes==='string'||Array.isArray(data.participantes)&&data.participantes.length<=100&&data.participantes.every(p=>typeof p==='string'&&p.length<=100)))throw Error('Participantes no válidos.');
 for(const field of ['excludedExpenseAccounts','includedExpenseCopies'])if(data[field]!==undefined&&(!Array.isArray(data[field])||data[field].length>1000||data[field].some(id=>!uuid(id))))throw Error('La selección de cuentas de gastos no es válida.');
 if(data.participantUsers!==undefined&&(!Array.isArray(data.participantUsers)||data.participantUsers.length>100||data.participantUsers.some(p=>!p||!uuid(p.id)||typeof p.email!=='string'||typeof p.name!=='string'||p.name.length>100)))throw Error('Usuarios participantes no válidos.');
 if(data.myMapsUrl)myMapsLinks(data.myMapsUrl);if(data.mapProvider!==undefined&&!['gpx','mymaps'].includes(data.mapProvider))throw Error('Tipo de mapa no válido.');if(data.mapProvider==='mymaps'&&!data.myMapsUrl)throw Error('Falta el enlace de Google My Maps.');
 return data;
}
export function makeTravelBackup(rows,ownerId){return {format:TRAVEL_BACKUP,exportedAt:new Date().toISOString(),records:rows.filter(r=>r.owner_id===ownerId).map(r=>({sourceId:r.id,data:validateTravelData(r.data)}))}}
export function validateTravelBackup(value){if(value?.format!==TRAVEL_BACKUP||!Array.isArray(value.records)||value.records.length>1000||value.records.some(r=>!r||!uuid(r.sourceId))||new Set(value.records.map(r=>r.sourceId)).size!==value.records.length)throw Error('La copia de Viajes no tiene un formato válido.');for(const r of value.records)validateTravelData(r.data);return value}
// Nunca se recuperan propietarios ni permisos desde un archivo: las copias son privadas.
export function travelRestoreRows(backup,current,ownerId,newId){validateTravelBackup(backup);const owned=current.filter(r=>r.owner_id===ownerId),existing=new Set(owned.flatMap(r=>[r.id,r.data.backupSourceId].filter(Boolean)));return backup.records.filter(r=>!existing.has(r.sourceId)).map(r=>({id:newId(),owner_id:ownerId,data:{...preparePrivateImport(r.data),backupSourceId:r.sourceId}}))}
