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
    <div class="stats-title">
      <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-bottom; margin-right: 0.4em;">
        <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38
          0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52
          0-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95
          0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.68 7.68 0 018 4.5c.68.003
          1.36.092 2 .27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82
          1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54
          1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.001 8.001 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      GitHub Profile Stats
    </div>
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
