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
      .call(d3.axisBottom(xScale));
  
    // Draw Y axis
    svg.append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00'));
  
    // Plot circles
    const dots = svg.append('g').attr('class', 'dots');
  
    dots.selectAll('circle')
      .data(commits)
      .join('circle')
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r', 5)
      .attr('fill', 'steelblue');
  }
  

let data = await loadData();
let commits = processCommits(data);
console.log(commits);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
