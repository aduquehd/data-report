'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { Info } from 'lucide-react'
import { DataPoint, ChartDimensions } from '@/lib/types'

interface BoxPlotProps {
  data: DataPoint[]
  dimensions?: ChartDimensions
}

export default function BoxPlot({ 
  data, 
  dimensions = {
    width: 600,
    height: 350,
    margin: { top: 20, right: 30, bottom: 40, left: 50 }
  }
}: BoxPlotProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height, margin } = dimensions
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    // Group data by date and then by day of week to get daily counts
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    // First, count records per day (date)
    const dailyCounts = d3.rollup(
      data,
      v => v.length,
      d => d3.timeDay(d.timestamp).toISOString()
    )
    
    // Then group these daily counts by day of week
    const dayOfWeekCounts = new Map<number, number[]>()
    for (let i = 0; i < 7; i++) {
      dayOfWeekCounts.set(i, [])
    }
    
    dailyCounts.forEach((count, dateStr) => {
      const date = new Date(dateStr)
      const dayOfWeek = date.getDay()
      dayOfWeekCounts.get(dayOfWeek)?.push(count)
    })
    
    const boxData = Array.from(dayOfWeekCounts, ([day, counts]) => {
      if (counts.length === 0) {
        return {
          day: weekDays[day],
          dayIndex: day,
          min: 0,
          q1: 0,
          median: 0,
          q3: 0,
          max: 0,
          outliers: []
        }
      }
      
      const sorted = counts.sort((a, b) => a - b)
      const q1 = d3.quantile(sorted, 0.25) || 0
      const median = d3.quantile(sorted, 0.5) || 0
      const q3 = d3.quantile(sorted, 0.75) || 0
      const iqr = q3 - q1
      const min = Math.max(sorted[0], q1 - 1.5 * iqr)
      const max = Math.min(sorted[sorted.length - 1], q3 + 1.5 * iqr)
      
      return {
        day: weekDays[day],
        dayIndex: day,
        min,
        q1,
        median,
        q3,
        max,
        outliers: sorted.filter(v => v < min || v > max)
      }
    }).sort((a, b) => a.dayIndex - b.dayIndex)

    const xScale = d3.scaleBand()
      .domain(weekDays)
      .range([0, innerWidth])
      .padding(0.2)

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(boxData, d => d.min) || 0,
        d3.max(boxData, d => d.max) || 0
      ])
      .nice()
      .range([innerHeight, 0])

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const boxWidth = xScale.bandwidth()

    boxData.forEach(d => {
      const x = xScale(d.day) || 0
      
      // Vertical line (min to max)
      g.append('line')
        .attr('x1', x + boxWidth / 2)
        .attr('x2', x + boxWidth / 2)
        .attr('y1', yScale(d.min))
        .attr('y2', yScale(d.max))
        .attr('stroke', '#00d4ff')
        .attr('stroke-width', 1)

      // Box (q1 to q3)
      g.append('rect')
        .attr('x', x)
        .attr('y', yScale(d.q3))
        .attr('width', boxWidth)
        .attr('height', yScale(d.q1) - yScale(d.q3))
        .attr('fill', '#00d4ff')
        .attr('fill-opacity', 0.3)
        .attr('stroke', '#00d4ff')
        .attr('stroke-width', 2)

      // Median line
      g.append('line')
        .attr('x1', x)
        .attr('x2', x + boxWidth)
        .attr('y1', yScale(d.median))
        .attr('y2', yScale(d.median))
        .attr('stroke', '#00ff88')
        .attr('stroke-width', 2)

      // Outliers
      g.selectAll('.outlier')
        .data(d.outliers)
        .enter().append('circle')
        .attr('cx', x + boxWidth / 2)
        .attr('cy', v => yScale(v))
        .attr('r', 3)
        .attr('fill', '#ff6b6b')
        .attr('fill-opacity', 0.6)
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
    <div className="chart-container relative">
      <div className="absolute top-4 right-4 z-10">
        <div className="group relative">
          <Info className="w-5 h-5 text-gray-500 hover:text-gray-300 cursor-help transition-colors" />
          <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-gray-900 text-gray-200 text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-10 shadow-lg border border-gray-700">
            Shows statistical distribution with quartiles, median, and outliers
            <div className="absolute right-2 bottom-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-900"></div>
          </div>
        </div>
      </div>
      <h3 className="chart-title">Weekly Box Plot</h3>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  )
}