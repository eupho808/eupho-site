(() => {
  const wiby = [
    'https://wiby.me/',
    'https://neocities.org/browse',
    'https://www.cameronsworld.net/',
    'https://pointerpointer.com/',
    'https://theuselessweb.com/',
    'https://www.fallingfalling.com/',
    'https://www.koalastothemax.com/',
    'https://cat-bounce.com/',
    'https://heeeeeeeey.com/',
    'https://corndog.io/',
    'https://puginarug.com/',
    'https://alwaysjudgeabookbyitscover.com/',
    'https://weirdorconfusing.com/',
    'https://thepigeon.org/',
    'https://ducksarethebest.com/'
  ];

  function surprise() {
    const url = wiby[Math.floor(Math.random() * wiby.length)];
    window.open(url, '_blank');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const link = document.getElementById('surprise-link');
    const footer = document.getElementById('footer-surprise');
    if (link) link.addEventListener('click', (e) => { e.preventDefault(); surprise(); });
    if (footer) footer.addEventListener('click', (e) => { e.preventDefault(); surprise(); });

    document.querySelectorAll('[data-wishlist]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.wishlist;
        const list = JSON.parse(localStorage.getItem('eupho_wishlist') || '[]');
        if (!list.includes(key)) list.push(key);
        localStorage.setItem('eupho_wishlist', JSON.stringify(list));
        btn.textContent = 'In Wishlist';
        btn.disabled = true;
      });
    });
  });
})();
