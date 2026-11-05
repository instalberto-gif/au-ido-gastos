import * as auth from '../store.js';
import {downloadJson} from '../lib/backup.mjs';
import {makeTravelBackup,validateTravelBackup,travelRestoreRows,validateTravelData} from '../lib/travel-backup.mjs';
const $=id=>document.getElementById(id); let rows=[],account=null,active=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function msg(s){$('message').textContent=s;$('message').hidden=!s}
const api=(endpoint,opts={})=>auth.api('/rest/v1/'+endpoint,{...opts,headers:{Prefer:'return=representation',...opts.headers}});
function userId(){return account?.id||''}
async function load(){msg('');try{if(!auth.loggedIn()){$('login').hidden=false;$('app').hidden=true;return}account=await auth.checkAccess();rows=[];for(let offset=0;;offset+=500){const batch=await api('au_ido_viajes_privados?select=*&order=id&limit=500&offset='+offset);rows.push(...batch);if(batch.length<500)break}$('login').hidden=true;$('app').hidden=false;render()}catch(e){if(!auth.loggedIn()||/autorizad|permiso/i.test(e.message)){$('app').hidden=true;$('login').hidden=false;rows=[]}msg(e.message)}}
function render(){let q=$('search').value.toLocaleLowerCase('es'),a=rows.filter(r=>JSON.stringify(r.data).toLocaleLowerCase('es').includes(q));$('cards').innerHTML=a.length?a.map(r=>'<article class="card"><span class="badge">'+(r.owner_id===userId()?'MI VIAJE':'COMPARTIDO CONMIGO')+'</span><h2>'+esc(r.data.nombre)+'</h2><div class="meta">'+esc(r.data.anio||'Año sin indicar')+' · '+esc(r.data.estado||'Sin confirmar')+'</div><p>'+esc(r.data.notas||'Sin notas')+'</p>'+'<button class="light" data-map="'+r.id+'">Mapa</button><a class="app-link" href="../gastos/?viaje='+r.id+'">Gastos</a><a class="app-link" href="../vacaciones/?viaje='+r.id+'">Vacaciones</a>'+(r.owner_id===userId()?'<button class="light" data-edit="'+r.id+'">Editar</button><button data-share="'+r.id+'">Compartir</button>':'')+'</article>').join(''):'<div class="panel">No hay viajes que mostrar. Crea uno o importa el inventario de tu ordenador.</div>'}
$('logout').onclick=async()=>{await auth.logout();rows=[];account=null;load()};$('refresh').onclick=load;$('search').oninput=render;
$('add').onclick=()=>{let f=$('editForm');f.reset();f.elements.id.value='';$('editTitle').textContent='Nuevo viaje';$('edit').showModal()};
document.addEventListener('click',async e=>{let b=e.target.closest('button');if(!b)return;if(b.dataset.close)$(b.dataset.close).close();if(b.dataset.edit){let r=rows.find(x=>x.id===b.dataset.edit),f=$('editForm');f.reset();f.elements.id.value=r.id;for(let k of ['nombre','anio','inicio','fin','estado','notas'])f.elements[k].value=r.data[k]||'';$('editTitle').textContent='Editar viaje';$('edit').showModal()}if(b.dataset.map){openMap(b.dataset.map)}if(b.dataset.share){active=rows.find(x=>x.id===b.dataset.share);$('shareName').textContent=active.data.nombre;$('sharing').showModal();await shareList()}if(b.dataset.remove){try{await api('au_ido_viajes_accesos?trip_id=eq.'+active.id+'&email=eq.'+encodeURIComponent(b.dataset.remove),{method:'DELETE'});await shareList()}catch(x){msg(x.message)}}});
$('editForm').onsubmit=async e=>{e.preventDefault();let f=new FormData(e.target),id=f.get('id')||crypto.randomUUID(),old=rows.find(x=>x.id===id);if(f.get('inicio')&&f.get('fin')&&f.get('fin')<f.get('inicio')){msg('La fecha final debe ser posterior a la inicial.');return}let data=Object.fromEntries(['nombre','anio','inicio','fin','estado','notas'].map(k=>[k,f.get(k)]));if(old){data={...old.data,...data};}try{await api('au_ido_viajes_privados'+(old?'?id=eq.'+id:''),{method:old?'PATCH':'POST',body:JSON.stringify(old?{data,updated_at:new Date().toISOString()}:{id,owner_id:userId(),data})});$('edit').close();await load()}catch(x){msg(x.message)}};
async function shareList(){try{let a=await api('au_ido_viajes_accesos?trip_id=eq.'+active.id+'&select=email');$('accessList').innerHTML=a.length?a.map(x=>'<div class="accessrow"><span>'+esc(x.email)+'</span><button class="light" data-remove="'+esc(x.email)+'">Retirar acceso</button></div>').join(''):'<p>Este viaje todavía es privado.</p>'}catch(x){$('accessList').textContent=x.message}}
$('shareForm').onsubmit=async e=>{e.preventDefault();let email=new FormData(e.target).get('email').trim().toLowerCase();try{await api('au_ido_viajes_accesos',{method:'POST',body:JSON.stringify({trip_id:active.id,owner_id:userId(),email})});e.target.reset();await shareList()}catch(x){msg(x.message)}};
$('importBtn').onclick=()=>$('file').click();$('file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>20*1024*1024)throw Error('El archivo supera 20 MB.');let records=JSON.parse(await file.text());if(!Array.isArray(records)||records.length>1000)throw Error('El archivo no contiene un inventario válido (máximo 1.000 viajes).');records.forEach(validateTravelData);if(!confirm('Se importarán '+records.length+' viajes como privados. ¿Continuar?'))return;let existing=new Set(rows.filter(r=>r.owner_id===userId()).map(r=>r.data.origen).filter(Boolean));let data=records.filter(x=>x.origen&&!existing.has(x.origen)).map(x=>({id:crypto.randomUUID(),owner_id:userId(),data:x}));if(data.length)await api('au_ido_viajes_privados',{method:'POST',body:JSON.stringify(data)});await load();msg(data.length+' viajes importados como privados.')}catch(x){msg(x.message)}finally{e.target.value=''}};

let selectedMapTrip=null,travelMap=null,mapLayer=null;
function openMap(id){
 selectedMapTrip=rows.find(r=>r.id===id);if(!selectedMapTrip)return;
 $('mapTitle').textContent=selectedMapTrip.data.nombre;
 $('mapControls').hidden=selectedMapTrip.owner_id!==userId();
 $('mapDialog').showModal();
 if(!window.L){$('mapInfo').textContent='No se ha podido cargar el mapa. Comprueba la conexión a internet.';return}
 if(!travelMap){travelMap=L.map('travelMap').setView([40,-3],5);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(travelMap);mapLayer=L.featureGroup().addTo(travelMap)}
 drawMap();setTimeout(()=>travelMap.invalidateSize(),100);
}
function drawMap(){
 if(!travelMap)return;mapLayer.clearLayers();let routes=selectedMapTrip.data.rutas||[],points=selectedMapTrip.data.waypoints||[];
 for(const route of routes)if(route.coords?.length>1)L.polyline(route.coords,{color:'#d90c26',weight:4}).bindTooltip(esc(route.nombre)).addTo(mapLayer);
 for(const point of points)if(Number.isFinite(point.lat)&&Number.isFinite(point.lon))L.marker([point.lat,point.lon]).bindPopup(esc(point.nombre)).addTo(mapLayer);
 $('mapInfo').textContent=routes.length+' rutas · '+points.length+' puntos. Los archivos GPX se añaden de forma manual.';
 $('pointList').innerHTML=points.map((x,i)=>'<button type="button" data-point="'+i+'">'+esc(x.nombre)+'</button>').join('');
 if(mapLayer.getLayers().length)travelMap.fitBounds(mapLayer.getBounds(),{padding:[22,22],maxZoom:14});else travelMap.setView([40,-3],5);
}
document.addEventListener('click',e=>{let b=e.target.closest('[data-point]');if(!b||!travelMap)return;let point=selectedMapTrip.data.waypoints[Number(b.dataset.point)];travelMap.setView([point.lat,point.lon],14)});
$('importGpx').onclick=()=>$('gpxFile').click();
$('gpxFile').onchange=async e=>{
 try{
  const f=e.target.files[0];if(!f)return;if(!selectedMapTrip||selectedMapTrip.owner_id!==userId())throw Error('Solo el propietario puede añadir rutas.');
  if(f.size>10*1024*1024)throw Error('El archivo supera 10 MB.');
  const xml=new DOMParser().parseFromString(await f.text(),'application/xml');if(xml.querySelector('parsererror')||xml.documentElement.localName!=='gpx')throw Error('El archivo GPX no es válido.');
  const all=Array.from(xml.getElementsByTagNameNS('*','trkseg'));const rte=Array.from(xml.getElementsByTagNameNS('*','rte'));const existingRoutes=selectedMapTrip.data.rutas||[],existingPoints=selectedMapTrip.data.waypoints||[];
  function position(n){let lat=Number(n.getAttribute('lat')),lon=Number(n.getAttribute('lon'));return n.hasAttribute('lat')&&n.hasAttribute('lon')&&Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180?[lat,lon]:null}
  let routeNodes=all.map(n=>Array.from(n.getElementsByTagNameNS('*','trkpt'))).concat(rte.map(n=>Array.from(n.getElementsByTagNameNS('*','rtept'))));
  let coords=routeNodes.map(nodes=>nodes.map(position).filter(Boolean)).filter(v=>v.length>1),points=Array.from(xml.getElementsByTagNameNS('*','wpt')).map(n=>{let c=position(n);let name=n.getElementsByTagNameNS('*','name')[0]?.textContent?.trim()||'Punto';return c?{lat:c[0],lon:c[1],nombre:name.slice(0,120)}:null}).filter(Boolean);
  if(!coords.length&&!points.length)throw Error('El archivo no contiene rutas ni puntos válidos.');
  let count=coords.reduce((n,v)=>n+v.length,0),step=Math.max(1,Math.ceil(count/4000));let routes=coords.map((c,i)=>({nombre:f.name+' · '+(i+1),coords:c.filter((x,k)=>k%step===0||k===c.length-1)}));
  let updated={...selectedMapTrip.data,rutas:[...existingRoutes,...routes],waypoints:[...existingPoints,...points].slice(0,3000)};
  if(new TextEncoder().encode(JSON.stringify(updated)).length>450000)throw Error('Este viaje ha alcanzado el límite de información. Usa rutas más pequeñas.');
  await api('au_ido_viajes_privados?id=eq.'+selectedMapTrip.id,{method:'PATCH',body:JSON.stringify({data:updated,updated_at:new Date().toISOString()})});
  selectedMapTrip.data=updated;drawMap();$('mapInfo').textContent+=' Archivo añadido.';
 }catch(x){$('mapInfo').textContent=x.message}finally{e.target.value=''}
};
load();

auth.watchSession(()=>location.reload());


$('backup').onclick=()=>{try{if(!account)throw Error('Inicia sesión primero.');downloadJson(makeTravelBackup(rows,userId()),'AU-Ido-viajes-'+new Date().toISOString().slice(0,10)+'.json');msg('Copia descargada de tus viajes propios, con rutas y puntos. Los permisos no se incluyen.')}catch(e){msg(e.message)}};
$('restore').onclick=()=>$('restoreFile').click();
$('restoreFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>20*1024*1024)throw Error('La copia supera 20 MB.');let value=JSON.parse(await file.text());if(value.format==='au-ido-backup-v1')value=value.viajes;validateTravelBackup(value);const newRows=travelRestoreRows(value,rows,userId(),()=>crypto.randomUUID());if(!newRows.length){msg('Todos los viajes de esta copia ya están presentes.');return}if(!confirm('Se recuperarán '+newRows.length+' viajes como privados en tu cuenta. No se sobrescriben los actuales ni se recuperan permisos. ¿Continuar?'))return;let restored=0;try{for(const record of newRows){await api('au_ido_viajes_privados',{method:'POST',body:JSON.stringify(record)});restored++}}catch(error){throw Error('Se recuperaron '+restored+' de '+newRows.length+' viajes. '+error.message+' Puedes volver a importar para continuar sin duplicados.')}await load();msg(restored+' viajes recuperados como privados. Revisa sus datos antes de compartirlos.')}catch(error){await load();msg(error.message)}finally{e.target.value=''}};
