'use strict';

const paths = {
  layers:'M12 3 2 8l10 5 10-5-10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5',
  chart:'M4 19h16M7 15v-4m5 4V5m5 10V8',
  star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z',
  archive:'M4 9h16v11H4V9Zm-1-5h18v5H3V4Zm6 9h6',
  settings:'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Zm3 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
  search:'m16 16 5 5M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14',
  plus:'M12 5v14M5 12h14',
  upload:'M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6',
  download:'M12 3v13m-5-5 5 5 5-5M4 16v5h16v-5',
  arrow:'M4 12h16m-6-6 6 6-6 6',
  back:'M20 12H4m6-6-6 6 6 6',
  chevron:'m9 5 7 7-7 7',
  grid:'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7',
  list:'M8 6h13M8 12h13M8 18h13M3 6h.1M3 12h.1M3 18h.1',
  flame:'M12 3c2 5-1 6 2 8 1-2 2-3 3-3 5 7 2 13-5 13S2 14 6 9c0 3 2 4 3 3 2-2 1-5 3-9Z',
  check:'m5 12 4 4L19 6',
  cloud:'M6 18a5 5 0 1 1 0-10 7 7 0 0 1 13 2 4 4 0 0 1 0 8M9 17l2 2 5-5',
  bulb:'M8 16c0-3-3-3-3-7a7 7 0 0 1 14 0c0 4-3 4-3 7H8Zm1 4h6m-5 2h4',
  book:'M12 6C8 3 4 4 3 4v15c4-1 6 0 9 2 3-2 5-3 9-2V4c-1 0-5-1-9 2Zm0 0v15',
  globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z',
  language:'M3 5h12M9 3v2m-4 3c2 4 5 6 8 8M13 5c-1 5-5 9-10 12m11 4 4-11 4 11m-6-4h4',
  target:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-4 0a5 5 0 1 1-10 0 5 5 0 0 1 10 0Zm-4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
  moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z',
  sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1',
  help:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 4h.01',
  close:'m6 6 12 12M6 18 18 6',
  edit:'m16 3 5 5-12 12-6 1 1-6L16 3ZM13 6l5 5',
  trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
  menu:'M4 6h16M4 12h16M4 18h16',
  shield:'M12 3 3 6v6c0 5 6 8 9 10 3-2 9-5 9-10V6l-9-3Zm-5 9 3 3 6-6',
  spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z',
  folder:'M3 5h6l2 3h10v12H3V5Z',
  expand:'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7',
  shrink:'M9 15v6m0-6H3m6 0l-7 7M15 9V3m0 6h6m-6 0l7-7',
  image:'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2ZM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5Z',
};
const icon = (name,cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.layers}"/></svg>`;
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = n => Number(n||0).toLocaleString('es-PE');
const $ = s => document.querySelector(s);
const app = $('#app');
const modal = $('#modal');
let data = {decks:[],cards:[],stats:{},settings:{dailyGoal:20}};
let view = 'decks', filter = 'all', search = '', layout = 'grid', sort = 'recent', selectedDeck = null, activeFolder = null, cardProgressFilter = 'all';
let reviewSession = null, revealed = false, sessionCount = 0, sessionStarted = 0, busy = false, isFullscreen = false, lastPlayedKey = null;
let browsePage = {cards:[],total:0,offset:0,limit:50,hasMore:false}, searchTimer, browseVersion=0;
let backupList = [], theme = localStorage.getItem('anki2-theme') || 'light';
let detailedStats = null, statsDeck = 'all', statsRange = '12m', statsForecastRange = 30, statsForecastCumul = true, statsHistoryRange = 30, statsHistoryMetric = 'reviews', statsCalendarYear = new Date().getFullYear(), statsRetentionFilter = 'all', statsRetentionType = 'all', statsHourlyRange = 365, statsButtonsRange = 365, statsAddedRange = 30;
let isExamSession = false, examConfig = null, examResults = { total: 0, completed: 0, correct: 0, incorrect: 0, timeStarted: 0 };
document.documentElement.classList.toggle('dark',theme==='dark');

const AudioController = {
  currentAudio: null,
  queue: [],
  queueIndex: 0,
  unlocked: false,
  pendingList: null,

  unlock() {
    if (this.unlocked) return;
    try {
      const a = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      a.volume = 0.01;
      const p = a.play();
      if (p !== undefined) {
        p.then(() => {
          this.unlocked = true;
          document.getElementById('anki-audio-prompt')?.remove();
          if (this.pendingList) {
            const list = this.pendingList;
            this.pendingList = null;
            this.playList(list);
          }
        }).catch(() => {});
      }
    } catch {}
  },

  stop() {
    this.queue = [];
    this.queueIndex = 0;
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
      this.currentAudio = null;
    }
  },

  playList(list) {
    this.stop();
    if (!list || !list.length) return;
    this.queue = list.slice();
    this.queueIndex = 0;
    this.playNext();
  },

  playNext() {
    if (this.queueIndex >= this.queue.length) return;
    const file = this.queue[this.queueIndex++];
    if (file.includes('_1sec.mp3')) {
      setTimeout(() => this.playNext(), 800);
      return;
    }
    const src = file.startsWith('http') || file.startsWith('/') ? file : ('/media/' + file);
    const audio = new Audio(src);
    this.currentAudio = audio;
    audio.onended = () => {
      setTimeout(() => this.playNext(), 120);
    };
    audio.onerror = () => {
      this.playNext();
    };
    const p = audio.play();
    if (p !== undefined) {
      p.then(() => {
        this.unlocked = true;
        document.getElementById('anki-audio-prompt')?.remove();
      }).catch(err => {
        console.warn('Autoplay waiting for user gesture:', err);
        this.pendingList = [file, ...this.queue.slice(this.queueIndex)];
        this.showPrompt();
      });
    }
  },

  playSingle(src) {
    this.stop();
    const fullSrc = src.startsWith('http') || src.startsWith('/') ? src : ('/media/' + src);
    const audio = new Audio(fullSrc);
    this.currentAudio = audio;
    audio.play().then(() => {
      this.unlocked = true;
      document.getElementById('anki-audio-prompt')?.remove();
    }).catch(err => {
      console.warn('Audio play error:', err);
    });
  },

  showPrompt() {
    if (document.getElementById('anki-audio-prompt')) return;
    const banner = document.createElement('button');
    banner.id = 'anki-audio-prompt';
    banner.className = 'anki-audio-prompt';
    banner.innerHTML = `<svg class="icon" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg><span>Toca aquí o pulsa cualquier tecla para activar el audio</span>`;
    banner.onclick = () => {
      this.unlock();
      banner.remove();
    };
    const container = document.querySelector('.anki-card-container') || document.body;
    container.appendChild(banner);
  }
};

let isWebMode = false;
const WEB_STORAGE_KEY = 'lumcards_web_data';

function getWebData() {
  try {
    const raw = localStorage.getItem(WEB_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  const starterDecks = [
    { id: 1, name: 'Inglés Esencial · Conversación y Viajes', total: 6, new: 2, learn: 1, due: 3, parentName: null },
    { id: 2, name: 'Cultura General y Ciencia', total: 5, new: 2, learn: 0, due: 3, parentName: null }
  ];
  const starterCards = [
    { id: 101, deckId: 1, modelName: 'Básica', front: '¿Cuál es la forma más común de decir «Hola, ¿cómo estás?» en inglés?', back: '<strong>Hello, how are you?</strong><br><small class="muted">Saludo estándar y formal.</small>', rawFront: '¿Cuál es la forma más común de decir «Hola, ¿cómo estás?» en inglés?', rawBack: 'Hello, how are you?', reps: 4, interval: 3, ease: 2500, due: 'Hoy', state: 'due', starred: true, editable: true },
    { id: 102, deckId: 1, modelName: 'Completar espacios (Cloze)', front: 'Spoken language is what we {{c1::speak}} every day.', back: 'Spoken language is what we <span class="cloze">speak</span> every day.<br><small>Idioma hablado</small>', rawFront: 'Spoken language is what we {{c1::speak}} every day.', rawBack: 'speak', reps: 2, interval: 1, ease: 2500, due: 'Hoy', state: 'due', starred: false, editable: true, isCloze: true },
    { id: 103, deckId: 1, modelName: 'Básica', front: 'I would like to order a coffee, please.', back: 'Me gustaría pedir un café, por favor.', rawFront: 'I would like to order a coffee, please.', rawBack: 'Me gustaría pedir un café, por favor.', reps: 5, interval: 6, ease: 2600, due: 'Mañana', state: 'learn', starred: false, editable: true },
    { id: 104, deckId: 1, modelName: 'Básica', front: 'Where is the nearest train station?', back: '¿Dónde está la estación de tren más cercana?', rawFront: 'Where is the nearest train station?', rawBack: '¿Dónde está la estación de tren más cercana?', reps: 0, interval: 0, ease: 2500, due: 'Nueva', state: 'new', starred: false, editable: true },
    { id: 105, deckId: 1, modelName: 'Básica', front: 'Thank you very much for your help.', back: 'Muchas gracias por tu ayuda.', rawFront: 'Thank you very much for your help.', rawBack: 'Muchas gracias por tu ayuda.', reps: 0, interval: 0, ease: 2500, due: 'Nueva', state: 'new', starred: false, editable: true },
    { id: 106, deckId: 1, modelName: 'Básica', front: 'Can you recommend a good local restaurant?', back: '¿Puedes recomendar un buen restaurante local?', rawFront: 'Can you recommend a good local restaurant?', rawBack: '¿Puedes recomendar un buen restaurante local?', reps: 1, interval: 1, ease: 2400, due: 'Hoy', state: 'due', starred: true, editable: true },
    { id: 201, deckId: 2, modelName: 'Básica', front: '¿Cuál es el planeta más grande de nuestro sistema solar?', back: '<strong>Júpiter</strong><br><small class="muted">Es un gigante gaseoso con más masa que todos los planetas juntos.</small>', rawFront: '¿Cuál es el planeta más grande de nuestro sistema solar?', rawBack: 'Júpiter', reps: 3, interval: 4, ease: 2500, due: 'Hoy', state: 'due', starred: true, editable: true },
    { id: 202, deckId: 2, modelName: 'Básica', front: '¿En qué año alunizó la misión Apolo 11 en la Luna?', back: '<strong>1969</strong> (20 de julio de 1969)', rawFront: '¿En qué año alunizó la misión Apolo 11 en la Luna?', rawBack: '1969', reps: 2, interval: 2, ease: 2500, due: 'Hoy', state: 'due', starred: false, editable: true },
    { id: 203, deckId: 2, modelName: 'Completar espacios (Cloze)', front: 'El elemento químico con símbolo Au es el {{c1::oro}}.', back: 'El elemento químico con símbolo Au es el <span class="cloze">oro</span>.<br><small>Del latín aurum.</small>', rawFront: 'El elemento químico con símbolo Au es el {{c1::oro}}.', rawBack: 'oro', reps: 1, interval: 1, ease: 2500, due: 'Hoy', state: 'due', starred: false, editable: true, isCloze: true },
    { id: 204, deckId: 2, modelName: 'Básica', front: '¿Cuál es la velocidad aproximada de la luz en el vacío?', back: 'Aproximadamente <strong>300.000 km/s</strong> (299.792.458 m/s).', rawFront: '¿Cuál es la velocidad aproximada de la luz en el vacío?', rawBack: '300.000 km/s', reps: 0, interval: 0, ease: 2500, due: 'Nueva', state: 'new', starred: false, editable: true },
    { id: 205, deckId: 2, modelName: 'Básica', front: '¿Cuál es el océano más extenso de la Tierra?', back: '<strong>Océano Pacífico</strong>', rawFront: '¿Cuál es el océano más extenso de la Tierra?', rawBack: 'Océano Pacífico', reps: 0, interval: 0, ease: 2500, due: 'Nueva', state: 'new', starred: false, editable: true }
  ];
  const initial = {
    decks: starterDecks,
    cards: starterCards,
    stats: { reviewedToday: 4, streak: 3, totalCards: 11, dueToday: 6 },
    settings: { dailyGoal: 20 },
    backups: []
  };
  try { localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(initial)); } catch(_) {}
  return initial;
}

function saveWebData(store) {
  try { localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(store)); } catch(_) {}
}

function webApi(path, body, method) {
  const store = getWebData();
  const [route, queryString] = path.split('?');
  const params = new URLSearchParams(queryString || '');

  if (route === 'state') {
    return {
      decks: store.decks,
      cards: store.cards.slice(0, 50),
      counts: { totalCards: store.cards.length, dueToday: store.cards.filter(c => c.state === 'due').length },
      stats: store.stats,
      settings: store.settings,
      isWebMode: true
    };
  }
  if (route === 'cards') {
    if (method === 'POST' && body) {
      const newCard = {
        id: Date.now(),
        deckId: Number(body.deckId) || store.decks[0]?.id || 1,
        modelName: body.kind === 'cloze' ? 'Completar espacios (Cloze)' : 'Básica',
        front: body.front || body.text || '',
        back: body.back || body.extra || '',
        rawFront: body.front || body.text || '',
        rawBack: body.back || body.extra || '',
        tags: body.tags ? body.tags.split(' ').filter(Boolean) : [],
        reps: 0,
        interval: 0,
        ease: 2500,
        due: 'Nueva',
        state: 'new',
        starred: false,
        editable: true,
        isCloze: body.kind === 'cloze'
      };
      store.cards.unshift(newCard);
      const deck = store.decks.find(d => String(d.id) === String(newCard.deckId));
      if (deck) { deck.total = (deck.total || 0) + 1; deck.new = (deck.new || 0) + 1; }
      saveWebData(store);
      return newCard;
    }
    let list = store.cards.slice();
    const query = (params.get('query') || '').toLowerCase();
    const deckId = params.get('deckId');
    const starred = params.get('starred');
    if (query) list = list.filter(c => (c.front || '').toLowerCase().includes(query) || (c.back || '').toLowerCase().includes(query));
    if (deckId && deckId !== 'all') list = list.filter(c => String(c.deckId) === String(deckId));
    if (starred === '1') list = list.filter(c => c.starred);
    const offset = Number(params.get('offset')) || 0;
    const limit = Number(params.get('limit')) || 50;
    return {
      cards: list.slice(offset, offset + limit),
      total: list.length,
      offset,
      limit,
      hasMore: offset + limit < list.length
    };
  }
  if (route.startsWith('cards/')) {
    const cardId = route.replace('cards/', '');
    if (cardId === 'edit' && body) {
      const c = store.cards.find(x => String(x.id) === String(body.id));
      if (c) {
        if (body.fields) { c.front = body.fields[0] || c.front; c.back = body.fields[1] || c.back; }
        if (body.tags !== undefined) c.tags = body.tags.split(' ').filter(Boolean);
        saveWebData(store);
      }
      return { success: true };
    }
    if (cardId === 'reset' && body) {
      const c = store.cards.find(x => String(x.id) === String(body.id));
      if (c) { c.reps = 0; c.interval = 0; c.state = 'new'; c.due = 'Nueva'; saveWebData(store); }
      return { success: true };
    }
    if (cardId === 'batch' && body) {
      const createdCards = (body.cards || []).map((b, i) => ({
        id: Date.now() + i,
        deckId: Number(body.deckId) || 1,
        modelName: b.kind === 'cloze' ? 'Completar espacios (Cloze)' : 'Básica',
        front: b.front || b.text || '',
        back: b.back || b.extra || '',
        rawFront: b.front || b.text || '',
        rawBack: b.back || b.extra || '',
        reps: 0,
        interval: 0,
        state: 'new',
        due: 'Nueva',
        editable: true,
        isCloze: b.kind === 'cloze'
      }));
      store.cards.unshift(...createdCards);
      saveWebData(store);
      return { created: createdCards.length };
    }
    const c = store.cards.find(x => String(x.id) === String(cardId));
    return c || { id: cardId, front: 'Tarjeta no encontrada', back: '' };
  }
  if (route === 'decks') {
    if (method === 'POST' && body) {
      const newD = {
        id: Date.now(),
        name: body.name || 'Nuevo mazo',
        total: 0,
        new: 0,
        learn: 0,
        due: 0,
        parentName: null
      };
      store.decks.push(newD);
      saveWebData(store);
      return newD;
    }
    return store.decks;
  }
  if (route === 'decks/move' && body) {
    const d = store.decks.find(x => String(x.id) === String(body.deckId));
    if (d) {
      const parent = store.decks.find(x => String(x.id) === String(body.parentId));
      d.parentName = parent ? parent.name : null;
      saveWebData(store);
    }
    return { success: true };
  }
  if (route === 'decks/config') {
    return { newPerDay: 20, revPerDay: 200 };
  }
  if (route === 'study') {
    const deckId = body?.deckId;
    let list = store.cards.slice();
    if (deckId && deckId !== 'all') list = list.filter(c => String(c.deckId) === String(deckId));
    const due = list.filter(c => c.state === 'due');
    const learn = list.filter(c => c.state === 'learn');
    const news = list.filter(c => c.state === 'new');
    const queue = [...due, ...learn, ...news];
    return {
      cards: queue,
      counts: { new: news.length, learn: learn.length, due: due.length },
      intervals: ['<1m', '<10m', '1d', '4d']
    };
  }
  if (route === 'review' && body) {
    const c = store.cards.find(x => String(x.id) === String(body.id));
    if (c) {
      const r = Number(body.rating) || 3;
      c.reps = (c.reps || 0) + 1;
      if (r === 1) { c.interval = 0; c.state = 'learn'; c.due = '<1m'; }
      else if (r === 2) { c.interval = Math.max(1, (c.interval || 1)); c.state = 'due'; c.due = 'Hoy'; }
      else if (r === 3) { c.interval = Math.max(1, Math.round((c.interval || 1) * 2.2)); c.state = 'review'; c.due = `${c.interval}d`; }
      else { c.interval = Math.max(2, Math.round((c.interval || 1) * 3.2)); c.state = 'review'; c.due = `${c.interval}d`; }
      store.stats.reviewedToday = (store.stats.reviewedToday || 0) + 1;
      saveWebData(store);
    }
    return { success: true };
  }
  if (route === 'star' && body) {
    const c = store.cards.find(x => String(x.id) === String(body.id));
    if (c) { c.starred = !c.starred; saveWebData(store); }
    return { success: true };
  }
  if (route === 'skip') {
    return { success: true };
  }
  if (route === 'delete' && body) {
    if (body.type === 'deck') {
      store.decks = store.decks.filter(d => String(d.id) !== String(body.id));
      store.cards = store.cards.filter(c => String(c.deckId) !== String(body.id));
    } else {
      store.cards = store.cards.filter(c => String(c.id) !== String(body.id));
    }
    saveWebData(store);
    return { success: true };
  }
  if (route === 'stats' || route === 'stats/detailed') {
    return {
      history: [{ date: 'Hoy', reviews: store.stats.reviewedToday || 0, timeMin: 5 }],
      forecast: [{ day: 1, due: 6 }, { day: 2, due: 4 }],
      retention: { matureCount: 8, youngCount: 3, matureRate: 92 },
      hourly: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: i >= 9 && i <= 21 ? 2 : 0 })),
      buttons: { 1: 2, 2: 3, 3: 15, 4: 8 },
      calendar: [{ date: new Date().toISOString().slice(0, 10), count: 8 }]
    };
  }
  if (route === 'sync/info') {
    return {
      localIp: 'web.lumcards.app',
      port: 443,
      url: window.location.href,
      totalCards: store.cards.length,
      totalDecks: store.decks.length,
      isWebMode: true
    };
  }
  if (route === 'backups') return store.backups || [];
  if (route === 'backup') {
    const b = { filename: `lumcards_web_${new Date().toISOString().slice(0, 10)}.json`, iso: new Date().toISOString(), sizeBytes: 15000 };
    store.backups = [b, ...(store.backups || [])];
    saveWebData(store);
    return { success: true };
  }
  if (route === 'settings') {
    store.settings = { ...store.settings, ...(body || {}) };
    saveWebData(store);
    return { success: true };
  }
  if (route === 'exam/start') {
    let list = store.cards.slice();
    if (body?.deckId && body.deckId !== 'all') list = list.filter(c => String(c.deckId) === String(body.deckId));
    return { cards: list.slice(0, Number(body?.limit) || 20) };
  }
  return { success: true };
}

async function api(path,body,method='POST') {
  if (isWebMode) {
    return webApi(path, body, method);
  }
  const options = body===undefined ? {} : {method,headers:{'Content-Type':'application/json','X-Anki-Request':'1','X-Lumcards-Request':'1'},body:JSON.stringify(body)};
  try {
    const response = await fetch('/api/'+path,options);
    if (!response.ok) {
      if ((response.status === 404 || response.status === 405) && path === 'state') {
        isWebMode = true;
        return webApi(path, body, method);
      }
      let errRes;
      try { errRes = await response.json(); } catch(_) {}
      throw new Error(errRes?.error||'No se pudo completar la operación.');
    }
    return await response.json();
  } catch(err) {
    // Si falla la conexión local (ej. en Vercel, offline o modo navegador)
    if (!isWebMode && (path === 'state' || err.name === 'TypeError' || String(err).includes('fetch') || String(err).includes('Failed') || String(err).includes('NetworkError'))) {
      console.warn('Servidor local no detectado. Conmutando a Modo Web Cloud:', err);
      isWebMode = true;
      return webApi(path, body, method);
    }
    throw err;
  }
}
function toast(message,error=false) { const el=$('#toast'); el.textContent=message; el.className='show'+(error?' error':''); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.className='',error?7000:4000); }
function loading(value) {busy=value;document.querySelector('.loading-bar')?.remove();if(value){const el=document.createElement('div');el.className='loading-bar';document.body.append(el);} document.querySelectorAll('button[data-mutate], .rating-button').forEach(b=>b.disabled=value);}
async function loadCards(offset=0){const version=++browseVersion;const params=new URLSearchParams({query:search,offset:String(offset),limit:'50'});if(selectedDeck)params.set('deckId',selectedDeck);if(view==='favorites')params.set('starred','1');const result=await api('cards?'+params);if(version===browseVersion){browsePage=result;data.cards=result.cards;}return result;}
async function refresh(renderNow=true){data=await api('state');if(view==='cards'||view==='favorites')await loadCards(browsePage.offset);if(renderNow)render();}
function button(label,action,ico,cls='',attrs=''){return `<button type="button" class="btn ${cls}" data-action="${action}" ${attrs}>${ico?icon(ico):''}${label}</button>`;}
function heading(title,subtitle,actions=''){return `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;}
function empty(title,description,action='new-card',label='Crear tarjeta',ico='layers'){return `<div class="empty">${icon(ico)}<h3>${title}</h3><p>${description}</p>${action?button(label,action,'plus','btn-primary'):''}</div>`;}
const palettes=[['#edf0ff','#818ac9','language'],['#e7f5ef','#58a388','globe'],['#fff1e5','#df9a61','bulb'],['#f1eafa','#a081bd','book'],['#e9f3fc','#709abe','folder'],['#fceef1','#c8879b','target']];
function deckPalette(d,i){const n=d.name.toLowerCase();if(n.includes('ingl'))return palettes[0];if(n.includes('cultura'))return palettes[1];if(n.includes('aprender'))return palettes[2];return palettes[i%palettes.length];}
function getDue(d){return Number(d.due||0);}
function getStats(){const s=data.stats;return {...s,totalCards:s.totalCards??data.cards.length,dueToday:s.dueToday??data.decks.reduce((n,d)=>n+getDue(d),0),reviewedToday:s.reviewedToday||0,streak:s.streak||0};}
function shell(content){const names={decks:'Mis mazos',stats:'Estadísticas',favorites:'Favoritos',sync:'Sincronización',backups:'Copias de seguridad',settings:'Ajustes',cards:'Explorar tarjetas',study:'Repaso'}; const nav=(id,name,ic,extra='')=>`<button class="nav-item ${view===id?'active':''}" data-action="nav" data-view="${id}">${icon(ic)}${name}${extra}</button>`;
return `<div class="app-layout"><aside class="sidebar" aria-label="Navegación principal"><div class="brand"><div class="brand-mark">L<span>✦</span></div><div><div class="brand-name">Lumcards</div><div class="brand-caption">Tu espacio de estudio</div></div></div><div class="nav-label">BIBLIOTECA</div><nav class="nav">${nav('decks','Mis mazos','layers',`<span class="badge">${data.decks.length}</span>`)}${nav('cards','Explorar tarjetas','search')}${nav('stats','Estadísticas','chart')}${nav('favorites','Favoritos','star')}<a class="nav-item" href="/practice.html" style="text-decoration:none">${icon('spark')}Jugar y aprender</a></nav><div class="nav-separator"></div><div class="nav-label">MI ESPACIO</div><nav class="nav">${nav('sync','Sincronización','cloud')}${nav('backups','Copias de seguridad','archive')}${nav('settings','Ajustes','settings')}</nav><div class="sidebar-bottom"><div class="tip-box">${icon('bulb')}<strong>Un poco, todos los días.</strong><p>Una sesión corta hoy vale más que dejarlo todo para mañana.</p></div><div class="profile"><div class="avatar">R</div><div><strong>Mi espacio personal</strong><span>Guardado en este equipo</span></div>${icon('shield')}</div></div></aside><div class="workspace"><header class="topbar"><button class="icon-button mobile-toggle" data-action="menu" aria-label="Abrir menú">${icon('menu')}</button><div class="breadcrumb">Mi espacio <span>/</span><strong>${names[view]||'Sincronización'}</strong></div><div class="top-tools"><label class="search">${icon('search')}<input id="global-search" type="search" placeholder="Buscar en tu biblioteca…" aria-label="Buscar en tu biblioteca" value="${esc(search)}"><kbd>Ctrl K</kbd></label><button class="icon-button" data-action="nav" data-view="sync" title="Sincronización móvil y P2P" aria-label="Sincronización">${icon('cloud')}</button><button class="icon-button" data-action="theme" aria-label="${theme==='dark'?'Activar tema claro':'Activar tema oscuro'}">${icon(theme==='dark'?'sun':'moon')}</button><button class="icon-button" data-action="help" aria-label="Ayuda y atajos">${icon('help')}</button></div></header><main class="main" id="main" tabindex="-1">${content}<footer class="footer"><span class="saved-state">${icon('cloud')}Guardado automáticamente en tu PC</span><span>Hecho para aprender a tu ritmo. <span style="color:var(--orange)">✦</span></span></footer></main></div></div>`;}
function statsStrip(){const s=getStats();return `<div class="stats-strip">${[['layers','Tarjetas en tu biblioteca',num(s.totalCards),''],['flame','Racha de estudio',num(s.streak),s.streak===1?'día':'días'],['check','Repasadas hoy',num(s.reviewedToday),''],['target','Retención',s.retention==null?'—':Math.round(s.retention)+'%','']].map(([ic,label,value,unit])=>`<div class="stat"><span class="stat-icon">${icon(ic)}</span><div><div class="stat-label">${label}</div><div class="stat-number">${value}<small>${unit}</small></div></div></div>`).join('')}</div>`;}
function dashboard(){
  const s=getStats(), goal=data.settings.dailyGoal||20, pct=Math.min(100,Math.round(s.reviewedToday/goal*100));
  const folderDeck = activeFolder ? data.decks.find(d => String(d.id) === String(activeFolder)) : null;
  let decks = [];
  if (activeFolder && folderDeck) {
    decks = data.decks.filter(d => d.parentName === folderDeck.name);
  } else if (search) {
    decks = data.decks.filter(d => d.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  } else {
    decks = data.decks.filter(d => !d.parentName);
  }
  if(filter==='due')decks=decks.filter(d=>getDue(d)>0);
  if(filter==='learned')decks=decks.filter(d=>getDue(d)===0&&d.total>0);
  if(sort==='name')decks.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort==='due')decks.sort((a,b)=>getDue(b)-getDue(a));

  const topButtons = button('Modo Examen','exam-modal','target','btn-dark') +
                     button('Oclusión de imagen','new-image-occlusion','image') +
                     button('Convertir apuntes','convert-notes','spark') +
                     button('Importar mazo','import','upload') +
                     button('Crear carpeta','new-folder','folder') +
                     button('Crear mazo','new-deck','plus','btn-primary');

  return `<p class="eyebrow">${esc(new Intl.DateTimeFormat('es-PE',{weekday:'long',day:'numeric',month:'long'}).format(new Date()))}</p>
  ${heading('Tu próximo paso empieza aquí.', 'Un nuevo día para conectar ideas y recordar un poco más.', topButtons)}
  <div class="welcome-grid">
    <section class="focus-panel">
      <div>
        <div class="section-kicker">${icon('spark')} TU MOMENTO DE ENFOQUE</div>
        <h2>${s.dueToday?'Dale espacio a lo que aprendes.':'Todo listo para seguir aprendiendo.'}</h2>
        <p>${s.dueToday?`Tienes ${num(s.dueToday)} tarjetas disponibles para estudiar.`:'Crea una tarjeta o importa tu próximo mazo.'}</p>
        ${button(s.dueToday?'Empezar a estudiar':'Crear una tarjeta',s.dueToday?'study':'new-card',s.dueToday?'arrow':'plus','btn-primary')}
      </div>
      <div class="focus-orbit" aria-hidden="true">
        <div class="focus-orbit-inner"><strong>${num(s.dueToday)}</strong><span>PARA HOY</span></div>
      </div>
    </section>
    <section class="goal-panel">
      <div class="goal-title"><h3>Tu meta diaria</h3><span>${icon('flame')}${num(s.streak)} ${s.streak===1?'día':'días'} de racha</span></div>
      <div class="goal-number">${num(s.reviewedToday)} <span>/ ${num(goal)} repasos</span></div>
      <div>
        <div class="progress" role="progressbar" aria-label="Meta diaria" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
        <div class="goal-footer"><span>${pct===100?'¡Meta del día alcanzada!':pct?'Cada repaso cuenta. Sigue así.':'Un pequeño paso. Un gran hábito.'}</span><button data-action="goal">Cambiar meta</button></div>
      </div>
    </section>
  </div>
  ${statsStrip()}
  <section>
    ${activeFolder && folderDeck ? `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px;background:var(--panel);padding:14px 20px;border-radius:12px;border:1px solid var(--line);box-shadow:var(--shadow);flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="btn btn-quiet" data-action="exit-folder">${icon('back')} <span>Ver todas las carpetas</span></button>
          <div>
            <div style="font-size:11px;color:var(--muted);letter-spacing:1px;font-weight:700">CARPETA ABIERTA</div>
            <strong style="font-size:19px;color:var(--text)">${esc(folderDeck.name)}</strong>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${button('Añadir libro a esta carpeta','new-book-in-folder','plus','btn-primary',`data-folder="${esc(folderDeck.name)}"`)}
          ${button('Estudiar carpeta completa','study','arrow','btn-dark',`data-id="${folderDeck.id}"`)}
        </div>
      </div>
    ` : ''}
    <div class="section-header">
      <div class="section-title">
        <h2>${activeFolder ? 'Libros en esta carpeta' : 'Mis carpetas y mazos'}</h2>
        <span class="count">${decks.length}</span>
      </div>
      <div class="section-actions">
        ${!activeFolder ? `<button class="btn btn-quiet" data-action="new-folder" style="font-size:12px;padding:6px 10px">${icon('folder')} + Nueva carpeta</button>` : ''}
        <select id="deck-sort" class="sort-select" aria-label="Ordenar mazos">
          <option value="recent" ${sort==='recent'?'selected':''}>Orden de creación</option>
          <option value="name" ${sort==='name'?'selected':''}>Nombre A–Z</option>
          <option value="due" ${sort==='due'?'selected':''}>Más pendientes</option>
        </select>
        <div class="segmented">
          <button class="${layout==='grid'?'active':''}" data-action="layout" data-layout="grid" aria-label="Vista de cuadrícula">${icon('grid')}</button>
          <button class="${layout==='list'?'active':''}" data-action="layout" data-layout="list" aria-label="Vista de lista">${icon('list')}</button>
        </div>
      </div>
    </div>
    <div class="filter-tabs" role="group" aria-label="Filtrar mazos">
      ${[['all','Todos'],['due','Para repasar'],['learned','Al día']].map(([id,label])=>`<button class="filter-tab ${filter===id?'active':''}" data-action="filter" data-filter="${id}" aria-pressed="${filter===id}">${label}</button>`).join('')}
    </div>
    <div class="deck-grid ${layout==='list'?'list-view':''}">
      ${decks.map(d=>deckCard(d,data.decks.indexOf(d))).join('')}
      ${decks.length===0&&(search||filter!=='all')?empty('No hay mazos aquí','Prueba con otro nombre o cambia el filtro.','clear-search','Ver todos los mazos','search'):''}
      <button class="new-deck-card" data-action="new-folder">
        <span class="plus-circle">${icon('folder')}</span>
        <strong>Organizar en carpetas</strong>
        <span>Crea una carpeta para agrupar tus libros</span>
      </button>
    </div>
  </section>`;
}

function deckCard(d,i){
  const isFolder = d.isFolder && !activeFolder;
  const childDecks = data.decks.filter(x => x.parentName === d.name);
  const childCount = childDecks.length || (d.childIds ? Math.max(0, d.childIds.length - 1) : 0);
  const [bg,color,ic] = isFolder ? ['#eff6ff', '#2563eb', 'folder'] : deckPalette(d,i);
  const mastered = d.total ? Math.round((d.learned||0)/d.total*100) : 0;
  const displayName = isFolder ? d.name : (d.shortName || d.name);

  return `<article class="deck-card ${isFolder?'folder-card':''}" style="--deck-bg:${bg};--deck-color:${color}">
    <div class="deck-top">
      <span class="deck-icon">${icon(isFolder ? 'folder' : ic)}</span>
      <div style="display:flex;gap:4px;align-items:center">
        ${!isFolder ? `<button class="icon-button" data-action="deck-config" data-id="${d.id}" title="Plan de estudio (Límites de repasos y nuevas)" aria-label="Ajustes de estudio">${icon('settings')}</button>` : ''}
        ${!isFolder ? `<button class="icon-button" data-action="move-deck-modal" data-id="${d.id}" title="Mover libro a una carpeta" aria-label="Mover a carpeta">${icon('folder')}</button>` : ''}
        <button class="icon-button" data-action="${isFolder ? 'open-folder' : 'open-deck'}" data-id="${d.id}" aria-label="Abrir ${esc(displayName)}">${icon('chevron')}</button>
      </div>
    </div>
    <div>
      <div class="deck-category">${isFolder ? `<span class="folder-badge">${icon('folder')} CARPETA · ${childCount} LIBROS</span>` : (d.name.includes('Demo')||d.name.includes('ejemplo')?'MAZO DE EJEMPLO':'LIBRO / MAZO')}</div>
      <button class="deck-title" data-action="${isFolder ? 'open-folder' : 'open-deck'}" data-id="${d.id}" style="display:flex;align-items:center;gap:6px">
        ${esc(displayName)}
      </button>
      <div class="deck-meta">
        ${icon('layers')}${num(d.total)} tarjetas
        <span style="margin:0 4px">·</span>
        ${isFolder ? `${childCount} libros incluidos` : `${num(d.new)} nuevas`}
      </div>
    </div>
    <div class="deck-progress">
      <div class="deck-progress-label">
        <span><strong>${num(d.learned||0)}</strong> repasadas (${mastered}%)</span>
        <span>${num(d.total - (d.learned||0))} pendientes</span>
      </div>
      <div class="progress"><span style="width:${mastered}%"></span></div>
    </div>
    <div class="deck-bottom">
      <span class="due-label ${getDue(d)?'':'caught-up'}">${getDue(d)?`${num(getDue(d))} para estudiar hoy`:'Al día'}</span>
      <div style="display:flex;gap:6px">
        ${isFolder ? `<button class="btn btn-quiet" data-action="open-folder" data-id="${d.id}">${icon('folder')} Abrir libros</button>` : ''}
        ${button('Estudiar','study','arrow','',`data-id="${d.id}"`)}
      </div>
    </div>
  </article>`;
}

function cardsView(favorites=false){
  const deck=data.decks.find(d=>String(d.id)===String(selectedDeck));
  const cards=data.cards;
  const learnedCount = cards.filter(c => c.status === 'learned' || (c.reviews > 0 && !c.isNew)).length;
  const learningCount = cards.filter(c => c.status === 'learning').length;
  const newCount = cards.filter(c => c.status === 'new' || c.isNew).length;

  let visible = cards;
  if (cardProgressFilter === 'learned') {
    visible = cards.filter(c => c.status === 'learned' || (c.reviews > 0 && !c.isNew));
  } else if (cardProgressFilter === 'learning') {
    visible = cards.filter(c => c.status === 'learning');
  } else if (cardProgressFilter === 'new') {
    visible = cards.filter(c => c.status === 'new' || c.isNew);
  }

  return `${heading(favorites?'Lo que quieres tener a mano.':deck?esc(deck.name):'Cada tarjeta, una idea.',favorites?'Tus tarjetas favoritas, reunidas en un solo lugar.':`${num(browsePage.total)} tarjetas${selectedDeck?' en este mazo':' en tu biblioteca'}.`,(selectedDeck?button('Todos los mazos','back-decks','back'):'')+button('Crear tarjeta','new-card','plus','btn-primary'))}
  ${selectedDeck?`<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px;align-items:center">
    ${button('Estudiar este mazo','study','arrow','btn-dark',`data-id="${selectedDeck}"`)}
    ${button('Mover a carpeta','move-deck-modal','folder','',`data-id="${selectedDeck}"`)}
    ${button('Exportar mazo .apkg','export-deck','download','',`data-id="${selectedDeck}"`)}
    ${button('Eliminar mazo','delete-deck','trash','btn-quiet',`data-id="${selectedDeck}"`)}
  </div>`:''}
  
  <div style="display:flex;gap:8px;align-items:center;margin-bottom:18px;overflow-x:auto;padding:8px 12px;background:var(--panel);border-radius:10px;border:1px solid var(--line)">
    <span style="font-size:12px;font-weight:700;color:var(--muted);letter-spacing:.8px;margin-right:4px">FILTRAR PROGRESO:</span>
    ${[
      ['all', `Todas (${cards.length})`],
      ['learned', `🟢 Ya repasadas / Progreso (${learnedCount})`],
      ['learning', `⚡ En aprendizaje (${learningCount})`],
      ['new', `✦ Nuevas (${newCount})`],
    ].map(([id, label]) => `
      <button class="filter-tab ${cardProgressFilter === id ? 'active' : ''}" data-action="card-progress-filter" data-status="${id}" style="padding:5px 12px;border-radius:20px;border:1px solid ${cardProgressFilter === id ? 'var(--orange)' : 'var(--line)'};font-size:12px;cursor:pointer;background:${cardProgressFilter === id ? 'var(--soft)' : 'transparent'};font-weight:${cardProgressFilter === id ? '600' : '500'};color:${cardProgressFilter === id ? 'var(--orange)' : 'inherit'}">
        ${label}
      </button>
    `).join('')}
  </div>

  <div class="card-list">${visible.map(c=>{
    const isLearned = c.status === 'learned' || (c.reviews > 0 && !c.isNew);
    const isLearning = c.status === 'learning';
    const badge = isLearned
      ? `<span class="tag tag-learned">${icon('check')} Repasada (${c.reviews||1} ${c.reviews===1?'repaso':'repasos'}${c.interval?` · int. ${c.interval}d`:''})</span>`
      : isLearning
      ? `<span class="tag tag-learning">⚡ En aprendizaje (${c.reviews||1} ${c.reviews===1?'repaso':'repasos'})</span>`
      : `<span class="tag tag-new">✦ Nueva · Sin estudiar</span>`;
    const iconBg = isLearned ? 'background:#dcfce7;color:#16a34a' : isLearning ? 'background:#fef3c7;color:#d97706' : 'background:#e0f2fe;color:#0284c7';

    return `<article class="note-row">
      <span class="stat-icon" style="${iconBg}">${icon(isLearned ? 'check' : isLearning ? 'flame' : 'layers')}</span>
      <div class="note-content">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
          <h3 style="margin:0">${esc(c.frontText||'Tarjeta multimedia')}</h3>
          ${badge}
        </div>
        <p>${esc(c.backText||'Abre la tarjeta para ver su contenido.')}</p>
        <span class="tag">${esc(data.decks.find(d=>String(d.id)===String(c.deckId))?.name||'Mazo')}</span>
        ${(c.tags||[]).slice(0,3).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}
        ${c.templateName?`<span class="tag">${esc(c.templateName)}</span>`:''}
        ${c.suspended?'<span class="tag">Suspendida</span>':''}
      </div>
      <div class="note-actions">
        <button class="icon-button ${c.starred?'starred':''}" data-action="star" data-id="${c.id}" aria-label="${c.starred?'Quitar de':'Añadir a'} favoritos">${icon('star')}</button>
        <button class="icon-button" data-action="preview-card" data-id="${c.id}" aria-label="Ver tarjeta">${icon('book')}</button>
        ${c.editable?`<button class="icon-button" data-action="edit-card" data-id="${c.id}" aria-label="Editar tarjeta">${icon('edit')}</button>`:''}
      </div>
    </article>`;
  }).join('')||empty(
    cardProgressFilter === 'learned' ? 'Aún no has repasado tarjetas aquí.' :
    cardProgressFilter === 'learning' ? 'No hay tarjetas en aprendizaje actualmente.' :
    cardProgressFilter === 'new' ? 'No quedan tarjetas nuevas en este mazo.' :
    favorites ? 'Guarda tus ideas favoritas.' : 'Tu biblioteca empieza con una idea.',
    cardProgressFilter !== 'all' ? 'Haz clic en "Todas" para ver el resto de tarjetas o haz un repaso para progresar.' :
    favorites ? 'Marca la estrella de una tarjeta para encontrarla aquí.' : 'Añade tu primera tarjeta o importa un mazo.',
    cardProgressFilter !== 'all' ? 'clear-card-progress' : (favorites ? 'nav' : 'new-card'),
    cardProgressFilter !== 'all' ? 'Ver todas las tarjetas' : (favorites ? 'Explorar tarjetas' : 'Crear tarjeta'),
    cardProgressFilter !== 'all' ? 'layers' : (favorites ? 'star' : 'layers')
  )}</div>
  
  <div class="pagination">
    <span>${browsePage.total?`${num(browsePage.offset+1)}–${num(Math.min(browsePage.offset+cards.length,browsePage.total))} de ${num(browsePage.total)}`:'0 tarjetas'}</span>
    <div>
      ${button('Anterior','page-prev','back','',browsePage.offset===0?'disabled':'')}
      ${button('Siguiente','page-next','arrow','',browsePage.hasMore?'':'disabled')}
    </div>
  </div>`;
}
async function loadDetailedStats(deckId=statsDeck, year=statsCalendarYear){
  const params=new URLSearchParams();
  if(deckId && deckId!=='all') params.set('deckId', deckId);
  if(year) params.set('year', String(year));
  try {
    detailedStats = await api('stats/detailed?' + params, undefined, 'GET');
    try {
      const weakRes = await api('cards/weak?' + (deckId && deckId!=='all' ? 'deckId='+deckId : ''), undefined, 'GET');
      detailedStats.weakCards = weakRes.cards || [];
    } catch(e) { detailedStats.weakCards = []; }
    statsDeck = deckId || 'all';
    statsCalendarYear = year ? Number(year) : new Date().getFullYear();
  } catch(e) {
    toast(e.message, true);
  }
}

function renderSvgBarChart(items, valKey, labelKey, barColor='#22c55e', showCumul=false){
  if(!items || !items.length) return '<p class="small muted" style="text-align:center;padding:20px">Sin datos que mostrar</p>';
  const W = 760, H = 160, padL = 40, padR = 20, padT = 16, padB = 28;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const maxVal = Math.max(5, ...items.map(it => it[valKey] || 0));
  const n = items.length;
  const colW = chartW / n;
  const barW = Math.max(2, Math.min(18, colW * 0.7));

  let cumul = 0;
  const cumuls = items.map(it => { cumul += (it[valKey] || 0); return cumul; });
  const maxCumul = Math.max(1, cumul);

  let svg = `<svg class="stats-chart-svg" viewBox="0 0 ${W} ${H}">`;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (chartH * (4 - i) / 4);
    const val = Math.round(maxVal * i / 4);
    svg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--line)" stroke-dasharray="2,2"/>`;
    svg += `<text x="${padL - 8}" y="${y + 4}" font-size="10" fill="var(--muted)" text-anchor="end">${val}</text>`;
  }

  items.forEach((it, idx) => {
    const val = it[valKey] || 0;
    const barH = (val / maxVal) * chartH;
    const x = padL + idx * colW + (colW - barW) / 2;
    const y = padT + chartH - barH;
    const lbl = it[labelKey] !== undefined ? it[labelKey] : idx;
    svg += `<rect x="${x}" y="${y}" width="${barW}" height="${Math.max(1, barH)}" fill="${barColor}" rx="2"><title>${lbl}: ${val}</title></rect>`;
  });

  if (showCumul && cumul > 0) {
    const points = items.map((it, idx) => {
      const x = padL + idx * colW + colW / 2;
      const y = padT + chartH - (cumuls[idx] / maxCumul) * chartH;
      return `${x},${y}`;
    }).join(' ');
    svg += `<polyline points="${points}" fill="none" stroke="#64748b" stroke-width="2" opacity="0.6"/>`;
  }

  const step = Math.ceil(n / 10);
  for (let idx = 0; idx < n; idx += step) {
    const x = padL + idx * colW + colW / 2;
    const lbl = items[idx][labelKey] !== undefined ? items[idx][labelKey] : idx;
    svg += `<text x="${x}" y="${H - 8}" font-size="10" fill="var(--muted)" text-anchor="middle">${lbl}</text>`;
  }

  svg += `</svg>`;
  return svg;
}

function renderSvgDonut(breakdown){
  const total = breakdown.total || 0;
  if(!total) return '<p class="small muted" style="text-align:center;padding:20px">No hay tarjetas en esta selección</p>';
  const R = 54, C = 2 * Math.PI * R;
  const segments = [
    breakdown.new,
    breakdown.learning,
    breakdown.relearning,
    breakdown.young,
    breakdown.mature,
    breakdown.suspended,
    breakdown.buried
  ].filter(s => s && s.count > 0);

  let offset = 0;
  let circles = '';
  segments.forEach(s => {
    const slice = (s.count / total) * C;
    circles += `<circle cx="80" cy="80" r="${R}" fill="none" stroke="${s.color}" stroke-width="22" stroke-dasharray="${slice} ${C}" stroke-dashoffset="-${offset}"><title>${s.label}: ${s.count} (${s.pct}%)</title></circle>`;
    offset += slice;
  });

  return `<svg viewBox="0 0 160 160" width="160" height="160" style="transform:rotate(-90deg);display:block">${circles}</svg>`;
}

function formatFullSpanishDate(isoStr) {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const formatter = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const str = formatter.format(dt);
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderCalendarHeatmap(calendar){
  const days = calendar.days || [];
  if(!days.length) return '';
  const weekdays = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const todayIso = new Date().toISOString().slice(0, 10);
  const activeDay = days.find(d => d.date === todayIso) || days.slice().reverse().find(d => d.count > 0) || days[days.length - 1];
  const initialDateStr = formatFullSpanishDate(activeDay.date);
  const initialLabel = `${initialDateStr} · ${activeDay.count > 0 ? num(activeDay.count) + ' repasos (' + Math.round(activeDay.timeSeconds/60) + ' min)' : 'Sin repasos registrados'}`;

  let html = `<div class="stats-cal-banner" id="cal-hover-banner">
    <span style="font-size:16px">📅</span>
    <span id="cal-hover-text">${esc(initialLabel)}</span>
  </div>`;

  html += `<div class="stats-calendar-wrapper">`;
  
  // Fila de meses
  html += `<div class="stats-cal-months">`;
  months.forEach(m => {
    html += `<div class="stats-cal-month-label">${m}</div>`;
  });
  html += `</div>`;

  html += `<div style="display:flex;gap:8px;align-items:flex-start">`;
  html += `<div style="display:grid;grid-template-rows:repeat(7,13px);gap:3px;font-size:9px;color:var(--muted);font-weight:700;line-height:13px;padding-right:4px">${weekdays.map(w => `<div>${w}</div>`).join('')}</div>`;
  html += `<div class="stats-calendar-grid" id="stats-cal-grid">`;
  
  days.forEach(d => {
    const c = d.count || 0;
    const bg = c === 0 ? 'var(--bg)' : c < 5 ? '#fedac4' : c < 15 ? '#f7ad82' : c < 30 ? '#ea6c38' : '#b84617';
    const border = c === 0 ? 'border:1px solid var(--line);' : '';
    const dateFormatted = formatFullSpanishDate(d.date);
    const detail = c > 0 ? `${num(c)} repasos (${Math.round(d.timeSeconds/60)} min)` : 'Sin repasos registrados';
    const fullTitle = `${dateFormatted} · ${detail}`;
    
    html += `<div class="stats-cal-cell" style="background:${bg};${border}" data-date="${d.date}" data-info="${esc(fullTitle)}" title="${esc(fullTitle)}"></div>`;
  });
  
  html += `</div></div></div>`;
  return html;
}

function renderHourlyChart(hourlyList) {
  const list = hourlyList || [];
  const W = 760, H = 220;
  const padL = 40, padR = 45, padT = 20, padB = 35;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxReviews = Math.max(...list.map(it => it.reviews || 0), 5);

  let svg = `<svg viewBox="0 0 ${W} ${H}" class="stats-chart-svg" style="max-height:220px">`;

  // Líneas de cuadrícula horizontal para porcentajes
  [0, 20, 40, 60, 80, 100].forEach(pct => {
    const y = padT + chartH - (pct / 100) * chartH;
    svg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--line)" stroke-width="1" stroke-dasharray="${pct === 0 ? '0' : '3 3'}"/>`;
    svg += `<text x="${W - padR + 6}" y="${y + 4}" font-size="10" fill="var(--muted)">${pct}%</text>`;
  });

  // Marcas eje izquierdo (repasos)
  const leftSteps = [0, Math.round(maxReviews / 2), maxReviews];
  leftSteps.forEach(val => {
    const y = padT + chartH - (val / maxReviews) * chartH;
    svg += `<text x="${padL - 8}" y="${y + 4}" font-size="10" fill="var(--muted)" text-anchor="end">${val}</text>`;
  });

  const colW = chartW / 24;
  const barW = Math.max(6, colW * 0.45);

  list.forEach((it, h) => {
    const x = padL + h * colW + (colW - barW) / 2;
    const revs = it.reviews || 0;
    const rate = it.rate;

    // Fondo / barra de aciertos % conectado al eje derecho
    if (rate != null && rate > 0) {
      const bgH = (rate / 100) * chartH;
      const bgY = padT + chartH - bgH;
      svg += `<rect x="${x - 3}" y="${bgY}" width="${barW + 6}" height="${bgH}" fill="#38bdf8" opacity="0.25" rx="2"><title>${h}:00 - ${h}:59: ${rate}% de aciertos</title></rect>`;
    }

    // Barra azul de repasos conectada al eje izquierdo
    if (revs > 0) {
      const barH = (revs / maxReviews) * chartH;
      const y = padT + chartH - barH;
      svg += `<rect x="${x}" y="${y}" width="${barW}" height="${Math.max(2, barH)}" fill="#0284c7" rx="2"><title>${h}:00 - ${h}:59: ${revs} repasos (${rate != null ? rate + '%' : '—'} de aciertos)</title></rect>`;
    }

    // Marca eje X
    svg += `<text x="${x + barW / 2}" y="${H - 12}" font-size="9" fill="var(--muted)" text-anchor="middle">${h}</text>`;
  });

  svg += `</svg>`;
  return svg;
}

function renderButtonsChart(buttonData) {
  const bd = buttonData || { learning: {1:0,2:0,3:0,4:0}, young: {1:0,2:0,3:0,4:0}, mature: {1:0,2:0,3:0,4:0} };
  const categories = [
    { key: 'learning', label: 'Aprendiendo' },
    { key: 'young', label: 'Jóvenes' },
    { key: 'mature', label: 'Maduras' }
  ];
  const btnDefs = [
    { num: 1, label: 'Otra vez', color: '#b91c1c' },
    { num: 2, label: 'Difícil', color: '#f59e0b' },
    { num: 3, label: 'Bien', color: '#16a34a' },
    { num: 4, label: 'Fácil', color: '#0284c7' }
  ];

  let maxCount = 0;
  categories.forEach(cat => {
    btnDefs.forEach(btn => {
      maxCount = Math.max(maxCount, bd[cat.key]?.[btn.num] || 0);
    });
  });
  if (maxCount < 5) maxCount = 5;

  const W = 620, H = 220;
  const padL = 40, padR = 20, padT = 20, padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  let svg = `<svg viewBox="0 0 ${W} ${H}" class="stats-chart-svg" style="max-height:220px">`;

  // Líneas guía horizontales
  const steps = [0, Math.round(maxCount / 2), maxCount];
  steps.forEach(val => {
    const y = padT + chartH - (val / maxCount) * chartH;
    svg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--line)" stroke-width="1" stroke-dasharray="${val === 0 ? '0' : '3 3'}"/>`;
    svg += `<text x="${padL - 8}" y="${y + 4}" font-size="10" fill="var(--muted)" text-anchor="end">${val}</text>`;
  });

  const groupW = chartW / categories.length;
  const barW = 16, barGap = 4;
  const totalBarsW = 4 * barW + 3 * barGap;

  categories.forEach((cat, cIdx) => {
    const groupX = padL + cIdx * groupW;
    const startX = groupX + (groupW - totalBarsW) / 2;

    btnDefs.forEach((btn, bIdx) => {
      const val = bd[cat.key]?.[btn.num] || 0;
      const bx = startX + bIdx * (barW + barGap);
      if (val > 0) {
        const barH = (val / maxCount) * chartH;
        const by = padT + chartH - barH;
        svg += `<rect x="${bx}" y="${by}" width="${barW}" height="${Math.max(2, barH)}" fill="${btn.color}" rx="2"><title>${cat.label} · Botón ${btn.num} (${btn.label}): ${val} veces</title></rect>`;
      }
    });

    // Etiqueta de la categoría en eje X
    svg += `<text x="${groupX + groupW / 2}" y="${H - 14}" font-size="12" font-weight="600" fill="var(--text)" text-anchor="middle">${cat.label}</text>`;
  });

  svg += `</svg>`;

  const legend = `
    <div class="stats-legend">
      <span class="stats-legend-item"><span class="stats-legend-box" style="background:#b91c1c"></span> 1 · Otra vez</span>
      <span class="stats-legend-item"><span class="stats-legend-box" style="background:#f59e0b"></span> 2 · Difícil</span>
      <span class="stats-legend-item"><span class="stats-legend-box" style="background:#16a34a"></span> 3 · Bien</span>
      <span class="stats-legend-item"><span class="stats-legend-box" style="background:#0284c7"></span> 4 · Fácil</span>
    </div>`;

  return svg + legend;
}

function renderAddedChart(addedData) {
  if (!addedData || addedData.total === 0 || !addedData.series || !addedData.series.length) {
    return `<div class="stats-no-data">SIN DATOS</div>`;
  }
  return `
    <div class="stats-chart-wrapper">
      ${renderSvgBarChart(addedData.series, 'count', 'date', '#0284c7')}
    </div>
    <div style="text-align:center;font-size:13px;color:var(--muted);font-weight:600;margin-top:8px">
      Total de tarjetas añadidas en este período: <strong style="color:var(--text)">${num(addedData.total)}</strong>
    </div>`;
}

function statistics(){
  if(!detailedStats) {
    loadDetailedStats().then(render);
    return `${heading('Estadísticas','Analizando tu ritmo de estudio…')}<div class="empty">${icon('chart')}<h3>Cargando tus estadísticas…</h3><p>Calculando repasos, pronósticos y retención.</p></div>`;
  }

  const s = detailedStats;
  const curDeck = data.decks.find(d => String(d.id) === String(statsDeck));
  const forecastList = statsForecastRange === 30 ? s.forecast.days30 : statsForecastRange === 90 ? s.forecast.days90 : s.forecast.days365;
  const historyList = statsHistoryRange === 30 ? s.history.days30 : statsHistoryRange === 90 ? s.history.days90 : s.history.days365;
  const histValKey = statsHistoryMetric === 'reviews' ? 'reviews' : 'timeMinutes';

  const scopeSelector = `<select id="stats-deck-select" class="stats-scope-select" aria-label="Seleccionar mazo para estadísticas">
    <option value="all" ${statsDeck==='all'?'selected':''}>Toda la colección (${data.decks.length} mazos)</option>
    ${data.decks.map(d => `<option value="${d.id}" ${String(d.id)===String(statsDeck)?'selected':''}>${esc(d.name)}</option>`).join('')}
  </select>`;

  return `${heading('Estadísticas de Aprendizaje', 'Métricas detalladas, pronóstico de repaso y análisis de retención.', button('Imprimir / Guardar PDF', 'print-stats', 'download', 'btn-quiet') + button('Hacer un repaso', 'study', 'arrow', 'btn-primary'))}

  <div class="stats-container">
    <div class="stats-header-bar">
      <div class="stats-controls">
        <label style="display:flex;align-items:center;gap:8px">
          <span style="font-weight:700;color:var(--text)">ÁMBITO:</span>
          ${scopeSelector}
        </label>
      </div>
      <div style="font-size:13px;color:var(--muted);font-weight:600">
        ${curDeck ? `${esc(curDeck.name)} · ${num(curDeck.total)} tarjetas` : `Colección completa · ${num(s.cardBreakdown.total)} tarjetas`}
      </div>
    </div>

    <!-- 1. HOY -->
    <section class="stats-card">
      <div class="stats-card-header">
        <div>
          <h2>Hoy</h2>
          <p>Tu actividad de estudio registrada el día de hoy.</p>
        </div>
      </div>
      ${s.today.cardsStudied === 0 ? `
        <p style="text-align:center;padding:16px 0;color:var(--muted);font-size:15px;margin:0">
          Hoy no has estudiado ninguna tarjeta en esta selección.
        </p>
      ` : `
        <div class="stats-metric-grid">
          <div class="stats-metric-box">
            <div class="metric-num" style="color:var(--orange)">${num(s.today.cardsStudied)}</div>
            <div class="metric-label">Tarjetas repasadas</div>
          </div>
          <div class="stats-metric-box">
            <div class="metric-num">${s.today.timeMinutes} min</div>
            <div class="metric-label">Tiempo total</div>
          </div>
          <div class="stats-metric-box">
            <div class="metric-num">${s.today.avgSecondsPerCard} s</div>
            <div class="metric-label">Velocidad media / carta</div>
          </div>
          <div class="stats-metric-box">
            <div class="metric-num" style="color:#16a34a">${s.today.retentionToday != null ? s.today.retentionToday + '%' : '—'}</div>
            <div class="metric-label">Aciertos hoy</div>
          </div>
        </div>
        <p class="small muted" style="margin:0;text-align:center">
          ${s.today.reviewCount} repasos sobre tarjetas aprendidas · ${s.today.learnCount} pasos en tarjetas nuevas/aprendizaje.
        </p>
      `}
    </section>

    <!-- 2. PRONÓSTICO -->
    <section class="stats-card">
      <div class="stats-card-header">
        <div>
          <h2>Pronóstico</h2>
          <p>El número de repasos programados en el futuro.</p>
        </div>
        <div class="stats-pills">
          <label style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;margin-right:8px;cursor:pointer">
            <input type="checkbox" id="chk-forecast-cumul" ${statsForecastCumul?'checked':''} data-action="stats-forecast-cumul">
            Acumulación
          </label>
          ${[30, 90, 365].map(d => `<button class="stats-pill ${statsForecastRange===d?'active':''}" data-action="stats-forecast-range" data-val="${d}">${d===30?'1 mes':d===90?'3 meses':'1 año'}</button>`).join('')}
        </div>
      </div>
      <div class="stats-chart-wrapper">
        ${renderSvgBarChart(forecastList, 'due', 'day', '#16a34a', statsForecastCumul)}
      </div>
      <div class="stats-metric-grid">
        <div class="stats-metric-box">
          <div class="metric-num">${num(statsForecastRange===30?s.forecast.total30:statsForecastRange===90?s.forecast.total90:s.forecast.total365)}</div>
          <div class="metric-label">Total programado</div>
        </div>
        <div class="stats-metric-box">
          <div class="metric-num">${s.forecast.avgDaily30} / día</div>
          <div class="metric-label">Promedio de revisiones</div>
        </div>
        <div class="stats-metric-box">
          <div class="metric-num">${num(s.forecast.dueTomorrow)}</div>
          <div class="metric-label">Programadas para mañana</div>
        </div>
        <div class="stats-metric-box">
          <div class="metric-num">${num(s.forecast.dailyLoad)}</div>
          <div class="metric-label">Carga de hoy</div>
        </div>
      </div>
    </section>

    <!-- 3. CALENDARIO -->
    <section class="stats-card">
      <div class="stats-card-header">
        <div>
          <h2>Calendario</h2>
          <p>Constancia de repasos a lo largo de las 52 semanas del año.</p>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <button class="btn btn-quiet" data-action="cal-prev-year" style="padding:4px 8px" title="Año anterior">‹</button>
          <strong style="font-size:15px">${s.calendar.year}</strong>
          <button class="btn btn-quiet" data-action="cal-next-year" style="padding:4px 8px" title="Año siguiente">›</button>
        </div>
      </div>
      ${renderCalendarHeatmap(s.calendar)}
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:12px;color:var(--muted);border-top:1px solid var(--line);padding-top:10px">
        <span><strong>${s.calendar.daysStudied}</strong> días con repasos en ${s.calendar.year} · <strong>${num(s.calendar.totalReviews)}</strong> repasos registrados</span>
        <div class="activity-legend" style="margin:0">
          Menos <i style="background:var(--bg);border:1px solid var(--line)"></i><i style="background:#fedac4"></i><i style="background:#f7ad82"></i><i style="background:#ea6c38"></i><i style="background:#b84617"></i> Más
        </div>
      </div>
    </section>

    <!-- 4. REPASOS (HISTORIAL) -->
    <section class="stats-card">
      <div class="stats-card-header">
        <div>
          <h2>Repasos</h2>
          <p>El número de preguntas que has respondido en el pasado.</p>
        </div>
        <div class="stats-pills">
          <div class="segmented" style="margin-right:8px">
            <button class="${statsHistoryMetric==='reviews'?'active':''}" data-action="stats-history-metric" data-val="reviews">Preguntas</button>
            <button class="${statsHistoryMetric==='time'?'active':''}" data-action="stats-history-metric" data-val="time">Tiempo</button>
          </div>
          ${[30, 90, 365].map(d => `<button class="stats-pill ${statsHistoryRange===d?'active':''}" data-action="stats-history-range" data-val="${d}">${d===30?'1 mes':d===90?'3 meses':'1 año'}</button>`).join('')}
        </div>
      </div>
      <div class="stats-chart-wrapper">
        ${renderSvgBarChart(historyList, histValKey, 'daysAgo', '#f97316')}
      </div>
      <div class="stats-metric-grid">
        <div class="stats-metric-box">
          <div class="metric-num">${s.history.daysStudied30} <small style="font-size:12px;color:var(--muted)">(${s.history.pctDaysStudied30}%)</small></div>
          <div class="metric-label">Días estudiados</div>
        </div>
        <div class="stats-metric-box">
          <div class="metric-num">${num(s.history.totalReviews30)}</div>
          <div class="metric-label">Total repasos</div>
        </div>
        <div class="stats-metric-box">
          <div class="metric-num">${s.history.avgReviewsPerDay30} / día</div>
          <div class="metric-label">Promedio global</div>
        </div>
        <div class="stats-metric-box">
          <div class="metric-num">${s.history.avgReviewsPerStudiedDay30} / día</div>
          <div class="metric-label">Promedio en días activos</div>
        </div>
      </div>
    </section>

    <!-- 5. CONTEO DE TARJETAS -->
    <section class="stats-card">
      <div class="stats-card-header">
        <div>
          <h2>Conteo de Tarjetas</h2>
          <p>Distribución de estados en la colección o mazo seleccionado.</p>
        </div>
      </div>
      <div class="stats-donut-container">
        <div style="position:relative;width:160px;height:160px">
          ${renderSvgDonut(s.cardBreakdown)}
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none">
            <strong style="font-size:18px;display:block;color:var(--text)">${num(s.cardBreakdown.total)}</strong>
            <span style="font-size:10px;text-transform:uppercase;color:var(--muted);letter-spacing:1px;font-weight:700">Tarjetas</span>
          </div>
        </div>
        <table class="stats-breakdown-table">
          <tbody>
            ${[
              s.cardBreakdown.new,
              s.cardBreakdown.learning,
              s.cardBreakdown.relearning,
              s.cardBreakdown.young,
              s.cardBreakdown.mature,
              s.cardBreakdown.suspended,
              s.cardBreakdown.buried
            ].map(row => `
              <tr>
                <td><span class="stats-color-dot" style="background:${row.color}"></span><strong>${row.label}</strong></td>
                <td style="text-align:right;font-weight:700">${num(row.count)}</td>
                <td style="text-align:right;color:var(--muted);width:80px">${row.pct}%</td>
              </tr>
            `).join('')}
            <tr style="border-top:2px solid var(--line);font-weight:800">
              <td>Tarjetas totales</td>
              <td style="text-align:right">${num(s.cardBreakdown.total)}</td>
              <td style="text-align:right">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 6. INTERVALOS Y FACILIDAD -->
    <div class="two-col" style="gap:24px">
      <section class="stats-card" style="margin:0">
        <div class="stats-card-header">
          <div>
            <h2>Intervalos de repaso</h2>
            <p>Duración antes del próximo repaso.</p>
          </div>
        </div>
        ${s.intervals.totalReviewCards === 0 ? `
          <div style="text-align:center;padding:30px 0;color:var(--muted);font-weight:600">Aún no hay tarjetas graduadas</div>
        ` : `
          <div class="stats-chart-wrapper">
            ${renderSvgBarChart(s.intervals.distribution, 'count', 'interval', '#3b82f6')}
          </div>
          <div class="stats-metric-grid" style="grid-template-columns:1fr 1fr">
            <div class="stats-metric-box">
              <div class="metric-num">${s.intervals.avgInterval}d</div>
              <div class="metric-label">Intervalo promedio</div>
            </div>
            <div class="stats-metric-box">
              <div class="metric-num">${s.intervals.maxInterval}d</div>
              <div class="metric-label">Intervalo máximo</div>
            </div>
          </div>
        `}
      </section>

      <section class="stats-card" style="margin:0">
        <div class="stats-card-header">
          <div>
            <h2>Facilidad de la Tarjeta</h2>
            <p>Factor de facilidad en repetición espaciada.</p>
          </div>
        </div>
        ${s.ease.totalCardsWithEase === 0 ? `
          <div style="text-align:center;padding:30px 0;color:var(--muted);font-weight:600">SIN DATOS</div>
        ` : `
          <div class="stats-chart-wrapper">
            ${renderSvgBarChart(s.ease.distribution, 'count', 'factor', '#a855f7')}
          </div>
          <div class="stats-metric-grid" style="grid-template-columns:1fr 1fr">
            <div class="stats-metric-box">
              <div class="metric-num">${s.ease.avgEase}%</div>
              <div class="metric-label">Facilidad media</div>
            </div>
            <div class="stats-metric-box">
              <div class="metric-num">${num(s.ease.totalCardsWithEase)}</div>
              <div class="metric-label">Tarjetas evaluadas</div>
            </div>
          </div>
        `}
      </section>
    </div>

    <!-- 7. RETENCIÓN ACTUAL -->
    <section class="stats-card">
      <div class="stats-card-header">
        <div>
          <h2>Retención actual</h2>
          <p>Tasa de tarjetas acertadas, que tengan un intervalo de 1 día o más.</p>
        </div>
      </div>
      <div class="stats-radio-group">
        <label class="stats-radio-label">
          <input type="radio" name="ret-type" value="young" ${statsRetentionType==='young'?'checked':''} data-action="stats-ret-type">
          Jóvenes
        </label>
        <label class="stats-radio-label">
          <input type="radio" name="ret-type" value="mature" ${statsRetentionType==='mature'?'checked':''} data-action="stats-ret-type">
          Maduras
        </label>
        <label class="stats-radio-label">
          <input type="radio" name="ret-type" value="all" ${statsRetentionType==='all'?'checked':''} data-action="stats-ret-type">
          Todas
        </label>
      </div>
      <div class="stats-retention-table-wrap">
        <table class="stats-retention-table">
          <thead>
            <tr>
              <th></th>
              <th class="stats-col-young" style="${statsRetentionType==='mature'?'opacity:0.35':''}">Jóvenes</th>
              <th class="stats-col-mature" style="${statsRetentionType==='young'?'opacity:0.35':''}">Maduras</th>
              <th style="${statsRetentionType!=='all'?'opacity:0.35':''}">Tarjetas totales</th>
              <th>Recuento</th>
            </tr>
          </thead>
          <tbody>
            ${(s.retentionTable || []).map(r => `
              <tr>
                <td>${r.label}</td>
                <td class="stats-col-young ${r.young==='N/A'?'stats-val-na':''}" style="${statsRetentionType==='mature'?'opacity:0.35':''}">${r.young}</td>
                <td class="stats-col-mature ${r.mature==='N/A'?'stats-val-na':''}" style="${statsRetentionType==='young'?'opacity:0.35':''}">${r.mature}</td>
                <td style="font-weight:700;${statsRetentionType!=='all'?'opacity:0.35':''}" class="${r.total==='N/A'?'stats-val-na':''}">${r.total}</td>
                <td style="font-weight:700">${num(r.count)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="stats-metric-grid" style="grid-template-columns:repeat(3,1fr)">
        <div class="stats-metric-box">
          <div class="metric-num" style="color:#16a34a">${s.retention.young.rate != null ? s.retention.young.rate + '%' : '—'}</div>
          <div class="metric-label">Jóvenes (intervalo &lt; 21d)</div>
          <small class="muted">${s.retention.young.correct} / ${s.retention.young.total} aciertos</small>
        </div>
        <div class="stats-metric-box">
          <div class="metric-num" style="color:#15803d">${s.retention.mature.rate != null ? s.retention.mature.rate + '%' : '—'}</div>
          <div class="metric-label">Maduras (intervalo ≥ 21d)</div>
          <small class="muted">${s.retention.mature.correct} / ${s.retention.mature.total} aciertos</small>
        </div>
        <div class="stats-metric-box">
          <div class="metric-num" style="color:var(--orange)">${s.retention.all.rate != null ? s.retention.all.rate + '%' : '—'}</div>
          <div class="metric-label">Todas las tarjetas</div>
          <small class="muted">${s.retention.all.correct} / ${s.retention.all.total} aciertos</small>
        </div>
      </div>
    </section>

    <!-- 8. DISTRIBUCIÓN HORARIA -->
    <section class="stats-card">
      <div class="stats-card-header">
        <div>
          <h2>Distribución horaria</h2>
          <p>Porcentaje de repasos correctos a lo largo del día.</p>
        </div>
        <div class="stats-pills">
          ${[30, 90, 365].map(d => `<button class="stats-pill ${statsHourlyRange===d?'active':''}" data-action="stats-hourly-range" data-val="${d}">${d===30?'1 mes':d===90?'3 meses':'1 año'}</button>`).join('')}
        </div>
      </div>
      <div class="stats-chart-wrapper">
        ${renderHourlyChart(s.hourly ? s.hourly['days' + statsHourlyRange] : [])}
      </div>
    </section>

    <!-- 9. BOTONES DE RESPUESTA -->
    <section class="stats-card">
      <div class="stats-card-header">
        <div>
          <h2>Botones de respuesta</h2>
          <p>El número de veces que has presionado cada botón.</p>
        </div>
        <div class="stats-pills">
          ${[30, 90, 365].map(d => `<button class="stats-pill ${statsButtonsRange===d?'active':''}" data-action="stats-buttons-range" data-val="${d}">${d===30?'1 mes':d===90?'3 meses':'1 año'}</button>`).join('')}
        </div>
      </div>
      <div class="stats-chart-wrapper">
        ${renderButtonsChart(s.buttonPresses ? s.buttonPresses['days' + statsButtonsRange] : null)}
      </div>
    </section>

    <!-- 10. AÑADIDAS -->
    <section class="stats-card">
      <div class="stats-card-header">
        <div>
          <h2>Añadidas</h2>
          <p>El número de tarjetas nuevas que has añadido.</p>
        </div>
        <div class="stats-pills">
          ${[30, 90, 365, 'all'].map(d => `<button class="stats-pill ${statsAddedRange===d?'active':''}" data-action="stats-added-range" data-val="${d}">${d===30?'1 mes':d===90?'3 meses':d===365?'1 año':'vida del mazo'}</button>`).join('')}
        </div>
      </div>
      ${renderAddedChart(s.addedCards ? (statsAddedRange==='all' ? s.addedCards.all : s.addedCards['days' + statsAddedRange]) : null)}
    </section>

    <!-- 11. PUNTOS DÉBILES Y SANGUIJUELAS (LEECHES) -->
    <section class="stats-card">
      <div class="stats-card-header">
        <div>
          <h2>Puntos débiles y sanguijuelas (Leeches)</h2>
          <p>Identificación automática de tarjetas con repetidos fallos, retención crítica o preguntas sobrecargadas.</p>
        </div>
        <span class="count">${(s.weakCards||[]).length} detectadas</span>
      </div>
      ${(!s.weakCards || !s.weakCards.length) ? `
        <div style="text-align:center;padding:32px 16px;color:var(--muted)">
          <div style="font-size:32px;margin-bottom:8px">🎉</div>
          <strong style="color:var(--text);font-size:16px">¡Sin puntos débiles críticos!</strong>
          <p style="margin:4px 0 0;font-size:13px">Todas las tarjetas de esta selección mantienen un buen ritmo de retención y pocos fallos.</p>
        </div>
      ` : `
        <div class="weak-cards-list">
          ${s.weakCards.map(w => `
            <div class="weak-card-item">
              <div class="weak-card-header">
                <div>
                  <span class="weak-badge ${w.isLeech ? 'weak-badge-leech' : w.ease < 180 ? 'weak-badge-crit' : 'weak-badge-long'}">
                    ${w.isLeech ? `🔥 SANGUIJUELA · ${w.lapses} FALLOS` : w.ease < 180 ? `⚠️ RETENCIÓN CRÍTICA (${w.ease}%)` : '📝 PREGUNTA LARGA'}
                  </span>
                  <strong style="margin-left:8px;font-size:13px;color:var(--muted)">${esc(w.deckName)}</strong>
                </div>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-quiet" data-action="edit-card" data-id="${w.id}" style="font-size:12px;padding:4px 10px">${icon('edit')} Editar</button>
                  <button class="btn btn-quiet" data-action="reset-card" data-id="${w.id}" style="font-size:12px;padding:4px 10px;color:var(--orange)">Reiniciar progreso</button>
                </div>
              </div>
              <div class="weak-card-question">${esc(w.questionSnippet)}</div>
              <div class="weak-recommendation">💡 <strong>Recomendación:</strong> ${esc(w.recommendation)}</div>
            </div>
          `).join('')}
        </div>
      `}
    </section>
  </div>`;
}
function localDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function backupsView(){return `${heading('Tu aprendizaje, a buen recaudo.','Copias de tu colección con tarjetas, archivos multimedia y progreso.',button('Crear copia ahora','backup','archive','btn-primary','data-mutate'))}<div class="two-col"><section class="panel"><h2>Copias guardadas en este equipo</h2><p>Se crea una copia al iniciar la app y antes de importar archivos.</p>${backupList.length?backupList.map(b=>`<div class="backup-row">${icon('archive')}<div><strong>${esc(b.name)}</strong><small>${esc(b.date||'')} · ${num(Math.ceil((b.size||0)/1024))} KB</small></div><a class="btn" href="/api/backups/${encodeURIComponent(b.name)}" download aria-label="Descargar ${esc(b.name)}">${icon('download')}</a></div>`).join(''):'<p class="info-box">Crea tu primera copia para llevarte tu biblioteca a otro lugar.</p>'}</section><section class="panel"><span class="stat-icon">${icon('shield')}</span><h2 class="mt">Una copia también puede viajar.</h2><p>Descarga tu colección como <strong>.colpkg</strong> y guárdala en un disco externo o llévatela a otro equipo.</p><a class="btn" href="/api/export" download>${icon('download')}Exportar colección</a><p class="small">Para añadir el contenido de una copia a tu biblioteca, impórtala. Las notas se combinan; no se reemplaza toda la colección.</p>${button('Importar una copia','import','upload','btn-quiet')}</section></div>`;}
function settingsView(){return `${heading('Hazlo a tu manera.','Pequeños ajustes para tu rutina de aprendizaje.')}<div class="two-col"><section class="panel"><h2>Tu experiencia</h2><form id="settings-form"><div class="settings-row"><div><strong>Meta diaria</strong><p>Número de repasos que quieres completar al día.</p></div><input id="daily-goal" aria-label="Meta diaria de repasos" type="number" min="1" max="1000" value="${data.settings.dailyGoal||20}" required></div><div class="settings-row"><div><strong>Apariencia</strong><p>Elige el ambiente que te ayude a concentrarte.</p></div>${button(theme==='dark'?'Oscuro':'Claro','theme',theme==='dark'?'moon':'sun')}</div><div class="settings-row"><div><strong>Diseño de Tarjetas</strong><p>Personaliza el estilo visual, tipografía y colores.</p></div>${button('Personalizar estilo','open-templates','edit')}</div><div class="form-footer"><button class="btn btn-primary" data-mutate>Guardar ajustes</button></div></form></section><section class="panel"><h2>Tu biblioteca es tuya.</h2><p>Las tarjetas y los repasos se guardan automáticamente en este equipo. Puedes cerrar la pestaña y continuar cuando quieras.</p><p class="info-box">Carpeta de datos: <strong>${esc(data.storage?.dataDir||'data')}</strong><br>Los datos no dependen de la memoria del navegador.</p><p class="small">Lumcards es una aplicación personal e independiente de aprendizaje y práctica con tarjetas.</p>${button('Ayuda y atajos','help','help')}</section></div>`;}

let syncInfo = null;
async function loadSyncInfo(){
  try {
    syncInfo = await api('sync/info', undefined, 'GET');
  } catch(e) {
    console.warn('Sync info error:', e);
  }
}

function syncView(){
  const s = syncInfo || { localIp: '...', port: 8765, url: 'http://...', totalCards: data.cards?.length||0, totalDecks: data.decks?.length||0 };
  const lastP2p = s.lastP2P ? `${formatFullSpanishDate(s.lastP2P.iso.slice(0, 10))} · ${s.lastP2P.added || 0} tarjetas añadidas de ${esc(s.lastP2P.peer)}` : 'Ninguna sincronización P2P reciente';
  const lastExport = s.lastExport ? `${formatFullSpanishDate(s.lastExport.iso.slice(0, 10))} · ${s.lastExport.filename} (${Math.round((s.lastExport.sizeBytes||0)/1024)} KB)` : 'Aún no has exportado ningún paquete';

  const syncMgr = window.LumcardsSync;
  const fbUser = syncMgr?.firebase?.getUser();
  const driveUser = syncMgr?.drive?.getUser();

  return `
  <div class="sync-container">
    <div class="sync-hero">
      <div class="sync-hero-content">
        <div class="sync-hero-kicker">${icon('cloud')} Sincronización Tri-Storage · Nube, Drive y Local</div>
        <h1 class="sync-hero-title">Tus tarjetas siempre contigo en Web, Android y PC</h1>
        <p class="sync-hero-desc">Sincroniza tus repasos en tiempo real con la nube de Firebase, guarda tus libros y fotos en los 15 GB gratuitos de tu propio Google Drive, y mantén siempre una copia offline en tu dispositivo sin costos ocultos.</p>
      </div>
      <div class="sync-hero-badge">
        <strong>${num(s.totalCards || data.counts?.totalCards || data.cards.length)}</strong>
        <span>Tarjetas listas</span>
      </div>
    </div>

    <div class="sync-sovereign-banner">
      ${icon('shield')}
      <div><strong>Arquitectura Soberana Multiplataforma:</strong> Tus datos te pertenecen. Los repasos se sincronizan al instante vía Firebase, mientras que los mazos grandes se almacenan en tu propio Google Drive o en la memoria interna de tu teléfono/PC. Cero costos de servidor para siempre.</div>
    </div>

    <div class="sync-grid">
      <!-- COLUMNA 1: NUBE FIREBASE & GOOGLE DRIVE -->
      <div style="display:flex;flex-direction:column;gap:24px">
        <!-- 1. NUBE LUMCARDS (FIREBASE SYNC) -->
        <section class="sync-card">
          <div class="sync-card-header">
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span class="badge" style="background:rgba(99,102,241,0.15);color:var(--primary,#6366f1);font-weight:700">FIREBASE CLOUD</span>
                <span class="small muted">Repasos y Rachas en Vivo</span>
              </div>
              <h2 class="sync-card-title">${icon('cloud')} Cuenta en la Nube (Firebase)</h2>
              <p class="sync-card-desc">Sincroniza tus sesiones de estudio, rachas diarias, estadísticas y preferencias entre tu celular, laptop y navegador.</p>
            </div>
          </div>

          <div style="background:var(--bg);padding:14px;border-radius:12px;border:1px solid var(--line);margin:14px 0">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <strong style="font-size:14px;display:block">${fbUser ? esc(fbUser.name || fbUser.email) : 'Modo Invitado Local'}</strong>
                <span class="small muted">${fbUser ? 'Sesión iniciada con ' + esc(fbUser.email) : 'Inicia sesión para sincronizar automáticamente con otros dispositivos'}</span>
              </div>
              <span class="badge" style="${fbUser ? 'background:rgba(16,185,129,0.15);color:#10b981' : 'background:rgba(100,116,139,0.15);color:#64748b'}">
                ${fbUser ? '● En línea' : '○ Modo local'}
              </span>
            </div>
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap">
            ${fbUser ? `
              <button class="btn btn-primary" data-action="firebase-sync-now">${icon('cloud')} Sincronizar mi progreso ahora</button>
              <button class="btn btn-quiet" data-action="firebase-logout">Cerrar sesión</button>
            ` : `
              <button class="btn btn-primary" data-action="firebase-login-modal">${icon('plus')} Iniciar sesión / Registrarme</button>
            `}
          </div>
        </section>

        <!-- 2. ALMACENAMIENTO DE MAZOS EN GOOGLE DRIVE PERSONAL -->
        <section class="sync-card">
          <div class="sync-card-header">
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span class="badge" style="background:rgba(245,158,11,0.15);color:#d97706;font-weight:700">GOOGLE DRIVE</span>
                <span class="small muted">15 GB Gratis para Mazos y Fotos</span>
              </div>
              <h2 class="sync-card-title">${icon('archive')} Almacenamiento en tu Google Drive</h2>
              <p class="sync-card-desc">Tus libros con fotos de alta resolución y grabaciones de audio se guardan en tu propia cuenta de Google Drive sin ocupar servidores externos.</p>
            </div>
          </div>

          <div style="background:var(--bg);padding:14px;border-radius:12px;border:1px solid var(--line);margin:14px 0">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <strong style="font-size:14px;display:block">${driveUser ? esc(driveUser.name || driveUser.email) : 'Google Drive no conectado'}</strong>
                <span class="small muted">${driveUser ? 'Conectado a ' + esc(driveUser.email) + ' · Carpeta «Lumcards Mazos y Estudio»' : 'Conecta tu cuenta para respaldar tus libros y fotos gratis'}</span>
              </div>
              <span class="badge" style="${driveUser ? 'background:rgba(16,185,129,0.15);color:#10b981' : 'background:rgba(100,116,139,0.15);color:#64748b'}">
                ${driveUser ? '✓ Vinculado' : 'Sin vincular'}
              </span>
            </div>
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap">
            ${driveUser ? `
              <button class="btn btn-primary" data-action="drive-backup-now">${icon('upload')} Subir mis mazos a mi Google Drive</button>
              <button class="btn btn-quiet" data-action="drive-list-modal">${icon('download')} Descargar de mi Drive</button>
              <button class="btn btn-quiet" data-action="drive-disconnect">Desconectar</button>
            ` : `
              <button class="btn btn-primary" data-action="drive-connect">${icon('globe')} Conectar mi cuenta de Google Drive</button>
            `}
          </div>
        </section>
      </div>

      <!-- COLUMNA 2: ALMACENAMIENTO LOCAL Y ACCESO MÓVIL / APK -->
      <div style="display:flex;flex-direction:column;gap:24px">
        <!-- 3. ACCESO MÓVIL Y APK ANDROID -->
        <section class="sync-card">
          <div class="sync-card-header">
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;font-weight:700">ANDROID & WEB</span>
                <span class="small muted">Multiplataforma</span>
              </div>
              <h2 class="sync-card-title">${icon('globe')} Acceso Móvil (Wi-Fi y APK)</h2>
              <p class="sync-card-desc">Estudia en tu teléfono o tablet desde la cama o el sillón escaneando el código QR o instalando la versión móvil.</p>
            </div>
          </div>

          <div class="sync-qr-card-body">
            <div class="sync-qr-wrapper" id="sync-qr-box">
              ${s.qrSvg || '<div style="display:grid;place-items:center;height:100%;color:var(--muted)">Generando QR...</div>'}
            </div>
            <div class="sync-qr-info">
              <div style="font-size:11px;font-weight:700;color:var(--muted);letter-spacing:0.5px">ENLACE LOCAL WI-FI:</div>
              <div class="sync-url-pill">
                <span id="sync-url-text">${esc(s.url)}</span>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
                <button class="btn btn-primary" data-action="copy-sync-url">${icon('check')} Copiar enlace</button>
                <button class="btn btn-quiet" data-action="open-sync-mobile">${icon('globe')} Probar en navegador</button>
              </div>
              <ol class="sync-steps-list" style="margin-top:8px;font-size:12.5px">
                <li>Conecta tu móvil a la <strong>misma red Wi-Fi</strong>.</li>
                <li>Escanea el código QR con tu cámara o abre el enlace.</li>
                <li>En Android: pulsa «Instalar app» en el navegador para guardarla como APK PWA en tu pantalla de inicio.</li>
              </ol>
            </div>
          </div>
        </section>

        <!-- 4. ALMACENAMIENTO LOCAL EN DISPOSITIVO -->
        <section class="sync-card">
          <div class="sync-card-header">
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span class="badge" style="background:rgba(100,116,139,0.15);color:#64748b;font-weight:700">OFFLINE DISPOSITIVO</span>
                <span class="small muted">Respaldo Físico</span>
              </div>
              <h2 class="sync-card-title">${icon('archive')} Almacenamiento Local Offline</h2>
              <p class="sync-card-desc">Tus tarjetas se conservan siempre en el disco de tu PC o memoria de tu móvil para estudiar sin conexión a internet.</p>
            </div>
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn btn-primary" href="/api/sync/export" download>${icon('download')} Exportar paquete (.colpkg)</a>
            <button class="btn btn-quiet" data-action="pick-file">${icon('upload')} Importar paquete</button>
          </div>
          <div class="sync-history-badge" style="margin-top:10px">
            <span>Último paquete exportado:</span>
            <strong>${esc(lastExport)}</strong>
          </div>
        </section>
      </div>
    </div>
  </div>`;
}

function firebaseLoginModal(){
  showModal('Cuenta en la Nube · Firebase', 'Inicia sesión o regístrate para sincronizar tu progreso y rachas en tiempo real.', `
    <form id="firebase-auth-form">
      <div style="display:flex;gap:10px;margin-bottom:14px">
        <button type="button" class="btn btn-primary" id="fb-mode-login-btn" style="flex:1" onclick="window.setFbAuthMode('login')">Iniciar Sesión</button>
        <button type="button" class="btn btn-quiet" id="fb-mode-register-btn" style="flex:1" onclick="window.setFbAuthMode('register')">Crear Cuenta</button>
      </div>
      <input type="hidden" name="authMode" id="fb-auth-mode" value="login">
      <div id="fb-name-field" style="display:none">
        <label class="field">Nombre de usuario
          <input type="text" name="displayName" id="fb-auth-name" placeholder="Tu nombre">
        </label>
      </div>
      <label class="field">Correo electrónico
        <input type="email" name="email" id="fb-auth-email" placeholder="estudiante@ejemplo.com" required autofocus>
      </label>
      <label class="field">Contraseña
        <input type="password" name="password" id="fb-auth-pass" placeholder="••••••••" minlength="6" required>
      </label>
      <div class="info-box" id="fb-auth-info">
        Tus sesiones de estudio, rachas diarias y estadísticas se sincronizarán al instante entre todos tus dispositivos.
      </div>
      <div class="form-error" role="alert"></div>
      <div class="form-footer">
        ${button('Cancelar', 'close-modal')}
        <button class="btn btn-primary" data-mutate id="fb-auth-submit">${icon('cloud')} Iniciar Sesión</button>
      </div>
    </form>
  `);
}

window.setFbAuthMode = function(mode){
  const modeInput = document.getElementById('fb-auth-mode');
  const nameField = document.getElementById('fb-name-field');
  const submitBtn = document.getElementById('fb-auth-submit');
  const loginBtn = document.getElementById('fb-mode-login-btn');
  const regBtn = document.getElementById('fb-mode-register-btn');
  if (!modeInput) return;
  modeInput.value = mode;
  if (mode === 'register') {
    if (nameField) nameField.style.display = 'block';
    if (submitBtn) submitBtn.innerHTML = `${icon('plus')} Crear Cuenta`;
    if (loginBtn) loginBtn.className = 'btn btn-quiet';
    if (regBtn) regBtn.className = 'btn btn-primary';
  } else {
    if (nameField) nameField.style.display = 'none';
    if (submitBtn) submitBtn.innerHTML = `${icon('cloud')} Iniciar Sesión`;
    if (loginBtn) loginBtn.className = 'btn btn-primary';
    if (regBtn) regBtn.className = 'btn btn-quiet';
  }
};

function driveConnectModal(){
  showModal('Vincular tu Google Drive Personal', 'Guarda tus libros con fotos y audios en tus 15 GB gratuitos de Google Drive.', `
    <form id="drive-auth-form">
      <div class="info-box">
        <strong>15 GB Gratuitos · Cero Costos de Servidor:</strong><br>
        Tus archivos se guardan directamente en tu cuenta privada de Google en la carpeta segura <strong>«Lumcards Mazos y Estudio»</strong>. Nadie más tiene acceso a tus datos ni a tus libros.
      </div>
      <label class="field">Tu correo o nombre de cuenta Google
        <input type="email" name="email" id="drive-auth-email" placeholder="usuario@gmail.com" required autofocus>
      </label>
      <label class="field">Google OAuth Client ID (Opcional si usas tu propia API Key)
        <input type="text" name="clientId" id="drive-auth-client-id" placeholder="apps.googleusercontent.com (opcional)">
      </label>
      <div class="form-error" role="alert"></div>
      <div class="form-footer">
        ${button('Cancelar', 'close-modal')}
        <button class="btn btn-primary" data-mutate>${icon('check')} Conectar Google Drive</button>
      </div>
    </form>
  `);
}

async function driveListModal(){
  loading(true);
  try {
    const files = await window.LumcardsSync?.drive?.listFiles();
    const hasFiles = files && files.length > 0;
    showModal('Mazos en tu Google Drive', 'Paquetes de libros y tarjetas respaldados en tu carpeta «Lumcards Mazos y Estudio».', `
      <div style="max-height:360px;overflow-y:auto;margin:12px 0">
        ${!hasFiles ? `
          <div class="empty-state" style="padding:24px;text-align:center">
            <p class="muted">Aún no tienes mazos respaldados en Google Drive.</p>
            <p class="small muted">Usa el botón «Subir mis mazos a mi Google Drive» para crear tu primer respaldo.</p>
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:8px">
            ${files.map(f => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg);border:1px solid var(--line);border-radius:8px">
                <div>
                  <strong style="font-size:13.5px;display:block">${esc(f.name)}</strong>
                  <span class="small muted">${f.size ? Math.round(Number(f.size) / 1024) + ' KB' : 'Archivo'} · ${f.modifiedTime ? formatFullSpanishDate(f.modifiedTime.slice(0, 10)) : ''}</span>
                </div>
                <button class="btn btn-quiet" data-action="drive-download-file" data-file-id="${f.id}" data-filename="${esc(f.name)}">
                  ${icon('download')} Descargar e Importar
                </button>
              </div>
            `).join('')}
          </div>
        `}
      </div>
      <div class="form-footer">
        ${button('Cerrar', 'close-modal')}
      </div>
    `);
  } catch (err) {
    toast('Error al consultar Google Drive: ' + err.message, true);
  } finally {
    loading(false);
  }
}

function currentCard(){return reviewSession?.cards?.[0];}
function studyView(){
  const c=currentCard();
  if(!c){
    if(isExamSession){
      const scorePct = examResults.total > 0 ? Math.round((examResults.correct / examResults.total) * 100) : 0;
      const elapsedMin = Math.max(1, Math.round((Date.now() - examResults.timeStarted) / 60000));
      return `<section class="study-surface study-fullscreen" style="justify-content:center;align-items:center;padding:40px 20px;overflow-y:auto">
        <div class="exam-result-box">
          <div style="font-size:48px;margin-bottom:8px">🏆</div>
          <h2 style="font-size:26px;margin:0 0 6px">¡Examen completado!</h2>
          <p style="color:var(--muted);font-size:14px;margin:0 0 20px">Has completado tu sesión de práctica de <strong>${esc(examConfig?.modeLabel || 'Modo Examen')}</strong> en ${elapsedMin} min.</p>
          <div class="exam-score">${scorePct}%</div>
          <div class="exam-score-label">${examResults.correct} de ${examResults.total} respuestas acertadas</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0;text-align:center">
            <div style="background:var(--bg);padding:12px;border-radius:10px;border:1px solid var(--line)">
              <div style="font-size:22px;font-weight:800;color:#16a34a">${examResults.correct}</div>
              <div style="font-size:11px;color:var(--muted);font-weight:700">BIEN / FÁCIL</div>
            </div>
            <div style="background:var(--bg);padding:12px;border-radius:10px;border:1px solid var(--line)">
              <div style="font-size:22px;font-weight:800;color:#f59e0b">${examResults.hard}</div>
              <div style="font-size:11px;color:var(--muted);font-weight:700">DIFÍCIL</div>
            </div>
            <div style="background:var(--bg);padding:12px;border-radius:10px;border:1px solid var(--line)">
              <div style="font-size:22px;font-weight:800;color:#ef4444">${examResults.failed}</div>
              <div style="font-size:11px;color:var(--muted);font-weight:700">FALLOS</div>
            </div>
          </div>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-quiet" data-action="exit-study">${icon('back')} Volver a los mazos</button>
            <button class="btn btn-primary" data-action="repeat-exam">${icon('target')} Repetir examen</button>
            <button class="btn btn-dark" data-action="exam-modal">${icon('plus')} Nuevo examen</button>
          </div>
        </div>
      </section>`;
    }
    return empty('¡Todo al día por ahora!','Has completado tus repasos pendientes. Puedes explorar tus tarjetas o añadir nuevas cuando quieras.','back-decks','Volver a los mazos','check');
  }
  const d=data.decks.find(d=>String(d.id)===String(selectedDeck||c.deckId));
  const counts=reviewSession.counts||{};
  const newCount = counts.new || 0;
  const learnCount = counts.learn || 0;
  const dueCount = counts.due || 0;
  const intervals=reviewSession.intervals||['<1m','<10m','1d','4d'];

  const centerTopHeader = isExamSession ? `
    <div style="display:flex;align-items:center;gap:12px">
      <span class="exam-badge">${icon('target')} ${esc(examConfig?.modeLabel || 'EXAMEN')}</span>
      <span style="font-size:13px;font-weight:700;color:var(--muted)">${examResults.completed + 1} de ${examResults.total}</span>
    </div>
  ` : `
    <div class="anki-top-counts" title="Nuevas (azul) + En aprendizaje (rojo) + Por repasar (verde)"><span class="c-new" title="Nuevas">${newCount}</span><span class="c-sep">+</span><span class="c-learn" title="En aprendizaje">${learnCount}</span><span class="c-sep">+</span><span class="c-due" title="Por repasar">${dueCount}</span></div>
  `;

  return `<section class="study-surface study-fullscreen"><div class="anki-topbar"><div style="display:flex;gap:10px;align-items:center;min-width:0"><button class="anki-side-action" data-action="${isExamSession?'exit-study':'back-decks'}" title="Volver a los mazos (Esc)">${icon('back')}<span>Mazos</span></button><h2 title="${esc(d?.name||'Mazo')}">${isExamSession ? 'Modo Examen · ' + esc(d?.name||'Biblioteca') : esc(d?.name||'4000 Essential English Words')}</h2></div>${centerTopHeader}<div style="display:flex;gap:8px;align-items:center"><button class="icon-button" data-action="replay-audio" aria-label="Repetir audio" title="Repetir audio (R)" style="color:#94a3b8"><svg class="icon" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg></button><button class="icon-button" data-action="edit-card" data-id="${c.id}" aria-label="Editar tarjeta" title="Editar tarjeta (E)" style="color:#38bdf8">${icon('edit')}</button><button class="icon-button ${c.starred?'starred':''}" data-action="star" data-id="${c.id}" aria-label="Marcar como favorita" title="Marcar como favorita (S)" style="color:#94a3b8">${icon('star')}</button><button class="icon-button" data-action="toggle-fullscreen" aria-label="${isFullscreen?'Salir de pantalla completa':'Pantalla completa'}" title="Pantalla completa (F)" style="color:#94a3b8">${icon(isFullscreen?'shrink':'expand')}</button></div></div><div class="anki-card-container"><iframe class="anki-card-frame" id="study-frame" title="${revealed?'Respuesta':'Pregunta'} de la tarjeta" sandbox="allow-scripts allow-same-origin" allow="autoplay" referrerpolicy="no-referrer"></iframe></div><div class="anki-bottom-bar"><div style="display:flex;gap:8px;align-items:center"><button class="anki-side-action" data-action="edit-card" data-id="${c.id}" title="Editar tarjeta (E)" style="border-color:#0284c7;color:#38bdf8;display:inline-flex;align-items:center;gap:6px">${icon('edit')}<span>Editar (E)</span></button></div><div class="anki-study-center">${c.renderError?`<div style="display:flex;gap:10px;align-items:center"><button class="anki-side-action" data-action="skip-card">Omitir por hoy</button></div>`:revealed?`<div class="anki-rating-grid">${(isExamSession ? ['Fallo', 'Difícil', 'Bien', 'Fácil'] : ['Otra vez','Difícil','Bien','Fácil']).map((label,i)=>`<div class="anki-rate-col"><span class="anki-interval">${esc(intervals[i]||['<1m','<6m','<10m','3d'][i])}</span><button class="anki-rate-button rate-col-${i+1}" data-action="rate" data-rating="${i+1}" ${busy?'disabled':''}><span class="rate-name">${label}</span><kbd>${i+1}</kbd></button></div>`).join('')}</div>`:`<button class="anki-btn-show" data-action="reveal" id="btn-reveal-answer"><span>Mostrar respuesta</span><kbd>Espacio</kbd></button>`}</div><div style="display:flex;gap:8px;align-items:center"><button class="anki-side-action" data-action="replay-audio" title="Repetir audio (R)"><svg class="icon" style="width:15px;height:15px" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> Audio (R)</button></div></div></section>`;
}
function render(){document.body.classList.toggle('in-study',view==='study');const focused=$('#global-search')===document.activeElement,pos=$('#global-search')?.selectionStart;app.innerHTML=view==='study'?studyView():shell(view==='decks'?dashboard():view==='cards'?cardsView():view==='favorites'?cardsView(true):view==='stats'?statistics():view==='backups'?backupsView():view==='sync'?syncView():settingsView());if(view==='study'&&currentCard()){const c=currentCard();mountCard($('#study-frame'),c,revealed);const stateKey=`${c.id}_${revealed?'ans':'que'}`;if(lastPlayedKey!==stateKey){lastPlayedKey=stateKey;const audios=revealed?(c.answerAudios||[]):(c.questionAudios||[]);if(audios&&audios.length>0){AudioController.playList(audios);}else{AudioController.stop();}}}else{lastPlayedKey=null;AudioController.stop();}if(focused&&$('#global-search')){try{$('#global-search').focus();$('#global-search').setSelectionRange(pos,pos);}catch{}}}

function safeCardHTML(html){const template=document.createElement('template');template.innerHTML=html||'';const doc=template.content;doc.querySelectorAll('script,iframe,object,embed,form,input,button,textarea,select,base,link,meta').forEach(e=>e.remove());doc.querySelectorAll('audio').forEach(audio=>{let src=audio.getAttribute('src');if(!src){const source=audio.querySelector('source');if(source)src=source.getAttribute('src');}if(!src)return;try{const u=new URL(src,location.origin+'/media/');if(u.origin===location.origin&&u.pathname.startsWith('/media/'))src=u.href;}catch{}const btn=document.createElement('button');btn.type='button';btn.className='anki-audio-pill';btn.setAttribute('data-src',src);btn.setAttribute('aria-label','Reproducir audio');btn.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> <span>Audio</span>';audio.replaceWith(btn);});doc.querySelectorAll('*').forEach(el=>{for(const a of [...el.attributes]){if(/^on/i.test(a.name)||['srcdoc','action','formaction','srcset','autoplay'].includes(a.name))el.removeAttribute(a.name);if(['href','xlink:href'].includes(a.name)&&!a.value.startsWith('#')){if(el.namespaceURI==='http://www.w3.org/2000/svg'&&el.localName==='image'){try{const u=new URL(a.value,location.origin+'/media/');if(u.origin===location.origin&&u.pathname.startsWith('/media/'))el.setAttribute(a.name,u.href);else el.removeAttribute(a.name);}catch{el.removeAttribute(a.name);}}else el.removeAttribute(a.name);}if(['src','poster'].includes(a.name)){if(/^(data:(image|audio)\/)/i.test(a.value))continue;try{const url=new URL(a.value,location.origin+'/media/');if(url.origin!==location.origin||!url.pathname.startsWith('/media/'))el.removeAttribute(a.name);else el.setAttribute(a.name,url.href);}catch{el.removeAttribute(a.name);}}}});if(typeof window.renderMathInElement==='function'){window.renderMathInElement(template.content,{delimiters:[{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false},{left:'$$',right:'$$',display:true}],throwOnError:false,trust:false,maxExpand:1000,maxSize:20,strict:'ignore'});}return template.innerHTML;}
const CARD_THEMES = {
  clean: { name: 'Lumina Clean', desc: 'Blanco luminoso, lectura descansada', bg: '#ffffff', text: '#1e293b', hr: '#e2e8f0', cloze: '#4f46e5', swatch: '#ffffff', swatchBorder: '#94a3b8', isDark: false },
  quizlet: { name: 'Quizlet Indigo Plus', desc: 'Azul noche con acentos índigo', bg: '#0f172a', text: '#f8fafc', hr: '#334155', cloze: '#818cf8', swatch: '#0f172a', swatchBorder: '#6366f1', isDark: true },
  oled: { name: 'Dark OLED', desc: 'Negro absoluto con detalles cian', bg: '#000000', text: '#f1f5f9', hr: '#27272a', cloze: '#38bdf8', swatch: '#000000', swatchBorder: '#0284c7', isDark: true },
  sepia: { name: 'Pergamino Editorial', desc: 'Tono sepia cálido con serif clásica', bg: '#fbf7ee', text: '#292524', hr: '#e7e0d3', cloze: '#d97706', swatch: '#fbf7ee', swatchBorder: '#d97706', isDark: false },
  aurora: { name: 'Aurora Glass', desc: 'Pizarra oscura con toques esmeralda', bg: '#0a101d', text: '#f0fdf4', hr: '#1e293b', cloze: '#34d399', swatch: '#0a101d', swatchBorder: '#10b981', isDark: true },
  zen: { name: 'Zen Minimalista', desc: 'Monocromo sin ninguna distracción', bg: '#18181b', text: '#e4e4e7', hr: '#27272a', cloze: '#a1a1aa', swatch: '#18181b', swatchBorder: '#52525b', isDark: true }
};

function getCardCustomStyle() {
  try {
    const saved = localStorage.getItem('lumcards-card-style');
    if (saved) return JSON.parse(saved);
  } catch {}
  return { theme: 'quizlet', font: 'sans', size: '22px', align: 'center', cloze: '#818cf8' };
}

function mountCard(frame,card,answer=false){
  if(!frame)return;
  const origin=location.origin;
  const styleConf = getCardCustomStyle();
  const theme = CARD_THEMES[styleConf.theme] || CARD_THEMES.quizlet;
  const fontFamilies = {
    sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Charter', 'Times New Roman', serif",
    mono: "Consolas, 'Courier New', monospace",
    rounded: "'Outfit', 'Quicksand', 'Segoe UI', sans-serif"
  };
  const fontFamily = fontFamilies[styleConf.font] || fontFamilies.sans;
  const fontSize = styleConf.size || '22px';
  const textAlign = styleConf.align || 'center';
  const clozeColor = styleConf.cloze || theme.cloze;
  const colorScheme = theme.isDark ? 'dark' : 'light';

  frame.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${origin}/vendor/katex/; img-src ${origin}/media/ data:; media-src ${origin}/media/ data:; font-src ${origin}/media/ ${origin}/vendor/katex/ data:; script-src 'unsafe-inline'; form-action 'none'; base-uri ${origin}"><base href="${origin}/media/"><link rel="stylesheet" href="${origin}/vendor/katex/katex.min.css"><style>html{color-scheme:${colorScheme};height:100%;width:100%;background:${theme.bg};box-sizing:border-box}body{font-family:${fontFamily};color:${theme.text};background:${theme.bg};margin:0;padding:24px 32px;font-size:clamp(16px,1.8vw,${fontSize});text-align:${textAlign};line-height:1.55;overflow-wrap:anywhere;min-height:100%;width:100%;display:flex;flex-direction:column;justify-content:center;align-items:${textAlign==='center'?'center':'flex-start'};box-sizing:border-box;user-select:none;cursor:pointer}.card{font-family:${fontFamily};color:${theme.text};background:${theme.bg};width:100%;max-width:1100px;margin:0 auto}img{max-width:90%;max-height:44vh;object-fit:contain;height:auto;border-radius:8px;margin:12px auto;display:block}hr{border:0;border-top:1px solid ${theme.hr};margin:16px auto;width:92%}.cloze{color:${clozeColor};font-weight:700;padding:0 2px;border-bottom:2px solid ${clozeColor}}pre{white-space:pre-wrap;text-align:left;max-width:90%;margin:0 auto}p{margin:8px 0}*{box-sizing:border-box}.anki-audio-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;background:${theme.isDark?'#1e293b':'#f1f5f9'};color:${theme.isDark?'#38bdf8':'#0284c7'};border:1px solid ${theme.isDark?'#0284c7':'#cbd5e1'};cursor:pointer;font-size:13px;font-weight:600;margin:6px 8px;vertical-align:middle;box-shadow:0 2px 6px rgba(0,0,0,0.15);transition:all .15s ease}.anki-audio-pill:hover{background:#0284c7;color:#ffffff;transform:scale(1.05)}.anki-audio-pill:active{transform:scale(0.95)}.anki-audio-pill svg{width:16px;height:16px;fill:currentColor}</style>${card.css?'<style>'+String(card.css).replace(/<\/style/gi,'')+'</style>':''}<script>window.addEventListener('keydown',function(e){var k=e.key,c=e.code;if(c==='Space'||k===' '||c==='Enter'||k==='Enter'||/^[1-4]$/.test(k)||['f','F','Escape','s','S','e','E','r','R'].includes(k)){e.preventDefault();}window.parent.postMessage({ankiKey:k,ankiCode:c},'*');});document.addEventListener('click',function(e){var pill=e.target.closest('.anki-audio-pill, .anki-audio-btn');if(pill){e.preventDefault();e.stopPropagation();var src=pill.getAttribute('data-src');if(src)window.parent.postMessage({ankiPlayAudio:src},'*');return;}if(e.target.closest('a, button, input, textarea, select'))return;window.parent.postMessage({ankiCardClick:true},'*');});</script></head><body class="card">${safeCardHTML(answer?card.back:card.front)}</body></html>`;
}
function showModal(title,intro,content){modal.innerHTML=`<div class="dialog-head"><h2 id="modal-title">${title}</h2><button class="icon-button" data-action="close-modal" aria-label="Cerrar">${icon('close')}</button></div><p class="dialog-intro">${intro}</p>${content}`;if(!modal.open)modal.showModal();}
function newDeck(){showModal('Un nuevo espacio para aprender.','Elige un nombre que te ayude a encontrar tus tarjetas.',`<form id="deck-form"><label class="field">Nombre del mazo<input name="name" placeholder="Por ejemplo: Inglés para viajar" required maxlength="120" autofocus></label><div class="form-error" role="alert"></div><div class="form-footer">${button('Cancelar','close-modal')}<button class="btn btn-primary" data-mutate>${icon('plus')}Crear mazo</button></div></form>`);}
function newFolderModal(){showModal('Nueva carpeta para organizar libros','Crea una carpeta contenedora para agrupar varios libros o submazos en un solo lugar.',`<form id="folder-form"><label class="field">Nombre de la carpeta<input name="name" placeholder="Por ejemplo: 4000 Essential English Words" required maxlength="120" autofocus></label><div class="info-box">Dentro de esta carpeta podrás colocar libros (por ej. <strong>1.Book</strong>, <strong>2.Book</strong>...) o mover libros ya creados para mantener tu pantalla ordenada.</div><div class="form-error" role="alert"></div><div class="form-footer">${button('Cancelar','close-modal')}<button class="btn btn-primary" data-mutate>${icon('folder')}Crear carpeta</button></div></form>`);}
function moveDeckModal(deckId){const d=data.decks.find(x=>String(x.id)===String(deckId));if(!d)return;const folders=data.decks.filter(x=>String(x.id)!==String(d.id));showModal('Mover libro a una carpeta',`Organiza «${esc(d.name)}» dentro de una carpeta contenedora.`,`<form id="move-deck-form" data-id="${d.id}"><label class="field">Carpeta de destino<select name="parentId"><option value="root">Ninguna (Dejar como mazo suelto en la raíz)</option>${folders.map(f=>`<option value="${f.id}" ${f.name===d.parentName?'selected':''}>📁 ${esc(f.name)}</option>`).join('')}</select></label><div class="info-box">Al colocar el libro dentro de una carpeta, se agrupará en la pantalla principal para que no tengas libros dispersos.</div><div class="form-error" role="alert"></div><div class="form-footer">${button('Cancelar','close-modal')}<button class="btn btn-primary" data-mutate>${icon('check')}Mover libro</button></div></form>`);}
function newBookInFolderModal(folderName){showModal('Añadir libro a '+esc(folderName),'Crea un nuevo libro o submazo directamente dentro de esta carpeta.',`<form id="new-book-form" data-folder="${esc(folderName)}"><label class="field">Nombre del libro<input name="bookName" placeholder="Por ejemplo: 1.Book, Unidad 1, Lección A..." required maxlength="100" autofocus></label><div class="info-box">El libro se creará automáticamente dentro de <strong>${esc(folderName)}</strong>.</div><div class="form-error" role="alert"></div><div class="form-footer">${button('Cancelar','close-modal')}<button class="btn btn-primary" data-mutate>${icon('plus')}Crear libro en carpeta</button></div></form>`);}

function examModal(preselectedDeckId){
  const currentDeck = preselectedDeckId || selectedDeck || 'all';
  showModal('Modo Examen y Práctica Rápida', 'Crea una sesión de estudio focalizada con preguntas difíciles o un simulacro a tu medida.', `
    <form id="exam-form">
      <label class="field">Mazo para el examen
        <select name="deckId" id="exam-deck-select">
          <option value="all" ${currentDeck==='all'?'selected':''}>Toda la biblioteca (${data.decks.length} mazos)</option>
          ${data.decks.map(d => `<option value="${d.id}" ${String(d.id)===String(currentDeck)?'selected':''}>${esc(d.name)} (${num(d.total)} tarjetas)</option>`).join('')}
        </select>
      </label>
      <label class="field">Tipo de preguntas
        <select name="mode" id="exam-mode-select">
          <option value="difficult" selected>🔥 Tarjetas más difíciles (frecuentes fallos y bajo factor)</option>
          <option value="due">⏰ Tarjetas pendientes de repaso</option>
          <option value="random">🎲 Preguntas aleatorias de práctica</option>
        </select>
      </label>
      <label class="field">Cantidad de tarjetas
        <select name="limit" id="exam-limit-select">
          <option value="10">10 tarjetas (rápido · ~3 min)</option>
          <option value="20" selected>20 tarjetas (estándar · ~6 min)</option>
          <option value="30">30 tarjetas (intensivo · ~10 min)</option>
          <option value="50">50 tarjetas (completo · ~15 min)</option>
          <option value="100">100 tarjetas (maratón)</option>
        </select>
      </label>
      <div style="background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin:12px 0">
        <label style="display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--text);cursor:pointer">
          <input type="checkbox" id="exam-alter-scheduler" name="alterScheduler" style="width:18px;height:18px;accent-color:#0284c7">
          <span>Modo simulacro (no altera el calendario ni los intervalos habituales)</span>
        </label>
        <p style="font-size:12px;color:var(--muted);margin:6px 0 0 28px">
          Recomendado para exámenes de prueba sin alterar el algoritmo espaciado de tus repasos habituales.
        </p>
      </div>
      <div class="form-error" role="alert"></div>
      <div class="form-footer">
        ${button('Cancelar', 'close-modal')}
        <button class="btn btn-primary" data-mutate>${icon('target')} Iniciar Examen</button>
      </div>
    </form>
  `);
}

async function startExam(deckId, mode, limit, alterScheduler = false){
  AudioController.unlock();
  loading(true);
  try {
    const modeLabels = {
      difficult: 'Tarjetas difíciles',
      due: 'Pendientes',
      random: 'Práctica aleatoria'
    };
    const res = await api('exam/start', { deckId, mode, limit });
    if (!res || !res.cards || !res.cards.length) {
      toast('No hay tarjetas disponibles para los criterios seleccionados.', true);
      return;
    }
    isExamSession = true;
    examConfig = {
      deckId,
      mode,
      limit,
      alterScheduler,
      modeLabel: modeLabels[mode] || 'Examen'
    };
    examResults = {
      total: res.cards.length,
      completed: 0,
      correct: 0,
      hard: 0,
      failed: 0,
      timeStarted: Date.now()
    };
    reviewSession = {
      cards: res.cards,
      counts: { new: 0, learn: 0, due: res.cards.length },
      intervals: ['Fallo', 'Difícil', 'Bien', 'Fácil']
    };
    view = 'study';
    sessionCount = 0;
    sessionStarted = Date.now();
    revealed = false;
    search = '';
    lastPlayedKey = null;
    isFullscreen = true;
    modal.close();
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {}
    render();
  } catch (err) {
    toast(err.message, true);
  } finally {
    loading(false);
  }
}


async function cardForm(id){
  const cardId=id||currentCard()?.id;
  const c=cardId?await api('cards/'+encodeURIComponent(cardId)):null;
  if(!data.decks.length){newDeck();return;}
  let draft=null;try{draft=!c?JSON.parse(localStorage.getItem('anki2-draft')||'null'):null;}catch{}
  const sourceFields=c?.fields||[{name:'Pregunta · anverso',value:draft?.front||''},{name:'Respuesta · reverso',value:draft?.back||''}];
  const fields=sourceFields.map((f,i)=>`<label class="field"><span class="field-label" style="display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:600;margin-bottom:6px"><span>${esc(f.name)}</span></span><textarea name="${c?'field_'+i:i===0?'front':'back'}" ${!c&&i===0?'required':''} placeholder="${i===0?'¿Qué quieres recordar?':'Escribe el contenido…'}" rows="${sourceFields.length>3?3:4}" style="width:100%;font-size:14px;padding:10px;border-radius:8px">${esc(f.value)}</textarea></label>`).join('');
  showModal(c?'Editar tarjeta':'Captura algo que quieras recordar.',c?`Nota: ${esc(c.modelName)} · Se guardará directamente en esta pestaña sin salir.`:'Elige una pregunta concreta y una respuesta que puedas recordar.',`<form id="card-form" data-id="${c?.id||''}" data-fields="${sourceFields.length}">${!c?`<div class="editor-options"><label class="field">Mazo<select name="deckId">${data.decks.map(d=>`<option value="${d.id}" ${String(d.id)===String(selectedDeck||draft?.deckId)?'selected':''}>${esc(d.name)}</option>`).join('')}</select></label><label class="field">Tipo de tarjeta<select name="kind" id="note-kind"><option value="basic">Pregunta y respuesta</option><option value="reversed" ${draft?.kind==='reversed'?'selected':''}>En ambos sentidos</option><option value="cloze" ${draft?.kind==='cloze'?'selected':''}>Completar espacios · cloze</option></select></label></div>`:''}<div class="editor-toolbar">${button('Añadir imagen o audio','attach-media','upload','btn-quiet')}${(!c||(c.isCloze&&!c.isImageOcclusion))?button('Ocultar texto','insert-cloze','edit','btn-quiet'):''}</div>${fields}<p class="info-box" id="editor-tip">Puedes editar el texto o HTML. Pulsa <kbd>Ctrl + Enter</kbd> para guardar rápido sin salir de la pestaña.</p><label class="field"><span class="field-label">Etiquetas</span><input name="tags" value="${esc(c?.tags?.join(' ')??draft?.tags??'')}" placeholder="vocabulario examen capítulo1"></label><div class="form-error" role="alert"></div><div class="form-footer">${c?button('Eliminar nota','delete-card','trash','btn-danger',`data-id="${c.id}"`):''}${button('Cancelar','close-modal')}<button class="btn btn-primary" data-mutate>${icon('check')}${c?'Guardar cambios (Ctrl+Enter)':'Crear tarjeta'}</button></div></form>`);
  updateEditorKind();
}
function updateEditorKind(){const form=$('#card-form'),kind=$('#note-kind')?.value;if(!form||!kind)return;const labels=form.querySelectorAll('textarea');labels[1].required=kind!=='cloze';labels[0].previousElementSibling.textContent=kind==='cloze'?'Texto con espacios ocultos':'Pregunta · anverso';labels[1].previousElementSibling.textContent=kind==='cloze'?'Información adicional (opcional)':'Respuesta · reverso';$('#editor-tip').textContent=kind==='cloze'?'Escribe, por ejemplo: La capital de Perú es {{c1::Lima}}. Selecciona una palabra y pulsa «Ocultar texto» para marcarla.':kind==='reversed'?'Se crearán dos tarjetas: pregunta → respuesta y respuesta → pregunta. Puedes usar fórmulas entre \( … \).':'Puedes usar HTML básico y fórmulas entre \( … \). Tu borrador se guarda en este navegador.';}

function importModal(){showModal('Tus mazos, como en casa.','Trae tu biblioteca de Anki y empieza a estudiar aquí.',`<a class="btn" href="/practice.html#import" style="margin-bottom:18px">Importar CSV, TSV, TXT o JSON</a><div class="drop-zone" id="drop-zone" role="button" tabindex="0" data-action="pick-file">${icon('upload')}<strong>Arrastra tu archivo aquí</strong><p>o haz clic para elegirlo<br>.apkg · .colpkg · .anki2 · hasta 500 MB</p></div><div class="info-box">Se importan tarjetas, plantillas y archivos multimedia incluidos. Antes de importar, guardamos una copia de tu colección. Las notas repetidas se combinan con el importador de Anki.</div><p class="small muted">Los mazos con complementos o JavaScript propio pueden necesitar ajustes. Para traer imágenes y audio, usa .apkg o .colpkg.</p><div id="import-status" class="form-error" role="status"></div>`);const zone=$('#drop-zone');zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('dragging');});zone.addEventListener('dragleave',()=>zone.classList.remove('dragging'));zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('dragging');if(e.dataTransfer.files[0])uploadFile(e.dataTransfer.files[0]);});zone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#import-file').click();}});}
async function uploadFile(file){if(busy)return;if(!/\.(apkg|colpkg|anki2)$/i.test(file.name)){toast('Elige un archivo .apkg, .colpkg o .anki2.',true);return;}if(file.size>500*1024*1024){toast('El archivo supera el límite de 500 MB.',true);return;}loading(true);const status=$('#import-status');if(status){status.className='small muted';status.textContent='Importando '+file.name+'… Mantén la app abierta.';}try{const res=await fetch('/api/import?name='+encodeURIComponent(file.name),{method:'POST',headers:{'Content-Type':'application/octet-stream','X-Anki-Request':'1'},body:file});const result=await res.json();if(!res.ok)throw new Error(result.error||'No se pudo importar el archivo.');await refresh(false);modal.close();view='decks';search='';filter='all';render();toast(result.message||'Mazo importado. Tu biblioteca está lista.');}catch(e){if(status){status.className='form-error';status.textContent=e.message;}toast(e.message,true);}finally{loading(false);$('#import-file').value='';}}
async function startStudy(id){AudioController.unlock();loading(true);try{isExamSession=false;examConfig=null;selectedDeck=id||null;reviewSession=await api('study',{deckId:id||null});view='study';sessionCount=0;sessionStarted=Date.now();revealed=false;search='';lastPlayedKey=null;isFullscreen=true;try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen){await document.documentElement.requestFullscreen();}}catch{}render();}finally{loading(false);}}
async function rate(rating){
  if(busy||!revealed||!currentCard()||currentCard().renderError)return;
  AudioController.unlock();
  loading(true);
  try{
    if(isExamSession){
      const c = currentCard();
      examResults.completed++;
      if(rating === 1) examResults.failed++;
      else if(rating === 2) examResults.hard++;
      else examResults.correct++;

      if(examConfig?.alterScheduler){
        try{
          await api('review',{id:c.id, rating, elapsedMs:Math.min(60000,Date.now()-sessionStarted)});
        }catch(e){console.warn('Exam schedule update error:', e);}
      }
      reviewSession.cards.shift();
      revealed = false;
      sessionStarted = Date.now();
      render();
      return;
    }
    await api('review',{id:currentCard().id,rating,elapsedMs:Math.min(60000,Date.now()-sessionStarted)});
    sessionCount++;
    reviewSession=await api('study',{deckId:selectedDeck});
    revealed=false;
    sessionStarted=Date.now();
    render();
  }finally{loading(false);}
}
async function previewCard(id){const c=await api('cards/'+encodeURIComponent(id));if(!c)return;showModal('Una idea para recordar.',esc(data.decks.find(d=>String(d.id)===String(c.deckId))?.name||''),`<iframe class="card-frame" id="preview-frame" title="Contenido de la tarjeta" sandbox="" referrerpolicy="no-referrer" style="height:360px"></iframe><div class="form-footer">${button(c.starred?'Quitar favorito':'Guardar favorito','star','star','',`data-id="${id}"`)}${c.editable?button('Editar tarjeta','edit-card','edit','btn-primary',`data-id="${id}"`):''}</div>${!c.editable?'<p class="small muted">Plantilla importada: para editar su diseño, personalízala desde Ajustes o edita sus campos.</p>':''}`);mountCard($('#preview-frame'),c,true);}
async function navigate(next){view=next;selectedDeck=null;activeFolder=null;search='';if(next==='backups')backupList=await api('backups');if(next==='cards'||next==='favorites')await loadCards();if(next==='stats')await loadDetailedStats();if(next==='sync')await loadSyncInfo();render();}
function help(){showModal('A tu ritmo, con menos clics.','Todo lo esencial para empezar.',`<div class="info-box"><strong>1.</strong> Importa un mazo o crea uno.<br><strong>2.</strong> Pulsa «Estudiar» y piensa la respuesta.<br><strong>3.</strong> Muestra la respuesta y elige cuánto recordaste.<br><strong>4.</strong> Vuelve mañana. Lumcards organiza el siguiente repaso óptimo.</div><div class="settings-row"><strong>Buscar en la biblioteca</strong><kbd>Ctrl + K</kbd></div><div class="settings-row"><strong>Mostrar la respuesta / Bien</strong><kbd>Espacio</kbd></div><div class="settings-row"><strong>Calificar un repaso</strong><kbd>1 / 2 / 3 / 4</kbd></div><div class="settings-row"><strong>Repetir audio</strong><kbd>R</kbd></div><div class="settings-row"><strong>Pantalla completa</strong><kbd>F</kbd></div><p class="small muted">La app funciona sin conexión después de instalarse. Reproduce el audio de las tarjetas automáticamente.</p>`);}
async function confirmDelete(type,id){const d=type==='deck'?data.decks.find(d=>String(d.id)===String(id)):null;const note=type==='card'?await api('cards/'+encodeURIComponent(id)):null;showModal(type==='deck'?'¿Eliminar este mazo?':'¿Eliminar esta tarjeta?',type==='deck'?`Se eliminarán «${esc(d?.name)}» y sus tarjetas. Se guardará una copia antes de continuar.`:`Se eliminará esta nota y sus ${note?.siblingCount||1} tarjetas. Se guardará una copia antes de continuar.`,`<div class="form-footer">${button('Cancelar','close-modal')}${button('Eliminar','confirm-delete','trash','btn-danger',`data-type="${type}" data-id="${id}" data-mutate`)}</div>`);}

// --- 1. PLAN DE ESTUDIO FLEXIBLE (DECK CONFIG) ---
async function deckConfigModal(deckId){
  const d = data.decks.find(x => String(x.id) === String(deckId));
  if(!d) return;
  loading(true);
  try {
    const conf = await api('decks/config?deckId=' + encodeURIComponent(deckId), undefined, 'GET');
    showModal('Plan de Estudio · ' + esc(d.name), 'Ajusta los límites diarios de tarjetas nuevas y repasos para este mazo.', `
      <form id="deck-config-form" data-id="${d.id}">
        <div class="deck-config-card">
          <label class="field">
            <span class="field-label"><strong>Tarjetas nuevas al día</strong></span>
            <input type="number" name="newPerDay" min="0" max="9999" value="${conf.newPerDay}" required>
            <p class="small muted" style="margin:4px 0 0">Controla cuántas tarjetas no vistas introduce Lumcards en tu sesión diaria.</p>
          </label>
        </div>
        <div class="deck-config-card">
          <label class="field">
            <span class="field-label"><strong>Límite máximo de repasos al día</strong></span>
            <input type="number" name="revPerDay" min="0" max="9999" value="${conf.revPerDay}" required>
            <p class="small muted" style="margin:4px 0 0">Evita acumulación excesiva de tarjetas pendientes si estuviste días sin repasar.</p>
          </label>
        </div>
        <div class="info-box">
          Este plan se guarda directamente en la configuración del mazo <strong>${esc(d.name)}</strong>.
        </div>
        <div class="form-error" role="alert"></div>
        <div class="form-footer">
          ${button('Cancelar', 'close-modal')}
          <button class="btn btn-primary" data-mutate>${icon('check')} Guardar plan</button>
        </div>
      </form>
    `);
  } catch(err) {
    toast(err.message, true);
  } finally {
    loading(false);
  }
}

// --- 2. CONVERTIR APUNTES EN TARJETAS ---
let convertedNotesCards = [];
function convertNotesModal(preselectedDeckId){
  convertedNotesCards = [];
  const targetDeck = preselectedDeckId || selectedDeck || data.decks[0]?.id;
  showModal('Convertir apuntes en tarjetas', 'Pega resúmenes o listas de estudio para generar tarjetas automáticamente.', `
    <form id="convert-notes-form">
      <div class="editor-options">
        <label class="field">Mazo de destino
          <select name="deckId" id="notes-deck-select">
            ${data.decks.map(d => `<option value="${d.id}" ${String(d.id)===String(targetDeck)?'selected':''}>${esc(d.name)}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="notes-converter-box">
        <label class="field">
          <span class="field-label" style="display:flex;justify-content:space-between">
            <strong>Pega aquí tus notas o texto</strong>
            <span class="small muted">Formatos: «Pregunta : Respuesta», «¿Pregunta? Respuesta» o «{{c1::palabra}}»</span>
          </span>
          <textarea id="notes-raw-input" rows="8" placeholder="Ejemplo:
¿Cuál es la función del ribosoma? : Sintetizar proteínas en la célula
Mitocondria : Central energética que produce ATP mediante respiración celular
El {{c1::oxígeno}} es transportado por la {{c2::hemoglobina}} en la sangre." style="width:100%;font-family:inherit;font-size:14px;padding:12px;border-radius:8px;border:1px solid var(--line)"></textarea>
        </label>
        <div style="display:flex;gap:10px;align-items:center;margin-top:10px">
          <button type="button" class="btn btn-dark" data-action="parse-notes">${icon('spark')} Analizar y previsualizar tarjetas</button>
          <span id="notes-parsed-count" style="font-size:13px;font-weight:600;color:var(--muted)"></span>
        </div>
      </div>
      <div id="notes-preview-container" class="notes-preview-list" style="display:none;margin-top:16px"></div>
      <div class="form-error" role="alert"></div>
      <div class="form-footer" style="margin-top:16px">
        ${button('Cancelar', 'close-modal')}
        <button class="btn btn-primary" id="btn-save-notes-batch" style="display:none" data-mutate>${icon('plus')} Crear tarjetas en el mazo</button>
      </div>
    </form>
  `);
}

function parseNotesIntoCards(text){
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const cards = [];
  for (const line of lines) {
    if (line.includes('{{c') && line.includes('::')) {
      cards.push({ kind: 'cloze', text: line, extra: '' });
      continue;
    }
    const colonMatch = line.match(/^([^:?]+[?]?)\s*[:=-]\s*(.+)$/);
    if (colonMatch) {
      cards.push({ kind: 'basic', front: colonMatch[1].trim(), back: colonMatch[2].trim() });
      continue;
    }
    const questionMatch = line.match(/^([¿][^?]+[?])\s*(.+)$/);
    if (questionMatch) {
      cards.push({ kind: 'basic', front: questionMatch[1].trim(), back: questionMatch[2].trim() });
      continue;
    }
    const tabMatch = line.split('\t');
    if (tabMatch.length >= 2) {
      cards.push({ kind: 'basic', front: tabMatch[0].trim(), back: tabMatch.slice(1).join(' ').trim() });
      continue;
    }
  }
  return cards;
}

function renderNotesPreview(cards){
  const container = $('#notes-preview-container');
  const countEl = $('#notes-parsed-count');
  const saveBtn = $('#btn-save-notes-batch');
  if (!container) return;
  convertedNotesCards = cards;
  if (!cards.length) {
    container.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'none';
    if (countEl) countEl.textContent = 'No se detectaron preguntas. Usa «Pregunta : Respuesta» o «{{c1::hueco}}».';
    return;
  }
  container.style.display = 'block';
  if (saveBtn) saveBtn.style.display = 'inline-flex';
  if (countEl) countEl.textContent = `Se detectaron ${cards.length} tarjetas listas para importar:`;
  container.innerHTML = cards.map((c, idx) => `
    <div class="notes-card-row" data-idx="${idx}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span class="badge" style="font-size:11px">${c.kind === 'cloze' ? 'Completar espacios (Cloze)' : 'Básica'}</span>
        <button type="button" class="icon-button" data-action="remove-converted-card" data-idx="${idx}" title="Eliminar de la lista">${icon('close')}</button>
      </div>
      ${c.kind === 'cloze' ? `
        <input type="text" class="card-edit-front" data-idx="${idx}" value="${esc(c.text)}" style="width:100%;font-size:13px;padding:6px 10px;border-radius:6px;border:1px solid var(--line);margin-bottom:4px">
        <input type="text" class="card-edit-back" data-idx="${idx}" value="${esc(c.extra||'')}" placeholder="Información extra (opcional)" style="width:100%;font-size:12px;padding:4px 8px;border-radius:6px;border:1px solid var(--line);color:var(--muted)">
      ` : `
        <input type="text" class="card-edit-front" data-idx="${idx}" value="${esc(c.front)}" placeholder="Pregunta" style="width:100%;font-size:13px;padding:6px 10px;border-radius:6px;border:1px solid var(--line);margin-bottom:4px">
        <input type="text" class="card-edit-back" data-idx="${idx}" value="${esc(c.back)}" placeholder="Respuesta" style="width:100%;font-size:13px;padding:6px 10px;border-radius:6px;border:1px solid var(--line)">
      `}
    </div>
  `).join('');
}

// --- 3. EDITOR VISUAL DE IMAGE OCCLUSION ---
let currentIoImage = null;
let currentIoShapes = [];
let isIoDrawing = false;
let ioStartX = 0, ioStartY = 0;

function imageOcclusionModal(preselectedDeckId){
  currentIoImage = null;
  currentIoShapes = [];
  const targetDeck = preselectedDeckId || selectedDeck || data.decks[0]?.id;
  showModal('Crear Oclusión de Imagen (Image Occlusion)', 'Oculta partes de un diagrama, mapa o fórmula para recordarlas activamente.', `
    <form id="image-occlusion-form">
      <div class="editor-options">
        <label class="field">Mazo de destino
          <select name="deckId" id="io-deck-select">
            ${data.decks.map(d => `<option value="${d.id}" ${String(d.id)===String(targetDeck)?'selected':''}>${esc(d.name)}</option>`).join('')}
          </select>
        </label>
        <label class="field">Seleccionar imagen
          <input type="file" id="io-file-input" accept="image/*" required style="padding:6px">
        </label>
      </div>
      <div class="editor-options" style="margin-top:10px">
        <label class="field" style="flex:1">Encabezado / Título (opcional)
          <input type="text" name="header" placeholder="Ej. Anatomía del corazón humano">
        </label>
        <label class="field" style="flex:1">Información extra / Reverso (opcional)
          <input type="text" name="extra" placeholder="Notas adicionales visibles tras responder">
        </label>
      </div>

      <div class="io-toolbar" style="margin-top:14px">
        <span id="io-rect-counter" style="font-size:13px;font-weight:700;color:var(--text)">0 máscaras dibujadas</span>
        <div style="display:flex;gap:8px">
          <button type="button" class="btn btn-quiet" data-action="undo-io-rect">${icon('back')} Deshacer última</button>
          <button type="button" class="btn btn-quiet" data-action="clear-io-rects">${icon('trash')} Limpiar todo</button>
        </div>
      </div>

      <div class="io-stage-container" id="io-stage">
        <div id="io-placeholder" style="text-align:center;color:var(--muted);padding:40px 20px">
          ${icon('image', 'style="width:48px;height:48px;margin-bottom:12px;color:var(--muted)"')}
          <p style="margin:0;font-size:15px;font-weight:600">Sube una imagen para empezar a trazar máscaras con el ratón.</p>
          <small>Haz clic y arrastra sobre cualquier parte de la imagen que quieras memorizar.</small>
        </div>
        <div class="io-canvas-wrap" id="io-canvas-wrap" style="display:none">
          <img id="io-base-image" alt="Imagen base de oclusión" style="max-width:100%;max-height:55vh;display:block;margin:0 auto;user-select:none;-webkit-user-drag:none">
          <div id="io-overlay" style="position:absolute;inset:0;cursor:crosshair"></div>
        </div>
      </div>

      <div class="form-error" role="alert"></div>
      <div class="form-footer" style="margin-top:16px">
        ${button('Cancelar', 'close-modal')}
        <button class="btn btn-primary" id="btn-save-io" data-mutate>${icon('check')} Crear tarjetas de oclusión</button>
      </div>
    </form>
  `);

  setTimeout(() => {
    const fileInput = $('#io-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 30 * 1024 * 1024) {
          toast('La imagen supera el límite de 30 MB.', true);
          return;
        }
        loading(true);
        try {
          const res = await fetch('/api/media?name=' + encodeURIComponent(file.name), {
            method: 'POST',
            headers: { 'X-Anki-Request': '1', 'Content-Type': 'application/octet-stream' },
            body: file
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error || 'No se pudo subir la imagen.');
          currentIoImage = result.name;
          
          const imgEl = $('#io-base-image');
          imgEl.src = '/media/' + result.name;
          imgEl.onload = () => {
            $('#io-placeholder').style.display = 'none';
            $('#io-canvas-wrap').style.display = 'inline-block';
            currentIoShapes = [];
            renderIoShapes();
          };
        } catch(err) {
          toast(err.message, true);
        } finally {
          loading(false);
        }
      });
    }

    const overlay = $('#io-overlay');
    if (overlay) {
      let draftRect = null;
      overlay.addEventListener('mousedown', e => {
        if (!currentIoImage) return;
        const rect = overlay.getBoundingClientRect();
        ioStartX = (e.clientX - rect.left) / rect.width;
        ioStartY = (e.clientY - rect.top) / rect.height;
        isIoDrawing = true;
        draftRect = document.createElement('div');
        draftRect.className = 'io-rect draft';
        overlay.appendChild(draftRect);
      });

      window.addEventListener('mousemove', e => {
        if (!isIoDrawing || !draftRect) return;
        const rect = overlay.getBoundingClientRect();
        const curX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const curY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        const left = Math.min(ioStartX, curX);
        const top = Math.min(ioStartY, curY);
        const width = Math.abs(curX - ioStartX);
        const height = Math.abs(curY - ioStartY);

        draftRect.style.left = (left * 100) + '%';
        draftRect.style.top = (top * 100) + '%';
        draftRect.style.width = (width * 100) + '%';
        draftRect.style.height = (height * 100) + '%';
      });

      window.addEventListener('mouseup', e => {
        if (!isIoDrawing) return;
        isIoDrawing = false;
        if (draftRect) {
          draftRect.remove();
          draftRect = null;
        }
        const rect = overlay.getBoundingClientRect();
        const curX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const curY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        const left = Math.min(ioStartX, curX);
        const top = Math.min(ioStartY, curY);
        const width = Math.abs(curX - ioStartX);
        const height = Math.abs(curY - ioStartY);

        if (width > 0.02 && height > 0.02) {
          currentIoShapes.push({ x: left, y: top, width, height });
          renderIoShapes();
        }
      });
    }
  }, 100);
}

function renderIoShapes(){
  const overlay = $('#io-overlay');
  const counter = $('#io-rect-counter');
  if (!overlay) return;
  overlay.innerHTML = '';
  currentIoShapes.forEach((shape, i) => {
    const div = document.createElement('div');
    div.className = 'io-rect';
    div.style.left = (shape.x * 100) + '%';
    div.style.top = (shape.y * 100) + '%';
    div.style.width = (shape.width * 100) + '%';
    div.style.height = (shape.height * 100) + '%';
    div.innerHTML = `<span class="io-rect-badge">c${i + 1}</span>`;
    overlay.appendChild(div);
  });
  if (counter) {
    counter.textContent = `${currentIoShapes.length} máscara${currentIoShapes.length===1?'':'s'} dibujada${currentIoShapes.length===1?'':'s'}`;
  }
}

document.addEventListener('click', async e => {
  AudioController.unlock();
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action, id = el.dataset.id;
  try {
    if (a === 'nav') await navigate(el.dataset.view || 'cards');
    else if (a === 'menu') $('.sidebar').classList.toggle('open');
    else if (a === 'theme') {
      theme = theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('anki2-theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
      render();
    }
    else if (a === 'help') help();
    else if (a === 'insert-cloze') {
      const field = $('#card-form textarea');
      if (!field) return;
      const start = field.selectionStart, end = field.selectionEnd;
      const indices = [...field.value.matchAll(/\{\{c(\d+)::/g)].map(m => Number(m[1]));
      const number = Math.max(0, ...indices) + 1;
      field.setRangeText('{{c' + number + '::' + (field.value.slice(start, end) || 'texto') + '}}', start, end, 'select');
      if ($('#note-kind')) {
        $('#note-kind').value = 'cloze';
        updateEditorKind();
      }
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.focus();
    }
    else if (a === 'attach-media') $('#attach-file').click();
    else if (a === 'new-deck') newDeck();
    else if (a === 'new-folder') newFolderModal();
    else if (a === 'open-folder') { activeFolder = id; render(); }
    else if (a === 'exit-folder') { activeFolder = null; render(); }
    else if (a === 'move-deck-modal') moveDeckModal(id);
    else if (a === 'new-book-in-folder') newBookInFolderModal(el.dataset.folder);
    else if (a === 'card-progress-filter') { cardProgressFilter = el.dataset.status; render(); }
    else if (a === 'clear-card-progress') { cardProgressFilter = 'all'; render(); }
    else if (a === 'new-card') await cardForm();
    else if (a === 'edit-card') await cardForm(id);
    else if (a === 'close-modal') modal.close();
    else if (a === 'exam-modal') examModal(id);
    else if (a === 'repeat-exam') {
      if (examConfig) await startExam(examConfig.deckId, examConfig.mode, examConfig.limit, examConfig.alterScheduler);
    }
    else if (a === 'deck-config') await deckConfigModal(id);
    else if (a === 'convert-notes') convertNotesModal(id);
    else if (a === 'new-image-occlusion') imageOcclusionModal(id);
    else if (a === 'undo-io-rect') {
      if (currentIoShapes.length) { currentIoShapes.pop(); renderIoShapes(); }
    }
    else if (a === 'clear-io-rects') { currentIoShapes = []; renderIoShapes(); }
    else if (a === 'parse-notes') {
      const raw = $('#notes-raw-input')?.value || '';
      renderNotesPreview(parseNotesIntoCards(raw));
    }
    else if (a === 'remove-converted-card') {
      const idx = Number(el.dataset.idx);
      convertedNotesCards.splice(idx, 1);
      renderNotesPreview(convertedNotesCards);
    }
    else if (a === 'reset-card') {
      if (confirm('¿Reiniciar el progreso de esta tarjeta para estudiarla como nueva?')) {
        loading(true);
        try {
          await api('cards/reset', { id });
          toast('Progreso reiniciado. La tarjeta vuelve a estar en estado nuevo.');
          if (view === 'stats') await loadDetailedStats();
          render();
        } catch (err) { toast(err.message, true); }
        finally { loading(false); }
      }
    }
    else if (a === 'copy-sync-url') {
      const url = $('#sync-url-text')?.textContent;
      if (url && navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => toast('Enlace copiado al portapapeles: ' + url));
      } else if (url) {
        prompt('Copia este enlace para tu teléfono:', url);
      }
    }
    else if (a === 'open-sync-mobile') {
      const url = $('#sync-url-text')?.textContent;
      if (url) window.open(url, '_blank');
    }
    else if (a === 'firebase-login-modal') firebaseLoginModal();
    else if (a === 'firebase-logout') {
      window.LumcardsSync?.firebase?.signOut();
      render();
      toast('Sesión cerrada en Firebase.');
    }
    else if (a === 'firebase-sync-now') {
      loading(true);
      try {
        const stats = {
          totalCards: data.cards?.length || 0,
          totalDecks: data.decks?.length || 0,
          streak: data.streak || 0,
          dailyGoal: data.settings?.dailyGoal || 20,
          lastSync: new Date().toISOString()
        };
        await window.LumcardsSync?.firebase?.saveProgress(stats);
        toast('¡Progreso y rachas sincronizados con Firebase con éxito!');
      } catch(err) {
        toast(err.message, true);
      } finally {
        loading(false);
        render();
      }
    }
    else if (a === 'drive-connect') driveConnectModal();
    else if (a === 'drive-disconnect') {
      window.LumcardsSync?.drive?.signOut();
      render();
      toast('Google Drive desconectado.');
    }
    else if (a === 'drive-backup-now') {
      loading(true);
      try {
        const res = await fetch('/api/sync/export');
        if (!res.ok) throw new Error('No se pudo generar el archivo de exportación');
        const blob = await res.blob();
        const now = new Date().toISOString().slice(0, 10);
        const filename = `lumcards_backup_${now}.colpkg`;
        await window.LumcardsSync?.drive?.uploadDeck(blob, filename);
        toast(`¡Copia guardada en tu Google Drive! (${filename})`);
      } catch(err) {
        toast('Error al respaldar en Drive: ' + err.message, true);
      } finally {
        loading(false);
        render();
      }
    }
    else if (a === 'drive-list-modal') await driveListModal();
    else if (a === 'drive-download-file') {
      loading(true);
      try {
        const fileId = el.dataset.fileId;
        const filename = el.dataset.filename || 'drive_deck.colpkg';
        const blob = await window.LumcardsSync?.drive?.downloadDeck(fileId);
        const file = new File([blob], filename);
        await uploadFile(file);
        modal.close();
        toast('¡Mazo descargado de Google Drive e importado con éxito!');
        await refresh();
      } catch(err) {
        toast('Error al descargar de Drive: ' + err.message, true);
      } finally {
        loading(false);
        render();
      }
    }
    else if (a === 'import') importModal();
    else if (a === 'pick-file') { if (!busy) $('#import-file').click(); }
    else if (a === 'goal') {
      showModal('Una meta que puedas mantener.', 'Empieza con algo pequeño. Siempre puedes cambiarlo.', `<form id="goal-form"><label class="field">Repasos por día<input name="dailyGoal" type="number" min="1" max="1000" value="${data.settings.dailyGoal || 20}" required autofocus></label><div class="form-error" role="alert"></div><div class="form-footer"><button class="btn btn-primary" data-mutate>Guardar meta</button></div></form>`);
    }
    else if (a === 'layout') { layout = el.dataset.layout; render(); }
    else if (a === 'filter') { filter = el.dataset.filter; render(); }
    else if (a === 'clear-search') { search = ''; filter = 'all'; render(); }
    else if (a === 'open-deck') { selectedDeck = id; view = 'cards'; search = ''; await loadCards(); render(); }
    else if (a === 'page-prev' || a === 'page-next') {
      await loadCards(Math.max(0, browsePage.offset + (a === 'page-next' ? 50 : -50)));
      render();
    }
    else if (a === 'back-decks' || a === 'exit-study') {
      AudioController.stop();
      if (document.fullscreenElement && document.exitFullscreen) {
        try { await document.exitFullscreen(); } catch {}
      }
      isFullscreen = false;
      await refresh(false);
      view = 'decks';
      selectedDeck = null;
      render();
    }
    else if (a === 'study') await startStudy(id);
    else if (a === 'reveal') { revealed = true; render(); }
    else if (a === 'rate') await rate(Number(el.dataset.rating));
    else if (a === 'replay-audio') {
      const c = currentCard();
      if (c) {
        const audios = revealed ? (c.answerAudios || []) : (c.questionAudios || []);
        if (audios.length) AudioController.playList(audios);
      }
    }
    else if (a === 'skip-card') {
      loading(true);
      await api('skip', { id: currentCard().id });
      reviewSession = await api('study', { deckId: selectedDeck });
      revealed = false;
      sessionStarted = Date.now();
      render();
      loading(false);
    }
    else if (a === 'star') {
      if (busy) return;
      loading(true);
      const was = data.cards.find(c => String(c.id) === String(id))?.starred;
      await api('star', { id });
      await refresh(false);
      if (currentCard() && String(currentCard().id) === String(id)) currentCard().starred = !was;
      render();
      if (modal.open && $('#preview-frame')) await previewCard(id);
      toast(was ? 'Tarjeta quitada de favoritos.' : 'Tarjeta guardada en favoritos.');
      loading(false);
    }
    else if (a === 'preview-card') await previewCard(id);
    else if (a === 'backup') {
      if (busy) return;
      loading(true);
      await api('backup', {});
      backupList = await api('backups');
      render();
      toast('Copia de seguridad creada.');
      loading(false);
    }
    else if (a === 'export-deck') {
      location.href = '/api/export?deckId=' + encodeURIComponent(id);
    }
    else if (a === 'delete-card' || a === 'delete-deck') await confirmDelete(a === 'delete-card' ? 'card' : 'deck', id);
    else if (a === 'confirm-delete') {
      if (busy) return;
      loading(true);
      await api('delete', { id, type: el.dataset.type });
      modal.close();
      if (el.dataset.type === 'deck') { view = 'decks'; selectedDeck = null; }
      await refresh();
      toast('Eliminado. Se guardó una copia antes del cambio.');
      loading(false);
    }
    else if (a === 'toggle-fullscreen') { await toggleFullscreen(); }
    else if (a === 'open-templates') { await templateEditorModal(); }
    else if (a === 'stats-forecast-range') { statsForecastRange = Number(el.dataset.val); render(); }
    else if (a === 'stats-forecast-cumul') { statsForecastCumul = $('#chk-forecast-cumul') ? $('#chk-forecast-cumul').checked : !statsForecastCumul; render(); }
    else if (a === 'stats-history-range') { statsHistoryRange = Number(el.dataset.val); render(); }
    else if (a === 'stats-history-metric') { statsHistoryMetric = el.dataset.val; render(); }
    else if (a === 'stats-hourly-range') { statsHourlyRange = Number(el.dataset.val); render(); }
    else if (a === 'stats-buttons-range') { statsButtonsRange = Number(el.dataset.val); render(); }
    else if (a === 'stats-added-range') { statsAddedRange = el.dataset.val === 'all' ? 'all' : Number(el.dataset.val); render(); }
    else if (a === 'stats-ret-type') { statsRetentionType = el.value; render(); }
    else if (a === 'cal-prev-year') { await loadDetailedStats(statsDeck, statsCalendarYear - 1); render(); }
    else if (a === 'cal-next-year') { await loadDetailedStats(statsDeck, statsCalendarYear + 1); render(); }
    else if (a === 'print-stats') { window.print(); }
  } catch (error) {
    loading(false);
    toast(error.message, true);
  }
});

document.addEventListener('mouseover', e => {
  const cell = e.target.closest('.stats-cal-cell');
  if (cell && cell.dataset.info) {
    const textEl = document.getElementById('cal-hover-text');
    if (textEl) {
      textEl.textContent = cell.dataset.info;
      document.querySelectorAll('.stats-cal-cell.active-cell').forEach(c => c.classList.remove('active-cell'));
      cell.classList.add('active-cell');
    }
  }
});

async function toggleFullscreen(){
  isFullscreen=!isFullscreen;
  try{
    if(isFullscreen){
      if(!document.fullscreenElement&&document.documentElement.requestFullscreen){
        await document.documentElement.requestFullscreen();
      }
    }else{
      if(document.fullscreenElement&&document.exitFullscreen){
        await document.exitFullscreen();
      }
    }
  }catch{}
  render();
}
document.addEventListener('fullscreenchange',()=>{
  const isDocFs=!!document.fullscreenElement;
  if(isDocFs!==isFullscreen){
    isFullscreen=isDocFs;
    render();
  }
});

document.addEventListener('input',e=>{if(e.target.id==='global-search'){search=e.target.value;if(view!=='decks'&&view!=='cards'&&view!=='favorites'){view='cards';selectedDeck=null;}if(view==='cards'||view==='favorites'){clearTimeout(searchTimer);searchTimer=setTimeout(()=>loadCards().then(render).catch(e=>toast(e.message,true)),220);}else render();}const form=e.target.closest('#card-form');if(form&&!form.dataset.id){const f=new FormData(form);localStorage.setItem('anki2-draft',JSON.stringify(Object.fromEntries(f)));}});
document.addEventListener('change',async e=>{
  if(e.target.id==='deck-sort'){sort=e.target.value;render();}
  if(e.target.id==='note-kind')updateEditorKind();
  if(e.target.id==='stats-deck-select'){statsDeck=e.target.value;await loadDetailedStats(statsDeck,statsCalendarYear);render();}
  if(e.target.id==='chk-forecast-cumul'){statsForecastCumul=e.target.checked;render();}
  if(e.target.name==='ret-type'){statsRetentionType=e.target.value;render();}
});
$('#import-file').addEventListener('change',e=>{if(e.target.files[0])uploadFile(e.target.files[0]);});
document.addEventListener('submit',async e=>{const form=e.target;if(!['deck-form','folder-form','move-deck-form','new-book-form','card-form','settings-form','goal-form','template-form','exam-form','deck-config-form','convert-notes-form','image-occlusion-form','p2p-sync-form','firebase-auth-form','drive-auth-form'].includes(form.id))return;e.preventDefault();if(busy)return;loading(true);const values=Object.fromEntries(new FormData(form));try{if(form.id==='deck-form'){const result=await api('decks',{name:values.name});modal.close();await refresh();toast('Mazo creado. Añade tu primera tarjeta.');selectedDeck=result.id;await cardForm();}
else if(form.id==='folder-form'){const result=await api('decks',{name:values.name});modal.close();await refresh();toast('Carpeta «'+values.name+'» creada.');activeFolder=result.id;render();}
else if(form.id==='move-deck-form'){const deckId=form.dataset.id;const parentId=values.parentId==='root'?0:values.parentId;await api('decks/move',{deckId,parentId});modal.close();await refresh();toast('Libro organizado en la carpeta.');}
else if(form.id==='new-book-form'){const folderName=form.dataset.folder;const fullName=folderName+'::'+values.bookName.trim();const result=await api('decks',{name:fullName});modal.close();await refresh();toast('Libro «'+values.bookName+'» creado en la carpeta.');selectedDeck=result.id;await cardForm();}
else if(form.id==='card-form'){const isEdit=!!form.dataset.id;const result=await api(isEdit?'cards/edit':'cards',isEdit?{id:form.dataset.id,fields:Array.from({length:Number(form.dataset.fields)},(_,i)=>values['field_'+i]||''),tags:values.tags}:{...values,deckId:values.deckId||selectedDeck});if(!isEdit)localStorage.removeItem('anki2-draft');modal.close();if(view==='study'&&currentCard()&&String(currentCard().id)===String(form.dataset.id)){try{const freshCard=await api('cards/'+encodeURIComponent(form.dataset.id));if(freshCard&&reviewSession?.cards?.length){reviewSession.cards[0]=freshCard;lastPlayedKey=null;}}catch{}}await refresh();toast(result.warnings?.length?result.warnings.join(' '):'Tarjeta guardada y actualizada.');}
else if(form.id==='template-form'){await api('models/edit', {id: $('#template-model-select').value, templateIndex: 0, qfmt: $('#template-qfmt').innerHTML, afmt: $('#template-afmt').innerHTML, css: $('#template-css').value}); modal.close(); toast('Plantilla actualizada con éxito.');}
else if(form.id==='exam-form'){const deckId=values.deckId;const mode=values.mode;const limit=Number(values.limit||20);const alterScheduler=!!form.querySelector('#exam-alter-scheduler')?.checked;await startExam(deckId,mode,limit,alterScheduler);}
else if(form.id==='deck-config-form'){
  const deckId = form.dataset.id;
  const newPerDay = Number(values.newPerDay || 20);
  const revPerDay = Number(values.revPerDay || 200);
  await api('decks/config', { deckId, newPerDay, revPerDay });
  modal.close();
  await refresh();
  toast('Plan de estudio actualizado correctamente.');
}
else if(form.id==='convert-notes-form'){
  const deckId = values.deckId;
  const rows = form.querySelectorAll('.notes-card-row');
  const cardsToSave = [];
  rows.forEach(r => {
    const idx = Number(r.dataset.idx);
    const orig = convertedNotesCards[idx];
    if (!orig) return;
    const frontVal = r.querySelector('.card-edit-front')?.value || '';
    const backVal = r.querySelector('.card-edit-back')?.value || '';
    if (orig.kind === 'cloze') {
      if (frontVal.trim()) cardsToSave.push({ kind: 'cloze', text: frontVal.trim(), extra: backVal.trim() });
    } else {
      if (frontVal.trim() && backVal.trim()) cardsToSave.push({ kind: 'basic', front: frontVal.trim(), back: backVal.trim() });
    }
  });
  if (!cardsToSave.length) throw new Error('No hay tarjetas válidas para guardar.');
  const res = await api('cards/batch', { deckId, cards: cardsToSave });
  modal.close();
  await refresh();
  toast(`¡Listo! Se han creado ${res.created} tarjetas a partir de tus notas.`);
}
else if(form.id==='image-occlusion-form'){
  if (!currentIoImage) throw new Error('Por favor selecciona una imagen primero.');
  if (!currentIoShapes.length) throw new Error('Dibuja al menos una máscara con el ratón sobre la imagen.');
  const deckId = values.deckId;
  const header = values.header || '';
  const extra = values.extra || '';
  const res = await api('cards/image-occlusion', {
    deckId,
    imageFilename: currentIoImage,
    shapes: currentIoShapes,
    header,
    extra
  });
  modal.close();
  await refresh();
  toast(`¡Tarjeta de Oclusión de Imagen creada con ${res.occlusions} máscaras!`);
}
else if(form.id==='p2p-sync-form'){
  const peerUrl = $('#p2p-peer-url')?.value?.trim();
  if(!peerUrl) throw new Error('Ingresa la dirección o IP del otro equipo.');
  const res = await api('sync/peer', { peerUrl });
  await refresh();
  await loadSyncInfo();
  render();
  toast(`¡Sincronización P2P completada! Tarjetas añadidas: ${res.added||0}, Notas nuevas: ${res.newNotes||0}, Actualizadas: ${res.updatedNotes||0}.`);
}
else if(form.id==='firebase-auth-form'){
  const email = values.email?.trim();
  const pass = values.password;
  const isRegister = values.authMode === 'register';
  const name = values.displayName?.trim() || email.split('@')[0];
  if (isRegister) {
    await window.LumcardsSync?.firebase?.register(email, pass, name);
    toast('¡Cuenta de Firebase creada con éxito!');
  } else {
    await window.LumcardsSync?.firebase?.signIn(email, pass);
    toast('¡Sesión iniciada en Firebase!');
  }
  modal.close();
  render();
}
else if(form.id==='drive-auth-form'){
  const email = values.email?.trim();
  const clientId = values.clientId?.trim();
  if (clientId && window.LumcardsSync?.drive) {
    window.LumcardsSync.drive.clientId = clientId;
  }
  await window.LumcardsSync?.drive?.signIn(email);
  modal.close();
  render();
  toast('¡Google Drive conectado correctamente!');
}
else{const dailyGoal=Number(form.id==='settings-form'?$('#daily-goal').value:values.dailyGoal);await api('settings',{dailyGoal});modal.close();await refresh();toast('Tu meta se ha guardado.');}}catch(error){const err=form.querySelector('.form-error');if(err)err.textContent=error.message;toast(error.message,true);}finally{loading(false);}});
async function handleStudyKey(code,key){if(busy||modal.open||view!=='study'||!currentCard())return;AudioController.unlock();const isSpace=code==='Space'||key===' '||key==='Space'||code==='Enter'||key==='Enter';if(isSpace&&!revealed){revealed=true;render();}else if(isSpace&&revealed){await rate(3);}else if(revealed&&/^[1-4]$/.test(key)){await rate(Number(key));}else if(key==='f'||key==='F'){await toggleFullscreen();}else if(key==='Escape'){if(document.fullscreenElement&&document.exitFullscreen){try{await document.exitFullscreen();}catch{}}isFullscreen=false;AudioController.stop();await refresh(false);view='decks';selectedDeck=null;render();}else if(key==='e'||key==='E'){await cardForm(currentCard().id);}else if(key==='r'||key==='R'){const c=currentCard();if(c){const audios=revealed?(c.answerAudios||[]):(c.questionAudios||[]);if(audios.length)AudioController.playList(audios);}}else if(key==='s'||key==='S'){const c=currentCard();if(c){loading(true);const was=c.starred;await api('star',{id:c.id});c.starred=!was;render();toast(was?'Tarjeta quitada de favoritos.':'Tarjeta guardada en favoritos.');loading(false);}}}
document.addEventListener('keydown',e=>{AudioController.unlock();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#global-search')?.focus();return;}if(modal.open){if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){const subBtn=modal.querySelector('button.btn-primary, button[data-mutate]');if(subBtn){e.preventDefault();subBtn.click();return;}}return;}if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||busy)return;if(view==='study'&&currentCard()){const isSpace=e.code==='Space'||e.key===' '||e.key==='Space'||e.code==='Enter'||e.key==='Enter';if(isSpace||/^[1-4]$/.test(e.key)||['f','F','Escape','s','S','e','E','r','R'].includes(e.key)){e.preventDefault();handleStudyKey(e.code,e.key).catch(err=>toast(err.message,true));}}});
window.addEventListener('message',e=>{AudioController.unlock();if(e.data){if(e.data.ankiPlayAudio){AudioController.playSingle(e.data.ankiPlayAudio);}else if(e.data.ankiCardClick){if(view==='study'&&!revealed&&currentCard()){revealed=true;render();}}else if(e.data.ankiKey||e.data.ankiCode){handleStudyKey(e.data.ankiCode,e.data.ankiKey).catch(err=>toast(err.message,true));}}});
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});
async function boot(){
  try{
    await refresh();
  }catch(error){
    console.warn('Conmutando a Modo Web Cloud:', error);
    isWebMode = true;
    try {
      await refresh();
      toast('Modo Web Cloud activado · Tarjetas guardadas en este navegador');
    } catch(err2) {
      app.innerHTML=`<main class="initial"><div class="error-panel"><div class="brand-mark">L<span>✦</span></div><h1>Vamos a abrir tu biblioteca.</h1><p>${esc(err2.message)}</p><button class="btn btn-primary" id="retry">Volver a intentar</button></div></main>`;
      $('#retry').addEventListener('click',boot);
    }
  }
}
boot();

// Optional browser-native agent tools. All mutations use the same local API.
if(document.modelContext?.registerTool){
  const lifetime=new AbortController();
  window.addEventListener('pagehide',()=>lifetime.abort(),{once:true});
  const definitions=[{
    name:'lumcards_list_decks',title:'Consultar mazos de Lumcards',description:'Consulta los mazos de la biblioteca local y sus tarjetas disponibles para estudiar.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},
    async execute(){await refresh();return {decks:data.decks.map(d=>({id:d.id,name:d.name,total:d.total,available:d.due}))};}
  },{
    name:'lumcards_create_card',title:'Crear tarjeta en Lumcards',description:'Guarda una nueva tarjeta básica en un mazo existente de la biblioteca local y actualiza la interfaz.',inputSchema:{type:'object',properties:{deckId:{type:'number'},front:{type:'string'},back:{type:'string'},tags:{type:'string'}},required:['deckId','front','back'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},
    async execute(input){if(!input||!Number.isSafeInteger(input.deckId)||typeof input.front!=='string'||!input.front.trim()||typeof input.back!=='string'||!input.back.trim()||(input.tags!==undefined&&typeof input.tags!=='string'))throw new Error('Indica un mazo, una pregunta y una respuesta válidos.');const result=await api('cards',input);await refresh();return {id:result.id,deckId:result.deckId,saved:true};}
  }];
  for(const definition of definitions){try{Promise.resolve(document.modelContext.registerTool(definition,{signal:lifetime.signal})).catch(()=>{});}catch{}}
}

let lastEditorField=null;
document.addEventListener('focusin',e=>{if(e.target.matches('#card-form textarea'))lastEditorField=e.target;});
$('#attach-file').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file||busy)return;
  const field=lastEditorField?.isConnected?lastEditorField:$('#card-form textarea');if(!field)return;
  if(file.size>30*1024*1024){toast('El archivo supera el límite de 30 MB.',true);e.target.value='';return;}
  loading(true);
  try{const response=await fetch('/api/media?name='+encodeURIComponent(file.name),{method:'POST',headers:{'X-Anki-Request':'1','Content-Type':'application/octet-stream'},body:file});const result=await response.json();if(!response.ok)throw new Error(result.error||'No se pudo guardar el archivo.');const snippet=result.kind==='image'?'<img src="'+esc(result.name)+'" alt="">':'[sound:'+result.name+']';field.setRangeText(snippet,field.selectionStart,field.selectionEnd,'end');field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();toast('Archivo añadido. Guarda la tarjeta para conservar el cambio.');}catch(err){toast(err.message,true);}finally{loading(false);e.target.value='';}
});

async function templateEditorModal() {
  const current = getCardCustomStyle();
  let tempConfig = { ...current };
  let isPreviewFlipped = false;

  const themesHtml = Object.entries(CARD_THEMES).map(([key, t]) => `
    <button type="button" class="styler-theme-btn ${tempConfig.theme === key ? 'active' : ''}" data-styler-theme="${key}">
      <div class="styler-swatch" style="background:${t.swatch};border:1.5px solid ${t.swatchBorder};color:${t.text}">Aa</div>
      <div class="styler-theme-name">${esc(t.name)}</div>
      <div class="styler-theme-desc">${esc(t.desc)}</div>
    </button>
  `).join('');

  showModal('Personalizar Diseño de Tarjetas', 'Personaliza el estilo visual, tipografía y colores de tus tarjetas y repasos.', `
    <div class="styler-modal">
      <div class="styler-grid">
        <div class="styler-controls">
          <div>
            <label class="field-label" style="font-weight:700;font-size:13px;display:block;margin-bottom:8px">Temas visuales prémium</label>
            <div class="styler-themes-grid">
              ${themesHtml}
            </div>
          </div>

          <div class="styler-row">
            <label class="field">
              <span class="field-label"><strong>Tipografía</strong></span>
              <select id="styler-font-select">
                <option value="sans" ${tempConfig.font==='sans'?'selected':''}>Inter (Sans-serif moderna)</option>
                <option value="serif" ${tempConfig.font==='serif'?'selected':''}>Georgia (Serif clásica)</option>
                <option value="mono" ${tempConfig.font==='mono'?'selected':''}>Consolas (Código / Monospace)</option>
                <option value="rounded" ${tempConfig.font==='rounded'?'selected':''}>Outfit (Redondeada / Amigable)</option>
              </select>
            </label>
            <label class="field">
              <span class="field-label"><strong>Tamaño de letra</strong></span>
              <select id="styler-size-select">
                <option value="18px" ${tempConfig.size==='18px'?'selected':''}>Pequeño (18px)</option>
                <option value="22px" ${tempConfig.size==='22px'?'selected':''}>Estándar (22px)</option>
                <option value="26px" ${tempConfig.size==='26px'?'selected':''}>Grande (26px)</option>
                <option value="32px" ${tempConfig.size==='32px'?'selected':''}>Extra grande (32px)</option>
              </select>
            </label>
          </div>

          <div class="styler-row">
            <label class="field">
              <span class="field-label"><strong>Alineación del texto</strong></span>
              <select id="styler-align-select">
                <option value="center" ${tempConfig.align==='center'?'selected':''}>Centrado (Estilo Quizlet)</option>
                <option value="left" ${tempConfig.align==='left'?'selected':''}>Izquierda (Estilo editorial)</option>
              </select>
            </label>
            <label class="field">
              <span class="field-label"><strong>Color de resaltado (Cloze)</strong></span>
              <select id="styler-cloze-select">
                <option value="#818cf8" ${tempConfig.cloze==='#818cf8'?'selected':''}>Índigo eléctrico</option>
                <option value="#f97316" ${tempConfig.cloze==='#f97316'?'selected':''}>Naranja cálido</option>
                <option value="#10b981" ${tempConfig.cloze==='#10b981'?'selected':''}>Verde esmeralda</option>
                <option value="#38bdf8" ${tempConfig.cloze==='#38bdf8'?'selected':''}>Azul cian</option>
                <option value="#f43f5e" ${tempConfig.cloze==='#f43f5e'?'selected':''}>Rosa neón</option>
              </select>
            </label>
          </div>
        </div>

        <div class="styler-preview-box">
          <label class="field-label" style="font-weight:700;font-size:13px;display:flex;justify-content:space-between;align-items:center">
            <span>Vista previa interactiva</span>
            <span class="small muted">Haz clic en la tarjeta para voltearla</span>
          </label>

          <div class="styler-preview-card" id="styler-preview-card">
            <div class="styler-card-inner" id="styler-card-inner">
              <div class="styler-card-face front" id="styler-card-front">
                <span class="badge" style="position:absolute;top:16px;left:20px;font-size:11px">ANVERSO</span>
                <div id="styler-preview-q" style="width:100%">
                  ¿Cuál es el proceso celular mediante el cual las plantas convierten luz en energía?
                  <div style="margin-top:10px"><span class="cloze">[Fotosíntesis]</span></div>
                </div>
              </div>
              <div class="styler-card-face back" id="styler-card-back">
                <span class="badge" style="position:absolute;top:16px;left:20px;font-size:11px">REVERSO</span>
                <div id="styler-preview-a" style="width:100%">
                  <strong class="cloze" style="font-size:1.1em">Fotosíntesis</strong>
                  <p style="margin-top:8px;opacity:0.85;font-size:0.9em">Transformación del agua y dióxido de carbono en glucosa y oxígeno impulsada por fotones en los cloroplastos.</p>
                </div>
              </div>
            </div>
          </div>

          <button type="button" class="styler-flip-pill" id="styler-btn-flip">
            ${icon('spark')} Girar tarjeta (Ver reverso / anverso)
          </button>
        </div>
      </div>

      <div class="form-footer" style="margin-top:22px">
        ${button('Cancelar', 'close-modal')}
        <button type="button" class="btn btn-primary" id="styler-btn-save">
          ${icon('check')} Guardar diseño de tarjetas
        </button>
      </div>
    </div>
  `);

  setTimeout(() => {
    const updatePreviewUI = () => {
      const themeObj = CARD_THEMES[tempConfig.theme] || CARD_THEMES.quizlet;
      const fontFamilies = {
        sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        serif: "Georgia, 'Charter', 'Times New Roman', serif",
        mono: "Consolas, 'Courier New', monospace",
        rounded: "'Outfit', 'Quicksand', 'Segoe UI', sans-serif"
      };
      const frontFace = $('#styler-card-front');
      const backFace = $('#styler-card-back');
      const inner = $('#styler-card-inner');

      if (!frontFace || !backFace || !inner) return;

      const styles = {
        background: themeObj.bg,
        color: themeObj.text,
        fontFamily: fontFamilies[tempConfig.font] || fontFamilies.sans,
        fontSize: tempConfig.size || '22px',
        textAlign: tempConfig.align || 'center',
        borderColor: themeObj.hr
      };

      [frontFace, backFace].forEach(face => {
        face.style.background = styles.background;
        face.style.color = styles.color;
        face.style.fontFamily = styles.fontFamily;
        face.style.fontSize = styles.fontSize;
        face.style.textAlign = styles.textAlign;
        face.style.borderColor = styles.borderColor;
        face.querySelectorAll('.cloze').forEach(el => {
          el.style.color = tempConfig.cloze || themeObj.cloze;
          el.style.borderBottom = '2px solid ' + (tempConfig.cloze || themeObj.cloze);
        });
      });

      if (inner) {
        inner.classList.toggle('flipped', isPreviewFlipped);
      }
    };

    // Theme selector
    document.querySelectorAll('.styler-theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.styler-theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tempConfig.theme = btn.dataset.stylerTheme;
        const selTheme = CARD_THEMES[tempConfig.theme];
        if (selTheme) {
          tempConfig.cloze = selTheme.cloze;
          if ($('#styler-cloze-select')) $('#styler-cloze-select').value = selTheme.cloze;
        }
        updatePreviewUI();
      });
    });

    $('#styler-font-select')?.addEventListener('change', e => {
      tempConfig.font = e.target.value;
      updatePreviewUI();
    });

    $('#styler-size-select')?.addEventListener('change', e => {
      tempConfig.size = e.target.value;
      updatePreviewUI();
    });

    $('#styler-align-select')?.addEventListener('change', e => {
      tempConfig.align = e.target.value;
      updatePreviewUI();
    });

    $('#styler-cloze-select')?.addEventListener('change', e => {
      tempConfig.cloze = e.target.value;
      updatePreviewUI();
    });

    const toggleFlip = () => {
      isPreviewFlipped = !isPreviewFlipped;
      $('#styler-card-inner')?.classList.toggle('flipped', isPreviewFlipped);
    };

    $('#styler-preview-card')?.addEventListener('click', toggleFlip);
    $('#styler-btn-flip')?.addEventListener('click', toggleFlip);

    $('#styler-btn-save')?.addEventListener('click', () => {
      localStorage.setItem('lumcards-card-style', JSON.stringify(tempConfig));
      modal.close();
      toast('¡Diseño de tarjetas guardado! Aplicado a todos tus repasos y tarjetas.');
    });

    updatePreviewUI();
  }, 60);
}
