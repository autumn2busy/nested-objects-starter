import { defineEventHandler } from 'nitro/h3'

import adminTriggers from '../../../api/admin/triggers.js'

export default defineEventHandler(({ req }) => adminTriggers.fetch(req))
