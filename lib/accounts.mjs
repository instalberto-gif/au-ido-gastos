export function allocate(cents, ids) {
  if (!Number.isSafeInteger(cents) || cents < 0 || !ids.length || new Set(ids).size !== ids.length) throw new Error('Reparto inválido');
  return Object.fromEntries(ids.map((id,i)=>[id,Math.floor(cents/ids.length)+(i<cents%ids.length?1:0)]));
}
export function balances(trip) {
  const rows=Object.fromEntries(trip.couples.map(c=>[c.id,{...c,paid:0,share:0,balance:0}]));
  for(const e of trip.expenses){rows[e.payer].paid+=e.cents; rows[e.payer].balance+=e.cents; for(const [id,cents] of Object.entries(allocate(e.cents,e.split))){rows[id].share+=cents; rows[id].balance-=cents;}}
  for(const p of trip.payments){rows[p.from].balance+=p.cents; rows[p.to].balance-=p.cents;}
  return Object.values(rows);
}
export function settlements(trip) {
  const rows=balances(trip), debt=rows.filter(x=>x.balance<0).map(x=>({...x,amount:-x.balance})), credit=rows.filter(x=>x.balance>0).map(x=>({...x,amount:x.balance})), result=[];
  let i=0,j=0;while(i<debt.length&&j<credit.length){const cents=Math.min(debt[i].amount,credit[j].amount);result.push({from:debt[i].id,to:credit[j].id,cents});debt[i].amount-=cents;credit[j].amount-=cents;if(!debt[i].amount)i++;if(!credit[j].amount)j++;}return result;
}
export function parseMoney(value) { const s=String(value).trim().replace(',','.');if(!/^\d{1,7}(\.\d{1,2})?$/.test(s))throw new Error('Introduce un importe válido con hasta dos decimales.');const [euros,decimal='']=s.split('.');const cents=Number(euros)*100+Number(decimal.padEnd(2,'0'));if(cents<=0)throw new Error('El importe debe ser mayor que cero.');return cents; }
const str=(v,max=160)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const validId=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v);
const validDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
export function validateTrip(t) {
  if(!t||!validId(t.id)||!str(t.name)||!Array.isArray(t.couples)||!t.couples.length||t.couples.length>30||!Array.isArray(t.expenses)||!Array.isArray(t.payments)||t.expenses.length+t.payments.length>3000)throw new Error('Datos del viaje inválidos.');
  const ids=new Set(t.couples.map(c=>c.id));if(ids.size!==t.couples.length||t.couples.some(c=>!validId(c.id)||!str(c.name,60)))throw new Error('Parejas inválidas.');
  const names=t.couples.map(c=>c.name.trim().toLocaleLowerCase('es'));if(new Set(names).size!==names.length)throw new Error('Hay nombres de parejas repetidos.');
  const rowIds=new Set();for(const r of [...t.expenses,...t.payments]){if(!validId(r.id)||rowIds.has(r.id)||!validDate(r.date)||!Number.isSafeInteger(r.cents)||r.cents<=0||r.cents>999999999)throw new Error('Movimiento inválido.');rowIds.add(r.id);}
  for(const e of t.expenses)if(!str(e.concept)||!str(e.category,40)||!ids.has(e.payer)||!Array.isArray(e.split)||!e.split.length||e.split.some(id=>!ids.has(id))||new Set(e.split).size!==e.split.length)throw new Error('Gasto o reparto inválido.');
  for(const p of t.payments)if(!ids.has(p.from)||!ids.has(p.to)||p.from===p.to)throw new Error('Abono inválido.');
  return t;
}
