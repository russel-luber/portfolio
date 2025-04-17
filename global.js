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

// ✅ Fix: recognize both localhost AND 127.0.0.1 as dev
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
