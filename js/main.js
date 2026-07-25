document.addEventListener('DOMContentLoaded', () => {
  loadBalance();
  initCategoryFilter();
  loadSidebarCounts();
});

async function loadSidebarCounts() {
  try {
    const [beats, kits] = await Promise.all([
      fetch(window.API_BASE + '/beats').then(r => r.json()),
      fetch(window.API_BASE + '/kits').then(r => r.json())
    ]);
    const beatsEl = document.getElementById('count-beats');
    const kitsEl = document.getElementById('count-kits');
    if (beatsEl) beatsEl.textContent = '(' + beats.length + ')';
    if (kitsEl) kitsEl.textContent = '(' + kits.length + ')';
  } catch (e) { console.error(e); }
}

function loadBalance() {
  const els = document.querySelectorAll('#balance');
  if (!els.length) return;
  const stored = localStorage.getItem('fractured_teeth');
  const teeth = stored ? parseFloat(stored) : 0;
  els.forEach(el => {
    el.textContent = teeth.toFixed(2);
  });
}

window.addEventListener('storage', (e) => {
  if (e.key === 'fractured_teeth') {
    loadBalance();
  }
});

function initCategoryFilter() {
  const links = document.querySelectorAll('.sidebar a[data-cat]');
  const grid = document.getElementById('product-grid');
  if (!grid || links.length === 0) return;

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = link.dataset.cat;
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      grid.querySelectorAll('.product').forEach(card => {
        if (cat === 'all') {
          card.style.display = '';
        } else if (cat === 'glitch' && card.dataset.category === 'visuals') {
          card.style.display = '';
        } else if (cat === 'abandoned' && card.dataset.category === 'games') {
          card.style.display = '';
        } else if (cat === 'ritual' && card.dataset.category === 'games') {
          card.style.display = '';
        } else {
          card.style.display = card.dataset.category === cat ? '' : 'none';
        }
      });
    });
  });
}
