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
// If found, add the `current` class
currentLink?.classList.add('current');