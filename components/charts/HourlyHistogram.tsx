'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { DataPoint, ChartDimensions } from '@/lib/types'

interface HourlyHistogramProps {
  data: DataPoint[]
  dimensions?: ChartDimensions
}

export default function HourlyHistogram({ 
  data, 
  dimensions = {
    width: 600,
    height: 350,
    margin: { top: 20, right: 30, bottom: 40, left: 50 }
  }
}: HourlyHistogramProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height, margin } = dimensions
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const hourCounts = Array(24).fill(0)
    data.forEach(d => {
      const hour = d.timestamp.getHours()
      hourCounts[hour]++
    })

    const hourData = hourCounts.map((count, hour) => ({ hour, count }))

    const xScale = d3.scaleBand()
      .domain(d3.range(24).map(String))
      .range([0, innerWidth])
      .padding(0.1)

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(hourData, d => d.count) || 0])
      .nice()
      .range([innerHeight, 0])

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    g.selectAll('.bar')
      .data(hourData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(String(d.hour)) || 0)
      .attr('y', d => yScale(d.count))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.count))
      .attr('fill', '#00ff88')
      .attr('opacity', 0.8)
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 1)
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8)
      })

    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(yScale))

  }, [data, dimensions])

  return (
    <div className="chart-container">
      <h3 className="chart-title">Hourly Distribution</h3>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  )
}