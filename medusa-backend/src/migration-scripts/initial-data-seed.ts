import type { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createApiKeysWorkflow, createLocationFulfillmentSetWorkflow, createRegionsWorkflow, createSalesChannelsWorkflow, createServiceZonesWorkflow, createShippingOptionsWorkflow, createShippingProfilesWorkflow, createStockLocationsWorkflow, createStoresWorkflow, createTaxRegionsWorkflow, linkSalesChannelsToApiKeyWorkflow, linkSalesChannelsToStockLocationWorkflow } from '@medusajs/medusa/core-flows'

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
 await createLocationFulfillmentSetWorkflow(container).run({input:{location_id:location.id,fulfillment_set_data:{name:'Manchester Store Pickup',type:'pickup'}}})
 const {data:[fulfillmentSet]}=await query.graph({entity:'fulfillment_set',fields:['id'],filters:{name:'Manchester Store Pickup'}})
 const {result:[serviceZone]}=await createServiceZonesWorkflow(container).run({input:{data:[{name:'Manchester Pickup Zone',fulfillment_set_id:fulfillmentSet.id,geo_zones:[{type:'country',country_code:'us'}]}]}})
 await createShippingOptionsWorkflow(container).run({input:[{name:'Free In-Store Pickup',service_zone_id:serviceZone.id,shipping_profile_id:shippingProfile.id,provider_id:'manual_manual',price_type:'flat',type:{label:'In-Store Pickup',description:'Pickup at 655 S Willow St',code:'store-pickup'},prices:[{currency_code:'usd',amount:0}]}]})
 logger.info(`Seed complete. Publishable key: ${key.token}`)
}
