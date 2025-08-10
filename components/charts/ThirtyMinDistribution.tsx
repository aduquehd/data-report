'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { DataPoint, ChartDimensions } from '@/lib/types'

interface ThirtyMinDistributionProps {
  data: DataPoint[]
  dimensions?: ChartDimensions
}

export default function ThirtyMinDistribution({ 
  data, 
  dimensions = {
    width: 600,
    height: 350,
    margin: { top: 50, right: 30, bottom: 60, left: 50 }
  }
}: ThirtyMinDistributionProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height, margin } = dimensions
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Create 48 30-minute intervals (24 hours * 2)
    const intervalCounts = Array(48).fill(0)
    const intervalLabels: string[] = []
    
    // Generate labels for each 30-min interval
    for (let hour = 0; hour < 24; hour++) {
      intervalLabels.push(`${hour.toString().padStart(2, '0')}:00`)
      intervalLabels.push(`${hour.toString().padStart(2, '0')}:30`)
    }

    // Count records in each 30-minute interval
    data.forEach(d => {
      const hour = d.timestamp.getHours()
      const minute = d.timestamp.getMinutes()
      const intervalIndex = hour * 2 + (minute >= 30 ? 1 : 0)
      intervalCounts[intervalIndex]++
    })

    const intervalData = intervalCounts.map((count, index) => ({
      interval: index,
      label: intervalLabels[index],
      count,
      hour: Math.floor(index / 2),
      isHalfHour: index % 2 === 1
    }))

    const maxCount = d3.max(intervalData, d => d.count) || 0

    const xScale = d3.scaleBand()
      .domain(intervalData.map(d => String(d.interval)))
      .range([0, innerWidth])
      .padding(0.05)

    const yScale = d3.scaleLinear()
      .domain([0, maxCount])
      .nice()
      .range([innerHeight, 0])

    // Color scale - different colors for morning, afternoon, evening, night
    const getColor = (hour: number) => {
      if (hour >= 6 && hour < 12) return '#00d4ff' // Morning - cyan
      if (hour >= 12 && hour < 18) return '#00ff88' // Afternoon - green
      if (hour >= 18 && hour < 22) return '#ff00ff' // Evening - magenta
      return '#6366f1' // Night - indigo
    }

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-innerHeight)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.3)

    // Add bars
    g.selectAll('.bar')
      .data(intervalData)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(String(d.interval)) || 0)
      .attr('y', d => yScale(d.count))
      .attr('width', xScale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.count))
      .attr('fill', d => getColor(d.hour))
      .attr('opacity', d => d.isHalfHour ? 0.6 : 0.9)
      .attr('stroke', d => getColor(d.hour))
      .attr('stroke-width', 0.5)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke-width', 2)
        
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0)
        
        tooltip.transition().duration(200).style('opacity', .9)
        tooltip.html(`
          Interval: ${d.label} - ${intervalLabels[d.interval + 1] || '00:00'}<br/>
          Records: ${d.count}<br/>
          Percentage: ${((d.count / data.length) * 100).toFixed(1)}%
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px')
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .attr('opacity', d.isHalfHour ? 0.6 : 0.9)
          .attr('stroke-width', 0.5)
        
        d3.selectAll('.tooltip').remove()
      })

    // Add x-axis with selective labels (every 2 hours)
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale)
        .tickValues(intervalData
          .filter(d => d.interval % 4 === 0) // Show every 2 hours
          .map(d => String(d.interval)))
        .tickFormat(i => intervalLabels[Number(i)])
      )
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(yScale))

    // Add legend for time periods above the chart
    const legendData = [
      { label: 'Morning (6-12)', color: '#00d4ff' },
      { label: 'Afternoon (12-18)', color: '#00ff88' },
      { label: 'Evening (18-22)', color: '#ff00ff' },
      { label: 'Night (22-6)', color: '#6366f1' }
    ]

    // Position legend above the chart area
    const legend = svg.append('g')
      .attr('transform', `translate(${margin.left + (innerWidth / 2) - 200}, 15)`)

    legendData.forEach((item, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(${i * 100}, 0)`)

      legendRow.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', item.color)
        .attr('opacity', 0.8)

      legendRow.append('text')
        .attr('x', 15)
        .attr('y', 9)
        .style('font-size', '10px')
        .style('fill', '#94a3b8')
        .text(item.label)
    })

    // Add peak interval annotation
    const peakInterval = intervalData.reduce((max, d) => d.count > max.count ? d : max)
    
    if (peakInterval.count > 0) {
      g.append('line')
        .attr('x1', (xScale(String(peakInterval.interval)) || 0) + xScale.bandwidth() / 2)
        .attr('x2', (xScale(String(peakInterval.interval)) || 0) + xScale.bandwidth() / 2)
        .attr('y1', yScale(peakInterval.count))
        .attr('y2', yScale(peakInterval.count) - 20)
        .attr('stroke', '#ff00ff')
        .attr('stroke-width', 1)
        .attr('marker-end', 'url(#arrowhead)')

      g.append('text')
        .attr('x', (xScale(String(peakInterval.interval)) || 0) + xScale.bandwidth() / 2)
        .attr('y', yScale(peakInterval.count) - 25)
        .attr('text-anchor', 'middle')
        .style('fill', '#ff00ff')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .text(`Peak: ${peakInterval.label}`)
    }

  }, [data, dimensions])

  return (
    <div className="chart-container">
      <h3 className="chart-title">Distribution Throughout Day (30-min intervals)</h3>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  )
}