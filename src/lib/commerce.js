import { medusa } from './medusa.js';

const CART_KEY='uns-medusa-cart-id';
const ADMIN_TOKEN_KEY='uns-medusa-admin-token';
const backendUrl=import.meta.env.VITE_MEDUSA_BACKEND_URL||'http://localhost:9000';
const publishableKey=import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY||'';

let regionPromise;
export function getStoreRegion(){
 if(!regionPromise)regionPromise=medusa.store.region.list({limit:20}).then(({regions})=>regions.find(x=>x.currency_code==='usd')||regions[0]);
 return regionPromise;
}

export async function getOrCreateCart(){
 const stored=localStorage.getItem(CART_KEY);
 if(stored){
  try{return (await medusa.store.cart.retrieve(stored,{fields:'*items,*items.variant,*items.product,*shipping_methods,*payment_collection'})).cart}catch{localStorage.removeItem(CART_KEY)}
 }
 const region=await getStoreRegion();
 if(!region)throw new Error('The pickup region is not configured.');
 const {cart}=await medusa.store.cart.create({region_id:region.id},{fields:'*items,*items.variant,*items.product'});
 localStorage.setItem(CART_KEY,cart.id);
 return cart;
}

export function cartItemsForStorefront(cart,catalog){
 const productsByVariant=new Map(catalog.map(product=>[product.variantId,product]));
 return (cart?.items||[]).flatMap(item=>{
  const product=productsByVariant.get(item.variant_id);
  return product?[{id:product.id,lineItemId:item.id,qty:item.quantity}]:[];
 });
}

export async function addVariantToCart(variantId,quantity=1){
 const cart=await getOrCreateCart();
 return (await medusa.store.cart.createLineItem(cart.id,{variant_id:variantId,quantity},{fields:'*items,*items.variant,*items.product'})).cart;
}

export async function updateCartLine(lineItemId,quantity){
 const cart=await getOrCreateCart();
 if(quantity<1){
  const result=await medusa.store.cart.deleteLineItem(cart.id,lineItemId,{fields:'*items,*items.variant,*items.product'});
  return result.parent;
 }
 return (await medusa.store.cart.updateLineItem(cart.id,lineItemId,{quantity},{fields:'*items,*items.variant,*items.product'})).cart;
}

export async function completePickupCart({name,email,phone,pickupWindow,notes}){
 let cart=await getOrCreateCart();
 const [first_name,...rest]=name.trim().split(/\s+/);
 const last_name=rest.join(' ')||'-';
 const address={first_name,last_name,phone,address_1:'655 S Willow St Unit 115A',city:'Manchester',province:'NH',postal_code:'03103',country_code:'us'};
 cart=(await medusa.store.cart.update(cart.id,{email,shipping_address:address,billing_address:address,metadata:{pickup_window:pickupWindow,pickup_notes:notes||''}},{fields:'*items,*shipping_methods,*payment_collection'})).cart;
 const {shipping_options}=await medusa.store.fulfillment.listCartOptions({cart_id:cart.id});
 const pickup=shipping_options.find(option=>option.type?.code==='store-pickup')||shipping_options[0];
 if(!pickup)throw new Error('No in-store pickup option is configured.');
 cart=(await medusa.store.cart.addShippingMethod(cart.id,{option_id:pickup.id},{fields:'*items,*shipping_methods,*payment_collection'})).cart;
 await medusa.store.payment.initiatePaymentSession(cart,{provider_id:'pp_system_default'});
 const result=await medusa.store.cart.complete(cart.id);
 if(result.type!=='order')throw new Error(result.error?.message||'Medusa could not place this pickup order.');
 localStorage.removeItem(CART_KEY);
 return result.order;
}

export async function signInCustomer(email,password){
 await medusa.auth.login('customer','emailpass',{email,password});
 return (await medusa.store.customer.retrieve()).customer;
}

export async function registerCustomer({first_name,last_name,email,password}){
 const token=await medusa.auth.register('customer','emailpass',{email,password});
 const response=await fetch(`${backendUrl}/store/customers`,{method:'POST',headers:{'content-type':'application/json',Authorization:`Bearer ${token}`,'x-publishable-api-key':publishableKey},body:JSON.stringify({first_name,last_name,email})});
 if(!response.ok){const data=await response.json();throw new Error(data.message||'Unable to create customer account.')}
 return signInCustomer(email,password);
}

export async function signInEmployee(email,password){
 const response=await fetch(`${backendUrl}/auth/user/emailpass`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password})});
 const data=await response.json();
 if(!response.ok||!data.token)throw new Error(data.message||'Unable to sign in.');
 sessionStorage.setItem(ADMIN_TOKEN_KEY,data.token);
 return data.token;
}

export function signOutEmployee(){sessionStorage.removeItem(ADMIN_TOKEN_KEY)}
export function isEmployeeSignedIn(){return Boolean(sessionStorage.getItem(ADMIN_TOKEN_KEY))}

const fileToBase64=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file)});

export async function importInventoryWorkbook(file,dryRun=true){
 const token=sessionStorage.getItem(ADMIN_TOKEN_KEY);
 if(!token)throw new Error('Employee session expired. Please sign in again.');
 const response=await fetch(`${backendUrl}/admin/inventory-import`,{method:'POST',headers:{'content-type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({file_base64:await fileToBase64(file),dry_run:dryRun})});
 const data=await response.json();
 if(!response.ok)throw new Error(data.message||'Unable to import inventory.');
 return data;
}
