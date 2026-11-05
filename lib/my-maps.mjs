export function myMapsId(id){return typeof id==='string'&&/^[A-Za-z0-9_-]{10,200}$/.test(id)}
export function myMapsLinks(input){if(!input||!String(input).trim())return null;let url;try{url=new URL(String(input).trim().replaceAll('&amp;','&'))}catch{throw Error('Pega un enlace completo de Google My Maps.');}
 if(url.protocol!=='https:'||!['www.google.com','google.com','www.google.es','google.es'].includes(url.hostname)||url.username||url.password||url.port||!/^\/maps\/d\/(?:u\/\d+\/)?(?:edit|viewer|embed)\/?$/.test(url.pathname)||url.searchParams.getAll('mid').length!==1||!myMapsId(url.searchParams.get('mid')))throw Error('Utiliza un enlace de Google My Maps con su identificador mid.');
 const mid=url.searchParams.get('mid');return {mid,viewer:'https://www.google.com/maps/d/viewer?mid='+encodeURIComponent(mid),embed:'https://www.google.com/maps/d/embed?mid='+encodeURIComponent(mid)};
}
