/*
========================================
  GLOBAL JS
========================================
*/
console.log('IT’S ALIVE!');

/**
 * $$ — shorthand for document.querySelectorAll()
 * @param {string} selector — CSS selector
 * @param {Element|Document} context — where to query (defaults to document)
 * @returns {Array<Element>}
 */
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Highlight the link matching the current page
const navLinks = $$('nav a');
const currentLink = navLinks.find(a =>
  a.host === location.host && a.pathname === location.pathname
);
currentLink?.classList.add('current');

const isDev = location.hostname === "localhost" || location.hostname === "127.0.0.1";
const BASE = isDev ? "/" : "/portfolio/";

// List of pages to include in the nav
const pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "cv/", title: "CV" },
  { url: "contact/", title: "Contact" },
  { url: "meta/", title: "Meta"},
  { url: "https://github.com/russel-luber", title: "GitHub Profile" }
];

// Create the <nav> element and insert it at the top of <body>
const nav = document.createElement("nav");
document.body.prepend(nav);

// Generate <a> links and add them to the nav
for (const page of pages) {
  const a = document.createElement("a");
  a.href = page.url.startsWith("http") ? page.url : BASE + page.url;
  a.textContent = page.title;

  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add("current");
  }

  if (a.host !== location.host) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }

  nav.appendChild(a);
}

// Dark mode toggle
const toggle = document.createElement('button');
toggle.textContent = '🕶';
toggle.setAttribute('aria-label', 'Toggle dark mode');
toggle.id = 'dark-mode-toggle';

// Add the button to the placeholder div
document.getElementById('theme-toggle')?.appendChild(toggle);

// Restore theme preference from localStorage
const savedTheme = localStorage.getItem('theme');

if (savedTheme) {
    // Use stored preference
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      toggle.textContent = '☀️';
    }
  } else {
    // No saved preference → check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      toggle.textContent = '☀️';
    }
  }

toggle.addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
  
    if (isDark) {
      html.removeAttribute('data-theme');
      toggle.textContent = '🕶';
      localStorage.setItem('theme', 'light');
    } else {
      html.setAttribute('data-theme', 'dark');
      toggle.textContent = '☀️';
      localStorage.setItem('theme', 'dark');
    }
  });

  const form = document.querySelector('form');

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
  
    const data = new FormData(form);
    const params = [];
  
    for (let [name, value] of data) {
      const encoded = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
      params.push(encoded);
    }
  
    const query = params.join('&');
    const url = `${form.action}?${query}`;
    location.href = url; // triggers email client
  });


// Projects Page
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    // Check if the fetch was successful
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    // Parse and return the JSON data
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

// Projects Page & Home Page Func for Rendering Project Previews
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = '';

  for (const project of projects) {
    const article = document.createElement('article');

    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <div>
        <p>${project.description}</p>
        <time datetime="${project.year}">c. ${project.year}</time>
      </div>
    `;

    containerElement.appendChild(article);
  }
}



export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}

