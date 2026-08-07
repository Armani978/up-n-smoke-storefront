import type { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules, ProductStatus } from '@medusajs/framework/utils'
import { createApiKeysWorkflow, createInventoryLevelsWorkflow, createLocationFulfillmentSetWorkflow, createProductCategoriesWorkflow, createProductsWorkflow, createRegionsWorkflow, createSalesChannelsWorkflow, createServiceZonesWorkflow, createShippingOptionsWorkflow, createShippingProfilesWorkflow, createStockLocationsWorkflow, createStoresWorkflow, createTaxRegionsWorkflow, linkSalesChannelsToApiKeyWorkflow, linkSalesChannelsToStockLocationWorkflow } from '@medusajs/medusa/core-flows'

const catalog=[
 ['Luxe Nano Pro','VPE-001','Devices',44.99,18,'Compact adjustable pod system with all-day battery life.','https://images.unsplash.com/photo-1604754742629-3e5728249d73?auto=format&fit=crop&w=700&q=80'],
 ['Nova Pod X','VPE-002','Pod Systems',34.99,9,'Pocket-ready pod system with fast USB-C charging.','https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=700&q=80'],
 ['Fogger 8000','DSP-001','Disposables',19.99,24,'Rechargeable disposable with smooth consistent output.','https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=700&q=80'],
 ['Pulse Bar','DSP-002','Disposables',12.99,4,'Compact grab-and-go device in rotating flavor drops.','https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=700&q=80'],
 ['Charge Case','ACC-001','Accessories',24.99,7,'Protective charging case for compatible devices.','/product-placeholder.svg'],
 ['EXO Tank','ACC-002','Accessories',29.99,0,'Durable replacement tank with adjustable airflow.','https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=700&q=80'],
] as const

export default async function seed({container}:{container:MedusaContainer}){
 const logger=container.resolve(ContainerRegistrationKeys.LOGGER),query=container.resolve(ContainerRegistrationKeys.QUERY),link=container.resolve(ContainerRegistrationKeys.LINK)
 logger.info('Seeding UP N SMOKE pickup store...')
 const {result:[channel]}=await createSalesChannelsWorkflow(container).run({input:{salesChannelsData:[{name:'UP N SMOKE Online Pickup'}]}})
 const {result:[key]}=await createApiKeysWorkflow(container).run({input:{api_keys:[{title:'Storefront Publishable Key',type:'publishable',created_by:''}]}})
 await linkSalesChannelsToApiKeyWorkflow(container).run({input:{id:key.id,add:[channel.id]}})
 await createStoresWorkflow(container).run({input:{stores:[{name:'UP N SMOKE VAPORS',supported_currencies:[{currency_code:'usd',is_default:true}],default_sales_channel_id:channel.id}]}})
 await createRegionsWorkflow(container).run({input:{regions:[{name:'New Hampshire Pickup',currency_code:'usd',countries:['us'],payment_providers:['pp_system_default']}]}})
 await createTaxRegionsWorkflow(container).run({input:[{country_code:'us',provider_id:'tp_system'}]})
 const {result:[shippingProfile]}=await createShippingProfilesWorkflow(container).run({input:{data:[{name:'UP N SMOKE Pickup Profile',type:'default'}]}})
 const {result:[location]}=await createStockLocationsWorkflow(container).run({input:{locations:[{name:'Manchester Store',address:{address_1:'655 S Willow St Unit 115A',city:'Manchester',province:'NH',postal_code:'03103',country_code:'US'}}]}})
 await link.create({[Modules.STOCK_LOCATION]:{stock_location_id:location.id},[Modules.FULFILLMENT]:{fulfillment_provider_id:'manual_manual'}})
 await linkSalesChannelsToStockLocationWorkflow(container).run({input:{id:location.id,add:[channel.id]}})
 const names=[...new Set(catalog.map(x=>x[2]))]
 const {result:categories}=await createProductCategoriesWorkflow(container).run({input:{product_categories:names.map(name=>({name,is_active:true}))}})
 await createProductsWorkflow(container).run({input:{products:catalog.map(([title,sku,category,amount,,description,image])=>({title,handle:sku.toLowerCase(),description,status:ProductStatus.PUBLISHED,shipping_profile_id:shippingProfile.id,category_ids:[categories.find(c=>c.name===category)!.id],images:[{url:image}],options:[{title:'Format',values:['Standard']}],variants:[{title:'Standard',sku,manage_inventory:true,options:{Format:'Standard'},prices:[{currency_code:'usd',amount}]}],sales_channels:[{id:channel.id}]}))}})
 const {data:items}=await query.graph({entity:'inventory_item',fields:['id','sku']})
 await createInventoryLevelsWorkflow(container).run({input:{inventory_levels:items.filter(x=>catalog.some(p=>p[1]===x.sku)).map(item=>({location_id:location.id,inventory_item_id:item.id,stocked_quantity:catalog.find(p=>p[1]===item.sku)?.[4]||0}))}})
 await createLocationFulfillmentSetWorkflow(container).run({input:{location_id:location.id,fulfillment_set_data:{name:'Manchester Store Pickup',type:'pickup'}}})
 const {data:[fulfillmentSet]}=await query.graph({entity:'fulfillment_set',fields:['id'],filters:{name:'Manchester Store Pickup'}})
 const {result:[serviceZone]}=await createServiceZonesWorkflow(container).run({input:{data:[{name:'Manchester Pickup Zone',fulfillment_set_id:fulfillmentSet.id,geo_zones:[{type:'country',country_code:'us'}]}]}})
 await createShippingOptionsWorkflow(container).run({input:[{name:'Free In-Store Pickup',service_zone_id:serviceZone.id,shipping_profile_id:shippingProfile.id,provider_id:'manual_manual',price_type:'flat',type:{label:'In-Store Pickup',description:'Pickup at 655 S Willow St',code:'store-pickup'},prices:[{currency_code:'usd',amount:0}]}]})
 logger.info(`Seed complete. Publishable key: ${key.token}`)
}
