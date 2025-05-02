import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let query = '';
let selectedIndex = -1;

const updatePieChart = (projectsToShow, projectsAll, container) => {
  const rolledData = d3.rollups(
    projectsToShow,
    v => v.length,
    d => d.year
  );

  const data = rolledData.map(([year, count]) => ({
    label: year,
    value: count,
  }));

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
      .attr('class', selectedIndex === i ? 'selected' : null)
      .style('cursor', 'pointer')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        svg.selectAll('path')
          .attr('class', (_, idx) => (selectedIndex === idx ? 'selected' : null));

        d3.select('.legend')
          .selectAll('li')
          .attr('class', (_, idx) => `legend-item${selectedIndex === idx ? ' selected' : ''}`);

        if (selectedIndex === -1) {
          renderProjects(projectsAll, container, 'h2');
        } else {
          const selectedYear = data[selectedIndex].label;
          const filteredByYear = projectsAll.filter(p => p.year === selectedYear);
          renderProjects(filteredByYear, container, 'h2');
        }
      });
  });

  const legend = d3.select('.legend');
  legend.selectAll('*').remove();

  data.forEach((d, i) => {
    legend
      .append('li')
      .attr('style', `--color: ${colors(i)}`)
      .attr('class', `legend-item${selectedIndex === i ? ' selected' : ''}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        svg.selectAll('path')
          .attr('class', (_, idx) => (selectedIndex === idx ? 'selected' : null));

        legend.selectAll('li')
          .attr('class', (_, idx) => `legend-item${selectedIndex === idx ? ' selected' : ''}`);

        if (selectedIndex === -1) {
          renderProjects(projectsAll, container, 'h2');
        } else {
          const selectedYear = data[selectedIndex].label;
          const filteredByYear = projectsAll.filter(p => p.year === selectedYear);
          renderProjects(filteredByYear, container, 'h2');
        }
      });
  });
};

const loadProjects = async () => {
  const projects = await fetchJSON('../lib/projects.json');
  const projectsContainer = document.querySelector('.projects');
  const searchInput = document.querySelector('.searchBar');

  renderProjects(projects, projectsContainer, 'h2');
  updatePieChart(projects, projects, projectsContainer);

  const title = document.querySelector('.projects-title');
  if (title) {
    title.textContent = `${projects.length} Projects`;
  }

  searchInput.addEventListener('input', (event) => {
    query = event.target.value.toLowerCase();
    selectedIndex = -1;

    const filtered = projects.filter(project => {
      const values = Object.values(project).join('\n').toLowerCase();
      return values.includes(query);
    });

    renderProjects(filtered, projectsContainer, 'h2');
    updatePieChart(filtered, projects, projectsContainer);
  });
};

loadProjects();

