const STORAGE_KEY = 'crucix-visuals';

function isMobile() {
  return window.innerWidth <= 768;
}

function applyMode(mode) {
  document.body.classList.remove('lite', 'full');
  document.body.classList.add(mode);

  const fullBtn = document.getElementById('visuals-full');
  const liteBtn = document.getElementById('visuals-lite');
  if (fullBtn && liteBtn) {
    fullBtn.classList.remove('active');
    liteBtn.classList.remove('active');
    if (mode === 'full') {
      fullBtn.classList.add('active');
    } else {
      liteBtn.classList.add('active');
    }
  }

  window.dispatchEvent(new CustomEvent('visualschange', {
    detail: { mode }
  }));
}

export function initVisualsMode() {
  const saved = localStorage.getItem(STORAGE_KEY) || 'full';
  applyMode(saved);

  const fullBtn = document.getElementById('visuals-full');
  const liteBtn = document.getElementById('visuals-lite');
  
  if (fullBtn) {
    fullBtn.addEventListener('click', () => {
      localStorage.setItem(STORAGE_KEY, 'full');
      applyMode('full');
    });
  }
  
  if (liteBtn) {
    liteBtn.addEventListener('click', () => {
      localStorage.setItem(STORAGE_KEY, 'lite');
      applyMode('lite');
    });
  }
}
