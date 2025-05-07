import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// Load latest projects and render
const loadLatestProjects = async () => {
  const projects = await fetchJSON('./lib/projects.json');
  const latestProjects = projects.slice(0, 3);
  const projectsContainer = document.querySelector('.projects');
  renderProjects(latestProjects, projectsContainer, 'h2');
};

// Render GitHub stats in summary format
const renderGitHubStats = async () => {
  const githubData = await fetchGitHubData('russel-luber');
  const profileStats = document.querySelector('#profile-stats');

  if (!githubData || !profileStats) return;

  profileStats.classList.add('stats-container');

  profileStats.innerHTML = `
    <div class="stats-title">GitHub Profile Stats</div>
    <div class="stats-flex" id="profile-stats-grid"></div>
  `;

  const stats = [
    { label: 'Public Repos', value: githubData.public_repos },
    { label: 'Public Gists', value: githubData.public_gists },
    { label: 'Followers', value: githubData.followers },
    { label: 'Following', value: githubData.following },
  ];

  const grid = document.getElementById('profile-stats-grid');

  stats.forEach(stat => {
    const block = document.createElement('div');
    block.className = 'stat-block';
    block.innerHTML = `
      <div class="stat-label">${stat.label.toUpperCase()}</div>
      <div class="stat-value">${stat.value}</div>
    `;
    grid.appendChild(block);
  });
};

await renderGitHubStats();
await loadLatestProjects();



