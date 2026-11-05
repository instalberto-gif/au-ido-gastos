import {verifyExpenseTravel} from './lib/expense-links.mjs';
const cfg=window.AU_IDO_CONFIG||{};
const url=String(cfg.supabaseUrl||'').replace(/\/$/,'');
export const shared=!!(url&&cfg.supabaseKey);
const KEY='au-ido-session',RECOVERY='au-ido-recovery';
let refreshing=null;
function configured(){if(!shared||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||String(cfg.supabaseKey).startsWith('sb_secret_'))throw Error('La conexión a AU Ido no está configurada correctamente.');}
export function getSession(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');return s&&typeof s.access_token==='string'&&typeof s.refresh_token==='string'&&Number.isFinite(s.expires_at)?s:null}catch{return null}}
export function loggedIn(){return !!getSession()}
export function recoveryPending(){const t=Number(sessionStorage.getItem(RECOVERY));return t>0&&Date.now()-t<3600000&&loggedIn()}
export function clearRecovery(){sessionStorage.removeItem(RECOVERY)}
export function accessUrl(app){const target=new URL('./',import.meta.url);if(['gastos','vacaciones','viajes'].includes(app))target.searchParams.set('app',app);const id=new URLSearchParams(location.search).get('viaje');if(id&&/^[0-9a-f-]{36}$/i.test(id))target.searchParams.set('viaje',id);target.hash='acceso';return target.href}
function keep(s){if(!s?.access_token||!s.refresh_token)throw Error('Respuesta de acceso incompleta.');const expires=s.expires_at||Math.floor(Date.now()/1000)+Number(s.expires_in||3600);localStorage.setItem(KEY,JSON.stringify({access_token:s.access_token,refresh_token:s.refresh_token,expires_at:expires}));}
export function friendlyError(error){const code=error?.code||'',s=String(error?.message||error||'No se ha podido completar la operación.');
 if(code==='invalid_credentials'||/invalid.*credentials/i.test(s))return 'Correo o contraseña incorrectos. Si todavía no te has registrado, pulsa Crear cuenta.';
 if(code==='email_not_confirmed'||/email.*not.*confirmed/i.test(s))return 'Confirma tu correo antes de entrar. Revisa también spam.';
 if(code==='over_email_send_rate_limit'||/rate limit/i.test(s))return 'Se han solicitado demasiados correos. Espera unos minutos antes de volver a intentarlo.';
 if(/same_password/i.test(code))return 'Elige una contraseña diferente de la anterior.';
 return s;
}
async function request(path,options={},token){configured();let response;try{response=await fetch(url+path,{...options,headers:{apikey:cfg.supabaseKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...options.headers}})}catch{throw Error('No se ha podido conectar. Comprueba tu conexión e inténtalo de nuevo.');}
 const raw=await response.text();let data;try{data=raw?JSON.parse(raw):null}catch{throw Error('El servidor no ha devuelto una respuesta válida.');}
 if(!response.ok){const error=Error(data?.msg||data?.message||data?.error_description||'No se ha podido completar la operación.');error.code=data?.error_code||data?.code;error.status=response.status;error.message=friendlyError(error);throw error}return data;
}
async function refresh(){const s=getSession();if(!s)throw Error('Inicia sesión desde la portada de AU Ido.');if(Date.now()<s.expires_at*1000-30000)return s;
 try{const fresh=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refresh_token})});if(getSession()?.refresh_token!==s.refresh_token){const current=getSession();if(!current)throw Error('La sesión se ha cerrado.');return current}keep(fresh);return getSession()}
 catch(e){if(e.status===400||e.status===401){if(getSession()?.refresh_token===s.refresh_token){localStorage.removeItem(KEY);clearRecovery()}throw Error('Tu sesión ha caducado. Vuelve a entrar desde la portada.')}throw e}
}
export async function sessionReady(){if(!refreshing){refreshing=(async()=>{if(globalThis.navigator?.locks)return navigator.locks.request('au-ido-session-refresh',refresh);return refresh()})().finally(()=>{refreshing=null})}return refreshing}
export async function api(path,options={},auth=true){const s=auth?await sessionReady():null;try{return await request(path,options,s?.access_token)}catch(e){if(auth&&e.status===401){if(getSession()?.access_token===s?.access_token){localStorage.removeItem(KEY);clearRecovery()}throw Error('Tu sesión ha caducado. Vuelve a entrar desde la portada.')}if(e.status===403)throw Error('Tu cuenta no tiene permiso para realizar esta operación.');throw e}}
export async function login(email,password){const s=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:email.trim().toLowerCase(),password})},false);clearRecovery();keep(s)}
export async function signup(email,password){if(password.length<10)throw Error('Elige una contraseña de al menos 10 caracteres.');const d=await api('/auth/v1/signup',{method:'POST',body:JSON.stringify({email:email.trim().toLowerCase(),password})},false);if(d.access_token){keep(d);return true}return false}
export async function logout(){const s=getSession();localStorage.removeItem(KEY);clearRecovery();if(s)try{await request('/auth/v1/logout?scope=local',{method:'POST'},s.access_token)}catch{/* El cierre local siempre se completa. */}}
export async function currentUser(){return api('/auth/v1/user')}
export async function checkAccess(){const user=await currentUser();const members=await api('/rest/v1/au_ido_members?select=email&limit=1');if(!members?.length)throw Error('Tu correo aún no está autorizado en AU Ido. Contacta con el administrador.');return user}
export async function recoverPassword(email){const redirect=new URL('./',import.meta.url).href;await api('/auth/v1/recover?redirect_to='+encodeURIComponent(redirect),{method:'POST',body:JSON.stringify({email:email.trim().toLowerCase()})},false)}
export async function updatePassword(password){if(!recoveryPending())throw Error('Abre un enlace de recuperación válido desde tu correo.');if(password.length<10)throw Error('Elige una contraseña de al menos 10 caracteres.');await api('/auth/v1/user',{method:'PUT',body:JSON.stringify({password})});await logout()}
export async function consumeAuthCallback(){const params=new URLSearchParams(location.hash.slice(1));if(!params.has('access_token')&&!params.has('error')&&!params.has('error_description'))return null;
 // Eliminar credenciales del historial antes de realizar peticiones o cargar otras páginas.
 history.replaceState(null,'',location.pathname+location.search+'#acceso');
 if(params.has('error')||params.has('error_description'))throw Error('El enlace ha caducado o no es válido. Solicita uno nuevo desde «He olvidado mi contraseña».');
 const access_token=params.get('access_token'),refresh_token=params.get('refresh_token'),expires_in=Number(params.get('expires_in')||3600);
 if(!access_token||!refresh_token||!Number.isFinite(expires_in)||expires_in<=0)throw Error('El enlace de acceso está incompleto. Solicita uno nuevo.');
 await request('/auth/v1/user',{},access_token);
 keep({access_token,refresh_token,expires_in});const type=params.get('type');if(type==='recovery'||type==='invite')sessionStorage.setItem(RECOVERY,String(Date.now()));else clearRecovery();return type;
}
function identity(s){try{return JSON.parse(atob(s.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).sub||s.access_token}catch{return s?.access_token||null}}
export function watchSession(callback){window.addEventListener('storage',e=>{if(e.key===null){callback();return}if(e.key!==KEY)return;try{const old=e.oldValue?JSON.parse(e.oldValue):null,current=getSession();if(identity(old)!==identity(current))callback()}catch{callback()}})}
export async function list(){if(!shared)return JSON.parse(localStorage.getItem('au-ido-trips')||'[]');await checkAccess();return(await api('/rest/v1/au_ido_trips?select=data,revision,updated_at&order=updated_at.desc')).map(r=>({...r.data,revision:r.revision,updatedAt:r.updated_at}))}
export async function save(trip){if(!shared)throw Error('Para crear o modificar cuentas necesitas entrar y elegir un viaje existente en Viajes.');await verifyExpenseTravel(api,trip);const {revision,updatedAt,...data}=trip,next={...data,revision:(revision||0)+1,updatedAt:new Date().toISOString()};if(!shared){const all=await list(),old=all.find(t=>t.id===trip.id);if(old&&old.revision!==revision)throw Error('Otra pestaña ha modificado este viaje. Actualiza antes de guardar.');localStorage.setItem('au-ido-trips',JSON.stringify([...all.filter(t=>t.id!==trip.id),next]));return next}
 const rows=revision?await api('/rest/v1/au_ido_trips?id=eq.'+encodeURIComponent(trip.id)+'&revision=eq.'+revision,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({data,revision:next.revision,updated_at:next.updatedAt})}):await api('/rest/v1/au_ido_trips',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({id:trip.id,data,revision:1,updated_at:next.updatedAt})});if(!rows?.length)throw Error('Otra persona ha modificado este viaje. Actualiza los datos antes de volver a guardar.');return next;
}

