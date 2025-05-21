import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let xScale, yScale;
let selection = null;

let commitProgress = 100; // max time shown
let commitMaxTime;
let timeScale;

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

function isCommitSelected(commit) {
    if (!selection) return false;
    const [[x0, y0], [x1, y1]] = selection;
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

// renderSelectionCount and renderLanguageBreakdown consolidated into this
function updateBrushedSummary(commits) {
    const brushed = commits.filter(isCommitSelected);
    const container = d3.select('#brushed-stats');
    container.selectAll('*').remove();

    if (brushed.length === 0) {
        container.append('div')
            .attr('class', 'no-selection')
            .style('padding', '1em')
            .style('text-align', 'center')
            .text('📭 No commits selected.');
        return;
    }

    container.append('div')
        .attr('class', 'stats-title')
        .text('🔍 Selected Summary');

    const statGrid = container.append('div')
        .attr('class', 'stats-flex');

    // Commit Count
    statGrid.append('div')
        .attr('class', 'stat-block')
        .html(`
            <div class="stat-label">COMMITS</div>
            <div class="stat-value">${brushed.length}</div>
        `);

    // Language Breakdown
    const lines = brushed.flatMap(d => d.lines);
    const breakdown = d3.rollup(lines, v => v.length, d => d.type);

    for (const [lang, count] of breakdown) {
        const pct = d3.format('.1~%')(count / lines.length);
        statGrid.append('div')
            .attr('class', 'stat-block')
            .html(`
                <div class="stat-label">${lang.toUpperCase()}</div>
                <div class="stat-value">${count} (${pct})</div>
            `);
    }
}

function renderCommitInfo(data, commits) {
    const wrapper = d3.select('#stats')
        .append('div')
        .attr('class', 'stats-container');

    wrapper.append('div')
        .attr('class', 'stats-title')
        .text('📈 Site Summary');

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

    const colorStops = [
        { hour: 0, color: '#0f172a' },   // Midnight: Deep navy
        { hour: 3, color: '#1e40af' },   // Pre-dawn blue
        { hour: 6, color: '#fef08a' },   // Sunrise pale yellow
        { hour: 12, color: '#fde047' },  // Bright noon yellow
        { hour: 17, color: '#f97316' },  // Late afternoon orange
        { hour: 20, color: '#b45309' },  // Sunset burnt orange
        { hour: 22, color: '#1e3a8a' },  // Evening blue
        { hour: 24, color: '#0f172a' }   // Midnight again
    ];

    const colorScale = d3.scaleLinear()
      .domain(colorStops.map(d => d.hour))
      .range(colorStops.map(d => d.color))
      .clamp(true);

    xScale = d3.scaleTime()
      .domain(d3.extent(commits, d => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();
  
    yScale = d3.scaleLinear()
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
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
      });

    svg.call(
        d3.brush()
            .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
            .on('brush end', function(event) {
                selection = event.selection;
                if (!selection) {
                    dots.selectAll('circle').classed('selected', false);
                    updateTooltipVisibility(false);
                } else {
                    dots.selectAll('circle').classed('selected', d => isCommitSelected(d));
                }
                updateBrushedSummary(commits);
            })
    );

    svg.selectAll('.dots, .overlay ~ *').raise();

  }
  
let data = await loadData();
let commits = processCommits(data);

timeScale = d3.scaleTime()
  .domain(d3.extent(commits, d => d.datetime))
  .range([0, 100]);

commitMaxTime = timeScale.invert(commitProgress);

const timeSlider = document.getElementById("timeSlider");
const selectedTime = d3.select("#selectedTime");
selectedTime.text(commitMaxTime.toLocaleString());


renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
updateBrushedSummary(commits);