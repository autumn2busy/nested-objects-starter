import { defineEventHandler } from 'nitro/h3'

import previewHandler from '../../../api/preview/evaluate.js'

export default defineEventHandler(({ req }) => previewHandler.fetch(req))
