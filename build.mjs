import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist/lib',{recursive:true});await mkdir('dist/.openai',{recursive:true});
for(const f of ['index.html','style.css','config.js','store.js','app.js','icon.svg','lib/accounts.mjs','.openai/hosting.json'])await copyFile(f,'dist/'+f);
console.log('App estática preparada en dist/');
