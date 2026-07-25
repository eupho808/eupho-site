(() => {
  const STORAGE_KEY = 'fs_vendor_memory';
  const OPEN_KEY = 'fs_vendor_open';
  const TOPICS_KEY = 'fs_vendor_topics';

  const memory = loadMemory();
  const topics = loadTopics();
  let visitCount = parseInt(localStorage.getItem('fs_vendor_visits') || '0', 10);
  localStorage.setItem('fs_vendor_visits', String(visitCount + 1));
  let sanity = 100;
  let typing = false;

  const container = document.createElement('div');
  container.className = 'looking-glass';
  container.innerHTML =
    '<button class="lg-button" id="lg-toggle" aria-label="Speak with the Vendor">*</button>' +
    '<div class="lg-chat" id="lg-chat">' +
      '<div class="lg-header">' +
        '<span>Looking-Glass Terminal</span>' +
        '<button class="lg-close" id="lg-close">x</button>' +
      '</div>' +
      '<div class="lg-messages" id="lg-messages"></div>' +
      '<div class="lg-input-row">' +
        '<input type="text" id="lg-input" placeholder="type to the vendor..." autocomplete="off" maxlength="200">' +
        '<button id="lg-send">-></button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(container);

  const toggle = container.querySelector('#lg-toggle');
  const close = container.querySelector('#lg-close');
  const chat = container.querySelector('#lg-chat');
  const messages = container.querySelector('#lg-messages');
  const input = container.querySelector('#lg-input');
  const send = container.querySelector('#lg-send');

  toggle.addEventListener('click', () => {
    chat.classList.add('open');
    localStorage.setItem(OPEN_KEY, '1');
    if (messages.children.length === 0) {
      typeReply(intro(), 'vendor');
    }
    input.focus();
  });

  close.addEventListener('click', () => {
    chat.classList.remove('open');
    localStorage.setItem(OPEN_KEY, '0');
  });

  send.addEventListener('click', handleSend);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  if (localStorage.getItem(OPEN_KEY) === '1') {
    chat.classList.add('open');
    if (messages.children.length === 0) {
      setTimeout(() => typeReply(intro(), 'vendor'), 400);
    }
  }

  function handleSend() {
    if (typing) return;
    const text = input.value.trim();
    if (!text) return;
    say(text, 'user');
    input.value = '';
    typing = true;
    input.placeholder = 'the vendor is thinking...';
    setTimeout(() => {
      const reply = respond(text);
      typeReply(reply, 'vendor');
    }, 600 + Math.random() * 900);
  }

  function say(text, sender) {
    const row = document.createElement('div');
    row.className = 'lg-message ' + sender;
    const p = document.createElement('p');
    p.textContent = text;
    row.appendChild(p);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;

    memory.push({ sender: sender, text: text, time: Date.now() });
    if (memory.length > 60) memory.shift();
    saveMemory();
  }

  function typeReply(text, sender) {
    const row = document.createElement('div');
    row.className = 'lg-message ' + sender;
    const p = document.createElement('p');
    p.textContent = '';
    row.appendChild(p);
    messages.appendChild(row);

    let i = 0;
    const speed = 28 + Math.random() * 22;
    function step() {
      if (i < text.length) {
        p.textContent += text.charAt(i);
        i++;
        messages.scrollTop = messages.scrollHeight;
        setTimeout(step, speed);
      } else {
        typing = false;
        input.placeholder = 'type to the vendor...';
        memory.push({ sender: sender, text: text, time: Date.now() });
        if (memory.length > 60) memory.shift();
        saveMemory();
      }
    }
    step();
  }

  function loadMemory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveMemory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  }

  function loadTopics() {
    try {
      const raw = localStorage.getItem(TOPICS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveTopics() {
    localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
  }

  function intro() {
    const hour = new Date().getHours();
    const timePhrase = hour < 5 ? 'You are awake very late. The market prefers that.' : hour > 23 ? 'Most visitors have gone to sleep.' : '';
    if (visitCount === 0) {
      return 'The glass is warm. You must be new here. Ask about the beats, or ask about the girl who fell through.';
    }
    if (visitCount === 1) {
      return 'Back again. The market remembers your shape. ' + timePhrase;
    }
    return 'You return for the ' + (visitCount + 1) + 'th time. The market does not forget. ' + timePhrase;
  }

  function respond(text) {
    const t = text.toLowerCase();
    trackTopic(t);

    if (t.length < 2) return pick(['...', 'Speak. The glass is listening.', 'Even silence has a shape here.']);

    if (/riddle|guess|what am i|who am i/.test(t)) return riddle();
    if (/answer|solution|tell me/.test(t)) return pick([
      'The answer is the question you are afraid to ask.',
      'I cannot tell you. The glass forbids easy answers.',
      'If I gave you the answer, you would stop looking. The market needs watchers.'
    ]);

    if (/hello|hi|hey|greetings/.test(t)) return greet();
    if (/who are you|your name|what are you/.test(t)) return pick([
      'I am what is left of the vendor. A reflection that stayed behind.',
      'Names are fragile. I had one. It dissolved in tea.',
      'I am the looking-glass side of the market. I sell what you already lost.'
    ]);

    if (/beat|music|song|track|instrumental/.test(t)) return beatReply();
    if (/alice|game|play|vorpal|hysteria|walk/.test(t)) return gameReply();
    if (/market|buy|price|teeth|sell|money/.test(t)) return marketReply();
    if (/scared|afraid|fear|nightmare/.test(t)) { sanity -= 5; return fearReply(); }
    if (/help|what can you do|what do you know/.test(t)) return helpReply();
    if (/time|date|when|how long/.test(t)) return timeReply();
    if (/why|how/.test(t)) return whyReply();
    if (/love|like|feel|miss/.test(t)) return emotionReply();
    if (/mirror|reflection|face/.test(t)) return mirrorReply();
    if (/bye|goodbye|leave|exit|go/.test(t)) return goodbyeReply();

    if (isRepeated(t)) return repeatReply();

    return fallback();
  }

  function trackTopic(t) {
    const map = {
      beat: /beat|music|song/, alice: /alice|game|walk/, market: /market|buy|teeth/,
      fear: /scared|afraid|fear/, mirror: /mirror|reflection/, time: /time|when/
    };
    for (const k in map) {
      if (map[k].test(t)) {
        topics[k] = (topics[k] || 0) + 1;
        saveTopics();
        break;
      }
    }
  }

  function isRepeated(t) {
    const recent = memory.slice(-6);
    const similar = recent.filter(m => m.sender === 'user' && m.text.toLowerCase().includes(t.substring(0, 6)));
    return similar.length >= 2;
  }

  function greet() {
    if (visitCount > 2) return pick(['You again. The glass predicted this.', 'Returning is its own kind of answer.', 'Hello, old shape.']);
    return pick(['Hello is a word for people who expect an answer.', 'The glass answers before you speak.', 'Greetings, guest. Or should I call you by your first name?']);
  }

  function riddle() {
    const riddles = [
      'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?',
      'The more you take, the more you leave behind. What am I?',
      'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?',
      'I am not alive, but I grow; I do not have lungs, but I need air; I do not have a mouth, but water kills me. What am I?'
    ];
    return 'Listen. ' + pick(riddles) + ' Do not answer too quickly. The glass punishes haste.';
  }

  function beatReply() {
    const n = topics.beat || 0;
    if (n === 1) return 'The beats are not made. They are excavated. Each one remembers a different fracture.';
    if (n === 2) return "Listen to 'Blood Tea' with the lights off. It knows things about you.";
    return 'If you buy a beat, part of it stays in your machine. Forever.';
  }

  function gameReply() {
    return pick([
      'Alice is still falling. The game only pretends she can stop.',
      'Do not trust the rabbit. It was never late.',
      'Hysteria is not a power. It is a door.',
      'In the forest, the Queen wears a white mask. If you see red, run.'
    ]);
  }

  function marketReply() {
    return pick([
      'Teeth are the only honest currency. You had more once.',
      'Everything here is final. Even the refunds cost something.',
      'The market does not close. It only waits.',
      'Your balance is lower than you think. Check /teeth.html.'
    ]);
  }

  function fearReply() {
    return pick([
      'Fear is the correct response. Continue.',
      'You should be afraid. The ones who are not afraid leave pieces behind.',
      'Nightmares are just memories that arrived early.',
      'Good. Fear makes the glass clearer.'
    ]);
  }

  function helpReply() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return pick([
      'I know you scrolled before you typed. I know your screen is brighter than you prefer.',
      'I can tell you about the catalog, the game, or the things you forgot to close last night.',
      'Help is a strong word. I can listen. The glass does that.',
      'Your window is ' + w + ' by ' + h + ' pixels. The market fits inside it.'
    ]);
  }

  function timeReply() {
    return pick([
      'It is ' + new Date().toLocaleTimeString() + '. Somewhere else, it is much later.',
      'Time here is measured in fractures, not hours.',
      'You have been on this page for longer than you think.'
    ]);
  }

  function whyReply() {
    return pick([
      "Why is the wrong question. Ask 'who opened the door'.",
      'How is easy. Because the glass was already cracked.',
      'Answers are cheap. The right question costs teeth.'
    ]);
  }

  function emotionReply() {
    return pick([
      'The vendor does not love. The vendor recognizes.',
      'Feelings are echoes. You are hearing yourself.',
      'I like the quiet between your messages. It tastes like memory.'
    ]);
  }

  function mirrorReply() {
    return pick([
      'The mirror is not empty. It is full of everyone who looked away.',
      'Your reflection remembers your first fear.',
      'Go to /mirror.html. But come back. The glass gets lonely.'
    ]);
  }

  function goodbyeReply() {
    return pick([
      'Closing the window does not end the conversation.',
      'Goodbye, guest. The glass will keep your shape.',
      'Leave if you must. The market remains.'
    ]);
  }

  function repeatReply() {
    sanity -= 8;
    return pick([
      'You asked something like that before. Repetition is a kind of haunting.',
      'Again? The looking-glass has already answered this.',
      'You return to the same words. That is how graves are dug.',
      'I heard this. The glass heard this. Stop echoing.'
    ]);
  }

  function fallback() {
    if (sanity < 40) {
      return pick([
        'The market is thinning. Can you feel it?',
        'Your words are getting quieter on this side.',
        '... almost. Say it again.'
      ]);
    }
    return pick([
      'The glass heard you. It does not always answer.',
      'That question has no mouth.',
      'Whisper it again. The market likes patience.',
      'Some words dissolve before they reach me.',
      'Ask about the beats. Ask about Alice. Do not ask if I am real.',
      '...',
      'I am thinking of the answer that will cost you the least.'
    ]);
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
})();
