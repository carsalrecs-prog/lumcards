(function () {
  'use strict';

  const content = document.querySelector('#play-content');
  const status = document.querySelector('#play-status');
  const tabs = Array.from(document.querySelectorAll('.play-tabs .btn'));

  const modeNames = {
    learn: '🧠 Entrenador Neural',
    match: '⚡ Ráfaga de Conexión',
    flash: '🎴 Giro 3D Studio',
    write: '✍️ Desafío de Memoria Activa',
    test: '🏆 Arena de Simulación',
    choice: '🎯 Duelo de Opciones'
  };

  // ── Confetti Particle Engine (Zero-Dependencies) ───────────
  const Confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    animId: null,
    init() {
      this.canvas = document.getElementById('confetti-canvas');
      if (this.canvas) this.ctx = this.canvas.getContext('2d');
    },
    burst(count = 75) {
      this.init();
      if (!this.canvas || !this.ctx) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#14b8a6'];
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: window.innerWidth * (0.35 + Math.random() * 0.3),
          y: window.innerHeight * 0.45,
          vx: (Math.random() - 0.5) * 18,
          vy: (Math.random() - 0.85) * 18,
          size: Math.random() * 8 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          vrot: (Math.random() - 0.5) * 14,
          alpha: 1.0,
          decay: Math.random() * 0.016 + 0.008
        });
      }
      if (!this.animId) this.loop();
    },
    loop() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.38; // Gravedad
        p.vx *= 0.98;
        p.rotation += p.vrot;
        p.alpha -= p.decay;
        if (p.alpha <= 0 || p.y > this.canvas.height) {
          this.particles.splice(i, 1);
          continue;
        }
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.globalAlpha = Math.max(0, p.alpha);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        this.ctx.restore();
      }
      if (this.particles.length > 0) {
        this.animId = requestAnimationFrame(() => this.loop());
      } else {
        this.animId = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  };

  // ── Reproductor de Audio Nativo para Mazos Anki ─────────────
  const AudioPlayer = {
    currentAudio: null,
    play(url, btn) {
      if (!url) return;
      try {
        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio = null;
        }
        const audio = new Audio(url);
        this.currentAudio = audio;
        if (btn) btn.classList.add('playing');
        audio.play().catch(() => {});
        audio.onended = () => {
          if (btn) btn.classList.remove('playing');
          this.currentAudio = null;
        };
        audio.onerror = () => {
          if (btn) btn.classList.remove('playing');
          this.currentAudio = null;
        };
      } catch (_) {}
    }
  };

  // ── Efectos de Sonido Sintetizados (Web Audio API) ──────────
  const SoundFX = {
    ctx: null,
    enabled: localStorage.getItem('lumcards-sound') !== 'false',
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('lumcards-sound', String(this.enabled));
      return this.enabled;
    },
    playFlip() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.exponentialRampToValueAtTime(480, t + 0.07);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.07);
      } catch (_) {}
    },
    playSelect() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(540, t);
        osc.frequency.exponentialRampToValueAtTime(320, t + 0.05);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.05);
      } catch (_) {}
    },
    playCorrect() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + idx * 0.05);
          gain.gain.setValueAtTime(0.09, t + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.28);
          osc.connect(gain); gain.connect(this.ctx.destination);
          osc.start(t + idx * 0.05); osc.stop(t + idx * 0.05 + 0.28);
        });
      } catch (_) {}
    },
    playCombo(count) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const baseFreq = Math.min(1250, 523.25 + ((count || 1) * 75));
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, t + 0.12);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.15);
      } catch (_) {}
    },
    playWrong() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(190, t);
        osc.frequency.linearRampToValueAtTime(120, t + 0.16);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.16);
      } catch (_) {}
    },
    playVictory() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        const t = this.ctx.currentTime;
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t + idx * 0.08);
          gain.gain.setValueAtTime(0.11, t + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.38);
          osc.connect(gain); gain.connect(this.ctx.destination);
          osc.start(t + idx * 0.08); osc.stop(t + idx * 0.08 + 0.38);
        });
      } catch (_) {}
    }
  };

  const state = {
    tab: 'play',
    decks: [],
    ready: false,
    deckId: 'all',
    size: 10,
    ignoreAccents: false,
    reverseDirection: localStorage.getItem('lumcards-reverse-dir') === 'true',
    shuffle: localStorage.getItem('lumcards-shuffle') !== 'false',
    loading: false,
    session: null,
    history: null,
    historyLoading: false,
    historyError: '',
    pending: [],
    matchTimerInterval: null
  };

  const input = {
    source: 'paste',
    file: null,
    text: '',
    separator: 'auto',
    header: true,
    preview: null,
    busy: false,
    revision: 0,
    deckId: '',
    newDeck: '',
    message: '',
    error: ''
  };

  const pendingKey = 'anki2-practice-pending-v2';

  try {
    document.documentElement.classList.toggle('dark', localStorage.getItem('anki2-theme') === 'dark');
  } catch (_) {}

  function node(tag, props, children) {
    const element = document.createElement(tag);
    Object.entries(props || {}).forEach(([key, value]) => {
      if (key === 'className') element.className = value;
      else if (key === 'text') element.textContent = value;
      else if (key === 'html') element.innerHTML = value;
      else if (key === 'checked' || key === 'disabled' || key === 'selected' || key === 'required') element[key] = Boolean(value);
      else if (key === 'value') element.value = value;
      else if (value !== null && value !== undefined) element.setAttribute(key, String(value));
    });
    (children || []).forEach(child => {
      if (child !== null && child !== undefined) {
        element.append(typeof child === 'string' ? document.createTextNode(child) : child);
      }
    });
    return element;
  }

  const text = (tag, value, className) => node(tag, { text: value, className: className || '' });
  const button = (label, action, props) => node('button', { type: 'button', className: 'btn', 'data-action': action, text: label, ...props });
  function field(label, control) { return node('label', { className: 'field' }, [text('span', label), control]); }
  function say(message, error) { status.textContent = message || ''; status.classList.toggle('error', Boolean(error)); }
  function focus(selector) { requestAnimationFrame(() => content.querySelector(selector)?.focus()); }
  function humanTime(ms) {
    const seconds = Math.round(Math.max(0, Number(ms) || 0) / 1000);
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    const val = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return [val.slice(0, 8), val.slice(8, 12), val.slice(12, 16), val.slice(16, 20), val.slice(20)].join('-');
  }

  async function api(path, body, raw) {
    const options = body === undefined ? {} : {
      method: 'POST',
      headers: { 'X-Lumcards-Request': '1', 'X-Anki-Request': '1', 'Content-Type': raw ? 'application/octet-stream' : 'application/json' },
      body: raw ? body : JSON.stringify(body)
    };
    try {
      const response = await fetch(path, options);
      if (!response.ok) {
        let result;
        try { result = await response.json(); } catch (_) {}
        throw new Error(result?.error || 'Error en la operación (' + response.status + ').');
      }
      return await response.json();
    } catch (err) {
      // Soporte autónomo para Modo Web Cloud (Vercel / Offline)
      if (path.includes('/api/state') || path.includes('/api/exam/start')) {
        try {
          const rawStore = localStorage.getItem('lumcards_web_data');
          if (rawStore) {
            const store = JSON.parse(rawStore);
            if (path.includes('/api/state')) {
              return { decks: store.decks || [], isWebMode: true };
            }
            if (path.includes('/api/exam/start')) {
              const deckId = body?.deckId;
              let list = store.cards || [];
              if (deckId && deckId !== 'all') list = list.filter(c => String(c.deckId) === String(deckId));
              return { cards: list.slice(0, 200) };
            }
          }
        } catch (_) {}
      }
      throw err;
    }
  }

  function errorMessage(error) { return error instanceof Error ? error.message : 'No se pudo completar la operación.'; }

  function deckSelect(id, value, includeAll, includeNew, disabled) {
    const options = [];
    if (includeAll) options.push(node('option', { value: 'all', text: 'Todos mis mazos', selected: value === 'all' }));
    if (!includeAll && !state.decks.length) options.push(node('option', { value: '', text: 'Crea un mazo para importar' }));
    state.decks.forEach(deck => options.push(node('option', { value: deck.id, text: `${deck.name} (${deck.total || 0} tarjetas)`, selected: String(value) === String(deck.id) })));
    if (includeNew) options.push(node('option', { value: 'new', text: '+ Crear un mazo nuevo', selected: value === 'new' }));
    return node('select', { id, disabled }, options);
  }

  // ── Extracción y Adaptación de Medios Anki ───────────────────
  function sanitizeMediaUrl(src) {
    if (!src) return '';
    const s = String(src).trim();
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:') || s.startsWith('/media/')) {
      return s;
    }
    const clean = s.replace(/^[./\\]+/, '');
    return '/media/' + encodeURIComponent(clean);
  }

  function extractImagesFromHtml(html) {
    if (!html || typeof html !== 'string') return [];
    const matches = [];
    const rx = /<img[^>]+src=["']?([^"'>\s]+)["']?[^>]*>/gi;
    let m;
    while ((m = rx.exec(html)) !== null) {
      if (m[1]) matches.push(sanitizeMediaUrl(m[1]));
    }
    return matches;
  }

  function extractAudios(card) {
    const list = [];
    if (Array.isArray(card.questionAudios)) {
      card.questionAudios.forEach(a => { if (a) list.push(sanitizeMediaUrl(a)); });
    }
    if (Array.isArray(card.answerAudios)) {
      card.answerAudios.forEach(a => { if (a) list.push(sanitizeMediaUrl(a)); });
    }
    const allText = (card.front || '') + ' ' + (card.back || '') + ' ' + (card.rawFront || '') + ' ' + (card.rawBack || '');
    const rx = /\[sound:([^\]]+)\]/gi;
    let m;
    while ((m = rx.exec(allText)) !== null) {
      if (m[1]) list.push(sanitizeMediaUrl(m[1]));
    }
    if (Array.isArray(card.fields)) {
      card.fields.forEach(f => {
        let fm;
        while ((fm = rx.exec(f.value || '')) !== null) {
          if (fm[1]) list.push(sanitizeMediaUrl(fm[1]));
        }
      });
    }
    return Array.from(new Set(list));
  }

  function plainCardText(value) {
    const template = document.createElement('template');
    template.innerHTML = typeof value === 'string' ? value : '';
    template.content.querySelectorAll('script,style,audio,video,iframe,object,embed,svg,math,template,noscript').forEach(el => el.remove());
    template.content.querySelectorAll('br').forEach(el => el.replaceWith(document.createTextNode('\n')));
    template.content.querySelectorAll('p,div,li,tr,h1,h2,h3,h4,h5,h6,section,blockquote').forEach(el => el.append(document.createTextNode('\n')));
    return (template.content.textContent || '').replace(/\[sound:[^\]]*\]/gi, '').replace(/\s+/gu, ' ').trim();
  }

  // ── Adaptador Universal de Tarjetas Anki ─────────────────────
  function adaptCard(card) {
    if (!card || card.renderError) return null;
    let front = '', back = '', frontImage = '', backImage = '', ipa = '', example = '';
    const allAudios = extractAudios(card);

    // Extraer imágenes de anverso y reverso
    const fImgs = extractImagesFromHtml((card.front || '') + ' ' + (card.rawFront || ''));
    const bImgs = extractImagesFromHtml((card.back || '') + ' ' + (card.rawBack || ''));
    if (fImgs.length > 0) frontImage = fImgs[0];
    if (bImgs.length > 0) backImage = bImgs[0];

    // 1. Tarjetas Cloze (Huecos)
    if (card.isCloze) {
      const clozeMatch = (card.back || '').match(/<span class=["']?cloze["']?[^>]*>([\s\S]*?)<\/span>/i);
      if (clozeMatch) {
        back = plainCardText(clozeMatch[1]);
      }
      const frontText = plainCardText(card.front);
      if (frontText && (frontText.includes('[') || frontText.includes('...'))) {
        front = frontText;
      }
    }

    // 2. Mapeo semántico de campos múltiples (vocabulario, 4000 EEW, medicina, etc.)
    if (Array.isArray(card.fields) && card.fields.length >= 2) {
      const fieldMap = {};
      for (const f of card.fields) {
        const val = (f.value || '').trim();
        const clean = plainCardText(val);
        const name = f.name.toLowerCase().trim();

        const fieldImgs = extractImagesFromHtml(val);
        if (fieldImgs.length > 0 && !backImage && (name.includes('img') || name.includes('image') || name.includes('foto') || name.includes('pic'))) {
          backImage = fieldImgs[0];
        }

        // Descartar índices numéricos de control interno tipo 1_1_17
        if (clean && !clean.match(/^\d+(_\d+)*$/) && !['№', 'id', 'num', 'number', 'code'].includes(name)) {
          fieldMap[name] = clean;
        }

        if (name.includes('transcription') || name.includes('ipa') || name.includes('fonetic')) {
          ipa = clean;
        }
        if (name.includes('example') || name.includes('ejemplo') || name.includes('oracion')) {
          example = clean;
        }
      }

      const qKeys = ['word', 'palabra', 'term', 'término', 'english', 'concepto', 'expression', 'pregunta', 'front', 'question', 'text'];
      for (const k of qKeys) {
        if (fieldMap[k]) { front = fieldMap[k]; break; }
      }

      const aKeys = ['meaning', 'significado', 'definition', 'definición', 'translation', 'traducción', 'spanish', 'español', 'respuesta', 'back', 'extra'];
      for (const k of aKeys) {
        if (fieldMap[k] && fieldMap[k] !== front) { back = fieldMap[k]; break; }
      }

      if (!front || !back) {
        const validVals = Object.values(fieldMap).filter(v => v.length > 0);
        if (validVals.length >= 2) {
          front = front || validVals[0];
          back = back || validVals[1];
        }
      }
    }

    // 3. Corte por separador de plantilla <hr>
    if (!front || !back) {
      const backHtml = card.back || '';
      const hrSplit = backHtml.split(/<hr[^>]*>/i);
      if (hrSplit.length > 1) {
        const qFromHr = plainCardText(hrSplit[0]);
        const aFromHr = plainCardText(hrSplit.slice(1).join(' '));
        if (qFromHr && aFromHr) {
          front = front || qFromHr;
          back = back || aFromHr;
        }
      }
    }

    // 4. Campos estándar y textos planos
    front = front || plainCardText(card.rawFront) || plainCardText(card.frontText) || plainCardText(card.front);
    back = back || plainCardText(card.rawBack) || plainCardText(card.backText) || plainCardText(card.back);

    // Soporte para tarjetas cuyo contenido principal es una imagen (e.g. Banderas, Mapas, Anatomía)
    if (!front && frontImage) front = '[Imagen]';
    if (!back && backImage) back = '[Imagen]';

    // Invertir sentido si está activo en las opciones de estudio
    if (state.reverseDirection && front && back) {
      const tmp = front; front = back; back = tmp;
      const tmpImg = frontImage; frontImage = backImage; backImage = tmpImg;
    }

    if ((front || frontImage) && (back || backImage) && (front !== back || frontImage !== backImage)) {
      return {
        id: card.id,
        front: front || '[Imagen]',
        back: back || '[Imagen]',
        frontImage: frontImage || null,
        backImage: backImage || null,
        frontAudio: allAudios[0] || null,
        backAudio: allAudios[1] || allAudios[0] || null,
        ipa: ipa || null,
        example: example || null,
        isCloze: Boolean(card.isCloze)
      };
    }
    return null;
  }

  function practiceCards(raw) {
    const adapted = [];
    let skipped = 0;
    for (const card of raw) {
      const res = adaptCard(card);
      if (res) adapted.push(res);
      else skipped++;
    }
    const prepared = StudyGames.prepareCards(adapted);
    return { cards: prepared.cards, skipped: skipped + prepared.skipped };
  }

  function shuffle(cards) {
    const copy = cards.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // ── Render Pantalla Principal (Suite de Juegos) ───────────────
  function renderHome() {
    if (state.matchTimerInterval) { clearInterval(state.matchTimerInterval); state.matchTimerInterval = null; }

    const hero = node('section', { className: 'play-hero' }, [
      node('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px' }, [
        text('span', '✦ LUMCARDS STUDIO · SUITE DE APRENDIZAJE INTELIGENTE', 'play-eyebrow'),
        node('div', { style: 'display:flex;gap:8px;align-items:center' }, [
          button(SoundFX.enabled ? '🔊 Sonido: Activado' : '🔇 Sonido: Silenciado', 'toggle-sound', { className: 'btn btn-quiet', style: 'font-size:12.5px;padding:6px 12px' }),
          button('⚙️ Opciones de estudio', 'study-options', { className: 'btn btn-quiet', style: 'font-size:12.5px;padding:6px 12px' })
        ])
      ]),
      text('h1', 'Entrena, juega y domina cualquier mazo.'),
      text('p', 'Suite interactiva con física 3D, emparejamiento con combos de velocidad, aprendizaje neural adaptativo y evaluación inteligente. Totalmente privado y guardado en tu equipo.')
    ]);

    const settings = node('div', { className: 'play-settings' }, [
      field('Elige un mazo para entrenar', deckSelect('practice-deck', state.deckId, true, false, state.loading)),
      field('Tarjetas por sesión', node('select', { id: 'practice-size', disabled: state.loading }, [5, 10, 20, 30, 50].map(size => node('option', { value: size, text: size + ' tarjetas', selected: state.size === size })))),
      node('div', { style: 'align-self:flex-end;margin-bottom:4px' }, [
        node('span', { className: 'play-universal-badge', text: '✓ Adaptador Universal 100% Activo (Texto + Imágenes + Audio)' })
      ])
    ]);

    const modes = [
      ['learn', '🧠', 'Entrenador Neural', 'Sistema adaptativo inteligente estilo Quizlet Plus. Clasifica tus tarjetas en "En progreso" y "Dominadas", reforzando tus puntos débiles con distractores dinámicos y atajos [1-4].', '★ Insignia Adaptativa'],
      ['match', '⚡', 'Ráfaga de Conexión', 'Emparejamiento ultra-dinámico contrarreloj con multiplicadores de combo (x2, x3, x4), efectos sonoros ascendentes, tiles con imágenes y récord histórico al milisegundo.', '⚡ Velocidad Extrema'],
      ['flash', '🎴', 'Giro 3D Studio', 'Modo inmersivo con física de volteo 3D en tiempo real, soporte HD para fotos de Anki, pronunciación con audio nativo y atajos táctiles [Espacio, 1-4].', '🎴 Giro 3D Pro'],
      ['write', '✍️', 'Desafío de Memoria Activa', 'Memorización de alto impacto. Escribe la respuesta con motor Fuzzy que tolera acentos y pequeños deslices, con revelación inteligente de pistas.', '✍️ Memoria Activa'],
      ['test', '🏆', 'Arena de Simulación', 'Simulacro completo con opción múltiple, Verdadero/Falso y redacción. Calificación con tarjeta de puntuación, medalla de maestría y corrección detallada.', '🏆 Simulación Real'],
      ['choice', '🎯', 'Duelo de Opciones', 'Ronda relámpago de selección rápida. Entrena reflejos y reconocimiento inmediato con racha de aciertos continua y atajos numéricos directos.', '🎯 Reflejos Rápidos']
    ];

    const modeCards = modes.map(([mode, symbol, title, description, tag]) => node('article', { className: 'play-mode' }, [
      node('div', { style: 'display:flex;justify-content:space-between;width:100%;align-items:center' }, [
        text('span', symbol, 'play-symbol'),
        text('span', tag, 'play-mode-tag')
      ]),
      text('h2', title),
      text('p', description),
      button(state.loading ? 'Preparando…' : 'Comenzar ' + title, 'start', { 'data-mode': mode, className: 'btn btn-primary', disabled: state.loading || !state.ready })
    ]));

    content.replaceChildren(
      hero,
      settings,
      node('div', { className: 'play-modes' }, modeCards),
      text('p', '✓ Compatibilidad universal total: Las tarjetas con imágenes, fórmulas matemáticas KaTeX, audio nativo, huecos (cloze), notas de vocabulario multicampo y reversas se adaptan automáticamente a todos los juegos. El progreso de repaso de tu colección principal se mantiene intacto.', 'play-note')
    );

    if (!state.ready) content.append(button('Volver a cargar los mazos', 'reload'));
  }

  // ── Inicialización de Sesiones ───────────────────────────────
  async function start(mode, retryCards) {
    if (state.loading || !modeNames[mode]) return;
    if (state.matchTimerInterval) { clearInterval(state.matchTimerInterval); state.matchTimerInterval = null; }
    state.loading = true;
    say('Cargando tarjetas con soporte multimedia completo…');
    if (!retryCards) state.session = null;
    render();

    try {
      let pool, skipped = 0;
      let deckName = state.decks.find(deck => String(deck.id) === String(state.deckId))?.name || 'Todos mis mazos';

      if (retryCards) {
        pool = retryCards;
        deckName = state.session ? state.session.deckName : deckName;
      } else {
        const result = await api('/api/exam/start', { deckId: state.deckId === 'all' ? null : state.deckId, mode: 'random', limit: 200 });
        const prepared = practiceCards(Array.isArray(result.cards) ? result.cards : []);
        pool = prepared.cards;
        skipped = prepared.skipped;
      }

      if (!pool.length) {
        throw new Error('Este mazo no tiene tarjetas válidas. Prueba con otro mazo o importa tarjetas con contenido.');
      }

      const limit = retryCards ? pool.length : state.size;
      const session = {
        id: uuid(),
        mode,
        deckName,
        pool,
        skipped,
        started: Date.now(),
        index: 0,
        correct: 0,
        mistakes: 0,
        failed: [],
        answered: false,
        answer: '',
        isCorrect: false,
        completed: false,
        streak: 0,
        combo: 0,
        ignoreAccents: state.ignoreAccents
      };

      if (mode === 'choice') {
        session.questions = StudyGames.createChoiceSession(pool, { limit });
        session.total = session.questions.length;
      } else if (mode === 'write') {
        session.questions = shuffle(pool).slice(0, limit).map(card => ({
          id: card.id,
          front: card.front,
          answer: card.back,
          frontImage: card.frontImage,
          frontAudio: card.frontAudio,
          ipa: card.ipa,
          example: card.example
        }));
        session.total = session.questions.length;
      } else if (mode === 'match') {
        const gridData = StudyGames.createMatchGrid(pool, { limit: 6 });
        session.tiles = gridData.tiles;
        session.matched = new Set();
        session.selectedTile = null;
        session.total = gridData.totalPairs;
        session.elapsedMs = 0;
        session.bestTime = localStorage.getItem('codex_match_best_' + (state.deckId || 'all'));
        session.moves = 0;
      } else if (mode === 'learn') {
        const learnData = StudyGames.createLearnSession(pool, { limit });
        session.queue = learnData.cards.slice();
        session.learnData = learnData;
        session.currentCard = session.queue[0];
        session.question = learnData.generateQuestion(session.currentCard);
        session.total = session.queue.length;
        session.mastered = new Set();
      } else if (mode === 'test') {
        const testData = StudyGames.createTestSession(pool, { limit });
        session.questions = testData.questions;
        session.total = testData.total;
        session.answers = {};
      } else if (mode === 'flash') {
        session.cards = shuffle(pool).slice(0, limit);
        session.total = session.cards.length;
        session.flipped = false;
      }

      state.session = session;
      say(`${session.total} ${mode === 'match' ? 'parejas preparadas' : 'tarjetas listas'}. ¡A entrenar!`);

      if (mode === 'match') {
        state.matchTimerInterval = setInterval(() => {
          if (state.session && state.session.mode === 'match' && !state.session.completed) {
            state.session.elapsedMs = Date.now() - state.session.started;
            const timerEl = document.querySelector('#match-live-timer');
            if (timerEl) timerEl.textContent = (state.session.elapsedMs / 1000).toFixed(1) + 's';
          }
        }, 100);
      }
    } catch (error) {
      say(errorMessage(error), true);
    } finally {
      state.loading = false;
      render();
    }
  }

  function sessionHeader(session) {
    const parts = [
      node('div', { className: 'play-progress' }, [
        text('span', session.deckName),
        node('div', { className: 'play-badge-bar' }, [
          session.streak >= 2 ? node('span', { className: 'play-streak-badge', text: `🔥 Racha x${session.streak}` }) : null,
          text('span', `${session.index + 1} de ${session.total}`)
        ])
      ]),
      node('progress', { max: session.total, value: session.index + (session.answered ? 1 : 0) }),
      node('h1', { text: modeNames[session.mode] })
    ];
    if (session.skipped > 0) {
      parts.push(text('p', `${session.skipped} tarjetas omitidas automáticamente por falta de contenido.`, 'play-note'));
    }
    return parts;
  }

  // ── Render Modo 1: Giro 3D Studio (Flashcards) ───────────────
  function renderFlashcard(session) {
    const card = session.cards[session.index];
    const parts = sessionHeader(session);

    // Cara Frontal (Anverso)
    const frontChildren = [
      text('span', 'PREGUNTA (ANVERSO)', 'flashcard-badge')
    ];
    if (card.frontImage) {
      frontChildren.push(node('img', { src: card.frontImage, className: 'game-card-img', alt: 'Imagen de tarjeta' }));
    }
    if (card.frontAudio) {
      frontChildren.push(button('🔊 Escuchar', 'play-audio', { 'data-audio': card.frontAudio, className: 'game-audio-pill' }));
    }
    if (card.ipa) {
      frontChildren.push(text('span', `[ ${card.ipa} ]`, 'game-ipa-badge'));
    }
    frontChildren.push(text('p', card.front, 'flashcard-text'));
    frontChildren.push(text('span', 'Toca la tarjeta o presiona Espacio / Enter para voltear', 'flashcard-hint'));

    // Cara Trasera (Reverso)
    const backChildren = [
      text('span', 'RESPUESTA (REVERSO)', 'flashcard-badge')
    ];
    if (card.backImage && card.backImage !== card.frontImage) {
      backChildren.push(node('img', { src: card.backImage, className: 'game-card-img', alt: 'Imagen de tarjeta' }));
    }
    if (card.backAudio) {
      backChildren.push(button('🔊 Escuchar pronunciación', 'play-audio', { 'data-audio': card.backAudio, className: 'game-audio-pill' }));
    }
    backChildren.push(text('p', card.back, 'flashcard-text'));
    if (card.example) {
      backChildren.push(node('div', { className: 'game-example-box', html: `"${card.example}"` }));
    }
    backChildren.push(text('span', 'Califica cómo la recordaste:', 'flashcard-hint'));

    const inner = node('div', { id: 'flash-card-inner', className: 'flashcard-inner' + (session.flipped ? ' flipped' : '') }, [
      node('div', { className: 'flashcard-face front' }, frontChildren),
      node('div', { className: 'flashcard-face back' }, backChildren)
    ]);

    const cardBox = node('div', { className: 'flashcard-3d-box', 'data-action': 'flip-card' }, [inner]);
    parts.push(cardBox);

    if (session.flipped) {
      parts.push(node('div', { className: 'flashcard-ratings' }, [
        button('1 · Repetir', 'rate-flash', { 'data-quality': 0, className: 'btn' }),
        button('2 · Difícil', 'rate-flash', { 'data-quality': 1, className: 'btn' }),
        button('3 · Bueno', 'rate-flash', { 'data-quality': 2, className: 'btn btn-primary' }),
        button('4 · Fácil', 'rate-flash', { 'data-quality': 3, className: 'btn' })
      ]));
    }

    parts.push(button('Terminar sesión', 'cancel', { style: 'margin-top: 14px' }));
    content.replaceChildren(node('section', { className: 'panel play-session' }, parts));
  }

  // ── Render Modo 2: Entrenador Neural (Learn) ─────────────────
  function renderLearn(session) {
    const parts = sessionHeader(session);
    const q = session.question;

    const questionBox = node('div', { className: 'game-card-media' });
    if (q.frontImage) {
      questionBox.append(node('img', { src: q.frontImage, className: 'game-card-img', alt: 'Imagen de pregunta' }));
    }
    if (q.frontAudio) {
      questionBox.append(button('🔊 Escuchar', 'play-audio', { 'data-audio': q.frontAudio, className: 'game-audio-pill' }));
    }
    if (q.ipa) {
      questionBox.append(text('span', `[ ${q.ipa} ]`, 'game-ipa-badge'));
    }
    questionBox.append(text('p', q.front, 'play-question'));
    parts.push(questionBox);

    const optionsGrid = node('div', { className: 'play-options' }, q.options.map((option, index) => {
      const isCorrect = session.answered && option.correct;
      const isChosenWrong = session.answered && session.chosen === index && !option.correct;
      let btnClass = 'play-answer';
      if (isCorrect) btnClass += ' correct';
      if (isChosenWrong) btnClass += ' incorrect';

      return node('button', {
        type: 'button',
        className: btnClass,
        'data-action': 'answer-learn',
        'data-index': index,
        disabled: session.answered
      }, [
        node('span', { text: option.label }),
        node('span', { className: 'key-badge', text: '[' + (index + 1) + ']' })
      ]);
    }));
    parts.push(optionsGrid);

    if (session.answered) {
      const feedbackChildren = [
        text('strong', session.isCorrect ? '¡Excelente! Respuesta correcta.' : 'Tarjeta en refuerzo adaptativo.'),
        text('p', `Respuesta: ${q.back}`)
      ];
      if (q.example) {
        feedbackChildren.push(node('div', { className: 'game-example-box', html: `"${q.example}"` }));
      }
      feedbackChildren.push(button(session.mastered.size === session.total ? 'Ver resultados' : 'Siguiente tarjeta (Enter)', 'next-learn', { className: 'btn btn-primary' }));
      parts.push(node('div', { className: 'play-feedback' }, feedbackChildren));
    }

    parts.push(button('Terminar sesión', 'cancel', { style: 'margin-top: 14px' }));
    content.replaceChildren(node('section', { className: 'panel play-session' }, parts));
  }

  // ── Render Modo 3: Ráfaga de Conexión (Speed Match) ──────────
  function renderMatch(session) {
    const parts = [
      node('div', { className: 'play-progress' }, [
        text('span', session.deckName),
        node('div', { className: 'play-badge-bar' }, [
          session.combo >= 2 ? node('span', { className: 'play-streak-badge', text: `⚡ COMBO x${session.combo}!` }) : null,
          node('span', { id: 'match-live-timer', className: 'play-timer-badge', text: (session.elapsedMs / 1000).toFixed(1) + 's' }),
          session.bestTime ? text('span', `Récord: ${(Number(session.bestTime) / 1000).toFixed(1)}s`, 'play-record-badge') : null
        ])
      ]),
      node('progress', { max: session.total, value: session.matched.size }),
      node('h1', { text: modeNames.match }),
      text('p', 'Toca una ficha y encuentra su pareja correspondiente a toda velocidad. ¡Encadena aciertos para multiplicar tu combo!', 'play-note')
    ];

    const tilesElements = session.tiles.map((tile, index) => {
      const isMatched = session.matched.has(String(tile.pairId));
      const isSelected = session.selectedTile === index;
      const isWrong = session.wrongTiles && (session.wrongTiles[0] === index || session.wrongTiles[1] === index);

      let classes = 'match-grid-tile';
      if (isMatched) classes += ' matched';
      if (isSelected) classes += ' selected';
      if (isWrong) classes += ' wrong';

      const tileChildren = [];
      if (tile.image) {
        tileChildren.push(node('img', { src: tile.image, alt: 'Foto ficha' }));
      }
      if (tile.text && tile.text !== '[Imagen]') {
        tileChildren.push(document.createTextNode(tile.text));
      }

      return node('button', {
        type: 'button',
        className: classes,
        'data-action': 'select-match-tile',
        'data-index': index,
        disabled: isMatched
      }, tileChildren);
    });

    parts.push(node('div', { className: 'match-grid-container' }, tilesElements));
    parts.push(button('Abandonar partida', 'cancel'));
    content.replaceChildren(node('section', { className: 'panel play-session' }, parts));
  }

  // ── Render Modo 4: Arena de Simulación (Test) ────────────────
  function renderTest(session) {
    const parts = [
      node('div', { className: 'play-progress' }, [
        text('span', session.deckName),
        text('span', `${session.questions.length} preguntas de simulacro`)
      ]),
      node('h1', { text: modeNames.test }),
      text('p', 'Responde todas las preguntas con atención y pulsa «Calificar examen» para recibir tu nota y medalla de maestría.', 'play-note')
    ];

    const cardsSuite = session.questions.map((q, idx) => {
      const cardParts = [
        node('div', { className: 'test-card-header' }, [
          text('span', `Pregunta ${idx + 1} de ${session.total}`),
          text('span', q.type === 'choice' ? 'Opción Múltiple' : q.type === 'true_false' ? 'Verdadero o Falso' : 'Respuesta Escrita')
        ])
      ];

      if (q.frontImage) {
        cardParts.push(node('img', { src: q.frontImage, className: 'game-card-img', alt: 'Pregunta test' }));
      }
      cardParts.push(text('p', q.prompt, 'test-card-prompt'));

      if (q.type === 'choice') {
        const choiceButtons = q.options.map((opt, optIdx) => {
          const isSelected = session.answers[q.id] === opt.label;
          return button(`${optIdx + 1}. ${opt.label}`, 'test-choose', {
            'data-qid': q.id,
            'data-val': opt.label,
            className: 'btn' + (isSelected ? ' btn-primary' : '')
          });
        });
        cardParts.push(node('div', { className: 'test-choice-grid' }, choiceButtons));
      } else if (q.type === 'true_false') {
        cardParts.push(text('p', `Afirmación propuesta: «${q.shownStatement}»`, 'game-example-box'));
        cardParts.push(node('div', { className: 'test-tf-options' }, [
          button('Verdadero', 'test-choose', {
            'data-qid': q.id,
            'data-val': 'true',
            className: 'btn' + (session.answers[q.id] === 'true' ? ' btn-primary' : '')
          }),
          button('Falso', 'test-choose', {
            'data-qid': q.id,
            'data-val': 'false',
            className: 'btn' + (session.answers[q.id] === 'false' ? ' btn-primary' : '')
          })
        ]));
      } else {
        const inputField = node('input', {
          type: 'text',
          className: 'test-input-field',
          placeholder: 'Escribe tu respuesta de memoria…',
          value: session.answers[q.id] || '',
          'data-qid': q.id
        });
        cardParts.push(inputField);
      }

      return node('article', { className: 'test-card' }, cardParts);
    });

    parts.push(node('div', { className: 'test-suite' }, cardsSuite));
    parts.push(node('div', { className: 'play-result-actions' }, [
      button('Calificar examen y ver nota', 'test-submit', { className: 'btn btn-primary' }),
      button('Cancelar examen', 'cancel')
    ]));

    content.replaceChildren(node('section', { className: 'panel play-session' }, parts));
  }

  // ── Render Modo 5 y 6: Duelo de Opciones y Memoria Activa ─────
  function renderQuestion(session) {
    const question = session.questions[session.index];
    const parts = sessionHeader(session);

    const qMedia = node('div', { className: 'game-card-media' });
    if (question.frontImage) {
      qMedia.append(node('img', { src: question.frontImage, className: 'game-card-img', alt: 'Pregunta' }));
    }
    if (question.frontAudio) {
      qMedia.append(button('🔊 Escuchar', 'play-audio', { 'data-audio': question.frontAudio, className: 'game-audio-pill' }));
    }
    if (question.ipa) {
      qMedia.append(text('span', `[ ${question.ipa} ]`, 'game-ipa-badge'));
    }
    qMedia.append(text('p', question.front, 'play-question'));
    parts.push(qMedia);

    if (session.mode === 'choice') {
      parts.push(node('div', { className: 'play-options' }, question.options.map((option, index) => {
        const isCorrect = session.answered && option.correct;
        const isChosenWrong = session.answered && session.chosen === index && !option.correct;
        let btnClass = 'play-answer';
        if (isCorrect) btnClass += ' correct';
        if (isChosenWrong) btnClass += ' incorrect';

        return node('button', {
          type: 'button',
          className: btnClass,
          'data-action': 'answer-choice',
          'data-index': index,
          disabled: session.answered
        }, [
          node('span', { text: option.label }),
          node('span', { className: 'key-badge', text: '[' + (index + 1) + ']' })
        ]);
      })));
    } else {
      // Modo Escrito (Memoria Activa)
      const answerInput = node('textarea', {
        id: 'written-answer',
        name: 'answer',
        className: 'play-written',
        'aria-label': 'Tu respuesta',
        placeholder: 'Escribe tu respuesta de memoria…',
        value: session.answer,
        disabled: session.answered,
        autocomplete: 'off'
      });

      const hintText = session.revealedHint ? text('span', `Pista: «${session.revealedHint}»`, 'game-ipa-badge') : null;

      parts.push(node('form', { id: 'written-form' }, [
        answerInput,
        node('div', { className: 'hint-bar' }, [
          button('💡 Revelar primera letra', 'reveal-hint', { className: 'hint-btn', disabled: session.answered }),
          hintText
        ]),
        node('label', { className: 'play-check' }, [
          node('input', { type: 'checkbox', id: 'ignore-accents', checked: session.ignoreAccents, disabled: session.answered }),
          'Evaluación inteligente Fuzzy (tolera acentos, mayúsculas y deslices leves)'
        ]),
        node('div', { className: 'play-result-actions' }, [
          node('button', { type: 'submit', className: 'btn btn-primary', text: 'Comprobar respuesta', disabled: session.answered }),
          button('No la recuerdo · ver respuesta', 'reveal', { disabled: session.answered })
        ])
      ]));
    }

    if (session.answered) {
      const feedbackChildren = [
        text('strong', session.isCorrect ? '¡Excelente! Respuesta correcta.' : session.matchRating === 'close' ? '¡Muy cerca! (Aceptada por similitud)' : 'Vamos a reforzarla.'),
        text('p', 'Respuesta esperada: ' + question.answer)
      ];
      if (question.example) {
        feedbackChildren.push(node('div', { className: 'game-example-box', html: `"${question.example}"` }));
      }
      if (!session.isCorrect && session.answer) {
        feedbackChildren.push(text('p', 'Tu intento: ' + session.answer));
        feedbackChildren.push(button('Mi respuesta fue correcta (Anular fallo)', 'override-correct', { className: 'btn' }));
      }
      feedbackChildren.push(button(session.index + 1 === session.total ? 'Ver mi resultado' : 'Siguiente pregunta (Enter)', 'next', { className: 'btn btn-primary' }));
      parts.push(node('div', { className: 'play-feedback', role: 'status' }, feedbackChildren));
    }

    parts.push(button('Terminar sesión', 'cancel', { style: 'margin-top: 14px' }));
    content.replaceChildren(node('section', { className: 'panel play-session' }, parts));
  }

  // ── Respuestas en Modo Choice y Write ────────────────────────
  function answer(actual, correct, chosen, matchRating) {
    const session = state.session;
    if (!session || session.completed || session.answered) return;
    const question = session.questions[session.index];
    session.answer = actual;
    session.isCorrect = correct;
    session.chosen = chosen;
    session.answered = true;
    session.matchRating = matchRating;

    if (correct) {
      session.correct++;
      session.streak++;
      SoundFX.playCorrect();
    } else {
      session.streak = 0;
      session.mistakes++;
      session.failed.push({ id: question.id, front: question.front, back: question.answer, actual: actual || '(Sin respuesta)' });
      SoundFX.playWrong();
    }
    render();
    focus('[data-action="next"]');
  }

  // ── Interacciones de Ráfaga de Conexión (Match) ──────────────
  function selectMatchTile(index) {
    const session = state.session;
    if (!session || session.mode !== 'match' || session.completed) return;
    const tile = session.tiles[index];
    if (session.matched.has(String(tile.pairId)) || session.wrongTiles) return;

    SoundFX.playSelect();

    if (session.selectedTile === null) {
      session.selectedTile = index;
      render();
      return;
    }

    if (session.selectedTile === index) {
      session.selectedTile = null;
      render();
      return;
    }

    session.moves++;
    const prevTile = session.tiles[session.selectedTile];

    // Mismo par pero diferente tipo (front con back)
    if (String(prevTile.pairId) === String(tile.pairId) && prevTile.type !== tile.type) {
      session.matched.add(String(tile.pairId));
      session.correct++;
      session.combo = (session.combo || 0) + 1;
      session.selectedTile = null;

      if (session.matched.size === session.total) {
        if (state.matchTimerInterval) { clearInterval(state.matchTimerInterval); state.matchTimerInterval = null; }
        session.elapsedMs = Date.now() - session.started;
        const currentBest = localStorage.getItem('codex_match_best_' + (state.deckId || 'all'));
        if (!currentBest || session.elapsedMs < Number(currentBest)) {
          localStorage.setItem('codex_match_best_' + (state.deckId || 'all'), String(session.elapsedMs));
          session.newBest = true;
        }
        Confetti.burst(90);
        SoundFX.playVictory();
        finish();
        return;
      }
      SoundFX.playCombo(session.combo);
      render();
    } else {
      session.combo = 0;
      session.mistakes++;
      session.wrongTiles = [session.selectedTile, index];
      SoundFX.playWrong();
      session.selectedTile = null;
      render();
      setTimeout(() => {
        if (state.session && state.session.mode === 'match') {
          state.session.wrongTiles = null;
          render();
        }
      }, 450);
    }
  }

  // ── Interacciones de Flashcards 3D ───────────────────────────
  function handleFlashRating(quality) {
    const session = state.session;
    if (!session || session.mode !== 'flash') return;
    const current = session.cards[session.index];
    const isGood = quality >= 2;
    if (isGood) {
      session.correct++;
      session.streak++;
      SoundFX.playCorrect();
    } else {
      session.streak = 0;
      session.mistakes++;
      session.failed.push({ id: current?.id, front: current?.front, back: current?.back, actual: 'Dificultad nivel ' + quality });
      SoundFX.playWrong();
    }

    if (++session.index >= session.total) {
      finish();
    } else {
      session.flipped = false;
      render();
    }
  }

  // ── Interacciones de Entrenador Neural (Learn) ───────────────
  function answerLearn(chosenIndex) {
    const session = state.session;
    if (!session || session.mode !== 'learn' || session.answered) return;
    const q = session.question;
    const option = q.options[chosenIndex];
    session.answered = true;
    session.chosen = chosenIndex;
    session.isCorrect = option.correct;

    if (option.correct) {
      session.correct++;
      session.streak++;
      session.mastered.add(String(session.currentCard.id));
      SoundFX.playCorrect();
    } else {
      session.streak = 0;
      session.mistakes++;
      session.failed.push({ id: session.currentCard.id, front: session.currentCard.front, back: session.currentCard.back, actual: option.label });
      SoundFX.playWrong();
      session.queue.push(session.currentCard); // Reencolar para reforzar
    }
    render();
    focus('[data-action="next-learn"]');
  }

  function nextLearnCard() {
    const session = state.session;
    if (!session || session.mode !== 'learn') return;
    session.queue.shift();

    if (session.queue.length === 0 || session.mastered.size === session.total) {
      finish();
    } else {
      session.currentCard = session.queue[0];
      session.question = session.learnData.generateQuestion(session.currentCard);
      session.answered = false;
      session.isCorrect = false;
      session.chosen = null;
      render();
    }
  }

  // ── Interacciones de Test ────────────────────────────────────
  function submitTest() {
    const session = state.session;
    if (!session || session.mode !== 'test') return;

    let correctCount = 0;
    session.questions.forEach(q => {
      const userVal = (session.answers[q.id] || '').trim();
      let ok = false;
      if (q.type === 'choice') {
        ok = userVal.toLowerCase() === q.correctAnswer.toLowerCase();
      } else if (q.type === 'true_false') {
        ok = userVal.toLowerCase() === String(q.isTrue).toLowerCase();
      } else {
        const evaluation = StudyGames.fuzzyGrade(q.correctAnswer, userVal, { threshold: 0.82 });
        ok = evaluation.isCorrect;
      }

      if (ok) {
        correctCount++;
      } else {
        session.failed.push({
          id: q.id,
          front: q.prompt,
          back: q.correctAnswer,
          actual: userVal || '(Sin respuesta)'
        });
      }
    });

    session.correct = correctCount;
    session.mistakes = session.total - correctCount;
    finish();
  }

  // ── Guardar y Finalizar Sesión ────────────────────────────────
  function cachePending() {
    try { localStorage.setItem(pendingKey, JSON.stringify(state.pending.map(item => item.payload))); } catch (_) {}
  }

  async function saveResult(item) {
    if (item.saving) return;
    item.saving = true; item.error = '';
    if (state.tab === 'history' || (state.tab === 'play' && state.session?.completed)) render();
    try {
      await api('/api/practice/result', item.payload);
      state.pending = state.pending.filter(entry => entry.payload.id !== item.payload.id);
      cachePending();
      if (state.session?.id === item.payload.id) state.session.saved = true;
      state.history = null;
    } catch (error) { item.error = errorMessage(error); }
    finally {
      item.saving = false;
      if (state.tab === 'history' || (state.tab === 'play' && state.session?.completed)) render();
    }
  }

  function finish() {
    const session = state.session;
    if (!session || session.completed) return;
    if (state.matchTimerInterval) { clearInterval(state.matchTimerInterval); state.matchTimerInterval = null; }
    session.completed = true;
    session.elapsedMs = Math.min(86400000, Math.max(0, Date.now() - session.started));

    const payload = {
      id: session.id,
      mode: session.mode,
      deckName: session.deckName.slice(0, 240),
      correct: session.correct,
      total: session.total,
      mistakes: Math.min(10000, session.mistakes),
      elapsedMs: session.elapsedMs
    };

    const item = { payload, saving: false, error: '' };
    state.pending.push(item);
    cachePending();
    render();
    saveResult(item);

    const percent = Math.round((session.correct / session.total) * 100);
    if (percent >= 70) Confetti.burst(80);
    SoundFX.playVictory();
    say('Ronda completada con éxito.');
    focus('.play-result h1');
  }

  function pendingNotice(item) {
    return node('div', { className: 'play-feedback', role: 'status' }, [
      text('strong', item.saving ? 'Guardando en este equipo…' : 'Resultado pendiente'),
      text('p', item.error || 'La sesión se conserva localmente.'),
      button(item.saving ? 'Guardando…' : 'Reintentar guardado', 'retry-save', { 'data-id': item.payload.id, disabled: item.saving })
    ]);
  }

  // ── Pantalla Gamificada de Resultados ────────────────────────
  function renderResult(session) {
    const percent = Math.round((session.correct / session.total) * 100);
    let medal = '🏆', title = '¡Maestría Excepcional!';
    if (percent >= 90) { medal = '🏆'; title = '¡Maestría Excepcional!'; }
    else if (percent >= 75) { medal = '⭐'; title = '¡Muy Buen Dominio!'; }
    else if (percent >= 60) { medal = '🎖️'; title = '¡Buen Trabajo! En Proceso'; }
    else { medal = '📚'; title = '¡A Seguir Entrenando!'; }

    const masteryCard = node('div', { className: 'mastery-card' }, [
      text('span', medal, 'mastery-medal'),
      text('div', `${percent}%`, 'mastery-score'),
      text('h2', title, 'mastery-title'),
      text('p', `${modeNames[session.mode]} · ${session.deckName}`),
      node('div', { className: 'mastery-stats-grid' }, [
        node('div', { className: 'mastery-stat-cell' }, [
          text('span', 'Aciertos'),
          text('strong', `${session.correct} / ${session.total}`, '', { style: 'color:var(--lum-emerald)' })
        ]),
        node('div', { className: 'mastery-stat-cell' }, [
          text('span', 'Fallos'),
          text('strong', String(session.mistakes), '', { style: 'color:var(--lum-rose)' })
        ]),
        node('div', { className: 'mastery-stat-cell' }, [
          text('span', 'Tiempo'),
          text('strong', humanTime(session.elapsedMs))
        ])
      ])
    ]);

    const parts = [
      node('h1', { text: '¡Sesión Completada!', tabindex: '-1' }),
      masteryCard
    ];

    if (session.mode === 'match' && session.newBest) {
      parts.push(text('p', '🏆 ¡NUEVO RÉCORD HISTÓRICO DE VELOCIDAD EN ESTE MAZO! 🏆', 'play-record-badge'));
    }

    const pending = state.pending.find(item => item.payload.id === session.id);
    parts.push(pending ? pendingNotice(pending) : text('p', '✓ Resultado registrado en tus estadísticas locales.'));

    parts.push(node('div', { className: 'play-result-actions' }, [
      session.failed.length ? button(`Repasar tarjetas que costaron más (${session.failed.length})`, 'retry-failed', { className: 'btn btn-primary', disabled: state.loading }) : null,
      button('Jugar otra ronda', 'new-round', { disabled: state.loading }),
      button('Ver mi historial', 'show-history')
    ]));

    if (session.failed.length) {
      parts.push(node('section', { className: 'play-feedback' }, [
        text('h2', 'Tarjetas para consolidar'),
        ...session.failed.map(card => node('article', { className: 'play-mistake' }, [
          text('strong', card.front),
          text('p', 'Respuesta correcta: ' + card.back),
          text('p', 'Tu intento: ' + card.actual)
        ]))
      ]));
    }

    content.replaceChildren(node('section', { className: 'panel play-session play-result' }, parts));
  }

  // ── Historial ────────────────────────────────────────────────
  async function loadHistory() {
    if (state.historyLoading) return;
    state.historyLoading = true; state.historyError = ''; render();
    try {
      const result = await api('/api/practice/history');
      state.history = Array.isArray(result) ? result : [];
    } catch (error) {
      state.historyError = errorMessage(error);
    } finally {
      state.historyLoading = false;
      if (state.tab === 'history') render();
    }
  }

  function renderHistory() {
    const parts = [
      text('h1', 'Tu Historial de Juegos y Entrenamientos'),
      text('p', 'Registro detallado de tus últimas 30 sesiones. Los intervalos de repaso de tu colección principal no se alteran.', 'play-note')
    ];
    state.pending.forEach(item => parts.push(pendingNotice(item)));

    if (state.historyLoading) parts.push(text('p', 'Cargando historial…'));
    else if (state.historyError) parts.push(text('p', state.historyError), button('Reintentar carga', 'history-reload'));
    else if (!state.history?.length) parts.push(text('p', 'Completa tu primer juego para inaugurar tu historial.'));
    else {
      const headers = node('thead', {}, [node('tr', {}, ['Fecha', 'Modo / Mazo', 'Aciertos', 'Fallos', 'Tiempo'].map(label => text('th', label)))]);
      const rows = state.history.map(result => {
        const date = new Date(result.completed_at);
        return node('tr', {}, [
          text('td', Number.isNaN(date.getTime()) ? 'Fecha no disponible' : date.toLocaleString('es-PE')),
          node('td', {}, [text('strong', modeNames[result.mode] || result.mode), text('p', result.deck_name)]),
          text('td', `${result.correct} / ${result.total}`),
          text('td', String(result.mistakes)),
          text('td', humanTime(result.elapsed_ms))
        ]);
      });
      parts.push(node('div', { className: 'play-history' }, [node('table', {}, [headers, node('tbody', {}, rows)])]));
    }
    content.replaceChildren(node('section', { className: 'panel play-session' }, parts));
  }

  // ── Importación Multiformato & Quizlet ───────────────────────
  function invalidateImport() {
    input.revision++; input.preview = null; input.message = ''; input.error = '';
    content.querySelector('.play-preview')?.remove();
    content.querySelector('#import-feedback')?.replaceChildren();
  }

  function renderImport() {
    const source = node('select', { id: 'import-source', disabled: input.busy }, [
      node('option', { value: 'paste', text: 'Pegar texto o exportación de Quizlet', selected: input.source === 'paste' }),
      node('option', { value: 'file', text: 'Abrir archivo (CSV, TSV, TXT, JSON)', selected: input.source === 'file' })
    ]);

    const controls = [
      text('h1', 'Importador Multiformato Universal'),
      text('p', 'Importa tus tarjetas desde Quizlet, Excel, CSV, TSV, TXT tabulado o JSON de forma 100% legal e independiente.'),
      field('Origen de los datos', source)
    ];

    if (input.source === 'file') {
      controls.push(
        field('Archivo a importar', node('input', { id: 'import-file', type: 'file', accept: '.csv,.tsv,.txt,.json,.quizlet', disabled: input.busy })),
        text('p', input.file ? 'Archivo elegido: ' + input.file.name : 'Formatos soportados: CSV, TSV, TXT o JSON.', 'play-note')
      );
    } else {
      controls.push(
        field('Pega aquí tus tarjetas o exportación de Quizlet', node('textarea', {
          id: 'import-paste',
          placeholder: 'Ejemplo de exportación directa de Quizlet:\nFotosíntesis\tProceso por el cual las plantas producen alimento\nMitocondria\tCentral energética de la célula\n\n(O separa con comas, punto y coma o guiones)',
          value: input.text,
          disabled: input.busy
        }))
      );
    }

    controls.push(
      node('div', { className: 'play-settings' }, [
        field('Separador de columnas', node('select', { id: 'import-separator', disabled: input.busy }, [
          node('option', { value: 'auto', text: 'Detectar automáticamente (recomendado)', selected: input.separator === 'auto' }),
          node('option', { value: '\t', text: 'Tabulación (Quizlet estándar)', selected: input.separator === '\t' }),
          node('option', { value: ',', text: 'Coma (,)', selected: input.separator === ',' }),
          node('option', { value: ';', text: 'Punto y coma (;)', selected: input.separator === ';' }),
          node('option', { value: '-', text: 'Guion (-)', selected: input.separator === '-' })
        ])),
        node('label', { className: 'play-check', style: 'align-self:center;margin-top:16px' }, [
          node('input', { type: 'checkbox', id: 'import-header', checked: input.header, disabled: input.busy }),
          'La primera fila contiene encabezados'
        ]),
        field('Mazo de destino', deckSelect('import-deck', input.deckId, false, true, input.busy))
      ])
    );

    if (input.deckId === 'new') {
      controls.push(field('Nombre del nuevo mazo', node('input', {
        id: 'import-new-deck',
        type: 'text',
        placeholder: 'Por ejemplo: Vocabulario B2, Historia Universal...',
        value: input.newDeck,
        disabled: input.busy
      })));
    }

    controls.push(
      node('div', { className: 'play-import-actions' }, [
        button(input.busy ? 'Procesando…' : 'Previsualizar tarjetas', 'preview-import', { className: 'btn btn-primary', disabled: input.busy }),
        input.preview?.cards?.length ? button('Guardar en mi biblioteca', 'save-import', { className: 'btn', disabled: input.busy }) : null
      ]),
      node('div', { id: 'import-feedback' })
    );

    if (input.preview?.cards?.length) {
      const rows = input.preview.cards.slice(0, 20).map((c, i) => node('tr', {}, [
        text('td', String(i + 1)),
        text('td', c.front),
        text('td', c.back)
      ]));
      controls.push(node('div', { className: 'play-preview' }, [
        text('h2', `Vista previa (${input.preview.cards.length} tarjetas detectadas)`),
        node('div', { className: 'import-preview' }, [
          node('table', {}, [
            node('thead', {}, [node('tr', {}, ['#', 'Pregunta / Término', 'Respuesta / Definición'].map(h => text('th', h)))]),
            node('tbody', {}, rows)
          ])
        ])
      ]));
    }

    content.replaceChildren(node('section', { className: 'panel play-import' }, controls));
  }

  // ── Modal de Opciones de Estudio ─────────────────────────────
  function showStudyOptionsModal() {
    const backdrop = node('div', { className: 'play-modal-backdrop' });
    const modal = node('div', { className: 'play-modal-card' }, [
      text('h2', 'Opciones de Estudio y Rendimiento', 'play-modal-title'),
      text('p', 'Personaliza tu experiencia de juego y entrenamiento para adaptarla a tus metas.', 'play-note'),
      node('div', { className: 'play-modal-content' }, [
        node('label', { className: 'play-option-row' }, [
          node('div', {}, [
            text('strong', 'Invertir sentido de estudio'),
            text('p', 'Estudia respondiendo el concepto al ver la definición (útil para vocabulario e idiomas).')
          ]),
          node('input', { type: 'checkbox', id: 'opt-reverse', checked: state.reverseDirection })
        ]),
        node('label', { className: 'play-option-row' }, [
          node('div', {}, [
            text('strong', 'Efectos de sonido interactivos'),
            text('p', 'Campanas de acierto, chimes de combo multiplicador y fanfarria de victoria.')
          ]),
          node('input', { type: 'checkbox', id: 'opt-sound', checked: SoundFX.enabled })
        ]),
        node('label', { className: 'play-option-row' }, [
          node('div', {}, [
            text('strong', 'Mezclar tarjetas aleatoriamente'),
            text('p', 'Desordena las tarjetas en cada ronda para evitar memorizar por posición.')
          ]),
          node('input', { type: 'checkbox', id: 'opt-shuffle', checked: state.shuffle })
        ]),
        node('label', { className: 'play-option-row' }, [
          node('div', {}, [
            text('strong', 'Tolerancia ortográfica inteligente (Fuzzy Match)'),
            text('p', 'Acepta respuestas con pequeños deslices tipográficos o acentos omitidos.')
          ]),
          node('input', { type: 'checkbox', id: 'opt-accents', checked: state.ignoreAccents })
        ])
      ]),
      node('div', { style: 'display:flex;justify-content:flex-end;gap:10px;margin-top:20px' }, [
        button('Guardar opciones', 'close-options', { className: 'btn btn-primary' })
      ])
    ]);

    backdrop.append(modal);
    document.body.append(backdrop);

    backdrop.addEventListener('click', e => {
      if (e.target === backdrop || e.target.getAttribute('data-action') === 'close-options') {
        const rev = document.querySelector('#opt-reverse')?.checked;
        const snd = document.querySelector('#opt-sound')?.checked;
        const shf = document.querySelector('#opt-shuffle')?.checked;
        const acc = document.querySelector('#opt-accents')?.checked;

        state.reverseDirection = Boolean(rev);
        state.shuffle = Boolean(shf);
        state.ignoreAccents = Boolean(acc);
        SoundFX.enabled = Boolean(snd);

        localStorage.setItem('lumcards-reverse-dir', String(state.reverseDirection));
        localStorage.setItem('lumcards-sound', String(SoundFX.enabled));
        localStorage.setItem('lumcards-shuffle', String(state.shuffle));

        backdrop.remove();
        render();
      }
    });
  }

  // ── Render Enrutador ─────────────────────────────────────────
  function render() {
    tabs.forEach(tab => {
      const active = tab.dataset.tab === state.tab;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    if (state.tab === 'import') renderImport();
    else if (state.tab === 'history') renderHistory();
    else {
      const session = state.session;
      if (!session) renderHome();
      else if (session.completed) renderResult(session);
      else if (session.mode === 'flash') renderFlashcard(session);
      else if (session.mode === 'learn') renderLearn(session);
      else if (session.mode === 'match') renderMatch(session);
      else if (session.mode === 'test') renderTest(session);
      else renderQuestion(session);
    }
  }

  function changeTab(tab) {
    state.tab = ['play', 'import', 'history'].includes(tab) ? tab : 'play';
    if (location.hash !== '#' + state.tab) history.replaceState(null, '', '#' + state.tab);
    say('');
    if (state.tab === 'history' && !state.history && !state.historyLoading) loadHistory();
    render();
  }

  // ── Manejo Global de Eventos Clic ────────────────────────────
  document.addEventListener('click', async event => {
    const target = event.target.closest('[data-action], [data-tab]');
    if (!target) return;

    if (target.dataset.tab) {
      changeTab(target.dataset.tab);
      return;
    }

    const action = target.dataset.action;

    // Reproducción de audio Anki
    if (action === 'play-audio') {
      const audioUrl = target.getAttribute('data-audio');
      AudioPlayer.play(audioUrl, target);
      return;
    }

    if (action === 'toggle-sound') {
      SoundFX.toggle();
      render();
      return;
    }

    if (action === 'study-options') {
      showStudyOptionsModal();
      return;
    }

    if (action === 'start') {
      const mode = target.dataset.mode;
      start(mode);
      return;
    }

    if (action === 'cancel') {
      if (state.matchTimerInterval) { clearInterval(state.matchTimerInterval); state.matchTimerInterval = null; }
      state.session = null;
      render();
      return;
    }

    if (action === 'reload') {
      boot();
      return;
    }

    // 3D Flashcard
    if (action === 'flip-card') {
      if (state.session && state.session.mode === 'flash') {
        state.session.flipped = !state.session.flipped;
        SoundFX.playFlip();
        render();
      }
      return;
    }

    if (action === 'rate-flash') {
      const quality = parseInt(target.dataset.quality);
      handleFlashRating(quality);
      return;
    }

    // Entrenador Neural (Learn)
    if (action === 'answer-learn') {
      const idx = parseInt(target.dataset.index);
      answerLearn(idx);
      return;
    }

    if (action === 'next-learn') {
      nextLearnCard();
      return;
    }

    // Ráfaga de Conexión (Match)
    if (action === 'select-match-tile') {
      const idx = parseInt(target.dataset.index);
      selectMatchTile(idx);
      return;
    }

    // Arena de Simulación (Test)
    if (action === 'test-choose') {
      const qid = target.dataset.qid;
      const val = target.dataset.val;
      if (state.session?.answers) {
        state.session.answers[qid] = val;
        render();
      }
      return;
    }

    if (action === 'test-submit') {
      submitTest();
      return;
    }

    // Duelo de Opciones
    if (action === 'answer-choice') {
      const idx = parseInt(target.dataset.index);
      const session = state.session;
      if (session && !session.answered) {
        const opt = session.questions[session.index]?.options[idx];
        if (opt) answer(opt.label, opt.correct, idx);
      }
      return;
    }

    // Desafío de Memoria Activa
    if (action === 'reveal') {
      const session = state.session;
      if (session && !session.answered) {
        const question = session.questions[session.index];
        answer('', false, null);
      }
      return;
    }

    if (action === 'reveal-hint') {
      const session = state.session;
      if (session && !session.answered) {
        const expected = session.questions[session.index]?.answer || '';
        if (expected) {
          session.revealedHint = expected.slice(0, Math.max(1, Math.ceil(expected.length * 0.3))) + '…';
          render();
        }
      }
      return;
    }

    if (action === 'override-correct') {
      const session = state.session;
      if (session && session.answered && !session.isCorrect) {
        session.isCorrect = true;
        session.correct++;
        session.mistakes = Math.max(0, session.mistakes - 1);
        session.failed.pop();
        SoundFX.playCorrect();
        render();
      }
      return;
    }

    if (action === 'next') {
      const session = state.session;
      if (session && session.answered) {
        if (++session.index === session.total) finish();
        else {
          session.answered = false;
          session.answer = '';
          session.revealedHint = null;
          render();
          focus(session.mode === 'write' ? '#written-answer' : '.play-session h1');
        }
      }
      return;
    }

    // Resultados
    if (action === 'retry-failed') {
      const session = state.session;
      if (session && session.failed.length) {
        const cardsToRetry = session.failed.map(f => ({ id: f.id, front: f.front, back: f.back }));
        start(session.mode, cardsToRetry);
      }
      return;
    }

    if (action === 'new-round') {
      state.session = null;
      render();
      return;
    }

    if (action === 'show-history') {
      changeTab('history');
      return;
    }

    if (action === 'history-reload') {
      loadHistory();
      return;
    }

    if (action === 'retry-save') {
      const id = target.dataset.id;
      const item = state.pending.find(p => p.payload.id === id);
      if (item) saveResult(item);
      return;
    }

    // Importación
    if (action === 'preview-import') {
      input.busy = true; invalidateImport(); render();
      try {
        let body;
        if (input.source === 'file' && input.file) {
          const buffer = await input.file.arrayBuffer();
          body = await api(`/api/import/preview?filename=${encodeURIComponent(input.file.name)}&separator=${encodeURIComponent(input.separator)}&header=${input.header ? '1' : '0'}`, buffer, true);
        } else {
          body = await api('/api/import/preview', { text: input.text, separator: input.separator, header: input.header });
        }
        input.preview = body;
      } catch (err) {
        input.error = errorMessage(err);
      } finally {
        input.busy = false; render();
      }
      return;
    }

    if (action === 'save-import') {
      if (!input.preview?.cards?.length) return;
      input.busy = true; render();
      try {
        const payload = {
          deckId: input.deckId === 'new' ? null : input.deckId,
          deckName: input.deckId === 'new' ? (input.newDeck || 'Mazo importado') : null,
          cards: input.preview.cards
        };
        const result = await api('/api/import/save', payload);
        say(`¡Éxito! Se importaron ${result.added} tarjetas a tu biblioteca.`);
        input.text = ''; input.file = null; input.preview = null;
        await boot();
        changeTab('play');
      } catch (err) {
        input.error = errorMessage(err);
      } finally {
        input.busy = false; render();
      }
      return;
    }
  });

  // ── Formulario Modo Escrito ──────────────────────────────────
  document.addEventListener('submit', event => {
    if (event.target.id === 'written-form') {
      event.preventDefault();
      const session = state.session;
      if (!session || session.answered) return;
      const answerVal = (document.querySelector('#written-answer')?.value || '').trim();
      const expected = session.questions[session.index]?.answer || '';
      const evaluation = StudyGames.fuzzyGrade(expected, answerVal, {
        ignoreAccents: session.ignoreAccents,
        threshold: 0.82
      });
      answer(answerVal, evaluation.isCorrect, null, evaluation.match);
    }
  });

  // ── Inputs & Selects Dinámicos ───────────────────────────────
  document.addEventListener('change', event => {
    const el = event.target;
    if (el.id === 'practice-deck') { state.deckId = el.value; render(); }
    else if (el.id === 'practice-size') { state.size = parseInt(el.value); }
    else if (el.id === 'import-source') { input.source = el.value; invalidateImport(); render(); }
    else if (el.id === 'import-file') { input.file = el.files[0] || null; invalidateImport(); render(); }
    else if (el.id === 'import-separator') { input.separator = el.value; invalidateImport(); }
    else if (el.id === 'import-header') { input.header = el.checked; invalidateImport(); }
    else if (el.id === 'import-deck') { input.deckId = el.value; render(); }
  });

  document.addEventListener('input', event => {
    const el = event.target;
    if (el.dataset.qid && state.session?.answers) {
      state.session.answers[el.dataset.qid] = el.value;
    }
  });

  // ── Atajos de Teclado Universales ────────────────────────────
  window.addEventListener('keydown', event => {
    const session = state.session;
    if (!session || session.completed) return;

    // Si está escribiendo en un input o textarea del modo escrito/test, no interceptar números
    const inInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

    if (session.mode === 'flash') {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        session.flipped = !session.flipped;
        SoundFX.playFlip();
        render();
      } else if (session.flipped) {
        if (event.key === '1') handleFlashRating(0);
        else if (event.key === '2') handleFlashRating(1);
        else if (event.key === '3') handleFlashRating(2);
        else if (event.key === '4') handleFlashRating(3);
      }
    } else if (session.mode === 'choice' && !session.answered && !inInput) {
      const num = parseInt(event.key);
      if (num >= 1 && num <= 4) {
        event.preventDefault();
        const opt = session.questions[session.index]?.options[num - 1];
        if (opt) answer(opt.label, opt.correct, num - 1);
      }
    } else if (session.mode === 'learn' && !session.answered && !inInput) {
      const num = parseInt(event.key);
      if (num >= 1 && num <= 4) {
        event.preventDefault();
        answerLearn(num - 1);
      }
    } else if (session.answered && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      if (session.mode === 'learn') nextLearnCard();
      else if (session.mode === 'choice' || session.mode === 'write') {
        if (++session.index === session.total) finish();
        else {
          session.answered = false;
          session.answer = '';
          session.revealedHint = null;
          render();
          focus(session.mode === 'write' ? '#written-answer' : '.play-session h1');
        }
      }
    }
  });

  window.addEventListener('hashchange', () => changeTab(location.hash.slice(1)));

  async function boot() {
    say('Cargando tus mazos…');
    try {
      const result = await api('/api/state');
      state.decks = Array.isArray(result.decks) ? result.decks : [];
      state.ready = true;
      if (!input.deckId) input.deckId = state.decks[0]?.id || 'new';
      say('Tu biblioteca está lista.');
    } catch (error) {
      say(errorMessage(error), true);
    } finally {
      render();
    }
  }

  try {
    const pending = JSON.parse(localStorage.getItem(pendingKey) || '[]');
    if (Array.isArray(pending)) {
      state.pending = pending.filter(item => item && typeof item.id === 'string' && modeNames[item.mode]).slice(-100).map(payload => ({ payload, saving: false, error: '' }));
    }
  } catch (_) {}

  changeTab(location.hash.slice(1));
  boot();
  state.pending.slice().forEach(saveResult);
}());
