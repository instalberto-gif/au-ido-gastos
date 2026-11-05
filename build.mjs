import {mkdir,copyFile} from 'node:fs/promises';
for(const dir of ['lib','.openai','gastos','vacaciones','viajes'])await mkdir('dist/'+dir,{recursive:true});
for(const f of ['index.html','style.css','config.js','store.js','portal.js','lib/backup.mjs','lib/travel-backup.mjs','lib/travel-links.mjs','lib/expense-links.mjs','app.js','icon.svg','AuIdo_Logo.jpg','lib/accounts.mjs','gastos/index.html','vacaciones/index.html','viajes/index.html','viajes/viajes.js','viajes/viajes.css','viajes/portada.svg','lib/travel-hub.mjs'])await copyFile(f,'dist/'+f);
try { await copyFile('.openai/hosting.json','dist/.openai/hosting.json'); } catch (e) { if(e.code!=='ENOENT')throw e; }
console.log('Portal AU Ido, Gastos, Vacaciones y Viajes preparados en dist/');

