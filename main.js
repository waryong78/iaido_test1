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

// === GALLERY (IndexedDB) ===
const STATIC_IMAGES = ['Zanchin_01.jpeg', 'iaido_02.jpeg', 'Iaido_03.jpeg'];
const DB_NAME = 'iaido_gallery';
const DB_STORE = 'photos';
let db;

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

function makeGalleryItem(src, onDelete) {
  const wrap = document.createElement('div');
  wrap.className = 'gallery-item';
  const img = document.createElement('img');
  img.src = src;
  img.alt = '수련 사진';
  img.addEventListener('click', () => openLightbox(src));
  wrap.appendChild(img);
  if (onDelete) {
    const btn = document.createElement('button');
    btn.className = 'gallery-delete';
    btn.textContent = '×';
    btn.title = '삭제';
    btn.addEventListener('click', e => { e.stopPropagation(); onDelete(); });
    wrap.appendChild(btn);
  }
  return wrap;
}

async function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';
  STATIC_IMAGES.forEach(src => grid.appendChild(makeGalleryItem(src, null)));
  const photos = await getAllPhotos();
  photos.forEach(({ key, dataUrl }) => {
    grid.appendChild(makeGalleryItem(dataUrl, async () => {
      await deletePhoto(key);
      renderGallery();
    }));
  });
}

openDB().then(database => { db = database; renderGallery(); });

document.getElementById('galleryFileInput').addEventListener('change', async e => {
  for (const file of Array.from(e.target.files)) {
    const dataUrl = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = ev => resolve(ev.target.result);
      reader.readAsDataURL(file);
    });
    await addPhoto(dataUrl);
  }
  e.target.value = '';
  renderGallery();
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
