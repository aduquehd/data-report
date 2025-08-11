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

    // Clean up any existing tooltips
    d3.selectAll('.radar-tooltip').remove()

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

    // Add tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'radar-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.9)')
      .style('color', '#00ff88')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '13px')
      .style('border', '1px solid #00ff88')
      .style('box-shadow', '0 4px 6px rgba(0, 255, 136, 0.3)')
      .style('pointer-events', 'none')
      .style('z-index', '1000')

    // Add dots with hover effects
    g.selectAll('.radar-dot')
      .data(hourCounts)
      .enter().append('circle')
      .attr('class', 'radar-dot')
      .attr('cx', (d, i) => rScale(d) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('cy', (d, i) => rScale(d) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('r', 4)
      .style('fill', '#00ff88')
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        const hour = hourCounts.indexOf(d)
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 6)
          .style('fill', '#00d4ff')
          .style('filter', 'drop-shadow(0 0 8px rgba(0, 212, 255, 1))')
        
        tooltip
          .style('visibility', 'visible')
          .html(`
            <strong>${hour}:00 - ${hour}:59</strong><br/>
            Records: ${d}<br/>
            ${((d / data.length) * 100).toFixed(1)}% of total
          `)
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px')
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 4)
          .style('fill', '#00ff88')
          .style('filter', 'none')
        
        tooltip.style('visibility', 'hidden')
      })

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

    // Cleanup tooltip on unmount
    return () => {
      d3.selectAll('.radar-tooltip').remove()
    }

  }, [data, dimensions])

  return (
    <div id="radar-chart" className="chart-container relative">
      <div className="chart-info-tooltip">
        <Info size={14} />
        <div className="tooltip-content">
          Multi-dimensional view of time-based activity patterns
        </div>
      </div>
      <h3 className="chart-title">24-Hour Radar</h3>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  )
}