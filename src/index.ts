import * as d3 from 'd3';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './styles.css';

interface TimestampData {
    '@timestamp': string;
    date?: Date;
}

class TimestampVisualizer {
    private data: TimestampData[] = [];

    async loadDataFromText(csvText: string): Promise<void> {
        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                complete: (results) => {
                    this.data = (results.data as TimestampData[])
                        .filter(d => d['@timestamp'])
                        .map(d => ({
                            ...d,
                            date: new Date(d['@timestamp'])
                        }))
                        .filter(d => d.date && !isNaN(d.date.getTime()));

                    console.log(`Loaded ${this.data.length} valid records`);
                    this.updateAllCharts();
                    resolve();
                },
                error: (error: any) => {
                    console.error('Error parsing CSV:', error);
                    reject(error);
                }
            });
        });
    }

    async loadSampleData(): Promise<void> {
        try {
            const response = await fetch('/data.csv');
            const csvText = await response.text();
            await this.loadDataFromText(csvText);
        } catch (error) {
            console.error('Error loading sample data:', error);
            throw error;
        }
    }

    updateAllCharts(): void {
        if (this.data.length === 0) {
            this.showNoDataMessage();
            return;
        }

        this.createDailyHistogram();
        this.createTimeSeriesChart();
        this.createHourlyDistribution();
        this.createMinuteDistribution();
        this.createWeekdayWeekendComparison();
        this.createHeatmapCalendar();
        this.createRollingAverageChart();
        this.createDayOfWeekRadar();
        this.createMonthlyComparison();
        this.displayStatistics();
    }

    showNoDataMessage(): void {
        const containers = [
            '#daily-histogram', '#time-series', '#hourly-distribution', '#minute-distribution',
            '#statistics', '#weekday-weekend', '#heatmap-calendar',
            '#rolling-average', '#day-of-week-radar', '#monthly-comparison'
        ];
        containers.forEach(id => {
            const container = d3.select(id);
            container.selectAll('*').remove();
            container.append('div')
                .attr('class', 'no-data')
                .text('No data to display. Please upload a CSV file.');
        });
    }

    createDailyHistogram(): void {
        const container = d3.select('#daily-histogram');
        container.selectAll('*').remove();

        const margin = { top: 60, right: 30, bottom: 70, left: 60 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = container
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const dailyCounts = d3.rollup(
            this.data,
            v => v.length,
            d => d3.timeDay(d.date!)
        );

        const dailyData = Array.from(dailyCounts, ([date, count]) => ({ date, count }));
        dailyData.sort((a, b) => a.date.getTime() - b.date.getTime());

        if (dailyData.length === 0) return;

        const x = d3.scaleTime()
            .domain(d3.extent(dailyData, d => d.date) as [Date, Date])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(dailyData, d => d.count) as number])
            .range([height, 0]);

        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .tickFormat(d3.timeFormat('%Y-%m-%d') as any)
                .tickValues(dailyData.map(d => d.date)))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');

        g.append('g')
            .call(d3.axisLeft(y));

        g.selectAll('.bar')
            .data(dailyData)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.date))
            .attr('y', d => y(d.count))
            .attr('width', Math.min(width / dailyData.length * 0.8, 50))
            .attr('height', d => height - y(d.count))
            .attr('fill', '#00ffff')
            .attr('fill-opacity', 0.8);

        g.append('text')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Records per Day');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Count');

        g.append('text')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom})`)
            .style('text-anchor', 'middle')
            .text('Date');
    }

    createTimeSeriesChart(): void {
        const container = d3.select('#time-series');
        container.selectAll('*').remove();

        const margin = { top: 60, right: 30, bottom: 70, left: 60 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = container
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const sortedData = [...this.data].sort((a, b) => a.date!.getTime() - b.date!.getTime());

        if (sortedData.length === 0) return;

        const x = d3.scaleTime()
            .domain(d3.extent(sortedData, d => d.date) as [Date, Date])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, sortedData.length])
            .range([height, 0]);

        const line = d3.line<TimestampData>()
            .x(d => x(d.date!))
            .y((d, i) => y(i + 1));

        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .tickFormat(d3.timeFormat('%H:%M:%S') as any));

        g.append('g')
            .call(d3.axisLeft(y));

        g.append('path')
            .datum(sortedData)
            .attr('fill', 'none')
            .attr('stroke', '#ff00ff')
            .attr('stroke-width', 3)
            .attr('stroke-opacity', 0.8)
            .attr('d', line);

        g.selectAll('.dot')
            .data(sortedData)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => x(d.date!))
            .attr('cy', (d, i) => y(i + 1))
            .attr('r', 5)
            .attr('fill', '#ff00ff')
            .attr('fill-opacity', 0.9);

        g.append('text')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Cumulative Records Over Time');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Cumulative Count');

        g.append('text')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 20})`)
            .style('text-anchor', 'middle')
            .text('Time');
    }

    createHourlyDistribution(): void {
        const container = d3.select('#hourly-distribution');
        container.selectAll('*').remove();

        const margin = { top: 60, right: 30, bottom: 50, left: 60 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = container
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const hourlyCounts = d3.rollup(
            this.data,
            v => v.length,
            d => d.date!.getHours()
        );

        const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            count: hourlyCounts.get(hour) || 0
        }));

        const x = d3.scaleBand()
            .domain(hourlyData.map(d => d.hour.toString()))
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(hourlyData, d => d.count) as number])
            .range([height, 0]);

        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .append('text')
            .attr('x', width / 2)
            .attr('y', 35)
            .attr('fill', 'black')
            .style('text-anchor', 'middle')
            .text('Hour of Day');

        g.append('g')
            .call(d3.axisLeft(y));

        g.selectAll('.bar')
            .data(hourlyData)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.hour.toString())!)
            .attr('y', d => y(d.count))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.count))
            .attr('fill', d => d.count > 0 ? '#00ffff' : 'rgba(255,255,255,0.05)')
            .attr('fill-opacity', d => d.count > 0 ? 0.8 : 1);

        g.append('text')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Records by Hour of Day');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Count');
    }

    createMinuteDistribution(): void {
        const container = d3.select('#minute-distribution');
        container.selectAll('*').remove();

        if (this.data.length === 0) return;

        const margin = { top: 60, right: 30, bottom: 70, left: 60 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = container
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const minuteIntervals = this.data.map(d => {
            const totalMinutes = d.date!.getHours() * 60 + d.date!.getMinutes();
            return totalMinutes;
        });

        const histogram = d3.histogram()
            .domain([0, 24 * 60])
            .thresholds(48);

        const bins = histogram(minuteIntervals);

        const x = d3.scaleLinear()
            .domain([0, 24 * 60])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length) as number])
            .range([height, 0]);

        g.selectAll('.bar')
            .data(bins)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.x0!))
            .attr('y', d => y(d.length))
            .attr('width', d => x(d.x1!) - x(d.x0!))
            .attr('height', d => height - y(d.length))
            .attr('fill', '#00ccff')
            .attr('fill-opacity', 0.7)
            .attr('stroke', 'rgba(0,255,255,0.3)')
            .attr('stroke-width', 0.5);

        const timeFormat = (minutes: number) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        };

        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .tickValues([0, 180, 360, 540, 720, 900, 1080, 1260, 1440])
                .tickFormat(d => timeFormat(d as number)))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');

        g.append('g')
            .call(d3.axisLeft(y));

        g.append('text')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Distribution Throughout the Day (30-min intervals)');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Count');

        g.append('text')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
            .style('text-anchor', 'middle')
            .text('Time of Day');
    }

    displayStatistics(): void {
        const stats = d3.select('#statistics');
        stats.selectAll('*').remove();

        if (this.data.length === 0) {
            stats.append('div')
                .attr('class', 'no-data')
                .text('No statistics to display');
            return;
        }

        const totalRecords = this.data.length;
        const dates = this.data.map(d => d.date!);
        const minDate = d3.min(dates);
        const maxDate = d3.max(dates);

        const timeRange = maxDate!.getTime() - minDate!.getTime();
        const avgInterval = totalRecords > 1 ? timeRange / (totalRecords - 1) : 0;

        const intervals = [];
        for (let i = 1; i < dates.length; i++) {
            intervals.push(dates[i].getTime() - dates[i - 1].getTime());
        }

        const medianInterval = d3.median(intervals) || 0;

        const formatDuration = (ms: number) => {
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);

            if (hours > 0) {
                return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
            } else if (minutes > 0) {
                return `${minutes}m ${seconds % 60}s`;
            } else {
                return `${seconds}s`;
            }
        };

        const statsHtml = `
      <div class="stat-card">
        <h3>Summary Statistics</h3>
        <p><strong>Total Records:</strong> ${totalRecords}</p>
        <p><strong>Date Range:</strong> ${minDate?.toLocaleString()} - ${maxDate?.toLocaleString()}</p>
        <p><strong>Time Span:</strong> ${formatDuration(timeRange)}</p>
        <p><strong>Average Interval:</strong> ${formatDuration(avgInterval)}</p>
        <p><strong>Median Interval:</strong> ${formatDuration(medianInterval)}</p>
      </div>
    `;

        stats.html(statsHtml);
    }

    createWeekdayWeekendComparison(): void {
        const container = d3.select('#weekday-weekend');
        container.selectAll('*').remove();

        const margin = { top: 60, right: 30, bottom: 50, left: 60 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = container
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const weekdayCount = this.data.filter(d => {
            const day = d.date!.getDay();
            return day >= 1 && day <= 5;
        }).length;

        const weekendCount = this.data.filter(d => {
            const day = d.date!.getDay();
            return day === 0 || day === 6;
        }).length;

        const data = [
            { type: 'Weekday', count: weekdayCount, avg: weekdayCount / 5 },
            { type: 'Weekend', count: weekendCount, avg: weekendCount / 2 }
        ];

        const x = d3.scaleBand()
            .domain(data.map(d => d.type))
            .range([0, width])
            .padding(0.3);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.avg) as number])
            .range([height, 0]);

        g.selectAll('.bar')
            .data(data)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.type)!)
            .attr('y', d => y(d.avg))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.avg))
            .attr('fill', d => d.type === 'Weekday' ? '#00ffff' : '#ff00ff')
            .attr('fill-opacity', 0.8);

        g.selectAll('.label')
            .data(data)
            .enter().append('text')
            .attr('x', d => x(d.type)! + x.bandwidth() / 2)
            .attr('y', d => y(d.avg) - 5)
            .attr('text-anchor', 'middle')
            .text(d => `Total: ${d.count}`);

        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x));

        g.append('g')
            .call(d3.axisLeft(y));

        g.append('text')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Weekday vs Weekend Activity (Avg per Day)');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Average Events per Day');
    }

    createHeatmapCalendar(): void {
        const container = d3.select('#heatmap-calendar');
        container.selectAll('*').remove();

        if (this.data.length === 0) return;

        const margin = { top: 60, right: 30, bottom: 50, left: 60 };
        const width = 1200 - margin.left - margin.right;
        const height = 200 - margin.top - margin.bottom;

        const svg = container
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const dailyCounts = d3.rollup(
            this.data,
            v => v.length,
            d => d3.timeDay(d.date!)
        );

        const dates = this.data.map(d => d.date!);
        const minDate = d3.timeDay(d3.min(dates)!);
        const maxDate = d3.timeDay(d3.max(dates)!);

        const cellSize = 17;
        const yearHeight = cellSize * 7 + 25;

        const colorScale = d3.scaleSequential()
            .interpolator(d3.interpolatePlasma)
            .domain([0, d3.max(Array.from(dailyCounts.values())) as number]);

        const weeks = d3.timeWeeks(minDate, maxDate);
        const days = d3.timeDays(minDate, maxDate);

        g.selectAll('.day')
            .data(days)
            .enter().append('rect')
            .attr('class', 'day')
            .attr('width', cellSize - 1)
            .attr('height', cellSize - 1)
            .attr('x', d => {
                const weekDiff = d3.timeWeek.count(minDate, d);
                return weekDiff * cellSize;
            })
            .attr('y', d => d.getDay() * cellSize)
            .attr('fill', d => {
                const count = dailyCounts.get(d3.timeDay(d)) || 0;
                return count > 0 ? colorScale(count) : 'rgba(255,255,255,0.05)';
            })
            .append('title')
            .text(d => {
                const count = dailyCounts.get(d3.timeDay(d)) || 0;
                return `${d3.timeFormat('%Y-%m-%d')(d)}: ${count} events`;
            });

        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        g.selectAll('.dayLabel')
            .data(dayLabels)
            .enter().append('text')
            .attr('class', 'dayLabel')
            .attr('x', -5)
            .attr('y', (d, i) => i * cellSize + cellSize / 2)
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '12px')
            .text(d => d);

        g.append('text')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Activity Heatmap Calendar');
    }

    createRollingAverageChart(): void {
        const container = d3.select('#rolling-average');
        container.selectAll('*').remove();

        if (this.data.length < 2) return;

        const margin = { top: 60, right: 30, bottom: 70, left: 60 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = container
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const hourlyBins = d3.rollup(
            this.data,
            v => v.length,
            d => d3.timeHour(d.date!)
        );

        const hourlyData = Array.from(hourlyBins, ([hour, count]) => ({ hour, count }))
            .sort((a, b) => a.hour.getTime() - b.hour.getTime());

        const windowSize = 3;
        const rollingAvg = hourlyData.map((d, i) => {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(hourlyData.length, i + Math.floor(windowSize / 2) + 1);
            const window = hourlyData.slice(start, end);
            const avg = d3.mean(window, w => w.count) || 0;
            return { hour: d.hour, value: d.count, avg };
        });

        const x = d3.scaleTime()
            .domain(d3.extent(rollingAvg, d => d.hour) as [Date, Date])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(rollingAvg, d => Math.max(d.value, d.avg)) as number])
            .range([height, 0]);

        const line = d3.line<{hour: Date, value: number, avg: number}>()
            .x(d => x(d.hour))
            .y(d => y(d.value));

        const avgLine = d3.line<{hour: Date, value: number, avg: number}>()
            .x(d => x(d.hour))
            .y(d => y(d.avg))
            .curve(d3.curveMonotoneX);

        g.append('path')
            .datum(rollingAvg)
            .attr('fill', 'none')
            .attr('stroke', 'rgba(255,255,255,0.3)')
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.5)
            .attr('d', line);

        g.append('path')
            .datum(rollingAvg)
            .attr('fill', 'none')
            .attr('stroke', '#00ffff')
            .attr('stroke-width', 3)
            .attr('stroke-opacity', 0.9)
            .attr('d', avgLine);

        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .tickFormat(d3.timeFormat('%H:%M') as any));

        g.append('g')
            .call(d3.axisLeft(y));

        const legend = g.append('g')
            .attr('transform', `translate(${width - 100}, 20)`);

        legend.append('line')
            .attr('x1', 0)
            .attr('x2', 20)
            .attr('y1', 0)
            .attr('y2', 0)
            .attr('stroke', '#cbd5e0')
            .attr('stroke-width', 1);

        legend.append('text')
            .attr('x', 25)
            .attr('y', 0)
            .attr('dominant-baseline', 'middle')
            .style('font-size', '12px')
            .text('Actual');

        legend.append('line')
            .attr('x1', 0)
            .attr('x2', 20)
            .attr('y1', 15)
            .attr('y2', 15)
            .attr('stroke', '#4299e1')
            .attr('stroke-width', 2);

        legend.append('text')
            .attr('x', 25)
            .attr('y', 15)
            .attr('dominant-baseline', 'middle')
            .style('font-size', '12px')
            .text('3-hr Avg');

        g.append('text')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Hourly Activity with Rolling Average');
    }

    createDayOfWeekRadar(): void {
        const container = d3.select('#day-of-week-radar');
        container.selectAll('*').remove();

        const margin = { top: 60, right: 60, bottom: 60, left: 60 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = container
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${width/2 + margin.left},${height/2 + margin.top})`);

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayCounts = Array.from({ length: 7 }, (_, i) => {
            const count = this.data.filter(d => d.date!.getDay() === i).length;
            return { day: dayNames[i], value: count };
        });

        const maxValue = d3.max(dayCounts, d => d.value) || 1;
        const angleSlice = Math.PI * 2 / 7;
        const radius = Math.min(width / 2, height / 2);

        const rScale = d3.scaleLinear()
            .domain([0, maxValue])
            .range([0, radius]);

        const levels = 5;
        for (let level = 0; level < levels; level++) {
            const levelRadius = radius * ((level + 1) / levels);

            g.append('circle')
                .attr('r', levelRadius)
                .attr('fill', 'none')
                .attr('stroke', 'rgba(0, 255, 255, 0.2)')
                .attr('stroke-width', 1);

            g.append('text')
                .attr('x', 5)
                .attr('y', -levelRadius)
                .style('font-size', '10px')
                .style('fill', '#718096')
                .text(Math.round(maxValue * ((level + 1) / levels)));
        }

        dayCounts.forEach((d, i) => {
            g.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', radius * Math.cos(angleSlice * i - Math.PI / 2))
                .attr('y2', radius * Math.sin(angleSlice * i - Math.PI / 2))
                .attr('stroke', 'rgba(0, 255, 255, 0.2)')
                .attr('stroke-width', 1);

            g.append('text')
                .attr('x', (radius + 20) * Math.cos(angleSlice * i - Math.PI / 2))
                .attr('y', (radius + 20) * Math.sin(angleSlice * i - Math.PI / 2))
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('font-size', '12px')
                .text(d.day);
        });

        const radarLine = d3.lineRadial<{day: string, value: number}>()
            .angle((d, i) => i * angleSlice)
            .radius(d => rScale(d.value))
            .curve(d3.curveLinearClosed);

        g.append('path')
            .datum(dayCounts)
            .attr('fill', '#ff00ff')
            .attr('fill-opacity', 0.2)
            .attr('stroke', '#ff00ff')
            .attr('stroke-width', 3)
            .attr('d', radarLine as any);

        g.selectAll('.dot')
            .data(dayCounts)
            .enter().append('circle')
            .attr('cx', (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
            .attr('cy', (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
            .attr('r', 5)
            .attr('fill', '#ff00ff')
            .attr('fill-opacity', 0.9);

        svg.append('text')
            .attr('x', width / 2 + margin.left)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Activity by Day of Week');
    }

    createMonthlyComparison(): void {
        const container = d3.select('#monthly-comparison');
        container.selectAll('*').remove();

        if (this.data.length === 0) return;

        const margin = { top: 60, right: 30, bottom: 70, left: 60 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = container
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyCounts = d3.rollup(
            this.data,
            v => v.length,
            d => d.date!.getMonth()
        );

        const monthlyData = monthNames.map((name, i) => ({
            month: name,
            count: monthlyCounts.get(i) || 0
        }));

        const x = d3.scaleBand()
            .domain(monthlyData.map(d => d.month))
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(monthlyData, d => d.count) as number])
            .range([height, 0]);

        g.selectAll('.bar')
            .data(monthlyData)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.month)!)
            .attr('y', d => y(d.count))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d.count))
            .attr('fill', d => d.count > 0 ? '#00ffff' : 'rgba(255,255,255,0.05)')
            .attr('fill-opacity', d => d.count > 0 ? 0.8 : 1);

        g.selectAll('.label')
            .data(monthlyData.filter(d => d.count > 0))
            .enter().append('text')
            .attr('x', d => x(d.month)! + x.bandwidth() / 2)
            .attr('y', d => y(d.count) - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .text(d => d.count);

        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x));

        g.append('g')
            .call(d3.axisLeft(y));

        g.append('text')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Monthly Activity Distribution');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Event Count');
    }

    async handleFileUpload(file: File): Promise<void> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const text = e.target?.result as string;
                    await this.loadDataFromText(text);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    async exportToPDF(): Promise<void> {
        const exportStatus = document.getElementById('export-status') as HTMLDivElement;
        exportStatus.innerHTML = '<div class="loading">Generating PDF...</div>';

        try {
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const chartContainers = [
                { id: 'statistics', title: 'Summary Statistics' },
                { id: 'daily-histogram', title: 'Records per Day' },
                { id: 'time-series', title: 'Cumulative Records Over Time' },
                { id: 'hourly-distribution', title: 'Records by Hour of Day' },
                { id: 'minute-distribution', title: 'Distribution Throughout the Day' },
                { id: 'weekday-weekend', title: 'Weekday vs Weekend Activity' },
                { id: 'heatmap-calendar', title: 'Activity Heatmap Calendar' },
                { id: 'rolling-average', title: 'Hourly Activity with Rolling Average' },
                { id: 'day-of-week-radar', title: 'Activity by Day of Week' },
                { id: 'monthly-comparison', title: 'Monthly Activity Distribution' }
            ];

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;

            pdf.setFontSize(20);
            pdf.text('Timestamp Data Analysis Report', pageWidth / 2, 20, { align: 'center' });
            pdf.setFontSize(12);
            pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });

            let isFirstChart = true;

            for (const chart of chartContainers) {
                const element = document.getElementById(chart.id);
                if (!element || element.querySelector('.no-data')) continue;

                if (!isFirstChart) {
                    pdf.addPage();
                }
                isFirstChart = false;

                const canvas = await html2canvas(element, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    logging: false,
                    useCORS: true
                });

                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pageWidth - (2 * margin);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                let yPosition = 40;

                pdf.setFontSize(14);
                pdf.text(chart.title, pageWidth / 2, yPosition, { align: 'center' });
                yPosition += 10;

                const maxHeight = pageHeight - yPosition - margin;
                const finalHeight = Math.min(imgHeight, maxHeight);
                const finalWidth = imgHeight > maxHeight ? (canvas.width * finalHeight) / canvas.height : imgWidth;

                const xPosition = (pageWidth - finalWidth) / 2;

                pdf.addImage(imgData, 'PNG', xPosition, yPosition, finalWidth, finalHeight);
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            pdf.save(`timestamp-analysis-${timestamp}.pdf`);

            exportStatus.innerHTML = '<div class="file-success">PDF exported successfully!</div>';
            setTimeout(() => {
                exportStatus.innerHTML = '';
            }, 3000);

        } catch (error) {
            console.error('Error exporting to PDF:', error);
            exportStatus.innerHTML = '<div class="file-error">Error exporting PDF. Please try again.</div>';
            setTimeout(() => {
                exportStatus.innerHTML = '';
            }, 3000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const visualizer = new TimestampVisualizer();

    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    const fileInfo = document.getElementById('file-info') as HTMLDivElement;
    const loadSampleBtn = document.getElementById('load-sample') as HTMLButtonElement;
    const uploadLabel = document.querySelector('.upload-label') as HTMLLabelElement;
    const exportPdfBtn = document.getElementById('export-pdf') as HTMLButtonElement;

    visualizer.showNoDataMessage();

    fileInput.addEventListener('change', async (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];

        if (file) {
            fileInfo.innerHTML = `<div class="loading">Processing ${file.name}...</div>`;

            try {
                await visualizer.handleFileUpload(file);
                fileInfo.innerHTML = `
          <div class="file-success">
            <strong>Loaded:</strong> ${file.name}<br>
            <small>Size: ${(file.size / 1024).toFixed(2)} KB</small>
          </div>
        `;
            } catch (error) {
                console.error('Error processing file:', error);
                fileInfo.innerHTML = `
          <div class="file-error">
            Error loading file. Please ensure it's a valid CSV with @timestamp column.
          </div>
        `;
            }
        }
    });

    uploadLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadLabel.classList.add('drag-over');
    });

    uploadLabel.addEventListener('dragleave', () => {
        uploadLabel.classList.remove('drag-over');
    });

    uploadLabel.addEventListener('drop', async (e) => {
        e.preventDefault();
        uploadLabel.classList.remove('drag-over');

        const file = e.dataTransfer?.files[0];
        if (file && file.type === 'text/csv' || file?.name.endsWith('.csv')) {
            fileInput.files = e.dataTransfer!.files;
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        }
    });

    loadSampleBtn.addEventListener('click', async () => {
        fileInfo.innerHTML = '<div class="loading">Loading sample data...</div>';

        try {
            await visualizer.loadSampleData();
            fileInfo.innerHTML = '<div class="file-success">Sample data loaded successfully</div>';
        } catch (error) {
            console.error('Error loading sample data:', error);
            fileInfo.innerHTML = '<div class="file-error">Error loading sample data</div>';
        }
    });

    exportPdfBtn.addEventListener('click', async () => {
        await visualizer.exportToPDF();
    });
});
