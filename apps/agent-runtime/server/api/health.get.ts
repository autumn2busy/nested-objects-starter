import { defineEventHandler } from 'nitro/h3'

import healthHandler from '../../api/health.js'

export default defineEventHandler(({ req }) => healthHandler.fetch(req))
