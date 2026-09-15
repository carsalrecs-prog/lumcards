/* Motor de práctica y juegos de estudio: implementación propia, 100% independiente.
 * Incluye mecánicas de repaso activo, aprendizaje adaptativo (Learn), emparejar contrarreloj (Match),
 * examen integrado (Test) y evaluación con tolerancia tipográfica (Fuzzy Write).
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StudyGames = api;
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function displayText(value) {
    return typeof value === 'string' ? value.normalize('NFC').replace(/\s+/gu, ' ').trim() : '';
  }

  function normalizeAnswer(value, options) {
    var text = displayText(value).toLowerCase();
    if (options && options.ignoreAccents) {
      text = text.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC');
    }
    return text;
  }

  function gradeAnswer(expected, actual, options) {
    var answer = normalizeAnswer(expected, options);
    return answer.length > 0 && answer === normalizeAnswer(actual, options);
  }

  // Distancia Levenshtein para evaluación con tolerancia ortográfica
  function levenshtein(a, b) {
    var m = a.length, n = b.length;
    var dp = [];
    for (var i = 0; i <= m; i++) {
      dp[i] = [i];
    }
    for (var j = 0; j <= n; j++) {
      dp[0][j] = j;
    }
    for (var i = 1; i <= m; i++) {
      for (var j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  // Evaluación difusa (Fuzzy Matching): tolera mayúsculas, acentos, puntuación y pequeños errores
  function fuzzyGrade(expected, actual, options) {
    var cleanExpected = normalizeAnswer(expected, { ignoreAccents: true })
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .replace(/\s+/gu, ' ')
      .trim();
    var cleanActual = normalizeAnswer(actual, { ignoreAccents: true })
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .replace(/\s+/gu, ' ')
      .trim();

    if (!cleanExpected) return { isCorrect: false, score: 0, reason: 'empty_expected' };
    if (!cleanActual) return { isCorrect: false, score: 0, reason: 'empty_actual' };
    if (cleanExpected === cleanActual) return { isCorrect: true, score: 1.0, match: 'exact' };

    var maxLen = Math.max(cleanExpected.length, cleanActual.length);
    var dist = levenshtein(cleanExpected, cleanActual);
    var similarity = 1 - (dist / maxLen);

    var threshold = (options && options.threshold) || 0.82;
    var isCorrect = similarity >= threshold;

    return {
      isCorrect: isCorrect,
      score: similarity,
      match: isCorrect ? 'close' : 'wrong',
      distance: dist
    };
  }

  function prepareCards(input) {
    if (!Array.isArray(input)) throw new TypeError('Las tarjetas deben ser una lista.');
    var candidates = [];
    var answersByFront = new Map();
    input.forEach(function (card, index) {
      if (!card || typeof card !== 'object') return;
      var front = displayText(card.front);
      var back = displayText(card.back);
      if (!front || !back) return;
      var frontKey = normalizeAnswer(front);
      var backKey = normalizeAnswer(back);
      if (!answersByFront.has(frontKey)) answersByFront.set(frontKey, new Set());
      answersByFront.get(frontKey).add(backKey);
      var id = card.id;
      if (!((typeof id === 'string' && id.trim()) || (typeof id === 'number' && Number.isFinite(id)))) {
        id = 'study-card-' + index;
      }
      var candidate = Object.assign({}, card, { id: id, front: front, back: back });
      candidates.push({ card: candidate, frontKey: frontKey, backKey: backKey });
    });
    var cards = [];
    var seenFronts = new Set();
    var seenIds = new Set();
    candidates.forEach(function (item) {
      if (answersByFront.get(item.frontKey).size !== 1 || seenFronts.has(item.frontKey) || seenIds.has(String(item.card.id))) return;
      seenFronts.add(item.frontKey);
      seenIds.add(String(item.card.id));
      cards.push(item.card);
    });
    return { cards: cards, skipped: input.length - cards.length };
  }

  function configuration(options, defaultLimit, minimumLimit) {
    options = options || {};
    var limit = options.limit === undefined ? defaultLimit : options.limit;
    var random = options.random === undefined ? Math.random : options.random;
    if (!Number.isInteger(limit) || limit < minimumLimit) throw new RangeError('El límite debe ser un entero de al menos ' + minimumLimit + '.');
    if (typeof random !== 'function') throw new TypeError('El generador aleatorio debe ser una función.');
    return { limit: limit, random: random };
  }

  // Fisher–Yates sobre copia
  function shuffled(input, random) {
    var result = input.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var value = random();
      if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('El generador aleatorio debe devolver un número entre 0 y 1.');
      var j = Math.floor(value * (i + 1));
      var temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  function uniqueAnswers(cards) {
    var answers = new Map();
    cards.forEach(function (card) {
      var key = normalizeAnswer(card.back);
      if (!answers.has(key)) answers.set(key, card.back);
    });
    return Array.from(answers, function (entry) { return { key: entry[0], label: entry[1] }; });
  }

  // Modo Elección Múltiple clásico
  function createChoiceSession(input, options) {
    var config = configuration(options, 10, 1);
    var cards = prepareCards(input).cards;
    var answers = uniqueAnswers(cards);
    if (cards.length < 2 || answers.length < 2) throw new RangeError('Necesitas al menos dos pares válidos con respuestas diferentes.');
    return shuffled(cards, config.random).slice(0, config.limit).map(function (card) {
      var answerKey = normalizeAnswer(card.back);
      var distractors = shuffled(answers.filter(function (a) { return a.key !== answerKey; }), config.random).slice(0, 3);
      var choices = [{ label: card.back, correct: true }].concat(distractors.map(function (d) { return { label: d.label, correct: false }; }));
      return Object.assign({}, card, { id: card.id, front: card.front, answer: card.back, options: shuffled(choices, config.random) });
    });
  }

  // Modo Emparejar (Match): genera tablero de fichas mezcladas (estilo Quizlet)
  function createMatchGrid(input, options) {
    var config = configuration(options, 6, 2);
    var candidates = shuffled(prepareCards(input).cards, config.random);
    var seenAnswers = new Set();
    var cards = candidates.filter(function (card) {
      var key = normalizeAnswer(card.back);
      if (seenAnswers.has(key)) return false;
      seenAnswers.add(key);
      return true;
    });
    if (cards.length < 2) throw new RangeError('Necesitas al menos dos pares válidos para emparejar.');
    cards = cards.slice(0, config.limit);

    var tiles = [];
    cards.forEach(function (c) {
      tiles.push({
        id: 'f-' + c.id,
        pairId: c.id,
        type: 'front',
        text: c.front,
        html: c.frontHtml || c.front,
        image: c.frontImage || null,
        audio: (c.questionAudios && c.questionAudios[0]) || c.frontAudio || null
      });
      tiles.push({
        id: 'b-' + c.id,
        pairId: c.id,
        type: 'back',
        text: c.back,
        html: c.backHtml || c.back,
        image: c.backImage || null,
        audio: (c.answerAudios && c.answerAudios[0]) || c.backAudio || null
      });
    });

    return {
      cards: cards,
      tiles: shuffled(tiles, config.random),
      totalPairs: cards.length
    };
  }

  // Modo Emparejar clásico de dos columnas (mantiene compatibilidad)
  function createMatchRound(input, options) {
    var grid = createMatchGrid(input, options);
    return {
      left: shuffled(grid.cards.map(function (c) { return { id: c.id, text: c.front }; }), options ? options.random || Math.random : Math.random),
      right: shuffled(grid.cards.map(function (c) { return { id: c.id, text: c.back }; }), options ? options.random || Math.random : Math.random)
    };
  }

  // Modo Examen completo (Test): combina opción múltiple, Verdadero/Falso y preguntas escritas
  function createTestSession(input, options) {
    var config = configuration(options, 10, 3);
    var cards = shuffled(prepareCards(input).cards, config.random).slice(0, config.limit);
    if (cards.length < 3) throw new RangeError('Se requieren al menos 3 tarjetas válidas para generar un examen.');

    var answers = uniqueAnswers(cards);
    var total = cards.length;

    var questions = cards.map(function (card, index) {
      var ratio = index / total;
      var type;
      if (ratio < 0.4) {
        type = 'choice'; // 40% opción múltiple
      } else if (ratio < 0.7) {
        type = 'true_false'; // 30% Verdadero / Falso
      } else {
        type = 'written'; // 30% Pregunta escrita
      }

      if (type === 'choice') {
        var answerKey = normalizeAnswer(card.back);
        var others = answers.filter(function (a) { return a.key !== answerKey; });
        var distractors = shuffled(others, config.random).slice(0, 3);
        var choices = [{ label: card.back, correct: true }]
          .concat(distractors.map(function (d) { return { label: d.label, correct: false }; }));
        return {
          id: card.id,
          type: 'choice',
          prompt: card.front,
          correctAnswer: card.back,
          options: shuffled(choices, config.random),
          userAnswer: null
        };
      }

      if (type === 'true_false') {
        var isTrue = config.random() > 0.5;
        var wrongCard = cards.find(function (c) { return c.id !== card.id; });
        var shownStatement = isTrue ? card.back : (wrongCard ? wrongCard.back : card.back);
        return {
          id: card.id,
          type: 'true_false',
          prompt: card.front,
          shownStatement: shownStatement,
          correctAnswer: card.back,
          isTrue: isTrue,
          userAnswer: null
        };
      }

      // 'written'
      return {
        id: card.id,
        type: 'written',
        prompt: card.front,
        correctAnswer: card.back,
        userAnswer: ''
      };
    });

    return {
      total: questions.length,
      questions: shuffled(questions, config.random)
    };
  }

  // Modo Aprender adaptativo (Learn): sesión con seguimiento de tarjetas dominadas vs en proceso
  function createLearnSession(input, options) {
    var config = configuration(options, 20, 2);
    var cards = shuffled(prepareCards(input).cards, config.random).slice(0, config.limit);
    if (cards.length < 2) throw new RangeError('Se requieren al menos 2 tarjetas para el modo Aprender.');

    var answers = uniqueAnswers(cards);
    return {
      cards: cards,
      total: cards.length,
      generateQuestion: function (card) {
        var answerKey = normalizeAnswer(card.back);
        var distractors = shuffled(answers.filter(function (a) { return a.key !== answerKey; }), config.random).slice(0, 3);
        var choices = [{ label: card.back, correct: true }]
          .concat(distractors.map(function (d) { return { label: d.label, correct: false }; }));
        return Object.assign({}, card, {
          id: card.id,
          front: card.front,
          back: card.back,
          options: shuffled(choices, config.random)
        });
      }
    };
  }

  return Object.freeze({
    prepareCards: prepareCards,
    createChoiceSession: createChoiceSession,
    createMatchRound: createMatchRound,
    createMatchGrid: createMatchGrid,
    createTestSession: createTestSession,
    createLearnSession: createLearnSession,
    normalizeAnswer: normalizeAnswer,
    gradeAnswer: gradeAnswer,
    fuzzyGrade: fuzzyGrade,
    levenshtein: levenshtein
  });
}));
