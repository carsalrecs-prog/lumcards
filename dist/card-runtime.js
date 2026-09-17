'use strict';
// Loaded externally: srcdoc inherits the server's script-src 'self' policy.
function installCardAudioRuntime(parentOrigin) {
  let activeAudio = null;
  let activeButton = null;

  function fitCardToViewport() {
    const body = document.body;
    const card = body?.querySelector ? body.querySelector(':scope > .card') : null;
    if (!body || !card) return;
    try {
      if (card.style?.setProperty) {
        card.style.setProperty('min-height', '100dvh');
      }
      if (card.classList?.contains) {
        if (card.classList.contains('card-long')) {
          body.style?.setProperty?.('justify-content', 'flex-start');
        }
      } else {
        // Fallback for mocked unit tests without classList
        body.style?.setProperty?.('justify-content', 'flex-start');
      }
    } catch (_) {}

    const getCS = typeof window !== 'undefined' && window.getComputedStyle ? window.getComputedStyle : (typeof getComputedStyle === 'function' ? getComputedStyle : null);
    if (getCS) {
      try {
        const background = getCS(card).backgroundColor;
        if (background && background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent') {
          body.style.backgroundColor = background;
          document.documentElement.style.backgroundColor = background;
        }
      } catch (_) {}
    }
  }

  function clearActive(audio) {
    if (activeAudio !== audio) return;
    if (activeButton) activeButton.classList.remove('playing');
    activeAudio = null;
    activeButton = null;
  }

  function stopActive() {
    const previousAudio = activeAudio;
    const previousButton = activeButton;
    activeAudio = null;
    activeButton = null;
    if (previousAudio) {
      try {
        previousAudio.pause();
        previousAudio.currentTime = 0;
      } catch (_) {}
    }
    if (previousButton) previousButton.classList.remove('playing');
  }

  function playFromStart(src, button) {
    if (!src) return;
    window.parent.postMessage({ ankiStopAudio: true }, parentOrigin);
    stopActive();
    activeButton = button || null;
    if (button) button.classList.add('playing');
    window.parent.postMessage({ ankiPlayAudio: src }, parentOrigin);
  }

  document.addEventListener('click', event => {
    const button = event.target.closest?.('.anki-audio-pill, .anki-audio-btn');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    playFromStart(button.getAttribute('data-src'), button);
  }, true);
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.origin !== parentOrigin) return;
    if (event.data && event.data.ankiAudioEnded) {
      if (activeButton) activeButton.classList.remove('playing');
      activeButton = null;
    }
  });
  document.addEventListener('DOMContentLoaded', fitCardToViewport, { once: true });
}

const parentOrigin = typeof document !== 'undefined' && document.baseURI ? new URL(document.baseURI).origin : '';
if (parentOrigin) {
  installCardAudioRuntime(parentOrigin);
  const card = document.querySelector ? document.querySelector('body > .card') : null;
  if (card) {
    const getCS = typeof window !== 'undefined' && window.getComputedStyle ? window.getComputedStyle : (typeof getComputedStyle === 'function' ? getComputedStyle : null);
    if (getCS) {
      try {
        const background = getCS(card).backgroundColor;
        if (background && background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent') {
          document.body.style.backgroundColor = background;
          document.documentElement.style.backgroundColor = background;
        }
      } catch (_) {}
    }
  }
  window.addEventListener('keydown', e => {
    if (['Space','Enter'].includes(e.code) || /^[1-4]$/.test(e.key) || ['f','F','Escape','s','S','e','E','r','R'].includes(e.key)) {
      e.preventDefault();
      window.parent.postMessage({ankiKey:e.key, ankiCode:e.code}, parentOrigin);
    }
  });
  document.addEventListener('click', e => {
    if (e.target.closest?.('a,button,input,textarea,select')) return;
    window.parent.postMessage({ankiCardClick:true}, parentOrigin);
  });
}
