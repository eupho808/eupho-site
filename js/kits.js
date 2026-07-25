const TELEGRAM_HANDLE = 'euphotg';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(window.API_BASE + '/kits');
    const kits = await res.json();

    document.getElementById('kit-count').textContent = kits.length + ' kit' + (kits.length !== 1 ? 's' : '');
    const grid = document.getElementById('kit-grid');
    const empty = document.getElementById('kit-empty');

    if (kits.length === 0) {
      grid.style.display = 'none';
      if (empty) empty.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    if (empty) empty.style.display = 'none';

    kits.forEach(kit => {
      const card = document.createElement('article');
      card.className = 'kit-card';
      card.innerHTML =
        '<div class="kit-title">' + escapeHtml(kit.title) + '</div>' +
        '<div class="kit-desc">' + escapeHtml(kit.description || 'Drum kit by eupho.') + '</div>' +
        '<div class="kit-footer">' +
          '<span class="kit-price">' + escapeHtml(kit.price || '$?') + '</span>' +
          '<a class="btn" href="https://t.me/' + TELEGRAM_HANDLE + '?text=' + encodeURIComponent('hi, i want to buy drum kit "' + kit.title + '"') + '" target="_blank">Buy via Telegram</a>' +
        '</div>';
      grid.appendChild(card);
    });
  } catch (e) {
    console.error(e);
    document.getElementById('kit-grid').innerHTML = '<p style="text-align:center;color:var(--text-dim);">failed to load kits...</p>';
  }
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
