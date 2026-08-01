export const STORE_ADDRESS='655 S Willow St Unit 115A, Manchester, NH 03103';
export const TAX_RATE=.083;

export const seedOrders=[
 {id:'PU-1048',customerName:'Maya Rodriguez',customerEmail:'maya@example.com',customerPhone:'(603) 555-0184',status:'ready',pickupWindow:'ASAP · 15—20 min',createdAt:'2026-07-11T14:24:00.000Z',items:[{productId:'p2',productName:'Nova Pod X',quantity:1,price:34.99}],notes:'Text when ready',subtotal:34.99,tax:2.90,total:37.89},
 {id:'PU-1047',customerName:'Jordan Lee',customerEmail:'jordan@example.com',customerPhone:'(603) 555-0112',status:'preparing',pickupWindow:'Today · 4:30 PM',createdAt:'2026-07-11T13:52:00.000Z',items:[{productId:'p3',productName:'Fogger 8000',quantity:2,price:19.99}],notes:'',subtotal:39.98,tax:3.32,total:43.30},
 {id:'PU-1046',customerName:'Alex Morgan',customerEmail:'alex@example.com',customerPhone:'(603) 555-0165',status:'completed',pickupWindow:'ASAP · 15—20 min',createdAt:'2026-07-11T12:15:00.000Z',items:[{productId:'p5',productName:'Charge Case',quantity:1,price:24.99}],notes:'',subtotal:24.99,tax:2.07,total:27.06}
];

export const pickupStatuses=['pending','accepted','preparing','ready','arrived','completed','cancelled'];

export function parseInventoryCsv(text){
 const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.trim());
 if(lines.length<2)throw new Error('CSV needs a header and at least one product.');
 const split=line=>{const out=[];let cur='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&line[i+1]==='"'){cur+='"';i++}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){out.push(cur.trim());cur=''}else cur+=c}out.push(cur.trim());return out};
 const headers=split(lines[0]).map(h=>h.toLowerCase().replace(/[_-]/g,' '));
 const find=(row,names)=>{for(const n of names){const i=headers.indexOf(n);if(i>=0&&row[i])return row[i]}return''};
 return lines.slice(1).map((line,index)=>{const row=split(line),name=find(row,['name','product name','item']),sku=find(row,['sku','item sku']),price=Number(find(row,['price','retail price','sell price']).replace(/[$,]/g,'')),stock=Number(find(row,['quantity','qty','stock','inventory','on hand']));if(!name||!Number.isFinite(price)||!Number.isFinite(stock))throw new Error(`Row ${index+2}: name, price, and quantity are required.`);return {id:`import-${Date.now()}-${index}`,name,sku:sku||`UNS-${Date.now().toString().slice(-5)}-${index+1}`,category:find(row,['category','department','type'])||'Other',price,stock:Math.max(0,stock),description:find(row,['description','desc'])||'Available for in-store pickup.',img:'https://images.unsplash.com/photo-1604754742629-3e5728249d73?auto=format&fit=crop&w=700&q=80'}});
}
