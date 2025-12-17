'use client'

import { useEffect, useRef, useState } from 'react'
import { select } from 'd3-selection'
import { geoPath, geoAlbersUsa } from 'd3-geo'
import * as topojson from 'topojson-client'
import 'd3-transition' // Side-effect import for transition support
import firmsData from './data/firms_map_data.json'

// Use real data types
export type MapFirm = {
    id: string
    name: string
    lat: number
    lng: number
}

// Map firmsData to match expected type
const typedFirmsData = firmsData as MapFirm[]

export function HeroMap() {
    const svgRef = useRef<SVGSVGElement>(null)
    const [usData, setUsData] = useState<any>(null)
    const [dimensions, setDimensions] = useState({ width: 960, height: 600 })

    // 1. Fetch Topology
    useEffect(() => {
        fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
            .then((res) => res.json())
            .then((data) => {
                setUsData(data)
            })
            .catch(err => console.error("Failed to load map data", err))
    }, [])

    // 2. Handle Resize
    useEffect(() => {
        function handleResize() {
            if (svgRef.current) {
                const { width, height } = svgRef.current.getBoundingClientRect()
                setDimensions({ width, height })
            }
        }
        window.addEventListener('resize', handleResize)
        handleResize()
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // 3. Render Map
    useEffect(() => {
        if (!usData || !svgRef.current) return

        const svg = select(svgRef.current)
        svg.selectAll('*').remove() // Clear previous render

        const pathGenerator = geoPath()

        // A. Draw States (Wireframe style)
        const states = topojson.feature(usData, usData.objects.states) as any

        // Create projection to fit container
        const projection = geoAlbersUsa()
            .fitSize([dimensions.width, dimensions.height], states)

        pathGenerator.projection(projection)

        // Draw Map Paths
        svg.append('g')
            .selectAll('path')
            .data(states.features)
            .enter()
            .append('path')
            .attr('d', pathGenerator as any)
            .attr('fill', '#0F172A') // Slate-900 background
            .attr('stroke', '#334155') // Slate-700 lines
            .attr('stroke-width', 0.5)

        // B. Draw Firms (Real Data)
        const firmsSelection = svg.append('g')
            .selectAll('circle')
            .data(typedFirmsData)
            .enter()
            .append('circle')
            .attr('cx', (d) => {
                const coords = projection([d.lng, d.lat])
                return coords ? coords[0] : -1000 // Hide if outside projection
            })
            .attr('cy', (d) => {
                const coords = projection([d.lng, d.lat])
                return coords ? coords[1] : -1000
            })
            .attr('r', 2)
            .attr('fill', '#10b981') // Emerald-500
            .attr('opacity', 0.6)

        // Add pulsing effect
        firmsSelection.each(function () {
            const circle = select(this)
            const randomDelay = Math.random() * 2000

            function repeat() {
                // Cast to any to bypass strict typing issues with d3-transition augmentation
                // @ts-ignore
                circle
                    .transition()
                    .delay(randomDelay)
                    .duration(2000)
                    .attr('r', 4)
                    .attr('opacity', 0)
                    .transition()
                    .duration(0)
                    .attr('r', 2)
                    .attr('opacity', 0.6)
                    .on('end', repeat)
            }
            repeat()
        })

    }, [usData, dimensions])

    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-none md:pointer-events-auto">
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
