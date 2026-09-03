import { isEnabledMemberToolPath } from './member-tool-access'

export type MemberToolLink = {
  href: string
  label: string
}

export function normalizeMemberToolHref(href: string): string {
  if (isEnabledMemberToolPath(href)) return href
  return href.startsWith('/tools/') ? '/tools' : href
}

export function normalizeMemberToolLink<T extends MemberToolLink>(link: T): T {
  if (!link.href.startsWith('/tools/') || isEnabledMemberToolPath(link.href)) return link

  return {
    ...link,
    href: '/tools',
    label: /preview/i.test(link.label) ? link.label : `${link.label} preview`,
  }
}
