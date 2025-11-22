import type { Metadata } from 'next'

import { UpgradeContent } from './UpgradeContent'

export const metadata: Metadata = {
  title: 'Upgrade your Nested Objects membership',
  description:
    'Move from Starter to Pro or higher with the preselected plan widget so you can unlock more hub features quickly.',
}

export default function UpgradePage() {
  return <UpgradeContent />
}
