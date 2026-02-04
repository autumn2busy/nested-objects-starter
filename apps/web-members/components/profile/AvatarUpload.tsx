'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Loader2, Upload, User, Camera } from 'lucide-react'

interface AvatarUploadProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function AvatarUpload({ size = 'md', className = '' }: AvatarUploadProps) {
    const { user, accessToken, profileAvatarUrl, updateProfileAvatarUrl } = useAuth()
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const sizeClasses = {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-24 w-24 text-xl'
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!accessToken) {
            alert('You must be logged in to upload an avatar.')
            return
        }

        // Client-side validation
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB')
            return
        }

        if (!file.type.startsWith('image/')) {
            alert('Only image files are allowed')
            return
        }

        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/profile/avatar', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                body: formData
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed')
            }

            // Update global auth state with new URL
            if (data.url) {
                updateProfileAvatarUrl(data.url)
            }

        } catch (error) {
            console.error('Avatar upload error:', error)
            alert(error instanceof Error ? error.message : 'Failed to upload avatar')
        } finally {
            setIsUploading(false)
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const triggerUpload = () => {
        fileInputRef.current?.click()
    }

    const initials = user?.name
        ? user.name.charAt(0).toUpperCase()
        : user?.email?.charAt(0).toUpperCase() || '?'

    return (
        <div className={`relative group ${className}`}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
            />

            <button
                type="button"
                onClick={triggerUpload}
                disabled={isUploading}
                className={`
          relative flex items-center justify-center rounded-full 
          border border-brand-mist bg-brand-copper/10 text-brand-slate 
          overflow-hidden transition-all hover:ring-2 hover:ring-brand-copper/50
          ${sizeClasses[size]}
        `}
                title="Change profile picture"
            >
                {isUploading ? (
                    <Loader2 className="animate-spin text-brand-copper" size={size === 'sm' ? 12 : 20} />
                ) : profileAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={profileAvatarUrl}
                        alt="Profile"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <span className="font-bold text-brand-copper">{initials}</span>
                )}

                {/* Hover Overlay */}
                {!isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white w-1/2 h-1/2" />
                    </div>
                )}
            </button>
        </div>
    )
}
