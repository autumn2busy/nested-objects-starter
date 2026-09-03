import { defineEventHandler } from 'nitro/h3'

import adminRunDetail from '../../../../api/admin/runs/[runId].js'

export default defineEventHandler(({ req }) => adminRunDetail.fetch(req))
