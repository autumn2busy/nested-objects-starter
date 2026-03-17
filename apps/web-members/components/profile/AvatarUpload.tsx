'use client'

import Image from 'next/image'
import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Loader2, Camera } from 'lucide-react'

interface AvatarUploadProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function AvatarUpload({ size = 'md', className = '' }: AvatarUploadProps) {
    const { user, isAuthenticated, profileAvatarUrl, updateProfileAvatarUrl } = useAuth()
    const [isUploading, setIsUploading] = useState(false)
    const [statusMsg, setStatusMsg] = useState<string>('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const sizeClasses = {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-24 w-24 text-xl'
    }

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        console.log('[AvatarUpload] File:', file.name, file.size, file.type)

        if (file.size > 5 * 1024 * 1024) {
            setStatusMsg('File too large (max 5MB)')
            return
        }

        if (!file.type.startsWith('image/')) {
            setStatusMsg('Only image files are allowed')
            return
        }

        setStatusMsg('Uploading...')
        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', file)

            // Use cookie auth (httpOnly) — no Bearer token needed.
            // The server route calls getCurrentUser() which reads the cookie.
            const res = await fetch('/api/profile/avatar', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
            })

            console.log('[AvatarUpload] Response:', res.status)
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed')
            }

            if (data.url) {
                updateProfileAvatarUrl(data.url)
                setStatusMsg('Uploaded!')
                // Clear success message after 3s
                setTimeout(() => setStatusMsg(''), 3000)
            }

        } catch (error) {
            console.error('[AvatarUpload] Error:', error)
            setStatusMsg(error instanceof Error ? error.message : 'Upload failed')
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }, [updateProfileAvatarUrl])

    const initials = user?.name
        ? user.name.charAt(0).toUpperCase()
        : user?.email?.charAt(0).toUpperCase() || '?'

    const inputId = `avatar-file-input-${size}`

    return (
        <div className={`relative group ${className}`}>
            <input
                id={inputId}
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                aria-label="Upload profile photo"
            />

            <label
                htmlFor={inputId}
                className={`
                    relative flex items-center justify-center rounded-full cursor-pointer
                    border border-brand-mist bg-brand-copper/10 text-brand-slate 
                    overflow-hidden transition-all hover:ring-2 hover:ring-brand-copper/50
                    ${sizeClasses[size]}
                `}
                title="Click to change profile picture"
            >
                {isUploading ? (
                    <Loader2 className="animate-spin text-brand-copper" size={size === 'sm' ? 12 : 20} />
                ) : profileAvatarUrl ? (
                    <Image
                        src={profileAvatarUrl}
                        alt="Profile"
                        fill
                        className="object-cover"
                    />
                ) : (
                    <span className="font-bold text-brand-copper">{initials}</span>
                )}

                {!isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <Camera className="text-white w-1/2 h-1/2" />
                    </div>
                )}
            </label>

            {size === 'lg' && (
                <p className={`text-xs mt-2 text-center ${statusMsg === 'Uploaded!' ? 'text-green-600' :
                        statusMsg && statusMsg !== 'Uploading...' ? 'text-red-500' :
                            'text-slate-400'
                    }`}>
                    {statusMsg || 'Click to upload photo'}
                </p>
            )}
        </div>
    )
}