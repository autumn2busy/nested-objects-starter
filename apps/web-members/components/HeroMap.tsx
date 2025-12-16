'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3-selection'
import * as d3Geo from 'd3-geo'
import * as topojson from 'topojson-client'

// Simplified type for firm data needed for the map
export type MapFirm = {
    id: string
    name: string
    lat: number
    lng: number
    pay?: number
}

// Generate some dummy data for visual testing if real data isn't passed
const MOCK_FIRMS: MapFirm[] = [
    { id: '1', name: 'SafeGuard', lat: 34.0522, lng: -118.2437, pay: 45 }, // LA
    { id: '2', name: 'MortgagePro', lat: 40.7128, lng: -74.0060, pay: 55 }, // NYC
    { id: '3', name: 'FieldOps', lat: 30.2672, lng: -97.7431, pay: 50 }, // Austin
    { id: '4', name: 'Midwest Insp', lat: 41.8781, lng: -87.6298, pay: 40 }, // Chicago
    { id: '5', name: 'Sunshine Svcs', lat: 25.7617, lng: -80.1918, pay: 48 }, // Miami
    { id: '6', name: 'Northwest', lat: 47.6062, lng: -122.3321, pay: 60 }, // Seattle
    { id: '7', name: 'Denver BPO', lat: 39.7392, lng: -104.9903, pay: 52 }, // Denver
    { id: '8', name: 'Atlanta Field', lat: 33.7490, lng: -84.3880, pay: 47 }, // Atlanta
]

export function HeroMap({ firms = MOCK_FIRMS }: { firms?: MapFirm[] }) {
    const svgRef = useRef<SVGSVGElement>(null)
    const [usData, setUsData] = useState<any>(null)
    const [dimensions, setDimensions] = useState({ width: 960, height: 600 })

    // Resize handler
    useEffect(() => {
        function handleResize() {
            if (svgRef.current) {
                const { width } = svgRef.current.getBoundingClientRect()
                // Maintain aspect ratio roughly for US map
                setDimensions({ width, height: width * 0.6 })
            }
        }

        window.addEventListener('resize', handleResize)
        handleResize() // init
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // 1. Fetch Topology
    useEffect(() => {
        fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
            .then((res) => res.json())
            .then((data) => {
                setUsData(data)
            })
            .catch(err => console.error("Failed to load map data", err))
    }, [])

    // 2. Render Map using D3
    useEffect(() => {
        if (!usData || !svgRef.current) return

        const svg = d3.select(svgRef.current)
        svg.selectAll('*').remove() // Clear previous

        const { width, height } = dimensions

        // A. Projection
        const projection = d3Geo.geoAlbersUsa()
            .translate([width / 2, height / 2])
            .scale(width * 1.3) // Scale relative to container

        const pathGenerator = d3Geo.geoPath().projection(projection)

        // B. Draw States (Wireframe style)
        const states = topojson.feature(usData, usData.objects.states) as any

        // Group for map content
        const g = svg.append('g')

        // State outlines
        g.selectAll('path')
            .data(states.features)
            .enter()
            .append('path')
            .attr('d', pathGenerator as any)
            .attr('fill', '#0F172A') // Slate-950 (Background match) or slightly lighter
            .attr('stroke', '#334155') // Slate-700
            .attr('stroke-width', 0.5)
            .attr('class', 'transition-all duration-300 hover:fill-slate-800')

        // C. Draw Firms (Pulsing Dots)
        // Filter valid coords
        const validFirms = firms.filter(f => {
            const coords = projection([f.lng, f.lat])
            return coords !== null
        })

        const firmGroup = svg.append('g').attr('class', 'firm-markers')

        validFirms.forEach(firm => {
            const coords = projection([firm.lng, firm.lat])
            if (!coords) return

            const [x, y] = coords

            // 1. Pulse ring
            firmGroup.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 2)
                .attr('fill', 'none')
                .attr('stroke', '#10B981') // Emerald-500
                .attr('stroke-width', 1)
                .attr('opacity', 0.8)
                .append('animate') // SVG native animation for performance
                .attr('attributeName', 'r')
                .attr('from', 2)
                .attr('to', 12)
                .attr('dur', '2s')
                .attr('repeatCount', 'indefinite')

            firmGroup.append('circle') // Fade for pulse
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 12)
                .attr('fill', 'none')
                .attr('opacity', 0)
                .append('animate')
                .attr('attributeName', 'opacity')
                .attr('from', 0.8)
                .attr('to', 0)
                .attr('dur', '2s')
                .attr('repeatCount', 'indefinite')

            // 2. Core dot
            firmGroup.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 3)
                .attr('fill', '#34D399') // Emerald-400
                .attr('class', 'cursor-pointer hover:r-4 transition-all')
                .append('title') // Native tooltip
                .text(`${firm.name} \nTypical Pay: $${firm.pay ?? '??'}`)
        })

    }, [usData, dimensions, firms])

    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden opacity-40 mix-blend-screen pointer-events-none md:pointer-events-auto">
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
        </div>
    )
}
