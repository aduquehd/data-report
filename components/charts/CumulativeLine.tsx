'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { DataPoint, ChartDimensions } from '@/lib/types'

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

    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat((d) => d3.timeFormat('%b %d')(d as Date)))

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(yScale))

  }, [data, dimensions])

  return (
    <div className="chart-container full-width">
      <h3 className="chart-title">Cumulative Trend</h3>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  )
}