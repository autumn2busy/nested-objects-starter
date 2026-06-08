'use client'

import { useState } from 'react'
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'

type BlogApproveButtonProps = {
    slug: string
}

type ApprovalResult = {
    ok?: boolean
    error?: string
    detail?: string
    commitUrl?: string | null
    branch?: string
}

export function BlogApproveButton({ slug }: BlogApproveButtonProps) {
    const [isApproving, setIsApproving] = useState(false)
    const [result, setResult] = useState<ApprovalResult | null>(null)

    async function approvePost() {
        setIsApproving(true)
        setResult(null)

        try {
            const response = await fetch('/api/blog/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug }),
            })

            const data = (await response.json()) as ApprovalResult

            if (!response.ok) {
                setResult({
                    ok: false,
                    error: data.error || 'Approval failed',
                    detail: data.detail,
                    branch: data.branch,
                })
                return
            }

            setResult(data)
        } catch (error) {
            setResult({
                ok: false,
                error: error instanceof Error ? error.message : 'Approval failed',
            })
        } finally {
            setIsApproving(false)
        }
    }

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={approvePost}
                disabled={isApproving}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isApproving ? 'Approving...' : 'Approve'}
            </button>

            {result?.ok && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
                    <p className="font-semibold">Approval commit created.</p>
                    {result.branch && <p>Branch: {result.branch}</p>}
                    {result.commitUrl && (
                        <a
                            href={result.commitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 font-semibold underline"
                        >
                            View commit
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    )}
                </div>
            )}

            {result && !result.ok && (
                <div className="max-w-xs rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-900">
                    <p className="font-semibold">{result.error}</p>
                    {result.branch && <p>Branch: {result.branch}</p>}
                    {result.detail && <p className="mt-1 line-clamp-4 break-words">{result.detail}</p>}
                </div>
            )}
        </div>
    )
}
