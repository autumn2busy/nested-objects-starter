'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface FirmLogoProps {
  name: string
  logoUrl: string | null
  websiteUrl: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * FirmLogo component with conservative crawler-friendly fallbacks:
 * 1. Try the provided logo_url
 * 2. Fall back to initials-based placeholder
 */
export function FirmLogo({ name, logoUrl, size = 'md', className = '' }: FirmLogoProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [fallbackLevel, setFallbackLevel] = useState(0) // 0 = original, 1 = initials
  const [isLoading, setIsLoading] = useState(true)

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-base',
  }

  const sizePixels = {
    sm: 32,
    md: 48,
    lg: 64,
  }

  // Keep public crawls focused on first-party assets. External firm logos often
  // block crawlers or return transient 4xx statuses.
  const isValidImageUrl = (url: string | null): boolean => {
    if (!url) return false
    return url.startsWith('/')
  }

  // Generate initials from company name
  const getInitials = (companyName: string): string => {
    const words = companyName.trim().split(/\s+/)
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase()
    }
    return words
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
  }

  // Generate a consistent color based on company name
  const getColorFromName = (companyName: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-emerald-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-cyan-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-rose-500',
      'bg-amber-500',
    ]
    
    // Simple hash function to pick a consistent color
    let hash = 0
    for (let i = 0; i < companyName.length; i++) {
      hash = companyName.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  useEffect(() => {
    setIsLoading(true)
    setFallbackLevel(0)

    // Determine initial image source
    if (isValidImageUrl(logoUrl)) {
      setImgSrc(logoUrl)
    } else {
      setImgSrc(null)
      setFallbackLevel(1)
      setIsLoading(false)
    }
  }, [logoUrl])

  const handleImageError = () => {
    setImgSrc(null)
    setFallbackLevel(1)
    setIsLoading(false)
  }

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const initials = getInitials(name)
  const bgColor = getColorFromName(name)

  // Render initials placeholder
  if (fallbackLevel === 1 || !imgSrc) {
    return (
      <div
        className={`
          ${sizeClasses[size]} 
          ${bgColor} 
          rounded-lg flex items-center justify-center 
          text-white font-bold shadow-sm
          ${className}
        `}
        title={name}
      >
        {initials}
      </div>
    )
  }

  // Render image with fallback handling
  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        rounded-lg overflow-hidden bg-white border border-slate-100 
        flex items-center justify-center
        ${className}
      `}
    >
      {isLoading && (
        <div className={`${sizeClasses[size]} animate-pulse bg-slate-100`} />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={`${name} logo`}
        className={`
          max-h-full max-w-full object-contain
          ${isLoading ? 'opacity-0 absolute' : 'opacity-100'}
        `}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </div>
  )
}

/**
 * Simple version for use in lists/cards where we just need a quick display
 */
export function FirmLogoSimple({ 
  name, 
  logoUrl, 
  size = 'md',
  className = '' 
}: FirmLogoProps) {
  const [hasError, setHasError] = useState(false)
  
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-base',
  }

  const getInitials = (companyName: string): string => {
    const words = companyName.trim().split(/\s+/)
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase()
    }
    return words.slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase()
  }

  const getColorFromName = (companyName: string): string => {
    const colors = [
      'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500',
      'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500', 'bg-rose-500', 'bg-amber-500',
    ]
    let hash = 0
    for (let i = 0; i < companyName.length; i++) {
      hash = companyName.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const isValidUrl = (url: string | null): boolean => {
    if (!url) return false
    return url.startsWith('/')
  }

  // Determine which URL to use
  let imgUrl: string | null = null
  if (!hasError) {
    if (isValidUrl(logoUrl)) {
      imgUrl = logoUrl
    }
  }

  if (!imgUrl || hasError) {
    const initials = getInitials(name)
    const bgColor = getColorFromName(name)
    
    return (
      <div
        className={`${sizeClasses[size]} ${bgColor} rounded-lg flex items-center justify-center text-white font-bold shadow-sm ${className}`}
        title={name}
      >
        {initials}
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-white border border-slate-100 flex items-center justify-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgUrl}
        alt={`${name} logo`}
        className="max-h-full max-w-full object-contain"
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  )
}
