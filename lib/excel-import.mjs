const xml = s => new DOMParser().parseFromString(s, 'application/xml');
const nodes = (root, name) => [...root.getElementsByTagNameNS('*', name)];
const text = node => nodes(node, 't').map(n => n.textContent).join('');
async function unzip(buffer) {
  const v = new DataView(buffer), bytes = new Uint8Array(buffer), decoder = new TextDecoder();
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { end = i; break; }
  if (end < 0) throw Error('El archivo no es un Excel .xlsx válido.');
  const count = v.getUint16(end + 10, true), offset = v.getUint32(end + 16, true), files = new Map();
  if (count > 1000) throw Error('El archivo tiene demasiados elementos.');
  let p = offset, total = 0;
  for (let i = 0; i < count; i++) {
    if (p + 46 > bytes.length || v.getUint32(p, true) !== 0x02014b50) throw Error('Archivo Excel dañado.');
    const method = v.getUint16(p + 10, true), compressed = v.getUint32(p + 20, true), size = v.getUint32(p + 24, true), nameLength = v.getUint16(p + 28, true), extra = v.getUint16(p + 30, true), comment = v.getUint16(p + 32, true), local = v.getUint32(p + 42, true);
    const name = decoder.decode(bytes.slice(p + 46, p + 46 + nameLength));
    p += 46 + nameLength + extra + comment;
    total += size; if (total > 30 * 1024 * 1024) throw Error('El contenido del Excel es demasiado grande.');
    if (!name.startsWith('xl/') || name.endsWith('/')) continue;
    if (local + 30 > bytes.length || v.getUint32(local, true) !== 0x04034b50) throw Error('Archivo Excel dañado.');
    const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    if (start + compressed > bytes.length || ![0, 8].includes(method)) throw Error('Compresión de Excel no admitida.');
    let data = bytes.slice(start, start + compressed);
    if (method === 8) {
      if (!globalThis.DecompressionStream) throw Error('Tu navegador no admite esta importación. Actualízalo.');
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      data = new Uint8Array(await new Response(stream).arrayBuffer());
    }
    if (data.length !== size) throw Error('Archivo Excel dañado.');
    files.set(name, decoder.decode(data));
  }
  return files;
}
export async function readWorkbook(file) {
  if (file.size > 10 * 1024 * 1024) throw Error('El Excel supera 10 MB.');
  const files = await unzip(await file.arrayBuffer()), workbook = xml(files.get('xl/workbook.xml') || ''), rels = xml(files.get('xl/_rels/workbook.xml.rels') || ''), shared = xml(files.get('xl/sharedStrings.xml') || '<sst/>');
  const settings = nodes(workbook, 'workbookPr')[0];
  if (['1','true'].includes(settings?.getAttribute('date1904'))) throw Error('Este Excel usa el sistema de fechas de 1904, que todavía no es compatible.');
  const strings = nodes(shared, 'si').map(text), relMap = new Map(nodes(rels, 'Relationship').map(n => [n.getAttribute('Id'), n.getAttribute('Target')]));
  const sheets = nodes(workbook, 'sheet').map(n => {
    const id = n.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'), target = relMap.get(id) || '';
    const path = target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '');
    return { name: n.getAttribute('name'), path };
  }).filter(s => files.has(s.path));
  if (!sheets.length) throw Error('No se han encontrado hojas compatibles en el Excel.');
  return sheets.map(sheet => {
    const doc = xml(files.get(sheet.path)), rows = [];
    for (const row of nodes(doc, 'row')) {
      const number = Number(row.getAttribute('r')); if (!number || number > 10000) continue;
      const cells = [];
      for (const c of nodes(row, 'c')) {
        const ref = c.getAttribute('r') || '', letters = ref.match(/^[A-Z]+/)?.[0]; if (!letters) continue;
        const index = [...letters].reduce((a, x) => a * 26 + x.charCodeAt(0) - 64, 0) - 1; if (index > 255) continue;
        const type = c.getAttribute('t'), value = nodes(c, 'v')[0]?.textContent ?? '';
        cells[index] = type === 's' ? strings[Number(value)] ?? '' : type === 'inlineStr' ? text(c) : value;
      }
      rows.push({ number, cells });
    }
    return {name: sheet.name, rows};
  });
}
export function excelDate(value) {
  const s = String(value ?? '').trim(); let date;
  if (/^\d+(\.\d+)?$/.test(s)) { const serial = Number(s); if (serial < 61 || serial > 100000) return ''; date = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000).toISOString().slice(0, 10); }
  else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) date = s;
  else { const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/); if (!m) return ''; date = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
  return !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date ? date : '';
}
