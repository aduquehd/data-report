'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { DataPoint, ChartDimensions } from '@/lib/types'

interface RecordsByHourProps {
  data: DataPoint[]
  dimensions?: ChartDimensions
}

export default function RecordsByHour({ 
  data, 
  dimensions = {
    width: 600,
    height: 350,
    margin: { top: 20, right: 30, bottom: 40, left: 50 }
  }
}: RecordsByHourProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height, margin } = dimensions
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Count records by hour
    const hourCounts = Array(24).fill(0)
    const hourValues: number[][] = Array(24).fill(null).map(() => [])
    
    data.forEach(d => {
      const hour = d.timestamp.getHours()
      hourCounts[hour]++
      hourValues[hour].push(d.value)
    })

    const hourData = hourCounts.map((count, hour) => ({
      hour,
      count,
      avgValue: hourValues[hour].length > 0 
        ? hourValues[hour].reduce((a, b) => a + b, 0) / hourValues[hour].length 
        : 0
    }))

    const xScale = d3.scaleBand()
      .domain(d3.range(24).map(String))
      .range([0, innerWidth])
      .padding(0.1)

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(hourData, d => d.count) || 0])
      .nice()
      .range([innerHeight, 0])

    const colorScale = d3.scaleSequential()
      .domain([0, d3.max(hourData, d => d.count) || 0])
      .interpolator(d3.interpolateViridis)

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Add bars with gradient based on count
    g.selectAll('.bar')
      .data(hourData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(String(d.hour)) || 0)
      .attr('y', d => yScale(d.count))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.count))
      .attr('fill', d => colorScale(d.count))
      .attr('stroke', '#00d4ff')
      .attr('stroke-width', 0.5)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke-width', 2)
          .attr('stroke', '#00ff88')
        
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0)
        
        tooltip.transition().duration(200).style('opacity', .9)
        tooltip.html(`
          Hour: ${d.hour}:00 - ${d.hour}:59<br/>
          Records: ${d.count}<br/>
          Avg Value: ${d.avgValue.toFixed(2)}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px')
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke-width', 0.5)
          .attr('stroke', '#00d4ff')
        
        d3.selectAll('.tooltip').remove()
      })

    // Add value labels on top of bars
    g.selectAll('.label')
      .data(hourData.filter(d => d.count > 0))
      .enter().append('text')
      .attr('class', 'label')
      .attr('x', d => (xScale(String(d.hour)) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.count) - 5)
      .attr('text-anchor', 'middle')
      .style('fill', '#00ff88')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .text(d => d.count)

    // Add axes
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

    // Add peak hours annotation
    const peakHour = hourData.reduce((max, d) => d.count > max.count ? d : max)
    const offPeakHour = hourData.reduce((min, d) => d.count < min.count ? d : min)

    g.append('text')
      .attr('x', innerWidth - 10)
      .attr('y', 15)
      .attr('text-anchor', 'end')
      .style('fill', '#00ff88')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text(`Peak: ${peakHour.hour}:00 (${peakHour.count} records)`)

    g.append('text')
      .attr('x', innerWidth - 10)
      .attr('y', 30)
      .attr('text-anchor', 'end')
      .style('fill', '#ff6b6b')
      .style('font-size', '11px')
      .text(`Low: ${offPeakHour.hour}:00 (${offPeakHour.count} records)`)

    // Add business hours overlay (9 AM - 5 PM)
    g.append('rect')
      .attr('x', xScale('9') || 0)
      .attr('y', 0)
      .attr('width', ((xScale('17') || 0) - (xScale('9') || 0)) + xScale.bandwidth())
      .attr('height', innerHeight)
      .attr('fill', '#00d4ff')
      .attr('opacity', 0.05)
      .attr('stroke', '#00d4ff')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,5')

    g.append('text')
      .attr('x', ((xScale('9') || 0) + (xScale('17') || 0) + xScale.bandwidth()) / 2)
      .attr('y', 10)
      .attr('text-anchor', 'middle')
      .style('fill', '#00d4ff')
      .style('font-size', '10px')
      .style('opacity', 0.6)
      .text('Business Hours')

  }, [data, dimensions])

  return (
    <div className="chart-container">
      <h3 className="chart-title">Records by Hour of Day</h3>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  )
}