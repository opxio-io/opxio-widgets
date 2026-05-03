// lib/configs/index.js
import { defaultConfig }       from './default.config.js'
import { shinSuppliesConfig }  from './shin-supplies.config.js'

const registry = {
  'shin-supplies': shinSuppliesConfig,
}

export function getConfig(clientId) {
  return registry[clientId] || defaultConfig
}
