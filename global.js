// global.js
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
toggle.textContent = '🌙';
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
      toggle.textContent = '🌙';
      localStorage.setItem('theme', 'light');
    } else {
      html.setAttribute('data-theme', 'dark');
      toggle.textContent = '☀️';
      localStorage.setItem('theme', 'dark');
    }
  });
  
  
