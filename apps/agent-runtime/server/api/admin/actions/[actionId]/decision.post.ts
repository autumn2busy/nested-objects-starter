import { defineEventHandler } from 'nitro/h3'

import adminActionDecision from '../../../../../api/admin/actions/[actionId]/decision.js'

export default defineEventHandler(({ req }) => adminActionDecision.fetch(req))
