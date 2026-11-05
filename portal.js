import * as auth from './store.js';
import {downloadJson,markBackup,backupStatus} from './lib/backup.mjs';
import {makeTravelBackup} from './lib/travel-backup.mjs';
import {validTravelId} from './lib/travel-links.mjs';
const $=id=>document.getElementById(id),form=$('access-form'),message=$('access-message'),menu=$('access-menu');
const destination=new URLSearchParams(location.search).get('app'),destinations={gastos:'./gastos/',vacaciones:'./vacaciones/',viajes:'./viajes/'};
const linkedId=new URLSearchParams(location.search).get('viaje');
const next=Object.hasOwn(destinations,destination)?destinations[destination]+(validTravelId(linkedId)?'?viaje='+encodeURIComponent(linkedId):''):null;
let user=null,busy=false;
if(next){$('access-continue').href=next;$('access-continue').textContent='Continuar a '+destination[0].toUpperCase()+destination.slice(1)}
function render(ready=false){const recovery=auth.recoveryPending();form.hidden=ready||recovery;$('access-reset').hidden=!recovery;$('access-session').hidden=!auth.loggedIn()||recovery;$('backup-panel').hidden=!ready||recovery;
 $('access-status').textContent=recovery?'Elige tu nueva contraseña.':ready?'Sesión iniciada · '+user.email:auth.loggedIn()?'Sesión iniciada · Acceso pendiente':'Entra o crea tu cuenta con el correo autorizado.';
 $('account-label').textContent=ready?'Mi cuenta':'Conexión y acceso';$('account-email').textContent=ready?user.email:'';$('account-email').hidden=!ready;
 if(recovery)menu.open=true;if(ready)renderBackup();
}
async function check(){if(!auth.shared){render();form.hidden=true;$('access-status').textContent='La conexión a AU Ido no está configurada.';return false}if(!auth.loggedIn()){user=null;render();return false}if(auth.recoveryPending()){render();return false}
 try{user=await auth.checkAccess();render(true);return true}catch(e){render();message.textContent=auth.friendlyError(e);return false}}
async function task(fn){if(busy)return;busy=true;document.querySelectorAll('#acceso button').forEach(b=>b.disabled=true);try{await fn()}catch(e){message.textContent=auth.friendlyError(e);menu.open=true}finally{busy=false;document.querySelectorAll('#acceso button').forEach(b=>b.disabled=false)}}
async function submit(signup){if(!form.reportValidity())return;await task(async()=>{const password=$('access-password').value,email=$('access-email').value.trim().toLowerCase();if(signup&&password.length<10)throw Error('Elige una contraseña de al menos 10 caracteres.');message.textContent=signup?'Creando cuenta…':'Comprobando acceso…';if(signup){if(!await auth.signup(email,password)){message.textContent='Si el registro se puede completar, recibirás un correo de confirmación. Revisa también spam y después pulsa Entrar.';return}}else await auth.login(email,password);message.textContent='';if(await check()){form.reset();message.textContent='Acceso correcto. Elige una aplicación.';if(next)location.assign(next)}})}
form.onsubmit=e=>{e.preventDefault();submit(false)};$('access-signup').onclick=()=>submit(true);
$('access-forgot').onclick=()=>{const email=$('access-email');if(!email.reportValidity())return;task(async()=>{await auth.recoverPassword(email.value);message.textContent='Si existe una cuenta con ese correo, recibirás un enlace para elegir una nueva contraseña. Revisa también spam.'})};
$('access-reset').onsubmit=e=>{e.preventDefault();task(async()=>{const password=$('reset-password').value;if(password!==$('reset-confirm').value)throw Error('Las contraseñas no coinciden.');await auth.updatePassword(password);$('access-reset').reset();user=null;render();message.textContent='Contraseña actualizada. Entra con tu nueva contraseña.'})};
$('reset-cancel').onclick=()=>task(async()=>{await auth.logout();user=null;render();message.textContent='Recuperación cancelada. Puedes solicitar otro enlace.'});
$('access-logout').onclick=()=>task(async()=>{await auth.logout();user=null;form.reset();render();message.textContent='Sesión cerrada en este navegador.'});
function openAccess(){if(location.hash==='#acceso'||next||auth.recoveryPending())menu.open=true}
window.addEventListener('hashchange',openAccess);document.addEventListener('click',e=>{if(menu.open&&!menu.contains(e.target)&&!auth.recoveryPending())menu.open=false});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus()}});auth.watchSession(()=>location.reload());
async function allRows(table,query){let all=[];for(let offset=0;;offset+=500){const batch=await auth.api('/rest/v1/'+table+'?'+query+'&limit=500&offset='+offset);all.push(...batch);if(batch.length<500)return all}}
function renderBackup(){const status=backupStatus(user.id,'completa');$('backup-status').textContent=(status.date?'Última descarga en este navegador: '+new Date(status.date).toLocaleDateString('es-ES')+'. ':'Aún no consta una copia en este navegador. ')+(status.due?'Conviene descargar una copia semanal.':'Copia reciente.');}
$('backup-all').onclick=async()=>{const b=$('backup-all');b.disabled=true;$('backup-status').textContent='Preparando copia…';try{await auth.checkAccess();const [gastos,vacaciones,viajes]=await Promise.all([allRows('au_ido_trips','select=id,data,revision&order=id'),auth.api('/rest/v1/au_ido_vacaciones?id=eq.grupo&select=data'),allRows('au_ido_viajes_privados','select=id,owner_id,data&owner_id=eq.'+encodeURIComponent(user.id)+'&order=id')]);const backup={format:'au-ido-backup-v1',exportedAt:new Date().toISOString(),gastos:gastos.map(r=>r.data),vacaciones:vacaciones[0]?.data||null,viajes:makeTravelBackup(viajes,user.id)};downloadJson(backup,'AU-Ido-copia-'+new Date().toISOString().slice(0,10)+'.json');markBackup(user.id,'completa');renderBackup()}catch(e){$('backup-status').textContent=auth.friendlyError(e)}finally{b.disabled=false}};
async function start(){try{const type=await auth.consumeAuthCallback();if(type)menu.open=true;openAccess();await check();if(type==='signup')message.textContent='Correo confirmado. Ya puedes acceder si tu cuenta está autorizada.'}catch(e){render();menu.open=true;message.textContent=auth.friendlyError(e)}}
start();
