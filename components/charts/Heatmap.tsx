'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { Info } from 'lucide-react'
import { DataPoint, ChartDimensions } from '@/lib/types'

interface HeatmapProps {
  data: DataPoint[]
  dimensions?: ChartDimensions
}

export default function Heatmap({ 
  data, 
  dimensions = {
    width: 600,
    height: 380,
    margin: { top: 80, right: 100, bottom: 80, left: 60 }
  }
}: HeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height, margin } = dimensions
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const heatmapData: number[][] = Array(7).fill(null).map(() => Array(24).fill(0))
    
    data.forEach(d => {
      const day = d.timestamp.getDay()
      const hour = d.timestamp.getHours()
      heatmapData[day][hour]++
    })

    const maxValue = d3.max(heatmapData.flat()) || 0

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const hours = Array.from({ length: 24 }, (_, i) => i)

    const xScale = d3.scaleBand()
      .domain(hours.map(String))
      .range([0, innerWidth])
      .padding(0.05)

    const yScale = d3.scaleBand()
      .domain(days)
      .range([0, innerHeight])
      .padding(0.05)

    // Create custom color scale with better contrast
    const colorScale = d3.scaleSequential()
      .domain([0, maxValue])
      .interpolator((t) => {
        if (t === 0) return '#0a0e27' // Very dark blue for zero
        if (t < 0.25) return d3.interpolate('#0a0e27', '#1e293b')(t * 4) // Dark slate
        if (t < 0.45) return d3.interpolate('#1e293b', '#3b82f6')((t - 0.25) * 5) // Blue
        if (t < 0.65) return d3.interpolate('#3b82f6', '#10b981')((t - 0.45) * 5) // Emerald
        if (t < 0.85) return d3.interpolate('#10b981', '#f59e0b')((t - 0.65) * 5) // Amber
        return d3.interpolate('#f59e0b', '#ef4444')((t - 0.85) * 6.67) // Red
      })

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Add background
    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', '#0a0e27')

    // Add cells with improved styling
    g.selectAll('.cell')
      .data(heatmapData.flatMap((row, day) => 
        row.map((value, hour) => ({ day, hour, value }))
      ))
      .enter().append('rect')
      .attr('class', 'cell')
      .attr('x', d => xScale(String(d.hour)) || 0)
      .attr('y', d => yScale(days[d.day]) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.value))
      .attr('stroke', d => d.value > 0 ? 'rgba(0, 212, 255, 0.2)' : '#0a0e27')
      .attr('stroke-width', 1)
      .attr('rx', 2)
      .attr('ry', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke', '#00ff88')
          .attr('stroke-width', 2)
          .style('filter', 'brightness(1.3)')
        
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0)
        
        tooltip.transition().duration(200).style('opacity', .9)
        tooltip.html(`
          <strong>${days[d.day]} ${d.hour}:00-${d.hour}:59</strong><br/>
          Events: ${d.value}<br/>
          ${d.value > 0 ? `${((d.value / data.length) * 100).toFixed(1)}% of total` : 'No activity'}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px')
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .attr('stroke', d.value > 0 ? 'rgba(0, 212, 255, 0.2)' : '#0a0e27')
          .attr('stroke-width', 1)
          .style('filter', 'none')
        
        d3.selectAll('.tooltip').remove()
      })

    // Add axes with better styling
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d => d + ':00'))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(yScale))

    // Improved legend with gradient
    const legendWidth = 200
    const legendHeight = 12

    const legendScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, legendWidth])

    const legend = svg.append('g')
      .attr('transform', `translate(${width - legendWidth - 40}, 25)`)

    // Create gradient for legend
    const legendGradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'heatmap-legend-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%')

    // Add gradient stops matching the color scale
    const gradientStops = [
      { offset: '0%', color: '#0a0e27' },      // Very dark blue
      { offset: '25%', color: '#1e293b' },     // Dark slate
      { offset: '45%', color: '#3b82f6' },     // Blue
      { offset: '65%', color: '#10b981' },     // Emerald
      { offset: '85%', color: '#f59e0b' },     // Amber
      { offset: '100%', color: '#ef4444' }     // Red
    ]

    gradientStops.forEach(stop => {
      legendGradient.append('stop')
        .attr('offset', stop.offset)
        .attr('stop-color', stop.color)
    })

    // Legend rectangle with gradient
    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', 'url(#heatmap-legend-gradient)')
      .attr('stroke', 'rgba(0, 212, 255, 0.3)')
      .attr('stroke-width', 1)
      .attr('rx', 2)

    // Legend title
    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .text('Event Density')
      .style('font-size', '12px')
      .style('fill', '#00d4ff')
      .style('font-weight', 'bold')

    // Legend axis
    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d3.format('.0f'))

    legend.append('g')
      .attr('transform', `translate(0, ${legendHeight})`)
      .call(legendAxis)
      .selectAll('text')
      .style('fill', '#64748b')
      .style('font-size', '10px')

    // Add time period labels
    const timePeriods = [
      { start: 0, end: 6, label: 'Night', color: '#6366f1' },
      { start: 6, end: 12, label: 'Morning', color: '#00d4ff' },
      { start: 12, end: 18, label: 'Afternoon', color: '#00ff88' },
      { start: 18, end: 24, label: 'Evening', color: '#ff00ff' }
    ]

    timePeriods.forEach(period => {
      const startX = xScale(String(period.start)) || 0
      const endX = (xScale(String(period.end - 1)) || 0) + xScale.bandwidth()
      
      g.append('line')
        .attr('x1', startX)
        .attr('x2', endX)
        .attr('y1', -5)
        .attr('y2', -5)
        .attr('stroke', period.color)
        .attr('stroke-width', 2)

      g.append('text')
        .attr('x', (startX + endX) / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('fill', period.color)
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .text(period.label)
    })

  }, [data, dimensions])

  return (
    <div id="heatmap-chart" className="chart-container relative">
      <div className="chart-info-tooltip">
        <Info size={14} />
        <div className="tooltip-content">
          Visualizes activity intensity by hour and day of week
        </div>
      </div>
      <h3 className="chart-title">Day/Hour Activity Heatmap</h3>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  )
}