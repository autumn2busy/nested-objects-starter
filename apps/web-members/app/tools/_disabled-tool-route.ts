import { redirect } from 'next/navigation'

export function redirectDisabledMemberTool(): never {
  redirect('/tools')
}
