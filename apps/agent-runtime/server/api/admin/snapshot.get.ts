import { defineEventHandler } from 'nitro/h3'

import adminSnapshot from '../../../api/admin/snapshot.js'

export default defineEventHandler(({ req }) => adminSnapshot.fetch(req))
