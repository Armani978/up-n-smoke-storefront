import {medusa} from './medusa.js';

export const isMedusaConfigured=Boolean(import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY);

export async function loadMedusaCatalog(){
 if(!isMedusaConfigured)return null;
 const {regions}=await medusa.store.region.list({limit:20});
 const region=regions.find(item=>item.currency_code==='usd')||regions[0];
 if(!region)throw new Error('Medusa has no storefront region configured.');
 const {products}=await medusa.store.product.list({limit:100,region_id:region.id,fields:'*variants.calculated_price,+variants.inventory_quantity,+categories'});
 return products.map(product=>{
  const variant=product.variants?.[0],price=variant?.calculated_price?.calculated_amount??variant?.prices?.find(x=>x.currency_code==='usd')?.amount??0;
  const sku=variant?.sku||product.handle,category=product.categories?.[0]?.name||({'VPE':'Devices','DSP':'Disposables','ACC':'Accessories'}[sku?.split('-')[0]]||'Other');
  return {id:product.id,variantId:variant?.id,name:product.title,sku,category,price:Number(price),stock:Math.max(0,Number(variant?.inventory_quantity)||0),description:product.description||'Available for in-store pickup.',img:product.thumbnail||product.images?.[0]?.url||'https://placehold.co/700x700/f7f7f2/1e1e1c?text=UP+N+SMOKE'};
 });
}
