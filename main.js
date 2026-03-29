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

// === GALLERY (IndexedDB + Pagination) ===
const STATIC_IMAGES = ['Zanchin_01.jpeg', 'iaido_02.jpeg', 'Iaido_03.jpeg'];
const DB_NAME = 'iaido_gallery';
const DB_STORE = 'photos';
const PER_PAGE = 6;
let db;
let galleryAllItems = []; // { src, key|null }
let currentPage = 0;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(DB_STORE, { autoIncrement: true });
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e);
  });
}

function getAllPhotos() {
  return new Promise(resolve => {
    const results = [];
    db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).openCursor().onsuccess = e => {
      const cursor = e.target.result;
      if (cursor) { results.push({ key: cursor.key, dataUrl: cursor.value }); cursor.continue(); }
      else resolve(results);
    };
  });
}

function addPhoto(dataUrl) {
  return new Promise(resolve => {
    db.transaction(DB_STORE, 'readwrite').objectStore(DB_STORE).add(dataUrl).onsuccess = e => resolve(e.target.result);
  });
}

function deletePhoto(key) {
  return new Promise(resolve => {
    db.transaction(DB_STORE, 'readwrite').objectStore(DB_STORE).delete(key).onsuccess = () => resolve();
  });
}

function makeGalleryItem(src, key) {
  const wrap = document.createElement('div');
  wrap.className = 'gallery-item';
  const img = document.createElement('img');
  img.src = src;
  img.alt = '수련 사진';
  img.addEventListener('click', () => openLightbox(src));
  wrap.appendChild(img);
  if (key != null) {
    const btn = document.createElement('button');
    btn.className = 'gallery-delete';
    btn.textContent = '×';
    btn.title = '삭제';
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      await deletePhoto(key);
      await loadAllItems();
      currentPage = Math.min(currentPage, totalPages() - 1);
      renderPage(currentPage);
    });
    wrap.appendChild(btn);
  }
  return wrap;
}

function totalPages() {
  return Math.max(1, Math.ceil(galleryAllItems.length / PER_PAGE));
}

function renderPage(page, direction) {
  const grid = document.getElementById('galleryGrid');
  const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
  const inClass  = direction === 'next' ? 'slide-in-right' : 'slide-in-left';

  function fillGrid() {
    grid.innerHTML = '';
    const start = page * PER_PAGE;
    galleryAllItems.slice(start, start + PER_PAGE).forEach(({ src, key }) => {
      grid.appendChild(makeGalleryItem(src, key));
    });
  }

  if (direction) {
    grid.classList.add(outClass);
    grid.addEventListener('animationend', function handler() {
      grid.classList.remove(outClass);
      grid.removeEventListener('animationend', handler);
      fillGrid();
      grid.classList.add(inClass);
      grid.addEventListener('animationend', function h2() {
        grid.classList.remove(inClass);
        grid.removeEventListener('animationend', h2);
      });
    });
  } else {
    fillGrid();
  }

  currentPage = page;
  updateControls();
}

function updateControls() {
  const pages = totalPages();
  const prevBtn = document.getElementById('galleryPrev');
  const nextBtn = document.getElementById('galleryNext');
  const dotsEl  = document.getElementById('galleryDots');

  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = currentPage >= pages - 1;

  dotsEl.innerHTML = '';
  if (pages > 1) {
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement('button');
      dot.className = 'gallery-dot' + (i === currentPage ? ' active' : '');
      dot.addEventListener('click', () => {
        if (i !== currentPage) renderPage(i, i > currentPage ? 'next' : 'prev');
      });
      dotsEl.appendChild(dot);
    }
  }
}

async function loadAllItems() {
  const uploaded = await getAllPhotos();
  galleryAllItems = [
    ...STATIC_IMAGES.map(src => ({ src, key: null })),
    ...uploaded.map(({ key, dataUrl }) => ({ src: dataUrl, key }))
  ];
}

async function initGallery() {
  await loadAllItems();
  renderPage(0);
}

openDB().then(database => { db = database; initGallery(); });

document.getElementById('galleryPrev').addEventListener('click', () => {
  if (currentPage > 0) renderPage(currentPage - 1, 'prev');
});
document.getElementById('galleryNext').addEventListener('click', () => {
  if (currentPage < totalPages() - 1) renderPage(currentPage + 1, 'next');
});


// === LIGHTBOX ===
function openLightbox(src) {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightbox').classList.add('open');
}

document.getElementById('lightbox').addEventListener('click', e => {
  if (e.target.id === 'lightbox' || e.target.id === 'lightboxClose') {
    document.getElementById('lightbox').classList.remove('open');
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.getElementById('lightbox').classList.remove('open');
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
