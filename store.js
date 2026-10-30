const cfg=window.AU_IDO_CONFIG||{};
const url=String(cfg.supabaseUrl||'').replace(/\/$/,'');
export const shared=!!(url&&cfg.supabaseKey);
if(shared&&(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||String(cfg.supabaseKey).startsWith('sb_secret_')))throw new Error('Configuración no válida. Usa la URL de Supabase y su clave publicable.');
let session;try{session=JSON.parse(localStorage.getItem('au-ido-session')||'null');}catch{session=null;}
export function loggedIn(){return !!session;}
async function api(path,options={},auth=true){
 if(auth&&session&&Date.now()>session.expires_at*1000-30000){const r=await fetch(url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:cfg.supabaseKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});if(!r.ok){logout();throw new Error('Tu sesión ha caducado. Vuelve a entrar.');}keep(await r.json());}
 const r=await fetch(url+path,{...options,headers:{apikey:cfg.supabaseKey,'Content-Type':'application/json',...(auth&&session?{Authorization:'Bearer '+session.access_token}:{}),...options.headers}});
 const text=await r.text();let data;try{data=text?JSON.parse(text):null;}catch{throw new Error('El servidor no ha devuelto una respuesta válida.');}
 if(!r.ok)throw new Error(r.status===401?'Vuelve a iniciar sesión.':r.status===403?'Tu cuenta no tiene acceso a AU Ido. Solicítalo al administrador.':data?.msg||data?.message||data?.error_description||'No se ha podido completar la operación.');return data;
}
function keep(s){session={access_token:s.access_token,refresh_token:s.refresh_token,expires_at:s.expires_at||Math.floor(Date.now()/1000)+s.expires_in};localStorage.setItem('au-ido-session',JSON.stringify(session));}
export async function login(email,password){keep(await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})},false));}
export async function signup(email,password){const d=await api('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password})},false);if(d.access_token){keep(d);return true;}return false;}
export function logout(){session=null;localStorage.removeItem('au-ido-session');}
export async function list(){if(!shared)return JSON.parse(localStorage.getItem('au-ido-trips')||'[]');if(!session)throw new Error('Inicia sesión para ver los viajes del grupo.');const member=await api('/rest/v1/au_ido_members?select=email&limit=1');if(!member.length)throw new Error('Tu cuenta aún no está autorizada en AU Ido. Solicita acceso al administrador.');return (await api('/rest/v1/au_ido_trips?select=data,revision,updated_at&order=updated_at.desc')).map(r=>({...r.data,revision:r.revision,updatedAt:r.updated_at}));}
export async function save(trip){const {revision,updatedAt,...data}=trip;const next={...data,revision:(revision||0)+1,updatedAt:new Date().toISOString()};if(!shared){const all=await list();const old=all.find(t=>t.id===trip.id);if(old&&old.revision!==revision)throw new Error('Otra pestaña ha modificado este viaje. Actualiza antes de guardar.');localStorage.setItem('au-ido-trips',JSON.stringify([...all.filter(t=>t.id!==trip.id),next]));return next;}
 const rows=revision?await api('/rest/v1/au_ido_trips?id=eq.'+encodeURIComponent(trip.id)+'&revision=eq.'+revision,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({data,revision:next.revision,updated_at:next.updatedAt})}):await api('/rest/v1/au_ido_trips',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({id:trip.id,data,revision:1,updated_at:next.updatedAt})});
 if(!rows?.length)throw new Error('Otra persona ha modificado este viaje. Actualiza los datos antes de volver a guardar.');return next;
}
