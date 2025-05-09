import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: +row.line,
        depth: +row.depth,
        length: +row.length,
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));
    return data;
}

function processCommits(data) {
    return d3.groups(data, (d) => d.commit).map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;

        let ret = {
            id: commit,
            url: 'https://github.com/russel-luber/portfolio/commit/' + commit,
            author,
            date,
            time,
            timezone,
            datetime,
            hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
            totalLines: lines.length,
        };

        Object.defineProperty(ret, 'lines', {
            value: lines,
            enumerable: false,
            writable: false,
            configurable: false,
        });

        return ret;
    });
}

function getTimeOfDay(hour) {
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
}

function renderTooltipContent(commit) {
    const datetime =commit.datetime;

    const formattedDate = datetime instanceof Date && !isNaN(datetime)
    ? datetime.toString()
    : '(Invalid date)';
    
    const formattedTime = datetime instanceof Date && !isNaN(datetime)
    ? datetime.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})
    : '(Invalid time)';

    document.getElementById('commit-link').href = commit.url;
    document.getElementById('commit-link').textContent = commit.id;
    document.getElementById('commit-date').textContent = formattedDate;
    document.getElementById('commit-time').textContent = formattedTime;
    document.getElementById('commit-author').textContent = commit.author;
    document.getElementById('commit-lines').textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
}

function renderCommitInfo(data, commits) {
    const wrapper = d3.select('#stats')
        .append('div')
        .attr('class', 'stats-container');

    wrapper.append('div')
        .attr('class', 'stats-title')
        .text('Summary');

    const daysWorked = d3.group(data, d => d.date.toDateString()).size;

    const workByPeriod = d3.rollups(
        data,
        v => v.length,
        d => getTimeOfDay(new Date(d.datetime).getHours())
    );
    const maxPeriod = d3.greatest(workByPeriod, d => d[1])?.[0] || 'Unknown';

    const fileCount = d3.group(data, d => d.file).size;
    const avgFileLength = fileCount > 0 ? Math.round(data.length / fileCount) : 0;

    const stats = [
        { label: 'Commits', value: commits.length },
        { label: 'Files', value: fileCount },
        { label: 'Total LOC', value: data.length },
        { label: 'Days Worked', value: daysWorked },
        { label: 'Most Active Period', value: maxPeriod },
        { label: 'Avg. File Length', value: avgFileLength }
    ];

    const statGrid = wrapper.append('div')
        .attr('class', 'stats-flex');

    statGrid.selectAll('div.stat-block')
        .data(stats)
        .enter()
        .append('div')
        .attr('class', 'stat-block')
        .html(d => `
            <div class="stat-label">${d.label.toUpperCase()}</div>
            <div class="stat-value">${d.value}</div>
        `);
}

function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  
    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };

    const colorScale = d3.scaleLinear()
      .domain([0, 6, 12, 18, 24])
      .range(['#1e3a8a', '#6366f1', '#facc15', '#fb923c', '#1e3a8a']); // night → da

    const xScale = d3.scaleTime()
      .domain(d3.extent(commits, d => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();
  
    const yScale = d3.scaleLinear()
      .domain([0, 24])
      .range([usableArea.bottom, usableArea.top]);
  
    const svg = d3.select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');
  
    // Draw grid lines
    svg.append('g')
      .attr('class', 'gridlines')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  
    // Draw X axis
    svg.append('g')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(d3.axisBottom(xScale).ticks(d3.timeDay.every(2)));
  
    // Draw Y axis
    svg.append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale)
        .ticks(12) // Optional: reduces clutter (0, 2, 4, ..., 24)
        .tickFormat(d => {
            if (d === 0 || d === 24) return 'Midnight';
            if (d === 12) return 'Noon';
            return d < 12 ? `${d} AM` : `${d - 12} PM`;
      })
    );

    // Add vertical color legend aligned with Y-axis
    const defs = svg.append('defs');

    const gradient = defs.append('linearGradient')
      .attr('id', 'time-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%')

    const colorStops = [
        { hour: 0, color: '#1e3a8a' },
        { hour: 6, color: '#6366f1' },
        { hour: 12, color: '#facc15' },
        { hour: 18, color: '#fb923c' },
        { hour: 24, color: '#1e3a8a' }
    ];

    colorStops.forEach(({ hour, color }) => {
        gradient.append('stop')
          .attr('offset', `${(hour / 24) * 100}%`)
          .attr('stop-color', color);
    });

    svg.append('rect')
      .attr('x', usableArea.left - 70)
      .attr('y', usableArea.top)
      .attr('width', 10)
      .attr('height', usableArea.height)
      .style('fill', 'url(#time-gradient)')
      .style('stroke', '#ccc')
      .style('stroke-width', '0.5');

    // Plot circles
    const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

    const sortedCommits = d3.sort(commits, d => -d.totalLines);

    const dots = svg.append('g').attr('class', 'dots');

    dots.selectAll('circle')
      .data(sortedCommits)
      .join('circle')
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r', d => rScale(d.totalLines))
      .attr('fill', d => colorScale(d.hourFrac))
      .style('fill-opacity', 0.7)
      .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1);
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mousemove', (event) => {
        updateTooltipPosition(event);
      })
      .on('mouseleave', () => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
      });
  }
  

let data = await loadData();
let commits = processCommits(data);
console.log(commits);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
