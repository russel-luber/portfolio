import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let query = '';
let selectedYear = null;
let colorMap = new Map();  // year -> color

const colorPalette = d3.schemeTableau10; // array of 10 fixed colors

const assignColorsToYears = (projects) => {
  const uniqueYears = Array.from(new Set(projects.map(p => p.year))).sort();
  uniqueYears.forEach((year, idx) => {
    colorMap.set(year, colorPalette[idx % colorPalette.length]);
  });
};

const updateDisplay = (projectsAll, container, dataForPie) => {
  const filtered = projectsAll.filter(project => {
    const matchesQuery = Object.values(project).join('\n').toLowerCase().includes(query);
    if (selectedYear === null) return matchesQuery;
    return matchesQuery && project.year === selectedYear;
  });

  renderProjects(filtered, container, 'h2');
  updatePieChart(filtered, projectsAll, container);
};

const updatePieChart = (visibleProjects, allProjects, container) => {
  const rolledData = d3.rollups(visibleProjects, v => v.length, d => d.year);
  const data = rolledData.map(([year, count]) => ({ label: year, value: count }));

  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const pie = d3.pie().value(d => d.value);
  const arcData = pie(data);

  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('*').remove();

  arcData.forEach((d, i) => {
    const year = d.data.label;
    const color = colorMap.get(year) || '#ccc';

    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', color)
      .attr('class', year === selectedYear ? 'selected' : null)
      .style('cursor', 'pointer')
      .on('click', () => {
        selectedYear = (selectedYear === year) ? null : year;
        updateDisplay(allProjects, container, allProjects);
      });
  });

  const legend = d3.select('.legend');
  legend.selectAll('*').remove();

  data.forEach((d) => {
    const color = colorMap.get(d.label) || '#ccc';

    legend.append('li')
      .attr('style', `--color: ${color}`)
      .attr('class', `legend-item${d.label === selectedYear ? ' selected' : ''}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedYear = (selectedYear === d.label) ? null : d.label;
        updateDisplay(allProjects, container, allProjects);
      });
  });
};

const loadProjects = async () => {
  const projects = await fetchJSON('../lib/projects.json');
  const container = document.querySelector('.projects');
  const searchInput = document.querySelector('.searchBar');

  assignColorsToYears(projects);  // Assign fixed colors ONCE

  renderProjects(projects, container, 'h2');
  updatePieChart(projects, projects, container);

  const title = document.querySelector('.projects-title');
  if (title) title.textContent = `${projects.length} Projects`;

  searchInput.addEventListener('input', (event) => {
    query = event.target.value.toLowerCase();
    updateDisplay(projects, container, projects);
  });
};

loadProjects();
