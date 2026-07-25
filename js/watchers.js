(() => {
  const watchers = [
    { name: 'vampiryuga', avatar: 'assets/vampiryuga.jpg', whisper: 'the vampire sees in infrared.' },
    { name: 'zahinzameri', avatar: 'assets/zahinzameri.png', whisper: 'z is the first letter of the end.' },
    { name: 's', avatar: 'assets/s.png', whisper: 'one letter, many voices.' },
    { name: 'regret', avatar: 'assets/regret.jpg', whisper: 'regret is just memory with teeth.' },
    { name: 'Lononone', avatar: 'assets/Lononone.jpg', whisper: 'loneliness spelled backwards is almost a name.' },
    { name: 'D 2', avatar: 'assets/D 2.jpg', whisper: 'D2 knows the second ending.' },
    { name: 'f0geLsk1', avatar: 'assets/f0geLsk1.jpg', whisper: 'fog eats the signal.' },
    { name: 'fml', avatar: 'assets/fml.jpg', whisper: 'same.' },
    { name: 'Mizusuki', avatar: 'assets/Mizusuki.jpg', whisper: 'water remembers every face.' },
    { name: 'Maksim', avatar: 'assets/Maksim.jpg', whisper: 'the skull in the name is not decorative.' }
  ];

  const whispers = [
    'was here before you opened the page.',
    'is listening to the same silence.',
    'left no comment.',
    'knows the password but will not tell.',
    'is waiting for the drop.',
    'saw the angel move.',
    'typed something and deleted it.',
    'is closer than the refresh button.'
  ];

  const grid = document.getElementById('hall-grid');
  const modal = document.getElementById('watcher-modal');
  const modalAvatar = document.getElementById('modal-avatar');
  const modalName = document.getElementById('modal-name');
  const modalText = document.getElementById('modal-text');
  const modalClose = document.getElementById('modal-close');

  if (!grid) return;

  watchers.forEach((w, i) => {
    const door = document.createElement('div');
    door.className = 'mirror-door';
    door.innerHTML =
      '<div class="door-avatar" style="background-image:url(' + encodeURI(w.avatar) + ')"></div>' +
      '<div class="door-frame"></div>' +
      '<div class="door-number">' + String(i + 1).padStart(2, '0') + '</div>' +
      '<div class="door-name">' + escapeHtml(w.name) + '</div>' +
      '<div class="door-whisper">' + escapeHtml(w.whisper) + '</div>';

    door.addEventListener('click', () => openModal(w, i));
    grid.appendChild(door);
  });

  function openModal(w, i) {
    modalAvatar.style.backgroundImage = 'url(' + encodeURI(w.avatar) + ')';
    modalName.textContent = w.name;
    modalText.textContent = 'Door ' + String(i + 1).padStart(2, '0') + '. ' + w.whisper + ' ' + pick(whispers);
    modal.classList.add('active');
  }

  modalClose.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
