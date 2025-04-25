import { fetchJSON, renderProjects } from '../global.js';

const loadProjects = async () => {
  const projects = await fetchJSON('../lib/projects.json');
  const projectsContainer = document.querySelector('.projects');
  renderProjects(projects, projectsContainer, 'h2');

  // --- Project Counter --
  const title = document.querySelector('.projects-title');
  if (title) {
    title.textContent = `${projects.length} Projects`;
  }
  

};

loadProjects();