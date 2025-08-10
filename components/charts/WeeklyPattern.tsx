'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { Info } from 'lucide-react'
import { DataPoint, ChartDimensions } from '@/lib/types'

interface WeeklyPatternProps {
  data: DataPoint[]
  dimensions?: ChartDimensions
}

export default function WeeklyPattern({ 
  data, 
  dimensions = {
    width: 600,
    height: 350,
    margin: { top: 20, right: 30, bottom: 40, left: 50 }
  }
}: WeeklyPatternProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height, margin } = dimensions
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayCounts = Array(7).fill(0)
    
    data.forEach(d => {
      dayCounts[d.timestamp.getDay()]++
    })

    const weekData = dayCounts.map((count, i) => ({
      day: weekDays[i],
      count,
      index: i
    }))

    const xScale = d3.scaleBand()
      .domain(weekDays)
      .range([0, innerWidth])
      .padding(0.2)

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(weekData, d => d.count) || 0])
      .nice()
      .range([innerHeight, 0])

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Futuristic neon color palette
    const colors = [
      '#00ffff', // Sunday - Electric Cyan
      '#ff00ff', // Monday - Neon Magenta
      '#00ff88', // Tuesday - Matrix Green
      '#ff6b00', // Wednesday - Neon Orange
      '#bd00ff', // Thursday - Electric Purple
      '#00ffaa', // Friday - Teal Glow
      '#ff0099'  // Saturday - Hot Pink
    ]

    // Add gradient definitions for each bar
    const defs = svg.append('defs')
    colors.forEach((color, i) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `weekly-gradient-${i}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%')
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color)
        .attr('stop-opacity', 1)
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', color)
        .attr('stop-opacity', 0.4)
    })

    g.selectAll('.bar')
      .data(weekData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.day) || 0)
      .attr('y', d => yScale(d.count))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.count))
      .attr('fill', d => `url(#weekly-gradient-${d.index})`)
      .attr('stroke', d => colors[d.index])
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.8)
      .style('filter', (d) => 'drop-shadow(0 0 8px ' + colors[d.index] + ')')
      .attr('rx', 2)
      .attr('ry', 2)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-width', 2)
          .style('filter', 'drop-shadow(0 0 16px ' + colors[d.index] + ')')
          .attr('transform', `translate(0, -2)`)
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-width', 1)
          .style('filter', 'drop-shadow(0 0 8px ' + colors[d.index] + ')')
          .attr('transform', 'translate(0, 0)')
      })

    // Add value labels on bars
    g.selectAll('.label')
      .data(weekData)
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', d => (xScale(d.day) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.count) - 5)
      .attr('text-anchor', 'middle')
      .style('fill', '#e2e8f0')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .text(d => d.count)

    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(yScale))

  }, [data, dimensions])

  return (
    <div id="weekly-chart" className="chart-container relative">
      <div className="absolute top-4 right-4 z-10">
        <div className="group relative">
          <Info className="w-5 h-5 text-gray-500 hover:text-gray-300 cursor-help transition-colors" />
          <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-gray-900 text-gray-200 text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg border border-gray-700">
            Visualizes weekly patterns and trends across multiple weeks
            <div className="absolute right-2 bottom-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-900"></div>
          </div>
        </div>
      </div>
      <h3 className="chart-title">Weekly Pattern</h3>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  )
}