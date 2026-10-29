import type { MouseEvent } from 'react'

// Hosted login preserves query parameters in its return URL. Management links
// must not depend on the separate embedded SDK session or submit cancellation.
export const MEMBERSHIP_MANAGEMENT_URL = 'https://nested-objects.outseta.com/profile?tab=plan'
export const ACCOUNT_SETTINGS_URL = 'https://nested-objects.outseta.com/profile?tab=profile'

export function preserveHostedAccountNavigation(event: MouseEvent<HTMLAnchorElement>) {
  // Outseta intercepts matching anchors to open its embedded profile widget.
  // Stop that handler in capture phase while retaining native link navigation,
  // including keyboard activation and modified clicks that open a new tab.
  event.stopPropagation()
  event.nativeEvent.stopImmediatePropagation()
}
