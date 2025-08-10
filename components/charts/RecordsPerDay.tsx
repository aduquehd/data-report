'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { Info } from 'lucide-react'
import { DataPoint, ChartDimensions } from '@/lib/types'

interface RecordsPerDayProps {
  data: DataPoint[]
  dimensions?: ChartDimensions
}

export default function RecordsPerDay({ 
  data, 
  dimensions = {
    width: 600,
    height: 350,
    margin: { top: 20, right: 30, bottom: 60, left: 60 }
  }
}: RecordsPerDayProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height, margin } = dimensions
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Group data by day
    const dailyData = d3.rollup(
      data,
      v => v.length,
      d => d3.timeDay(d.timestamp)
    )

    const chartData = Array.from(dailyData, ([date, count]) => ({
      date,
      count
    })).sort((a, b) => a.date.getTime() - b.date.getTime())

    const xScale = d3.scaleTime()
      .domain(d3.extent(chartData, d => d.date) as [Date, Date])
      .range([0, innerWidth])

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.count) || 0])
      .nice()
      .range([innerHeight, 0])

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Add gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'records-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%')

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#00d4ff')
      .attr('stop-opacity', 0.8)

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#00d4ff')
      .attr('stop-opacity', 0.1)

    // Calculate bar width based on data density
    const barWidth = Math.max(1, (innerWidth / chartData.length) * 0.8)

    // Add bars
    g.selectAll('.bar')
      .data(chartData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.date) - barWidth / 2)
      .attr('y', d => yScale(d.count))
      .attr('width', barWidth)
      .attr('height', d => innerHeight - yScale(d.count))
      .attr('fill', 'url(#records-gradient)')
      .attr('stroke', '#00d4ff')
      .attr('stroke-width', 0.5)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('fill', '#00ff88')
          .attr('stroke', '#00ff88')
        
        // Tooltip
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0)
        
        tooltip.transition().duration(200).style('opacity', .9)
        tooltip.html(`Date: ${d.date.toLocaleDateString()}<br/>Records: ${d.count}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px')
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('fill', 'url(#records-gradient)')
          .attr('stroke', '#00d4ff')
        
        d3.selectAll('.tooltip').remove()
      })

    // Add axes
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat((d) => d3.timeFormat('%b %d')(d as Date))
        .ticks(d3.timeDay.every(Math.ceil(chartData.length / 10))))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(yScale))

    // Add labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (innerHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', '#64748b')
      .style('font-size', '12px')
      .text('Number of Records')

    // Add average line
    const avgCount = d3.mean(chartData, d => d.count) || 0
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(avgCount))
      .attr('y2', yScale(avgCount))
      .attr('stroke', '#ff00ff')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.6)

    g.append('text')
      .attr('x', innerWidth - 5)
      .attr('y', yScale(avgCount) - 5)
      .attr('text-anchor', 'end')
      .style('fill', '#ff00ff')
      .style('font-size', '10px')
      .text(`Avg: ${avgCount.toFixed(0)}`)

  }, [data, dimensions])

  return (
    <div className="chart-container relative">
      <div className="absolute top-4 right-4 z-10">
        <div className="group relative">
          <Info className="w-5 h-5 text-gray-500 hover:text-gray-300 cursor-help transition-colors" />
          <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-gray-900 text-gray-200 text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg border border-gray-700">
            Daily record count distribution showing data volume patterns over time
            <div className="absolute right-2 bottom-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-900"></div>
          </div>
        </div>
      </div>
      <h3 className="chart-title">Records per Day</h3>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  )
}