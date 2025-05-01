import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const loadProjects = async () => {
  const projects = await fetchJSON('../lib/projects.json');
  const projectsContainer = document.querySelector('.projects');
  renderProjects(projects, projectsContainer, 'h2');

  // Update the h1 to reflect number of projects
  const title = document.querySelector('.projects-title');
  if (title) {
    title.textContent = `${projects.length} Projects`;
  }

  // Pie chart logic
  
  // Group projects by year
  const rolledData = d3.rollups(
    projects,
    v => v.length,
    d => d.year
  );

  // Convert grouped data into array of { label, value }
  const data = rolledData.map(([year, count]) => ({
    label: `c. ${year}`,
    value: count
  }));

  // Set up arc and pie generators
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const pie = d3.pie().value(d => d.value);
  const arcData = pie(data);

  // Use D3’s color scale
  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Select and clear the pie SVG
  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('*').remove();

  // Append slices
  arcData.forEach((d, i) => {
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i));
  });
};

loadProjects();