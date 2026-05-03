// lib/configs/shin-supplies.config.js
import { defaultConfig } from './default.config.js'

export const shinSuppliesConfig = {
  ...defaultConfig,
  clientId:    'shin-supplies',
  clientName:  'Shin Supplies',
  eyebrow:     'SHIN SUPPLIES · CUPTERRA',
  widgetTitle: 'CRM & Pipeline',
  apiEndpoint: 'https://api.opxio.io/api/clients/shin-supplies/crm-pipeline',
  // stages and terminology unchanged — inherits default
}
