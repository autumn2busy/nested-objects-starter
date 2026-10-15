import { defineEventHandler } from 'nitro/h3'

import refreshHandler from '../../../api/operations/free-journey-refresh.js'

export default defineEventHandler(({ req }) => refreshHandler.fetch(req))
