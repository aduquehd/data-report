'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { DataPoint, ChartDimensions } from '@/lib/types'
import { Info } from 'lucide-react'

interface CumulativeLineProps {
  data: DataPoint[]
  dimensions?: ChartDimensions
}

export default function CumulativeLine({ 
  data, 
  dimensions = {
    width: 1250,
    height: 350,
    margin: { top: 20, right: 30, bottom: 40, left: 60 }
  }
}: CumulativeLineProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height, margin } = dimensions
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Sort data by timestamp and calculate cumulative
    const sortedData = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    let cumulative = 0
    const cumulativeData = sortedData.map(d => {
      cumulative += d.value
      return {
        timestamp: d.timestamp,
        cumulative
      }
    })

    const xScale = d3.scaleTime()
      .domain(d3.extent(cumulativeData, d => d.timestamp) as [Date, Date])
      .range([0, innerWidth])

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(cumulativeData, d => d.cumulative) || 0])
      .nice()
      .range([innerHeight, 0])

    const line = d3.line<typeof cumulativeData[0]>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.cumulative))
      .curve(d3.curveMonotoneX)

    const area = d3.area<typeof cumulativeData[0]>()
      .x(d => xScale(d.timestamp))
      .y0(innerHeight)
      .y1(d => yScale(d.cumulative))
      .curve(d3.curveMonotoneX)

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Add grid lines first (behind everything)
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickFormat(() => '')
        .ticks(8))
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.2)
      .selectAll('.tick line')
      .style('stroke', '#374151')

    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
        .ticks(6))
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.2)
      .selectAll('.tick line')
      .style('stroke', '#374151')

    // Add gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'cumulative-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', yScale(0))
      .attr('x2', 0).attr('y2', yScale(d3.max(cumulativeData, d => d.cumulative) || 0))

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#00d4ff')
      .attr('stop-opacity', 0.1)

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#00ff88')
      .attr('stop-opacity', 0.4)

    // Add area
    g.append('path')
      .datum(cumulativeData)
      .attr('fill', 'url(#cumulative-gradient)')
      .attr('d', area)

    // Add line
    g.append('path')
      .datum(cumulativeData)
      .attr('fill', 'none')
      .attr('stroke', '#00ff88')
      .attr('stroke-width', 3)
      .attr('d', line)
      .style('filter', 'drop-shadow(0px 0px 8px rgba(0, 255, 136, 0.6))')

    // Add dots for data points
    g.selectAll('.dot')
      .data(cumulativeData.filter((_, i) => i % Math.ceil(cumulativeData.length / 50) === 0))
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.timestamp))
      .attr('cy', d => yScale(d.cumulative))
      .attr('r', 4)
      .attr('fill', '#00ff88')
      .style('filter', 'drop-shadow(0px 0px 4px rgba(0, 255, 136, 0.8))')

    // Add tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.9)')
      .style('color', '#00ff88')
      .style('padding', '10px')
      .style('border-radius', '8px')
      .style('font-size', '14px')
      .style('border', '1px solid #00ff88')
      .style('box-shadow', '0 4px 6px rgba(0, 255, 136, 0.3)')
      .style('pointer-events', 'none')
      .style('z-index', '1000')

    // Add invisible overlay for mouse tracking
    const bisect = d3.bisector<typeof cumulativeData[0], Date>(d => d.timestamp).left

    const focus = g.append('g')
      .style('display', 'none')

    focus.append('circle')
      .attr('r', 6)
      .attr('fill', '#00ff88')
      .style('filter', 'drop-shadow(0px 0px 8px rgba(0, 255, 136, 1))')

    focus.append('line')
      .attr('class', 'x-hover-line')
      .attr('stroke', '#00ff88')
      .attr('stroke-width', 1)
      .attr('opacity', 0.5)
      .attr('stroke-dasharray', '3,3')

    focus.append('line')
      .attr('class', 'y-hover-line')
      .attr('stroke', '#00ff88')
      .attr('stroke-width', 1)
      .attr('opacity', 0.5)
      .attr('stroke-dasharray', '3,3')

    g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', () => {
        focus.style('display', null)
        tooltip.style('visibility', 'visible')
      })
      .on('mouseout', () => {
        focus.style('display', 'none')
        tooltip.style('visibility', 'hidden')
      })
      .on('mousemove', (event) => {
        const [mouseX] = d3.pointer(event)
        const x0 = xScale.invert(mouseX)
        const i = bisect(cumulativeData, x0, 1)
        const d0 = cumulativeData[i - 1]
        const d1 = cumulativeData[i]
        
        if (!d0 || !d1) return
        
        const d = x0.getTime() - d0.timestamp.getTime() > d1.timestamp.getTime() - x0.getTime() ? d1 : d0
        
        focus.attr('transform', `translate(${xScale(d.timestamp)},${yScale(d.cumulative)})`)
        
        focus.select('.x-hover-line')
          .attr('y1', 0)
          .attr('y2', innerHeight - yScale(d.cumulative))
        
        focus.select('.y-hover-line')
          .attr('x1', -xScale(d.timestamp))
          .attr('x2', 0)

        tooltip
          .html(`
            <div style="font-weight: bold; margin-bottom: 5px;">
              ${d3.timeFormat('%B %d, %Y %H:%M')(d.timestamp)}
            </div>
            <div style="color: #00ff88;">
              Cumulative Value: <span style="font-weight: bold;">${d.cumulative.toLocaleString()}</span>
            </div>
          `)
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 28) + 'px')
      })

    // Add X axis
    const xAxis = g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat((d) => d3.timeFormat('%b %d')(d as Date))
        .ticks(8))

    xAxis.select('.domain')
      .style('stroke', '#6b7280')
    
    xAxis.selectAll('.tick line')
      .style('stroke', '#6b7280')
    
    xAxis.selectAll('.tick text')
      .style('fill', '#9ca3af')
      .style('font-size', '12px')

    // Add X axis label
    g.append('text')
      .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + 35})`)
      .style('text-anchor', 'middle')
      .style('fill', '#9ca3af')
      .style('font-size', '14px')
      .style('font-weight', '500')
      .text('Date')

    // Add Y axis
    const yAxis = g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale)
        .ticks(6)
        .tickFormat(d3.format(',.0f')))

    yAxis.select('.domain')
      .style('stroke', '#6b7280')
    
    yAxis.selectAll('.tick line')
      .style('stroke', '#6b7280')
    
    yAxis.selectAll('.tick text')
      .style('fill', '#9ca3af')
      .style('font-size', '12px')

    // Add Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -(innerHeight / 2))
      .style('text-anchor', 'middle')
      .style('fill', '#9ca3af')
      .style('font-size', '14px')
      .style('font-weight', '500')
      .text('Cumulative Value')

    // Cleanup tooltip on unmount
    return () => {
      d3.select('body').selectAll('.tooltip').remove()
    }

  }, [data, dimensions])

  return (
    <div className="chart-container full-width relative">
      <div className="absolute top-4 right-4 z-10">
        <div className="group relative">
          <Info className="w-5 h-5 text-gray-500 hover:text-gray-300 cursor-help transition-colors" />
          <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-gray-900 text-gray-200 text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg border border-gray-700">
            Shows the cumulative sum of values over time, revealing overall growth trends
            <div className="absolute right-2 bottom-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-900"></div>
          </div>
        </div>
      </div>
      <h3 className="chart-title">Cumulative Trend</h3>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  )
}