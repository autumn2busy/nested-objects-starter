import type { FirmRow } from './page'

export function formatPay(firm: Pick<FirmRow, 'pay_min' | 'pay_max' | 'pay_type' | 'pay_range'>): string | null {
    if (firm.pay_min && firm.pay_max) {
        const min = Math.round(Number(firm.pay_min))
        const max = Math.round(Number(firm.pay_max))
        const unit = firm.pay_type || '/inspection'
        return `$${min} - $${max} ${unit}`
    }
    if (firm.pay_range) return firm.pay_range
    return null
}

export function parseCategories(cats: string[] | string | null): string[] {
    if (!cats) return []
    if (Array.isArray(cats)) return cats.filter(Boolean)
    try {
        const p = JSON.parse(cats)
        if (Array.isArray(p)) return p.filter(Boolean)
    } catch {}
    return cats.split(',').map((s: string) => s.trim()).filter(Boolean)
}

export function parseSocialLinks(social: string | null): string[] {
    if (!social) return []
    try {
        const p = JSON.parse(social)
        if (Array.isArray(p)) return p.filter(Boolean)
    } catch {}
    return []
}
