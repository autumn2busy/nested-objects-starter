export type MemberToolLink = {
  href: string
  label: string
}

export function normalizeMemberToolHref(href: string): string {
  return href.startsWith('/tools/') ? '/tools' : href
}

export function normalizeMemberToolLink<T extends MemberToolLink>(link: T): T {
  if (!link.href.startsWith('/tools/')) return link

  return {
    ...link,
    href: '/tools',
    label: /preview/i.test(link.label) ? link.label : `${link.label} preview`,
  }
}
