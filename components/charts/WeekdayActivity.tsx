'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { DataPoint, ChartDimensions } from '@/lib/types'

interface WeekdayActivityProps {
  data: DataPoint[]
  dimensions?: ChartDimensions
}

export default function WeekdayActivity({ 
  data, 
  dimensions = {
    width: 600,
    height: 350,
    margin: { top: 20, right: 100, bottom: 40, left: 60 }
  }
}: WeekdayActivityProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height, margin } = dimensions
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Days of week
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    // Initialize data structure
    const weekdayData = weekdays.map((day, index) => ({
      day,
      dayShort: weekdayShort[index],
      dayIndex: index,
      count: 0,
      values: [] as number[],
      hourlyDistribution: Array(24).fill(0),
      avgValue: 0,
      peakHour: 0,
      percentage: 0
    }))

    // Populate data
    data.forEach(d => {
      const dayIndex = d.timestamp.getDay()
      const hour = d.timestamp.getHours()
      weekdayData[dayIndex].count++
      weekdayData[dayIndex].values.push(d.value)
      weekdayData[dayIndex].hourlyDistribution[hour]++
    })

    // Calculate statistics
    weekdayData.forEach(day => {
      day.avgValue = day.values.length > 0 
        ? day.values.reduce((a, b) => a + b, 0) / day.values.length 
        : 0
      day.peakHour = day.hourlyDistribution.indexOf(Math.max(...day.hourlyDistribution))
      day.percentage = (day.count / data.length) * 100
    })

    const maxCount = d3.max(weekdayData, d => d.count) || 0

    const xScale = d3.scaleBand()
      .domain(weekdayShort)
      .range([0, innerWidth])
      .padding(0.2)

    const yScale = d3.scaleLinear()
      .domain([0, maxCount])
      .nice()
      .range([innerHeight, 0])

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Add gradient definitions
    const defs = svg.append('defs')
    
    weekdayData.forEach((day, i) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `weekday-gradient-${i}`)
        .attr('x1', '0%').attr('y1', '100%')
        .attr('x2', '0%').attr('y2', '0%')

      // Weekend vs weekday colors
      const isWeekend = i === 0 || i === 6
      const topColor = isWeekend ? '#ff00ff' : '#00d4ff'
      const bottomColor = isWeekend ? '#ff00ff' : '#00d4ff'

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', bottomColor)
        .attr('stop-opacity', 0.2)

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', topColor)
        .attr('stop-opacity', 0.9)
    })

    // Add bars
    const bars = g.selectAll('.bar')
      .data(weekdayData)
      .enter().append('g')
      .attr('class', 'bar-group')

    bars.append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.dayShort) || 0)
      .attr('y', d => yScale(d.count))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.count))
      .attr('fill', (d, i) => `url(#weekday-gradient-${i})`)
      .attr('stroke', d => d.dayIndex === 0 || d.dayIndex === 6 ? '#ff00ff' : '#00d4ff')
      .attr('stroke-width', 1)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke-width', 3)
          .style('filter', 'drop-shadow(0px 0px 10px rgba(0, 212, 255, 0.8))')
        
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0)
        
        tooltip.transition().duration(200).style('opacity', .9)
        tooltip.html(`
          <strong>${d.day}</strong><br/>
          Records: ${d.count}<br/>
          Percentage: ${d.percentage.toFixed(1)}%<br/>
          Avg Value: ${d.avgValue?.toFixed(2)}<br/>
          Peak Hour: ${d.peakHour}:00
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px')
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke-width', 1)
          .style('filter', 'none')
        
        d3.selectAll('.tooltip').remove()
      })

    // Add value labels
    bars.append('text')
      .attr('x', d => (xScale(d.dayShort) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.count) - 5)
      .attr('text-anchor', 'middle')
      .style('fill', d => d.dayIndex === 0 || d.dayIndex === 6 ? '#ff00ff' : '#00d4ff')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text(d => d.count)

    // Add percentage labels
    bars.append('text')
      .attr('x', d => (xScale(d.dayShort) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.count) + 15)
      .attr('text-anchor', 'middle')
      .style('fill', '#64748b')
      .style('font-size', '10px')
      .text(d => `${d.percentage.toFixed(1)}%`)

    // Add axes
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(yScale))

    // Add y-axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (innerHeight / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', '#64748b')
      .style('font-size', '12px')
      .text('Number of Records')

    // Add weekend/weekday comparison
    const weekendTotal = weekdayData[0].count + weekdayData[6].count
    const weekdayTotal = data.length - weekendTotal
    const weekendAvg = weekendTotal / 2
    const weekdayAvg = weekdayTotal / 5

    const comparison = g.append('g')
      .attr('transform', `translate(${innerWidth + 10}, 20)`)

    comparison.append('text')
      .style('fill', '#64748b')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text('Average')

    comparison.append('text')
      .attr('y', 15)
      .style('fill', '#00d4ff')
      .style('font-size', '10px')
      .text(`Weekday: ${weekdayAvg.toFixed(0)}`)

    comparison.append('text')
      .attr('y', 30)
      .style('fill', '#ff00ff')
      .style('font-size', '10px')
      .text(`Weekend: ${weekendAvg.toFixed(0)}`)

    // Add sparklines for each day showing hourly distribution
    const sparklineHeight = 20
    const sparklineWidth = xScale.bandwidth() - 4
    
    weekdayData.forEach(day => {
      const sparklineG = g.append('g')
        .attr('transform', `translate(${(xScale(day.dayShort) || 0) + 2}, ${innerHeight + 25})`)

      const sparklineScale = d3.scaleLinear()
        .domain([0, d3.max(day.hourlyDistribution) || 0])
        .range([sparklineHeight, 0])

      const sparklineLine = d3.line<number>()
        .x((d, i) => (i / 23) * sparklineWidth)
        .y(d => sparklineScale(d))
        .curve(d3.curveMonotoneX)

      sparklineG.append('rect')
        .attr('width', sparklineWidth)
        .attr('height', sparklineHeight)
        .attr('fill', 'rgba(0, 212, 255, 0.05)')
        .attr('stroke', 'rgba(0, 212, 255, 0.2)')
        .attr('stroke-width', 0.5)

      sparklineG.append('path')
        .datum(day.hourlyDistribution)
        .attr('fill', 'none')
        .attr('stroke', day.dayIndex === 0 || day.dayIndex === 6 ? '#ff00ff' : '#00d4ff')
        .attr('stroke-width', 1)
        .attr('opacity', 0.6)
        .attr('d', sparklineLine)
    })

    g.append('text')
      .attr('x', -2)
      .attr('y', innerHeight + 35)
      .attr('text-anchor', 'end')
      .style('fill', '#64748b')
      .style('font-size', '9px')
      .text('24h')

  }, [data, dimensions])

  return (
    <div className="chart-container">
      <h3 className="chart-title">Activity by Day of Week</h3>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height + 50} />
    </div>
  )
}