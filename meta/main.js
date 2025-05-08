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

let data = await loadData();
let commits = processCommits(data);
console.log(commits);
renderCommitInfo(data, commits);
