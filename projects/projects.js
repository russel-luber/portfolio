import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const loadProjects = async () => {
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const projects = await fetchJSON('../lib/projects.json');
  const projectsContainer = document.querySelector('.projects');
  renderProjects(projects, projectsContainer, 'h2');
  const arc = arcGenerator({
    startAngle: 0,
    endAngle: 2 * Math.PI,
  });
  
  d3.select('#projects-pie-plot')
    .append('path')
    .attr('d', arc)
    .attr('fill', 'red');
  
  // --- Project Counter --
  const title = document.querySelector('.projects-title');
  if (title) {
    title.textContent = `${projects.length} Projects`;
  }
};

loadProjects();