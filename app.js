/* ==========================================================
   YrWeather PWA — Application Logic
   APIs used:
     • api.met.no/weatherapi/locationforecast/2.0/complete
     • api.met.no/weatherapi/sunrise/3.0/sun
   Geocoding: Nominatim (OpenStreetMap, free, no key)
   ========================================================== */
'use strict';

// ── CONSTANTS ───────────────────────────────────────────
const MET_BASE   = 'https://api.met.no/weatherapi';
const NOMINATIM  = 'https://nominatim.openstreetmap.org/search';
// MET Norway ToS requires identifying User-Agent
const UA         = 'YrWeatherPWA/2.0 github.com/Coexist3155/weather-app';

// ── SYMBOL → { emoji, label, animationType } ────────────
// Full mapping of every symbol_code returned by locationforecast/2.0
const SYM = {
  clearsky_day:                              { e:'☀️',  l:'Clear sky',              a:'sunny'  },
  clearsky_night:                            { e:'🌙',  l:'Clear night',            a:'night'  },
  clearsky_polartwilight:                    { e:'🌅',  l:'Polar twilight',         a:'sunny'  },
  fair_day:                                  { e:'🌤️', l:'Fair',                    a:'sunny'  },
  fair_night:                                { e:'🌤️', l:'Fair night',              a:'night'  },
  fair_polartwilight:                        { e:'🌤️', l:'Fair twilight',           a:'sunny'  },
  partlycloudy_day:                          { e:'⛅',  l:'Partly cloudy',          a:'cloudy' },
  partlycloudy_night:                        { e:'⛅',  l:'Partly cloudy night',    a:'cloudy' },
  partlycloudy_polartwilight:                { e:'⛅',  l:'Partly cloudy',          a:'cloudy' },
  cloudy:                                    { e:'☁️',  l:'Cloudy',                 a:'cloudy' },
  fog:                                       { e:'🌫️', l:'Fog',                     a:'fog'    },
  lightrain:                                 { e:'🌦️', l:'Light rain',             a:'rain'   },
  rain:                                      { e:'🌧️', l:'Rain',                   a:'rain'   },
  heavyrain:                                 { e:'🌧️', l:'Heavy rain',             a:'rain'   },
  lightrainshowers_day:                      { e:'🌦️', l:'Light rain showers',     a:'rain'   },
  lightrainshowers_night:                    { e:'🌦️', l:'Light rain showers',     a:'rain'   },
  lightrainshowers_polartwilight:            { e:'🌦️', l:'Light rain showers',     a:'rain'   },
  rainshowers_day:                           { e:'🌦️', l:'Rain showers',           a:'rain'   },
  rainshowers_night:                         { e:'🌦️', l:'Rain showers',           a:'rain'   },
  rainshowers_polartwilight:                 { e:'🌦️', l:'Rain showers',           a:'rain'   },
  heavyrainshowers_day:                      { e:'🌧️', l:'Heavy rain showers',     a:'rain'   },
  heavyrainshowers_night:                    { e:'🌧️', l:'Heavy rain showers',     a:'rain'   },
  heavyrainshowers_polartwilight:            { e:'🌧️', l:'Heavy rain showers',     a:'rain'   },
  lightsleet:                                { e:'🌨️', l:'Light sleet',            a:'rain'   },
  sleet:                                     { e:'🌨️', l:'Sleet',                  a:'rain'   },
  heavysleet:                                { e:'🌨️', l:'Heavy sleet',            a:'rain'   },
  lightsleetshowers_day:                     { e:'🌨️', l:'Light sleet showers',    a:'rain'   },
  lightsleetshowers_night:                   { e:'🌨️', l:'Light sleet showers',    a:'rain'   },
  lightsleetshowers_polartwilight:           { e:'🌨️', l:'Light sleet showers',    a:'rain'   },
  sleetshowers_day:                          { e:'🌨️', l:'Sleet showers',          a:'rain'   },
  sleetshowers_night:                        { e:'🌨️', l:'Sleet showers',          a:'rain'   },
  sleetshowers_polartwilight:                { e:'🌨️', l:'Sleet showers',          a:'rain'   },
  heavysleetshowers_day:                     { e:'🌨️', l:'Heavy sleet showers',    a:'rain'   },
  heavysleetshowers_night:                   { e:'🌨️', l:'Heavy sleet showers',    a:'rain'   },
  heavysleetshowers_polartwilight:           { e:'🌨️', l:'Heavy sleet showers',    a:'rain'   },
  lightsnow:                                 { e:'🌨️', l:'Light snow',             a:'snow'   },
  snow:                                      { e:'❄️',  l:'Snow',                   a:'snow'   },
  heavysnow:                                 { e:'❄️',  l:'Heavy snow',             a:'snow'   },
  lightsnowshowers_day:                      { e:'🌨️', l:'Light snow showers',     a:'snow'   },
  lightsnowshowers_night:                    { e:'🌨️', l:'Light snow showers',     a:'snow'   },
  lightsnowshowers_polartwilight:            { e:'🌨️', l:'Light snow showers',     a:'snow'   },
  snowshowers_day:                           { e:'🌨️', l:'Snow showers',           a:'snow'   },
  snowshowers_night:                         { e:'🌨️', l:'Snow showers',           a:'snow'   },
  snowshowers_polartwilight:                 { e:'🌨️', l:'Snow showers',           a:'snow'   },
  heavysnowshowers_day:                      { e:'❄️',  l:'Heavy snow showers',     a:'snow'   },
  heavysnowshowers_night:                    { e:'❄️',  l:'Heavy snow showers',     a:'snow'   },
  heavysnowshowers_polartwilight:            { e:'❄️',  l:'Heavy snow showers',     a:'snow'   },
  thunder:                                   { e:'⛈️',  l:'Thunder',                a:'thunder'},
  rainandthunder:                            { e:'⛈️',  l:'Rain and thunder',       a:'thunder'},
  lightrainandthunder:                       { e:'⛈️',  l:'Light rain & thunder',   a:'thunder'},
  heavyrainandthunder:                       { e:'⛈️',  l:'Heavy rain & thunder',   a:'thunder'},
  sleetandthunder:                           { e:'⛈️',  l:'Sleet and thunder',      a:'thunder'},
  lightsleetandthunder:                      { e:'⛈️',  l:'Light sleet & thunder',  a:'thunder'},
  heavysleetandthunder:                      { e:'⛈️',  l:'Heavy sleet & thunder',  a:'thunder'},
  snowandthunder:                            { e:'⛈️',  l:'Snow and thunder',       a:'thunder'},
  lightsnowandthunder:                       { e:'⛈️',  l:'Light snow & thunder',   a:'thunder'},
  heavysnowandthunder:                       { e:'⛈️',  l:'Heavy snow & thunder',   a:'thunder'},
  lightrainshowersandthunder_day:            { e:'⛈️',  l:'Light rain & thunder',   a:'thunder'},
  lightrainshowersandthunder_night:          { e:'⛈️',  l:'Light rain & thunder',   a:'thunder'},
  lightrainshowersandthunder_polartwilight:  { e:'⛈️',  l:'Light rain & thunder',   a:'thunder'},
  rainshowersandthunder_day:                 { e:'⛈️',  l:'Rain & thunder',         a:'thunder'},
  rainshowersandthunder_night:               { e:'⛈️',  l:'Rain & thunder',         a:'thunder'},
  rainshowersandthunder_polartwilight:       { e:'⛈️',  l:'Rain & thunder',         a:'thunder'},
  heavyrainshowersandthunder_day:            { e:'⛈️',  l:'Heavy rain & thunder',   a:'thunder'},
  heavyrainshowersandthunder_night:          { e:'⛈️',  l:'Heavy rain & thunder',   a:'thunder'},
  heavyrainshowersandthunder_polartwilight:  { e:'⛈️',  l:'Heavy rain & thunder',   a:'thunder'},
  sleetshowersandthunder_day:                { e:'⛈️',  l:'Sleet & thunder',        a:'thunder'},
  sleetshowersandthunder_night:              { e:'⛈️',  l:'Sleet & thunder',        a:'thunder'},
  sleetshowersandthunder_polartwilight:      { e:'⛈️',  l:'Sleet & thunder',        a:'thunder'},
  snowshowersandthunder_day:                 { e:'⛈️',  l:'Snow & thunder',         a:'thunder'},
  snowshowersandthunder_night:               { e:'⛈️',  l:'Snow & thunder',         a:'thunder'},
  snowshowersandthunder_polartwilight:       { e:'⛈️',  l:'Snow & thunder',         a:'thunder'},
};

function getSym(code) {
  return SYM[code] || { e:'🌡️', l: code ? code.replace(/_/g,' ') : 'Unknown', a:'cloudy' };
}

// Wind direction from degrees
function windDir(deg) {
  if (deg == null) return '';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

// ── STATE ────────────────────────────────────────────────
const S = {
  city: null,
  forecast: null,
  sunrise: null,
  accessMode: false,
  theme: 'auto',
  animType: null,
};

// ── DOM REFS ─────────────────────────────────────────────
const D = {};
[
  'weatherCanvas','app','topbar','cityName',
  'btnSearch','btnAccessibility','btnTheme','iconTheme',
  'searchPanel','searchInput','searchClose','searchResults','searchHint',
  'emptyState','btnStartSearch',
  'weatherDisplay',
  'currentIcon','currentTemp','currentFeels','currentDesc',
  'metaWind','metaWindDir','metaHumidity','metaPressure','metaPrecip','metaCloud','metaUv','metaVis',
  'sunriseTime','sunsetTime','moonriseTime',
  'hourlyScroll',
  'dailyList',
  'dayDetailSection','dayDetailTitle','dayDetailClose','dayDetailScroll',
  'loadingOverlay','errorState','errorMessage','btnRetry',
  'lastUpdated',
].forEach(id => { D[id] = document.getElementById(
  id.replace(/([A-Z])/g, s => '-' + s.toLowerCase())
     .replace(/^-/, '')
); });

// Manual fixes for IDs that don't follow camelCase→kebab
D.btnSearch         = document.getElementById('btn-search');
D.btnAccessibility  = document.getElementById('btn-accessibility');
D.btnTheme          = document.getElementById('btn-theme');
D.iconTheme         = document.getElementById('icon-theme');
D.searchPanel       = document.getElementById('search-panel');
D.searchInput       = document.getElementById('search-input');
D.searchClose       = document.getElementById('search-close');
D.searchResults     = document.getElementById('search-results');
D.searchHint        = document.getElementById('search-hint');
D.emptyState        = document.getElementById('empty-state');
D.btnStartSearch    = document.getElementById('btn-start-search');
D.weatherDisplay    = document.getElementById('weather-display');
D.currentIcon       = document.getElementById('current-icon');
D.currentTemp       = document.getElementById('current-temp');
D.currentFeels      = document.getElementById('current-feels');
D.currentDesc       = document.getElementById('current-desc');
D.metaWind          = document.getElementById('meta-wind');
D.metaWindDir       = document.getElementById('meta-wind-dir');
D.metaHumidity      = document.getElementById('meta-humidity');
D.metaPressure      = document.getElementById('meta-pressure');
D.metaPrecip        = document.getElementById('meta-precip');
D.metaCloud         = document.getElementById('meta-cloud');
D.metaUv            = document.getElementById('meta-uv');
D.metaVis           = document.getElementById('meta-vis');
D.sunriseTime       = document.getElementById('sunrise-time');
D.sunsetTime        = document.getElementById('sunset-time');
D.moonriseTime      = document.getElementById('moonrise-time');
D.hourlyScroll      = document.getElementById('hourly-scroll');
D.dailyList         = document.getElementById('daily-list');
D.dayDetailSection  = document.getElementById('day-detail-section');
D.dayDetailTitle    = document.getElementById('day-detail-title');
D.dayDetailClose    = document.getElementById('day-detail-close');
D.dayDetailScroll   = document.getElementById('day-detail-scroll');
D.loadingOverlay    = document.getElementById('loading-overlay');
D.errorState        = document.getElementById('error-state');
D.errorMessage      = document.getElementById('error-message');
D.btnRetry          = document.getElementById('btn-retry');
D.lastUpdated       = document.getElementById('last-updated');
D.canvas            = document.getElementById('weatherCanvas');
D.body              = document.body;
D.currentCard       = document.getElementById('current-card');
D.currentHi         = document.getElementById('current-hi');
D.currentLo         = document.getElementById('current-lo');

// ── CANVAS ANIMATIONS ────────────────────────────────────
const canvas = D.canvas;
const ctx = canvas.getContext('2d');
let rafId = null;
let particles = [];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function mkParticle(type) {
  const W = canvas.width, H = canvas.height;
  switch (type) {
    case 'rain': return {
      type, x: Math.random() * W, y: Math.random() * H - H,
      len: 13 + Math.random() * 10, spd: 9 + Math.random() * 7,
      op: 0.22 + Math.random() * 0.3,
    };
    case 'snow': return {
      type, x: Math.random() * W, y: Math.random() * H - H,
      r: 1.8 + Math.random() * 2.8, spd: 0.9 + Math.random() * 1.4,
      drift: (Math.random() - 0.5) * 0.55, op: 0.55 + Math.random() * 0.4,
    };
    case 'cloud': return {
      type, x: (Math.random() * (W + 200)) - 100,
      y: 30 + Math.random() * (H * 0.38),
      r: 38 + Math.random() * 55, spd: 0.1 + Math.random() * 0.14,
      op: 0.055 + Math.random() * 0.075,
    };
    case 'star': return {
      type, x: Math.random() * W, y: Math.random() * H * 0.72,
      r: 0.7 + Math.random() * 1.5, phase: Math.random() * Math.PI * 2,
      spd: 0.03 + Math.random() * 0.038, op: 0.4 + Math.random() * 0.5,
    };
    case 'sun': return {
      type, x: W * 0.72, y: H * 0.14, r: 48, glow: 0,
    };
    case 'fog': return {
      type, x: Math.random() * W, y: H * 0.2 + Math.random() * H * 0.5,
      w: 180 + Math.random() * 220, h: 40 + Math.random() * 50,
      spd: 0.07 + Math.random() * 0.1, op: 0.04 + Math.random() * 0.055,
    };
    case 'lightning': return {
      type, x: W * 0.15 + Math.random() * W * 0.7,
      life: 0, maxLife: 7 + Math.random() * 10, op: 0,
      delay: 80 + Math.random() * 160,
    };
  }
}

function initParticles(anim) {
  particles = [];
  const W = canvas.width;
  if (anim === 'sunny') {
    particles.push(mkParticle('sun'));
  } else if (anim === 'night') {
    for (let i = 0; i < 90; i++) particles.push(mkParticle('star'));
  } else if (anim === 'cloudy') {
    for (let i = 0; i < 9; i++) particles.push(mkParticle('cloud'));
  } else if (anim === 'fog') {
    for (let i = 0; i < 14; i++) particles.push(mkParticle('fog'));
  } else if (anim === 'rain') {
    for (let i = 0; i < 130; i++) particles.push(mkParticle('rain'));
    for (let i = 0; i < 5;   i++) particles.push(mkParticle('cloud'));
  } else if (anim === 'snow') {
    for (let i = 0; i < 100; i++) particles.push(mkParticle('snow'));
    for (let i = 0; i < 4;   i++) particles.push(mkParticle('cloud'));
  } else if (anim === 'thunder') {
    for (let i = 0; i < 90; i++) particles.push(mkParticle('rain'));
    for (let i = 0; i < 6;  i++) particles.push(mkParticle('cloud'));
    for (let i = 0; i < 4;  i++) particles.push(mkParticle('lightning'));
  }
}

function drawP(p) {
  const W = canvas.width, H = canvas.height;
  ctx.save();
  switch (p.type) {

    case 'rain':
      ctx.strokeStyle = `rgba(120,185,255,${p.op})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 1.4, p.y + p.len);
      ctx.stroke();
      p.y += p.spd; p.x -= 0.9;
      if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
      break;

    case 'snow':
      ctx.fillStyle = `rgba(215,238,255,${p.op})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      p.y += p.spd; p.x += p.drift;
      if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
      break;

    case 'cloud': {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, `rgba(255,255,255,${p.op * 2.2})`);
      g.addColorStop(1, `rgba(255,255,255,0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x,          p.y,     p.r,       0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x+p.r*0.44, p.y+6,   p.r*0.68,  0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x-p.r*0.44, p.y+7,   p.r*0.58,  0, Math.PI*2); ctx.fill();
      p.x += p.spd;
      if (p.x > W + p.r * 2) p.x = -p.r * 2;
      break;
    }

    case 'star':
      p.phase += p.spd;
      ctx.fillStyle = `rgba(255,255,255,${p.op * (0.5 + 0.5 * Math.sin(p.phase))})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      break;

    case 'sun': {
      p.glow = (p.glow + 0.014) % (Math.PI * 2);
      for (let r = 1; r <= 3; r++) {
        const gg = ctx.createRadialGradient(p.x, p.y, p.r * r * 0.45, p.x, p.y, p.r * r * 1.6);
        gg.addColorStop(0, `rgba(255,225,70,${(0.065 - r*0.016) + 0.013*Math.sin(p.glow)})`);
        gg.addColorStop(1, 'rgba(255,190,0,0)');
        ctx.fillStyle = gg;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * r * 1.6, 0, Math.PI * 2); ctx.fill();
      }
      const sg = ctx.createRadialGradient(p.x-9, p.y-9, 4, p.x, p.y, p.r);
      sg.addColorStop(0, 'rgba(255,255,200,0.96)');
      sg.addColorStop(0.55, 'rgba(255,210,45,0.88)');
      sg.addColorStop(1, 'rgba(255,165,0,0.62)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      break;
    }

    case 'fog': {
      const fg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.w/2);
      fg.addColorStop(0, `rgba(200,215,230,${p.op * 1.6})`);
      fg.addColorStop(1, 'rgba(200,215,230,0)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.w/2, p.h/2, 0, 0, Math.PI*2); ctx.fill();
      p.x += p.spd;
      if (p.x > W + p.w) p.x = -p.w;
      break;
    }

    case 'lightning': {
      if (p.delay > 0) { p.delay--; break; }
      p.life++;
      p.op = p.life <= p.maxLife/2
        ? p.life / (p.maxLife/2)
        : 1 - (p.life - p.maxLife/2) / (p.maxLife/2);
      if (p.life >= p.maxLife) {
        p.life = 0; p.delay = 90 + Math.random() * 180;
        p.x = W*0.15 + Math.random() * W*0.7; p.op = 0;
      }
      if (p.op > 0.02) {
        ctx.strokeStyle = `rgba(255,255,160,${p.op})`;
        ctx.lineWidth = 2.2;
        ctx.shadowColor = 'rgba(255,255,80,0.88)';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        let lx = p.x;
        for (let i = 0; i <= 9; i++) {
          const ny = H * 0.62 * (i / 9);
          const nx = lx + (Math.random() - 0.5) * 28;
          i === 0 ? ctx.moveTo(nx, ny) : ctx.lineTo(nx, ny);
          lx = nx;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      break;
    }
  }
  ctx.restore();
}

function animLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => drawP(p));
  rafId = requestAnimationFrame(animLoop);
}

function startAnim(type) {
  if (S.accessMode) return;
  if (rafId) cancelAnimationFrame(rafId);
  initParticles(type);
  animLoop();
  S.animType = type;
}

function stopAnim() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ── THEME ────────────────────────────────────────────────
const SUN_ICON  = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
const MOON_ICON = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';

function applyTheme(t) {
  S.theme = t;
  if (t === 'dark') {
    D.body.dataset.theme = 'dark';
    D.iconTheme.innerHTML = SUN_ICON;
  } else if (t === 'light') {
    D.body.dataset.theme = 'light';
    D.iconTheme.innerHTML = MOON_ICON;
  } else {
    delete D.body.dataset.theme;
    D.iconTheme.innerHTML = MOON_ICON;
  }
  localStorage.setItem('yrw-theme', t);
}

D.btnTheme.addEventListener('click', () => applyTheme(S.theme === 'dark' ? 'light' : 'dark'));

// ── ACCESSIBILITY MODE ───────────────────────────────────
function setAccess(on) {
  S.accessMode = on;
  D.body.classList.toggle('mode-access', on);
  D.body.classList.toggle('mode-normal', !on);
  D.btnAccessibility.setAttribute('aria-pressed', String(on));
  D.btnAccessibility.title = on ? 'Disable accessibility mode' : 'Enable accessibility mode (astigmatism-friendly)';
  if (on) stopAnim();
  else if (S.animType) startAnim(S.animType);
  localStorage.setItem('yrw-access', on ? '1' : '0');
}

D.btnAccessibility.addEventListener('click', () => setAccess(!S.accessMode));

// ── SEARCH ───────────────────────────────────────────────
let searchTimer = null;

function openSearch() {
  D.searchPanel.classList.remove('hidden');
  D.searchInput.value = '';
  D.searchResults.innerHTML = '';
  D.searchInput.focus();
}
function closeSearch() { D.searchPanel.classList.add('hidden'); }

D.btnSearch.addEventListener('click', openSearch);
D.btnStartSearch.addEventListener('click', openSearch);
D.searchClose.addEventListener('click', closeSearch);
D.searchPanel.addEventListener('click', e => { if (e.target === D.searchPanel) closeSearch(); });
D.searchInput.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch(); });

D.searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  const q = D.searchInput.value.trim();
  if (q.length < 2) { D.searchResults.innerHTML = ''; return; }
  searchTimer = setTimeout(() => doSearch(q), 340);
});

async function doSearch(q) {
  D.searchResults.innerHTML = `<li style="padding:1rem;color:var(--text3)">Searching…</li>`;
  try {
    const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=8&accept-language=en`;
    const r = await fetch(url);
    if (!r.ok) throw new Error();
    renderResults(await r.json());
  } catch {
    D.searchResults.innerHTML = `<li style="padding:1rem;color:var(--text3)">Search failed. Check your connection.</li>`;
  }
}

function renderResults(data) {
  D.searchResults.innerHTML = '';
  if (!data.length) {
    D.searchResults.innerHTML = `<li style="padding:1rem;color:var(--text3)">No results found.</li>`;
    return;
  }
  data.forEach(r => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.setAttribute('tabindex', '0');
    const a = r.address || {};
    const name = r.name || a.city || a.town || a.village || r.display_name.split(',')[0];
    const sub  = [a.state||a.county||'', a.country||''].filter(Boolean).join(', ');
    li.innerHTML = `<span class="result-name">${name}</span><span class="result-sub">${sub}</span>`;
    const pick = () => { selectCity({ name, lat: +r.lat, lon: +r.lon, country: a.country||'', region: a.state||'' }); closeSearch(); };
    li.addEventListener('click', pick);
    li.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') pick(); });
    D.searchResults.appendChild(li);
  });
}

// ── CITY SELECTION & FETCH ───────────────────────────────
function selectCity(city) {
  S.city = city;
  D.cityName.textContent = city.name;
  localStorage.setItem('yrw-city', JSON.stringify(city));
  fetchWeather(city);
}

function showLoad(on) { D.loadingOverlay.classList.toggle('hidden', !on); }

function showErr(msg) {
  D.errorState.classList.remove('hidden');
  D.weatherDisplay.classList.add('hidden');
  D.emptyState.classList.add('hidden');
  D.errorMessage.textContent = msg;
  showLoad(false);
}

D.btnRetry.addEventListener('click', () => { if (S.city) fetchWeather(S.city); });

async function fetchWeather(city) {
  showLoad(true);
  D.weatherDisplay.classList.add('hidden');
  D.emptyState.classList.add('hidden');
  D.errorState.classList.add('hidden');

  const lat4 = city.lat.toFixed(4);
  const lon4 = city.lon.toFixed(4);
  const today = new Date().toISOString().slice(0, 10);

  try {
    const [fRes, sRes] = await Promise.all([
      fetch(`${MET_BASE}/locationforecast/2.0/complete?lat=${lat4}&lon=${lon4}`,
        { headers: { 'User-Agent': UA } }),
      fetch(`${MET_BASE}/sunrise/3.0/sun?lat=${lat4}&lon=${lon4}&date=${today}&offset=+00:00`,
        { headers: { 'User-Agent': UA } }),
    ]);

    if (!fRes.ok) throw new Error(`Forecast ${fRes.status}`);
    const forecast = await fRes.json();
    const sunrise  = sRes.ok ? await sRes.json() : null;

    S.forecast = forecast;
    S.sunrise  = sunrise;
    renderWeather(forecast, sunrise);
  } catch (err) {
    console.error(err);
    showErr('Could not load weather data. Please check your connection and try again.');
  }
}

// ── DATE HELPERS ─────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return '--';
  return new Date(iso).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}
function fmtHour(iso) {
  const d = new Date(iso);
  return d.getHours().toString().padStart(2,'0') + ':00';
}
function todayStr() { return new Date().toISOString().slice(0,10); }
function dateLabel(dayStr) {
  const d = new Date(dayStr + 'T12:00:00');
  const t = new Date(); t.setHours(12,0,0,0);
  const tm = new Date(t); tm.setDate(t.getDate()+1);
  if (d.toDateString()===t.toDateString())  return 'Today';
  if (d.toDateString()===tm.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en', { weekday:'short', month:'short', day:'numeric' });
}

// ── RENDER ───────────────────────────────────────────────
function renderWeather(forecast, sunrise) {
  const ts = forecast.properties.timeseries;
  if (!ts?.length) { showErr('No forecast data available.'); return; }

  const now = Date.now();
  let ci = 0, minD = Infinity;
  ts.forEach((t, i) => { const d = Math.abs(new Date(t.time)-now); if(d<minD){minD=d;ci=i;} });

  const cur   = ts[ci];
  const inst  = cur.data.instant.details;
  const next1 = cur.data.next_1_hours || cur.data.next_6_hours || {};
  const sym   = getSym(next1.summary?.symbol_code || '');

  // Icon & temp
  D.currentIcon.textContent = sym.e;
  D.currentTemp.textContent = `${Math.round(inst.air_temperature ?? 0)}°C`;
  D.currentDesc.textContent = sym.l;

  // Set weather type for hero gradient
  D.currentCard.dataset.weather = sym.a;

  // Feels-like (dew point approximation isn't in the API; use wind chill if cold)
  const tC   = inst.air_temperature ?? 0;
  const wind = inst.wind_speed ?? 0;
  const feels = tC <= 10 && wind > 1.3
    ? Math.round(13.12 + 0.6215*tC - 11.37*Math.pow(wind*3.6,0.16) + 0.3965*tC*Math.pow(wind*3.6,0.16))
    : Math.round(tC);
  D.currentFeels.textContent = `Feels like ${feels}°C`;

  // Today H/L
  const today = todayStr();
  const todayTemps = ts
    .filter(t => t.time.slice(0, 10) === today)
    .map(t => t.data.instant.details.air_temperature ?? 0);
  if (todayTemps.length) {
    D.currentHi.textContent = `H:${Math.round(Math.max(...todayTemps))}°`;
    D.currentLo.textContent = `L:${Math.round(Math.min(...todayTemps))}°`;
  }

  // Meta
  D.metaWind.textContent      = `${Math.round(wind)} m/s`;
  D.metaWindDir.textContent   = windDir(inst.wind_from_direction) || '--';
  D.metaHumidity.textContent  = `${Math.round(inst.relative_humidity ?? 0)}%`;
  D.metaPressure.textContent  = inst.air_pressure_at_sea_level != null ? `${Math.round(inst.air_pressure_at_sea_level)} hPa` : '--';
  const precip = next1.details?.precipitation_amount;
  D.metaPrecip.textContent    = precip != null ? `${precip.toFixed(1)} mm` : '0 mm';
  D.metaCloud.textContent     = inst.cloud_area_fraction != null ? `${Math.round(inst.cloud_area_fraction)}%` : '--';
  D.metaUv.textContent        = inst.ultraviolet_index_clear_sky != null ? `${Math.round(inst.ultraviolet_index_clear_sky)}` : '--';
  D.metaVis.textContent       = inst.fog_area_fraction != null ? `${(100 - inst.fog_area_fraction).toFixed(0)}%` : '--';

  // Sunrise / sunset / moonrise
  const sp = sunrise?.properties;
  D.sunriseTime.textContent   = `🌅 ${fmtTime(sp?.sunrise?.time)}`;
  D.sunsetTime.textContent    = `🌇 ${fmtTime(sp?.sunset?.time)}`;
  D.moonriseTime.textContent  = `🌕 ${fmtTime(sp?.high_moon?.time || null)}`;

  D.lastUpdated.textContent = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

  // Canvas
  startAnim(sym.a);

  // Sections
  renderHourly(ts, ci);
  renderDaily(ts);

  D.dayDetailSection.classList.add('hidden');
  D.weatherDisplay.classList.remove('hidden');
  D.emptyState.classList.add('hidden');
  D.errorState.classList.add('hidden');
  showLoad(false);
}

function renderHourly(ts, startIdx) {
  D.hourlyScroll.innerHTML = '';
  let count = 0;
  for (let i = startIdx; i < ts.length && count < 25; i++) {
    const t    = ts[i];
    const inst = t.data.instant.details;
    const next = t.data.next_1_hours || t.data.next_6_hours || {};
    const sym  = getSym(next.summary?.symbol_code || '');
    const prec = next.details?.precipitation_amount;
    const isNow = (i === startIdx);

    const chip = document.createElement('div');
    chip.className = `hour-chip${isNow ? ' now-chip' : ''}`;
    chip.setAttribute('role', 'listitem');
    chip.innerHTML = `
      <span class="h-time">${isNow ? 'Now' : fmtHour(t.time)}</span>
      <span class="h-icon">${sym.e}</span>
      <span class="h-temp">${Math.round(inst.air_temperature ?? 0)}°</span>
      <span class="h-wind">${Math.round(inst.wind_speed ?? 0)} m/s</span>
      ${prec > 0 ? `<span class="h-precip">${prec.toFixed(1)}mm</span>` : ''}
    `;
    D.hourlyScroll.appendChild(chip);
    count++;
  }
}

function renderDaily(ts) {
  D.dailyList.innerHTML = '';
  // Group by local date
  const byDay = {};
  ts.forEach(t => {
    const day = t.time.slice(0, 10);
    (byDay[day] = byDay[day] || []).push(t);
  });

  // Compute per-day stats and overall temperature range in a single pass
  const dayStats = {};
  let allLo = Infinity, allHi = -Infinity;
  Object.keys(byDay).sort().slice(0, 10).forEach(day => {
    let lo = Infinity, hi = -Infinity;
    let noonEntry = byDay[day][0], bestDelta = Infinity;
    byDay[day].forEach(t => {
      const T = t.data.instant.details.air_temperature ?? 0;
      if (T < lo) lo = T;
      if (T > hi) hi = T;
      if (T < allLo) allLo = T;
      if (T > allHi) allHi = T;
      const delta = Math.abs(new Date(t.time).getUTCHours() - 12);
      if (delta < bestDelta) { bestDelta = delta; noonEntry = t; }
    });
    dayStats[day] = { lo, hi, noonEntry };
  });
  const allRange = allHi > allLo ? allHi - allLo : 1;

  const renderToday = todayStr();
  Object.keys(dayStats).forEach(day => {
    const { lo, hi, noonEntry } = dayStats[day];
    const next = noonEntry.data.next_1_hours || noonEntry.data.next_6_hours || {};
    const sym  = getSym(next.summary?.symbol_code || '');
    const isToday = day === renderToday;

    // Range bar percentages (0–100) relative to all-days span
    const loPct = Math.round(((lo - allLo) / allRange) * 100);
    const hiPct = Math.round(((hi - allLo) / allRange) * 100);
    // Ensure bar always has a minimum visible width of 4%
    const hiPctClamped = Math.max(hiPct, loPct + 4);

    const row = document.createElement('div');
    row.className = 'day-row';
    row.setAttribute('role', 'listitem');
    row.setAttribute('tabindex', '0');
    row.setAttribute('aria-label',
      `${dateLabel(day)}: ${sym.l}, low ${Math.round(lo)}° high ${Math.round(hi)}°C`);
    row.innerHTML = `
      <span class="day-name${isToday ? ' today' : ''}">${dateLabel(day)}</span>
      <span class="day-icon" aria-hidden="true">${sym.e}</span>
      <span class="day-temp-lo">${Math.round(lo)}°</span>
      <span class="day-range-bar"><span class="day-range-fill" style="left:${loPct}%;right:${100 - hiPctClamped}%"></span></span>
      <span class="day-temp-hi">${Math.round(hi)}°</span>
    `;
    const entries = byDay[day];
    row.addEventListener('click', () => openDayDetail(day, entries));
    row.addEventListener('keydown', e => { if(e.key==='Enter'||e.key===' ') openDayDetail(day, entries); });
    D.dailyList.appendChild(row);
  });
}

// ── DAY DETAIL ───────────────────────────────────────────
function openDayDetail(day, entries) {
  D.dayDetailTitle.textContent = `Hourly – ${dateLabel(day)}`;
  D.dayDetailScroll.innerHTML = '';

  const valid = entries.filter(t => t.data.next_1_hours || t.data.next_6_hours);
  if (!valid.length) {
    D.dayDetailScroll.innerHTML = `<p style="padding:1rem;color:var(--text3)">No hourly data for this day.</p>`;
  } else {
    valid.forEach(t => {
      const inst = t.data.instant.details;
      const next = t.data.next_1_hours || t.data.next_6_hours || {};
      const sym  = getSym(next.summary?.symbol_code || '');
      const prec = next.details?.precipitation_amount ?? 0;

      const chip = document.createElement('div');
      chip.className = 'hour-chip';
      chip.setAttribute('role', 'listitem');
      chip.style.minWidth = '66px';
      chip.innerHTML = `
        <span class="h-time">${fmtHour(t.time)}</span>
        <span class="h-icon">${sym.e}</span>
        <span class="h-temp">${Math.round(inst.air_temperature ?? 0)}°</span>
        <span class="h-wind">${Math.round(inst.wind_speed ?? 0)}m/s</span>
        ${prec > 0.05 ? `<span class="h-precip">${prec.toFixed(1)}mm</span>` : ''}
      `;
      D.dayDetailScroll.appendChild(chip);
    });
  }

  D.dayDetailSection.classList.remove('hidden');
  D.dayDetailSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

D.dayDetailClose.addEventListener('click', () => D.dayDetailSection.classList.add('hidden'));

// ── INIT ─────────────────────────────────────────────────
function init() {
  applyTheme(localStorage.getItem('yrw-theme') || 'auto');
  setAccess(localStorage.getItem('yrw-access') === '1');

  try {
    const saved = localStorage.getItem('yrw-city');
    if (saved) {
      const city = JSON.parse(saved);
      S.city = city;
      D.cityName.textContent = city.name;
      fetchWeather(city);
    }
  } catch {}

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init();