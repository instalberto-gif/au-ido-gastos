export function downloadJson(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function backupKey(userId,app){return 'au-ido-backup:'+userId+':'+app}
export function markBackup(userId,app){localStorage.setItem(backupKey(userId,app),new Date().toISOString())}
export function backupStatus(userId,app){const date=localStorage.getItem(backupKey(userId,app)),time=Date.parse(date);return {date:Number.isFinite(time)?date:null,due:!Number.isFinite(time)||Date.now()-time>7*86400000}}
