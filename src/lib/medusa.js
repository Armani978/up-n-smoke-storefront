import Medusa from '@medusajs/js-sdk';

// Configure VITE_MEDUSA_BACKEND_URL and VITE_MEDUSA_PUBLISHABLE_KEY to connect
// this production storefront to a Medusa v2 backend. The UI uses local seed
// inventory until those values are present, so development stays deterministic.
export const medusa=new Medusa({
 baseUrl:import.meta.env.VITE_MEDUSA_BACKEND_URL||'http://localhost:9000',
 publishableKey:import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY||'',
 debug:import.meta.env.DEV,
 auth:{type:'session'}
});
