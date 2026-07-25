document.addEventListener('DOMContentLoaded', () => {
  loadBalance();
  initCategoryFilter();
});

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
