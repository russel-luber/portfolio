import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let query = '';
let selectedYear = null;

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
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('*').remove();

  arcData.forEach((d, i) => {
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i))
      .attr('class', d.data.label === selectedYear ? 'selected' : null)
      .style('cursor', 'pointer')
      .on('click', () => {
        const clickedYear = d.data.label;
        selectedYear = (selectedYear === clickedYear) ? null : clickedYear;
        updateDisplay(allProjects, container, allProjects);
      });
  });

  const legend = d3.select('.legend');
  legend.selectAll('*').remove();

  data.forEach((d, i) => {
    legend.append('li')
      .attr('style', `--color: ${colors(i)}`)
      .attr('class', `legend-item${d.label === selectedYear ? ' selected' : ''}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        const clickedYear = d.label;
        selectedYear = (selectedYear === clickedYear) ? null : clickedYear;
        updateDisplay(allProjects, container, allProjects);
      });
  });
};

const loadProjects = async () => {
  const projects = await fetchJSON('../lib/projects.json');
  const container = document.querySelector('.projects');
  const searchInput = document.querySelector('.searchBar');

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
