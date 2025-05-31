import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let xScale, yScale, svg, commits, data;
let timeScale, commitMaxTime;
const tooltip = d3.select("#commit-tooltip");

async function loadData() {
  const rows = await d3.csv("loc.csv", d => ({
    ...d,
    line: +d.line,
    depth: +d.depth,
    length: +d.length,
    file: d.file,           
    type: d.type,
    timezone: d.timezone,
    datetime: new Date(d.datetime),
    date: new Date(d.date + "T00:00" + d.timezone) 
  }));
  return rows;
}


function getTimeOfDay(hour) {
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

function processCommits(rows) {
  return d3.groups(rows, d => d.commit).map(([id, lines]) => {
    const { author, datetime } = lines[0];
    return {
      id,
      author,
      datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length,
      lines,
      url: `https://github.com/russel-luber/portfolio/commit/${id}`,
    };
  }).sort((a, b) => a.datetime - b.datetime);
}

function renderStats(rows, commits) {
  const totalLOC = rows.length;
  const totalCommits = commits.length;
  const container = d3.select("#stats").html("");

  container.append("dl")
    .html(`
      <dt>Total LOC</dt><dd>${totalLOC}</dd>
      <dt>Total Commits</dt><dd>${totalCommits}</dd>
    `);
}

function updateSiteSummary(data, commits) {
  const wrapper = d3.select('#stats');
  wrapper.selectAll('*').remove();

  const container = wrapper.append('div')
    .attr('class', 'stats-container');

  container.append('div')
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

  const statGrid = container.append('div')
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


function renderScatter(commits) {
  const width = 900, height = 500;
  const margin = { top: 20, right: 30, bottom: 40, left: 40 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([margin.left, innerW]);

  yScale = d3.scaleLinear().domain([0, 24]).range([innerH, margin.top]);

  svg = d3.select("#scatter-plot")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);

  svg.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(xScale));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).ticks(12));

  svg.append("g")
    .selectAll("circle")
    .data(commits)
    .join("circle")
    .attr("cx", d => xScale(d.datetime))
    .attr("cy", d => yScale(d.hourFrac))
    .attr("r", d => Math.sqrt(d.totalLines))
    .attr("fill", "#28a745")
    .attr("fill-opacity", 0.6)
    .on("mouseenter", (e, d) => {
      tooltip.style("left", `${e.pageX}px`)
             .style("top", `${e.pageY}px`)
             .attr("hidden", null)
             .html(`
               <dt>Commit</dt><dd><a href="${d.url}" target="_blank">${d.id}</a></dd>
               <dt>Date</dt><dd>${d.datetime.toLocaleString()}</dd>
               <dt># Lines</dt><dd>${d.totalLines}</dd>
             `);
    })
    .on("mouseleave", () => tooltip.attr("hidden", true));
}

function renderSteps(commits) {
  const story = d3.select("#scatter-story");

  story.selectAll(".step")
    .data(commits)
    .join("div")
    .attr("class", "step")
    .html((d, i) => `
      On ${d.datetime.toLocaleString()}, I made 
      <a href="${d.url}" target="_blank">
        ${i > 0 ? "another glorious commit" : "my first commit, and it was glorious"}
      </a>.
      I edited ${d.totalLines} lines across ${
        d3.rollups(d.lines, v => v.length, d => d.file).length
      } files.
      Then I looked over all I had made, and I saw that it was very good.
    `);
}

function onStepEnter({ element }) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('is-active'));
  element.classList.add('is-active');

  const commit = element.__data__;
  const cutoff = commit.datetime;
  const filtered = commits.filter(d => d.datetime <= cutoff);

  svg.selectAll("circle")
    .data(filtered, d => d.id)
    .join("circle")
    .attr("cx", d => xScale(d.datetime))
    .attr("cy", d => yScale(d.hourFrac))
    .attr("r", d => Math.sqrt(d.totalLines))
    .attr("fill", "#28a745")
    .attr("fill-opacity", 0.6);
}

function setupScrollama() {
  const scroller = scrollama();
  scroller
    .setup({ step: ".step", offset: 0.5 })
    .onStepEnter(onStepEnter);
}

function setupSlider() {
  const slider = d3.select("#commit-time-slider");
  const timeText = d3.select("#selected-time");

  timeScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([0, 100]);

  slider.on("input", function () {
    const value = +this.value;
    commitMaxTime = timeScale.invert(value);
    timeText.text(commitMaxTime.toLocaleString());

    const filtered = commits.filter(d => d.datetime <= commitMaxTime);
    svg.selectAll("circle")
      .data(filtered, d => d.id)
      .join("circle")
      .attr("cx", d => xScale(d.datetime))
      .attr("cy", d => yScale(d.hourFrac))
      .attr("r", d => Math.sqrt(d.totalLines))
      .attr("fill", "#28a745")
      .attr("fill-opacity", 0.6);

    updateLanguageBreakdown(filtered);
    updateSiteSummary(data, filtered);
  });

  commitMaxTime = timeScale.invert(100);
  timeText.text(commitMaxTime.toLocaleString());
}

function renderLanguageBreakdown(commit) {
  const breakdown = d3.group(commit.lines, d => d.type);
  const colorScale = {
    html: '#e34c26',
    css: '#563d7c',
    js: '#f1e05a',
    md: '#083fa1',
    json: '#292929',
    default: '#999'
  };

  const container = d3.select("#language-breakdown");
  container.html(""); // clear previous

  for (const [type, lines] of breakdown) {
    const color = colorScale[type] ?? colorScale.default;

    container.append("dt").text(`${type} (${lines.length})`);
    const row = container.append("dd");

    row.selectAll("span")
      .data(lines)
      .join("span")
      .attr("class", "loc")
      .style("background-color", color);
  }
}

function updateLanguageBreakdown(commits) {
  const allLines = commits.flatMap(d => d.lines);
  const byLang = d3.rollups(allLines, v => v.length, d => d.type)
    .sort((a, b) => d3.descending(a[1], b[1]));

  const colors = {
    html: '#e34c26',
    css: '#563d7c',
    js: '#f1e05a',
    md: '#083fa1',
    json: '#292929',
    default: '#999'
  };

  const container = d3.select("#language-breakdown").html("");

  for (const [lang, count] of byLang) {
    container.append("dt").text(`${lang} (${count})`);
    container.append("dd")
      .selectAll("div")
      .data(Array(count))
      .join("div")
      .attr("class", "loc")
      .style("background", colors[lang] || colors.default);
  }
}

data = await loadData();
commits = processCommits(data);
renderStats(data, commits);
renderScatter(commits);
renderSteps(commits);
setupScrollama();
setupSlider();
updateSiteSummary(data, commits);

