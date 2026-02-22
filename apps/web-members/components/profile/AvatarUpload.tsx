'use client'

import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Loader2, Camera } from 'lucide-react'

interface AvatarUploadProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function AvatarUpload({ size = 'md', className = '' }: AvatarUploadProps) {
    const { user, accessToken, profileAvatarUrl, updateProfileAvatarUrl } = useAuth()
    const [isUploading, setIsUploading] = useState(false)
    const [statusMsg, setStatusMsg] = useState<string>('Ready')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const sizeClasses = {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-24 w-24 text-xl'
    }

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('[AvatarUpload] onChange fired')
        setStatusMsg('File selected...')

        const file = e.target.files?.[0]
        if (!file) {
            console.log('[AvatarUpload] No file in event')
            setStatusMsg('No file selected')
            return
        }

        console.log('[AvatarUpload] File:', file.name, file.size, file.type)
        setStatusMsg(`Uploading ${file.name}...`)

        if (!accessToken) {
            setStatusMsg('Error: Not logged in')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setStatusMsg('Error: File too large (max 5MB)')
            return
        }

        if (!file.type.startsWith('image/')) {
            setStatusMsg('Error: Not an image file')
            return
        }

        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', file)

            console.log('[AvatarUpload] POSTing to /api/profile/avatar')
            setStatusMsg('Uploading to server...')

            const res = await fetch('/api/profile/avatar', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                body: formData
            })

            console.log('[AvatarUpload] Response status:', res.status)
            const data = await res.json()
            console.log('[AvatarUpload] Response data:', data)

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed')
            }

            if (data.url) {
                updateProfileAvatarUrl(data.url)
                setStatusMsg('Upload complete!')
            }

        } catch (error) {
            console.error('[AvatarUpload] Error:', error)
            setStatusMsg(`Error: ${error instanceof Error ? error.message : 'Upload failed'}`)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }, [accessToken, updateProfileAvatarUrl])

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
                    <img
                        src={profileAvatarUrl}
                        alt="Profile"
                        className="h-full w-full object-cover"
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

            {/* Debug status — remove after fixing */}
            {size === 'lg' && (
                <p className={`text-xs mt-2 text-center ${statusMsg.startsWith('Error') ? 'text-red-500' : statusMsg === 'Upload complete!' ? 'text-green-600' : 'text-slate-400'}`}>
                    {statusMsg}
                </p>
            )}
        </div>
    )
}