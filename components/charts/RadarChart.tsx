'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { Info } from 'lucide-react'
import { DataPoint, ChartDimensions } from '@/lib/types'

interface RadarChartProps {
  data: DataPoint[]
  dimensions?: ChartDimensions
}

export default function RadarChart({ 
  data, 
  dimensions = {
    width: 600,
    height: 350,
    margin: { top: 40, right: 40, bottom: 40, left: 40 }
  }
}: RadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height, margin } = dimensions
    const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2

    const hourCounts = Array(24).fill(0)
    data.forEach(d => {
      hourCounts[d.timestamp.getHours()]++
    })

    const maxValue = Math.max(...hourCounts)
    const angleSlice = (Math.PI * 2) / 24

    const rScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, radius])

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)

    // Draw circles
    const levels = 5
    for (let level = 0; level < levels; level++) {
      g.append('circle')
        .attr('r', (radius / levels) * (level + 1))
        .style('fill', 'none')
        .style('stroke', '#334155')
        .style('stroke-opacity', 0.5)
    }

    // Draw axes
    for (let i = 0; i < 24; i++) {
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', radius * Math.cos(angleSlice * i - Math.PI / 2))
        .attr('y2', radius * Math.sin(angleSlice * i - Math.PI / 2))
        .style('stroke', '#334155')
        .style('stroke-opacity', 0.5)
    }

    // Draw data
    const radarLine = d3.lineRadial<number>()
      .radius(d => rScale(d))
      .angle((_, i) => i * angleSlice)
      .curve(d3.curveLinearClosed)

    g.append('path')
      .datum(hourCounts)
      .attr('d', radarLine)
      .style('fill', '#00d4ff')
      .style('fill-opacity', 0.3)
      .style('stroke', '#00d4ff')
      .style('stroke-width', 2)

    // Add dots
    g.selectAll('.radar-dot')
      .data(hourCounts)
      .enter().append('circle')
      .attr('class', 'radar-dot')
      .attr('cx', (d, i) => rScale(d) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('cy', (d, i) => rScale(d) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('r', 3)
      .style('fill', '#00ff88')

    // Add hour labels
    g.selectAll('.hour-label')
      .data(d3.range(24))
      .enter().append('text')
      .attr('class', 'hour-label')
      .attr('x', (d) => (radius + 20) * Math.cos(angleSlice * d - Math.PI / 2))
      .attr('y', (d) => (radius + 20) * Math.sin(angleSlice * d - Math.PI / 2))
      .text(d => d + 'h')
      .style('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#64748b')

  }, [data, dimensions])

  return (
    <div id="radar-chart" className="chart-container relative">
      <div className="absolute top-4 right-4 z-10">
        <div className="group relative">
          <Info className="w-5 h-5 text-gray-500 hover:text-gray-300 cursor-help transition-colors" />
          <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-gray-900 text-gray-200 text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg border border-gray-700">
            Multi-dimensional view of activity metrics across different time periods
            <div className="absolute right-2 bottom-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-900"></div>
          </div>
        </div>
      </div>
      <h3 className="chart-title">24-Hour Radar</h3>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  )
}