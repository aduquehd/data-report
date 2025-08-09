'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { DataPoint, ChartDimensions } from '@/lib/types'

interface DailyHistogramProps {
  data: DataPoint[]
  dimensions?: ChartDimensions
}

export default function DailyHistogram({ 
  data, 
  dimensions = {
    width: 600,
    height: 350,
    margin: { top: 20, right: 30, bottom: 40, left: 50 }
  }
}: DailyHistogramProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height, margin } = dimensions
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const dayCounts: { [key: string]: number } = {}
    data.forEach(d => {
      const day = d.timestamp.toISOString().split('T')[0]
      dayCounts[day] = (dayCounts[day] || 0) + 1
    })

    const dayData = Object.entries(dayCounts).map(([date, count]) => ({
      date: new Date(date),
      count
    })).sort((a, b) => a.date.getTime() - b.date.getTime())

    const xScale = d3.scaleTime()
      .domain(d3.extent(dayData, d => d.date) as [Date, Date])
      .range([0, innerWidth])

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(dayData, d => d.count) || 0])
      .nice()
      .range([innerHeight, 0])

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const barWidth = innerWidth / dayData.length * 0.8

    g.selectAll('.bar')
      .data(dayData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.date) - barWidth / 2)
      .attr('y', d => yScale(d.count))
      .attr('width', barWidth)
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
      .call(d3.axisBottom(xScale).tickFormat((d) => d3.timeFormat('%b %d')(d as Date)))

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(yScale))

  }, [data, dimensions])

  return (
    <div className="chart-container">
      <h3 className="chart-title">Daily Distribution</h3>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  )
}