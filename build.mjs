import {mkdir,copyFile} from 'node:fs/promises';
for(const dir of ['lib','.openai','gastos','vacaciones'])await mkdir('dist/'+dir,{recursive:true});
for(const f of ['index.html','style.css','config.js','store.js','app.js','icon.svg','AuIdo_Logo.jpg','lib/accounts.mjs','gastos/index.html','vacaciones/index.html'])await copyFile(f,'dist/'+f);
try { await copyFile('.openai/hosting.json','dist/.openai/hosting.json'); } catch (e) { if(e.code!=='ENOENT')throw e; }
console.log('Portal AU Ido, Gastos y Vacaciones preparados en dist/');
