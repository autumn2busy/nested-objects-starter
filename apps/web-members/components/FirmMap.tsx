'use client'

import { useCallback, useState } from 'react'
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api'
import { Firm } from '../lib/directory'

type FirmMapProps = {
  firms: Firm[]
  center?: { lat: number; lng: number }
  zoom?: number
  className?: string
  onFirmClick?: (firm: Firm) => void
}

const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 } // Center of US
const DEFAULT_ZOOM = 4

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '400px',
}

const mapOptions = {
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
  zoomControl: true,
}

export function FirmMap({
  firms,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = '',
  onFirmClick,
}: FirmMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [selectedFirm, setSelectedFirm] = useState<Firm | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY || '',
  })

  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance)

      // Auto-fit bounds to show all firms with coordinates
      const firmsWithCoords = firms.filter((f) => f.latitude != null && f.longitude != null)

      if (firmsWithCoords.length > 0) {
        const bounds = new window.google.maps.LatLngBounds()
        firmsWithCoords.forEach((firm) => {
          if (firm.latitude != null && firm.longitude != null) {
            bounds.extend({ lat: firm.latitude, lng: firm.longitude })
          }
        })
        mapInstance.fitBounds(bounds)

        // Prevent over-zooming on single firm
        const listener = window.google.maps.event.addListenerOnce(
          mapInstance,
          'bounds_changed',
          () => {
            if (mapInstance.getZoom()! > 15) {
              mapInstance.setZoom(15)
            }
          }
        )
      }
    },
    [firms]
  )

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const handleMarkerClick = (firm: Firm) => {
    setSelectedFirm(firm)
    if (onFirmClick) {
      onFirmClick(firm)
    }
  }

  if (loadError) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-md border border-red-200 bg-red-50 p-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-red-900">Failed to load map</p>
          <p className="mt-1 text-xs text-red-700">
            Please check your Google Maps API configuration
          </p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-md border border-slate-200 bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-teal-600" />
          <p className="mt-3 text-sm text-slate-600">Loading map...</p>
        </div>
      </div>
    )
  }

  // Filter firms that have valid coordinates
  const firmsWithCoords = firms.filter((f) => f.latitude != null && f.longitude != null)

  return (
    <div className={`relative ${className}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {firmsWithCoords.map((firm) => (
          <Marker
            key={firm.id}
            position={{
              lat: firm.latitude!,
              lng: firm.longitude!,
            }}
            title={firm.name}
            onClick={() => handleMarkerClick(firm)}
            onMouseOver={() => setSelectedFirm(firm)}
          />
        ))}

        {selectedFirm && selectedFirm.latitude != null && selectedFirm.longitude != null && (
          <InfoWindow
            position={{
              lat: selectedFirm.latitude,
              lng: selectedFirm.longitude,
            }}
            onCloseClick={() => setSelectedFirm(null)}
          >
            <div className="max-w-[220px] p-2">
              <h3 className="text-sm font-bold text-slate-900">{selectedFirm.name}</h3>
              {selectedFirm.address_city && selectedFirm.address_state && (
                <p className="mt-1 text-xs text-slate-600">
                  {selectedFirm.address_city}, {selectedFirm.address_state}
                </p>
              )}
              {selectedFirm.geographic_coverage && (
                <p className="mt-1 text-xs text-slate-500">
                  Coverage: {selectedFirm.geographic_coverage}
                </p>
              )}
              <a
                href={`/firms/${selectedFirm.slug ?? selectedFirm.id}`}
                className="mt-2 inline-block text-xs font-semibold text-teal-700 hover:underline"
              >
                View Profile →
              </a>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {firmsWithCoords.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-slate-50/90">
          <p className="text-sm text-slate-600">No firms with location data to display</p>
        </div>
      )}
    </div>
  )
}