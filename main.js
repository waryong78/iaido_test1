// === THEME TOGGLE ===
const themeToggle = document.getElementById('themeToggle');

if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
  themeToggle.textContent = '☀️';
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// === LANGUAGE TOGGLE ===
let lang = localStorage.getItem('lang') || 'ko';
const langToggle = document.getElementById('langToggle');

function applyLang(l) {
  document.querySelectorAll('[data-ko]').forEach(el => {
    el.textContent = el.getAttribute('data-' + l);
  });
  langToggle.textContent = l === 'ko' ? 'EN' : '한글';
  document.documentElement.lang = l;
}

applyLang(lang);

langToggle.addEventListener('click', () => {
  lang = lang === 'ko' ? 'en' : 'ko';
  localStorage.setItem('lang', lang);
  applyLang(lang);
});

// === MOBILE NAV ===
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});
