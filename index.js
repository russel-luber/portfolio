import { fetchJSON, renderProjects } from './global.js';

const loadLatestProjects = async () => {
    const projects = await fetchJSON('./lib/projects.json');
    const latestProjects = projects.slice(0, 3); // take first 3 projects
    const projectsContainer = document.querySelector('.projects');
    renderProjects(latestProjects, projectsContainer, 'h2');
  };
  
loadLatestProjects();
  