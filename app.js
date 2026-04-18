/* ═══════════════════════════════════════════
   GŌNG — Arts Martiaux · App Logic (Supabase)
═══════════════════════════════════════════ */

'use strict';

// ── CONFIG ───────────────────────────────────────────────────────────────────
const SUPABASE_URL = window.GONG_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.GONG_SUPABASE_ANON_KEY || '';

if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Gōng] Supabase non configuré.');
}

const supabaseClient = (window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    })
  : null;

// ── DEFAULT DATA ─────────────────────────────────────────────────────────────
const DEFAULT_SKILLS = [
  { id: 'relachement', name: 'Relâchement', value: 0 },
  { id: 'precision', name: 'Précision', value: 0 },
  { id: 'structure', name: 'Structure', value: 0 },
  { id: 'ancrage', name: 'Ancrage', value: 0 },
  { id: 'vitesse', name: 'Vitesse', value: 0 },
  { id: 'coordination', name: 'Coordination', value: 0 },
  { id: 'endurance', name: 'Endurance', value: 0 },
];

const DEFAULT_TECHNIQUES = [
  { name: 'Pak Sao', category: 'Wing Chun', mastered: false },
  { name: 'Pak Sao Latéral', category: 'Wing Chun', mastered: false },
  { name: 'Pak Sao Inversé', category: 'Wing Chun', mastered: false },
  { name: 'Tan Sao', category: 'Wing Chun', mastered: false },
  { name: 'Bon Sao', category: 'Wing Chun', mastered: false },
  { name: 'Jut Sao', category: 'Wing Chun', mastered: false },
  { name: 'Jut Sao Bas', category: 'Wing Chun', mastered: false },
  { name: 'Jut Sao Intérieur', category: 'Wing Chun', mastered: false },
  { name: 'Bil Sao', category: 'Wing Chun', mastered: false },
  { name: 'Fook Sao', category: 'Wing Chun', mastered: false },
  { name: 'Garn Sao', category: 'Wing Chun', mastered: false },
  { name: 'Gum Sao', category: 'Wing Chun', mastered: false },
  { name: 'Fut Sao', category: 'Wing Chun', mastered: false },
  { name: 'Chuen Sao', category: 'Wing Chun', mastered: false },
  { name: 'Huen Sao', category: 'Wing Chun', mastered: false },
  { name: 'Huen Sao Large', category: 'Wing Chun', mastered: false },
  { name: 'Huen Sao Ouverture', category: 'Wing Chun', mastered: false },
  { name: 'Wu Sao', category: 'Wing Chun', mastered: false },
  { name: 'Tarn Sao', category: 'Wing Chun', mastered: false },
  { name: 'Larp Sao', category: 'Wing Chun', mastered: false },
  { name: 'Larn Sao', category: 'Wing Chun', mastered: false },
  { name: 'Quan Sao', category: 'Wing Chun', mastered: false },
  { name: 'Qan Sao', category: 'Wing Chun', mastered: false },
];

function cloneSkills() {
  return DEFAULT_SKILLS.map((s) => ({ ...s }));
}

function cloneTechniques() {
  return DEFAULT_TECHNIQUES.map((t) => ({ ...t }));
}

// ── STATE ────────────────────────────────────────────────────────────────────
let state = {
  user: null, // { id, pseudo, email }
  skills: cloneSkills(),
  techniques: cloneTechniques(),
  history: [],
  observations: '',
};

let remoteSyncTimer = null;
let isInitialLoading = false;
let deferredInstallPrompt = null;

// ── DOM ──────────────────────────────────────────────────────────────────────
const obsEl = document.getElementById('observations');
const authBtn = document.getElementById('auth-btn');
const userDisplay = document.getElementById('user-display');

const modalCloseBtn = document.getElementById('modal-close-btn');

const loginPseudoEl = document.getElementById('login-pseudo');
const loginPasswordEl = document.getElementById('login-password');
const loginBtnEl = document.getElementById('login-btn');
const loginErrorEl = document.getElementById('login-error');

const regPseudoEl = document.getElementById('reg-pseudo');
const regPasswordEl = document.getElementById('reg-password');
const registerBtnEl = document.getElementById('register-btn');
const regErrorEl = document.getElementById('reg-error');

const saveObsBtn = document.getElementById('save-obs-btn');
const addTechniqueBtn = document.getElementById('add-technique-btn');
const techniqueModalClose = document.getElementById('technique-modal-close');
const addTechniqueConfirm = document.getElementById('add-technique-confirm');
const newTechniqueName = document.getElementById('new-technique-name');
const newTechniqueCategory = document.getElementById('new-technique-category');

const compareRadarContainer = document.getElementById('compare-radar-container');
const closeCompareBtn = document.getElementById('close-compare');

const installBtn = document.getElementById('install-btn');

const loadingScreen = document.getElementById('loading-screen');

// ── HELPERS ──────────────────────────────────────────────────────────────────
function normalizeSkills(skillsFromDb) {
  const incoming = Array.isArray(skillsFromDb) ? skillsFromDb : [];
  const byId = new Map(incoming.map((s) => [s.id, s]));
  const byName = new Map(incoming.map((s) => [s.name, s]));

  return DEFAULT_SKILLS.map((base) => {
    const source = byId.get(base.id) || byName.get(base.name);
    const val = Number.isFinite(source?.value) ? source.value : base.value;
    return { ...base, value: Math.max(0, Math.min(10, val)) };
  });
}

function normalizeTechniques(techniques) {
  return Array.isArray(techniques)
    ? techniques
        .map((t) => ({
          name: String(t.name || ''),
          category: String(t.category || 'Autre'),
          mastered: !!t.mastered,
        }))
        .filter((t) => t.name.trim())
    : cloneTechniques();
}

function resetStateToDefaults() {
  state.skills = cloneSkills();
  state.techniques = cloneTechniques();
  state.history = [];
  state.observations = '';
  if (obsEl) obsEl.value = '';
}

function normalizePseudo(pseudo) {
  return String(pseudo || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]/g, '');
}

function pseudoToEmail(pseudo) {
  return `${normalizePseudo(pseudo)}@gong.app`;
}

function safePseudoFromEmail(email) {
  return String(email || '').split('@')[0] || '';
}

function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError(el) {
  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function addHistory(type, desc) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  state.history.unshift({ type, desc, date: dateStr });
  if (state.history.length > 200) state.history.pop();
}

function isLoggedIn() {
  return !!state.user?.id;
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function updateAuthUI() {
  if (state.user) {
    if (authBtn) {
      authBtn.textContent = 'Déconnexion';
      authBtn.classList.add('logged-in');
    }
    if (userDisplay) {
      userDisplay.textContent = state.user.pseudo;
      userDisplay.classList.remove('hidden');
    }
  } else {
    if (authBtn) {
      authBtn.textContent = 'Se connecter';
      authBtn.classList.remove('logged-in');
    }
    if (userDisplay) {
      userDisplay.textContent = '';
      userDisplay.classList.add('hidden');
    }
  }
}

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === name);
  });

  document.querySelectorAll('.tab-section').forEach((s) => {
    s.classList.toggle('active', s.id === `tab-${name}`);
  });

  if (name === 'profil') drawRadar('radar-canvas', state.skills);
  if (name === 'techniques') renderTechniques();
  if (name === 'historique') renderHistory();
  if (name === 'communaute') renderCommunity();
}

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.querySelectorAll('.modal-backdrop').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.modal').forEach((m) => m.classList.add('hidden'));
  });
});

document.querySelectorAll('.modal-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.modal-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const which = tab.dataset.modalTab;
    document.getElementById('modal-login')?.classList.toggle('hidden', which !== 'login');
    document.getElementById('modal-register')?.classList.toggle('hidden', which !== 'register');
  });
});

// ── COLORS ───────────────────────────────────────────────────────────────────
function valueColor(v) {
  const t = v / 10;
  if (t === 0) return { r: 58, g: 58, b: 58 };

  const stops = [
    { t: 0, r: 58, g: 58, b: 58 },
    { t: 0.3, r: 80, g: 60, b: 5 },
    { t: 0.6, r: 160, g: 110, b: 0 },
    { t: 0.8, r: 220, g: 160, b: 0 },
    { t: 1, r: 255, g: 208, b: 0 },
  ];

  let i = 0;
  while (i < stops.length - 1 && stops[i + 1].t <= t) i++;
  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  const f = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t);

  return {
    r: Math.round(a.r + (b.r - a.r) * f),
    g: Math.round(a.g + (b.g - a.g) * f),
    b: Math.round(a.b + (b.b - a.b) * f),
  };
}

function colorStr(v) {
  const { r, g, b } = valueColor(v);
  return `rgb(${r},${g},${b})`;
}

function colorHex(v) {
  const { r, g, b } = valueColor(v);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ── RADAR ────────────────────────────────────────────────────────────────────
function drawRadar(canvasId, skills, secondarySkills = null) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) * 0.38;
  const N = skills.length;
  const levels = 5;

  ctx.clearRect(0, 0, W, H);

  for (let l = 1; l <= levels; l++) {
    const r = (R / levels) * l;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = l === levels ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = l === levels ? 1.5 : 1;
    ctx.stroke();
  }

  for (let i = 0; i < N; i++) {
    const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawPolygon(skillsArr, fillColor, strokeColor, alpha = 1) {
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
      const val = Math.max(0, Math.min(10, skillsArr[i].value));
      const r = (val / 10) * R;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  const avg = skills.reduce((s, k) => s + k.value, 0) / N;

  drawPolygon(
    skills,
    `rgba(${Object.values(valueColor(avg)).join(',')},0.13)`,
    colorStr(avg * 0.9 + 1)
  );

  for (let i = 0; i < N; i++) {
    const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
    const val = Math.max(0, Math.min(10, skills[i].value));
    const r = (val / 10) * R;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = colorStr(val);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  if (secondarySkills) {
    drawPolygon(
      secondarySkills,
      'rgba(120,180,255,0.08)',
      'rgba(120,180,255,0.6)',
      1
    );
  }

  for (let i = 0; i < N; i++) {
    const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
    const labelR = R + 22;
    const x = cx + labelR * Math.cos(angle);
    const y = cy + labelR * Math.sin(angle);

    ctx.font = '600 11px Barlow, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = skills[i].name === 'Coordination' ? '#f1f1f1' : colorStr(skills[i].value);
    const label = skills[i].name === 'Coordination' ? 'Coord.' : skills[i].name.toUpperCase();
    ctx.fillText(label, x, y);
  }

  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fill();
}

// ── REMOTE DB ────────────────────────────────────────────────────────────────
async function ensureRemoteRow() {
  if (!isLoggedIn() || !supabaseClient) return;

  const isoNow = new Date().toISOString();

  const privatePayload = {
    id: state.user.id,
    pseudo: state.user.pseudo,
    skills: state.skills,
    techniques: state.techniques,
    history: state.history,
    observations: state.observations,
    updated_at: isoNow,
  };

  const publicPayload = {
    id: state.user.id,
    pseudo: state.user.pseudo,
    skills: state.skills,
    updated_at: isoNow,
  };

  const { error: privateError } = await supabaseClient
    .from('gong_users')
    .upsert(privatePayload, { onConflict: 'id' });

  if (privateError) {
    console.warn('[Gōng] ensureRemoteRow private error', privateError);
  }

  const { error: publicError } = await supabaseClient
    .from('gong_public_profiles')
    .upsert(publicPayload, { onConflict: 'id' });

  if (publicError) {
    console.warn('[Gōng] ensureRemoteRow public error', publicError);
  }
}

async function loadRemoteUserState() {
  if (!isLoggedIn() || !supabaseClient) return;

  const { data, error } = await supabaseClient
    .from('gong_users')
    .select('id, pseudo, skills, techniques, history, observations')
    .eq('id', state.user.id)
    .maybeSingle();

  if (error) {
    console.warn('[Gōng] Supabase load error', error);
    return;
  }

  if (!data) {
    await ensureRemoteRow();
    return;
  }

  state.user.pseudo = data.pseudo || state.user.pseudo;
  state.skills = normalizeSkills(data.skills);
  state.techniques = normalizeTechniques(data.techniques);
  state.history = Array.isArray(data.history) ? data.history : [];
  state.observations = typeof data.observations === 'string' ? data.observations : '';

  if (obsEl) obsEl.value = state.observations;

  renderSkills();
  renderTechniques();
  renderHistory();
  drawRadar('radar-canvas', state.skills);
}

async function syncRemoteUserState() {
  if (!isLoggedIn() || !supabaseClient) return;

  const isoNow = new Date().toISOString();

  const privatePayload = {
    id: state.user.id,
    pseudo: state.user.pseudo,
    skills: state.skills,
    techniques: state.techniques,
    history: state.history,
    observations: state.observations,
    updated_at: isoNow,
  };

  const publicPayload = {
    id: state.user.id,
    pseudo: state.user.pseudo,
    skills: state.skills,
    updated_at: isoNow,
  };

  const { error: privateError } = await supabaseClient
    .from('gong_users')
    .upsert(privatePayload, { onConflict: 'id' });

  if (privateError) {
    console.warn('[Gōng] Supabase private sync error', privateError);
  }

  const { error: publicError } = await supabaseClient
    .from('gong_public_profiles')
    .upsert(publicPayload, { onConflict: 'id' });

  if (publicError) {
    console.warn('[Gōng] Supabase public sync error', publicError);
  }
}

function scheduleRemoteSync() {
  if (!isLoggedIn() || !supabaseClient || isInitialLoading) return;
  if (remoteSyncTimer) clearTimeout(remoteSyncTimer);

  remoteSyncTimer = setTimeout(() => {
    syncRemoteUserState();
  }, 400);
}

// ── SKILLS UI ────────────────────────────────────────────────────────────────
function renderSkills() {
  const container = document.getElementById('skills-list');
  if (!container) return;

  container.innerHTML = '';

  state.skills.forEach((skill) => {
    const div = document.createElement('div');
    div.className = 'skill-item';
    div.innerHTML = `
      <div class="skill-header">
        <span class="skill-name">${skill.name}</span>
        <span class="skill-value" id="val-${skill.id}" style="color:${colorStr(skill.value)}">${skill.value}</span>
      </div>
      <div class="skill-slider-wrap">
        <input type="range" min="0" max="10" step="1" value="${skill.value}"
          id="slider-${skill.id}" data-id="${skill.id}" />
      </div>
    `;
    container.appendChild(div);

    const slider = div.querySelector(`#slider-${skill.id}`);
    updateSliderStyle(slider, skill.value);
    slider.addEventListener('input', onSliderInput);
    slider.addEventListener('change', onSliderChange);
  });
}

function updateSliderStyle(slider, v) {
  const pct = (v / 10) * 100;
  const col = colorHex(v);
  const glow = v > 0 ? `rgba(${Object.values(valueColor(v)).join(',')},0.4)` : 'transparent';

  slider.style.setProperty('--thumb-color', col);
  slider.style.setProperty('--thumb-border', col);
  slider.style.setProperty('--thumb-glow', glow);
  slider.style.setProperty(
    '--track-bg',
    `linear-gradient(to right, ${col} 0%, ${col} ${pct}%, var(--bg-4) ${pct}%, var(--bg-4) 100%)`
  );
}

function onSliderInput(e) {
  const id = e.target.dataset.id;
  const v = parseInt(e.target.value, 10);
  const skill = state.skills.find((s) => s.id === id);
  if (!skill) return;

  skill.value = v;

  const valEl = document.getElementById(`val-${id}`);
  if (valEl) {
    valEl.textContent = v;
    valEl.style.color = colorStr(v);
  }

  updateSliderStyle(e.target, v);
  drawRadar('radar-canvas', state.skills);
}

function onSliderChange(e) {
  const id = e.target.dataset.id;
  const v = parseInt(e.target.value, 10);
  const skill = state.skills.find((s) => s.id === id);
  if (!skill) return;

  addHistory('skill', `${skill.name} → ${v}/10`);
  renderHistory();
  scheduleRemoteSync();
}

// ── TECHNIQUES UI ────────────────────────────────────────────────────────────
function renderTechniques() {
  const container = document.getElementById('techniques-list');
  if (!container) return;

  container.innerHTML = '';

  if (!state.techniques.length) {
    container.innerHTML = '<p style="color:var(--text-3);font-size:.88rem;text-align:center;padding:30px 0">Aucune technique. Appuyez sur + pour en ajouter.</p>';
    return;
  }

  state.techniques.forEach((tech, idx) => {
    const div = document.createElement('div');
    div.className = `technique-item ${tech.mastered ? 'mastered' : ''}`;
    div.innerHTML = `
      <div class="technique-check" data-idx="${idx}"></div>
      <div class="technique-info">
        <div class="technique-name">${tech.name}</div>
        <div class="technique-category">${tech.category}</div>
      </div>
      <button class="technique-delete" data-idx="${idx}" title="Supprimer" type="button">✕</button>
    `;

    const deleteBtn = div.querySelector('.technique-delete');

    div.addEventListener('click', (e) => {
      if (e.target.closest('.technique-delete')) return;
      toggleTechnique(idx);
    });

    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTechnique(idx);
    });

    container.appendChild(div);
  });
}

function toggleTechnique(idx) {
  state.techniques[idx].mastered = !state.techniques[idx].mastered;
  const status = state.techniques[idx].mastered ? 'maîtrisée' : 'non maîtrisée';
  addHistory('tech', `${state.techniques[idx].name} marquée ${status}`);
  renderTechniques();
  renderHistory();
  scheduleRemoteSync();
}

function deleteTechnique(idx) {
  const name = state.techniques[idx].name;
  state.techniques.splice(idx, 1);
  addHistory('tech', `Technique supprimée : ${name}`);
  renderTechniques();
  renderHistory();
  scheduleRemoteSync();
}

// ── HISTORY ──────────────────────────────────────────────────────────────────
function renderHistory() {
  const container = document.getElementById('history-list');
  if (!container) return;

  if (!state.history.length) {
    container.innerHTML = '<p class="history-empty">Aucune modification enregistrée.</p>';
    return;
  }

  container.innerHTML = state.history.map((h) => `
    <div class="history-item type-${h.type}">
      <span class="history-date">${h.date}</span>
      <span class="history-desc">${h.desc}</span>
    </div>
  `).join('');
}

// ── COMMUNITY ────────────────────────────────────────────────────────────────
async function renderCommunity() {
  const container = document.getElementById('community-list');
  if (!container) return;

  if (!supabaseClient) {
    container.innerHTML = '<p class="history-empty">Communauté indisponible.</p>';
    return;
  }

  container.innerHTML = '<p class="history-empty">Chargement…</p>';

  const { data, error } = await supabaseClient
    .from('gong_public_profiles')
    .select('id, pseudo, skills, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn('[Gōng] Community load error', error);
    container.innerHTML = '<p class="history-empty">Impossible de charger la communauté.</p>';
    return;
  }

  const users = (data || [])
    .filter((u) => u.id !== state.user?.id)
    .map((u) => ({
      id: u.id,
      pseudo: u.pseudo,
      skills: normalizeSkills(u.skills),
    }));

  if (!users.length) {
    container.innerHTML = '<p class="history-empty">Aucun autre pratiquant pour le moment.</p>';
    return;
  }

  container.innerHTML = users.map((u, idx) => {
    const avg = (u.skills.reduce((s, k) => s + k.value, 0) / u.skills.length).toFixed(1);
    return `
      <div class="community-item">
        <div>
          <div class="community-pseudo">${u.pseudo}</div>
          <div class="community-avg">Moyenne : ${avg}/10</div>
        </div>
        <button class="btn-compare" data-idx="${idx}">Comparer</button>
      </div>`;
  }).join('');

  container.querySelectorAll('.btn-compare').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      showComparison(users[idx]);
    });
  });
}

function showComparison(other) {
  const title = document.getElementById('compare-title');
  if (title) title.textContent = `Vous vs ${other.pseudo}`;
  if (compareRadarContainer) compareRadarContainer.classList.remove('hidden');
  drawRadar('compare-canvas', state.skills, other.skills);
}

// ── AUTH ─────────────────────────────────────────────────────────────────────
async function handleRegister() {
  hideError(regErrorEl);

  if (!supabaseClient) {
    showError(regErrorEl, 'Supabase non configuré.');
    return;
  }

  const pseudo = regPseudoEl?.value.trim() || '';
  const password = regPasswordEl?.value || '';

  if (!pseudo || !password) {
    showError(regErrorEl, 'Pseudo et mot de passe requis.');
    return;
  }

  if (normalizePseudo(pseudo).length < 3) {
    showError(regErrorEl, 'Pseudo trop court.');
    return;
  }

  if (password.length < 4) {
    showError(regErrorEl, 'Mot de passe trop court (4 caractères min.).');
    return;
  }

  const email = pseudoToEmail(pseudo);

  console.log('REGISTER START', email);

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { pseudo },
    },
  });

  console.log('REGISTER RESULT', data, error);

  if (error) {
    showError(regErrorEl, error.message || 'Inscription impossible.');
    return;
  }

  const signIn = await supabaseClient.auth.signInWithPassword({ email, password });

  if (signIn.error) {
    showError(regErrorEl, signIn.error.message || 'Connexion impossible après inscription.');
    return;
  }

  showToast(`Compte créé. Bienvenue, ${pseudo} !`);
  closeModal('auth-modal');
}

async function handleLogin() {
  hideError(loginErrorEl);

  if (!supabaseClient) {
    showError(loginErrorEl, 'Supabase non configuré.');
    return;
  }

  const pseudo = loginPseudoEl?.value.trim() || '';
  const password = loginPasswordEl?.value || '';

  if (!pseudo || !password) {
    showError(loginErrorEl, 'Pseudo et mot de passe requis.');
    return;
  }

  const email = pseudoToEmail(pseudo);

  console.log('LOGIN START', email);

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  console.log('LOGIN RESULT', error);

  if (error) {
    showError(loginErrorEl, 'Pseudo ou mot de passe incorrect.');
    return;
  }

  closeModal('auth-modal');
  showToast(`Bienvenue, ${pseudo} !`);
}

async function handleLogout() {
  if (!supabaseClient) return;

  await supabaseClient.auth.signOut();
  state.user = null;
  resetStateToDefaults();
  updateAuthUI();
  renderSkills();
  renderTechniques();
  renderHistory();
  drawRadar('radar-canvas', state.skills);
  showToast('Déconnecté');
}

async function applySession(session) {
  if (!session?.user) {
    state.user = null;
    resetStateToDefaults();
    if (obsEl) obsEl.value = '';
    updateAuthUI();
    renderSkills();
    renderTechniques();
    renderHistory();
    drawRadar('radar-canvas', state.skills);
    return;
  }

  const user = session.user;

  state.user = {
    id: user.id,
    pseudo: user.user_metadata?.pseudo || safePseudoFromEmail(user.email),
    email: user.email,
  };

  updateAuthUI();

  isInitialLoading = true;
  await loadRemoteUserState();
  isInitialLoading = false;
}

// ── PWA INSTALL ──────────────────────────────────────────────────────────────
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installBtn?.classList.remove('hidden');
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  installBtn?.classList.add('hidden');
});

async function handleInstallApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installBtn?.classList.add('hidden');
}

function hideLoadingScreen() {
  if (!loadingScreen) return;
  loadingScreen.classList.add('hidden');

  setTimeout(() => {
    loadingScreen.remove();
  }, 500);
}

// ── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  renderSkills();
  renderTechniques();
  renderHistory();
  drawRadar('radar-canvas', state.skills);

  const splashMaxDuration = 1500;
    setTimeout(() => {
    hideLoadingScreen();
 }, splashMaxDuration);

  if (obsEl) obsEl.value = state.observations || '';

  saveObsBtn?.addEventListener('click', () => {
    state.observations = obsEl?.value || '';
    addHistory('obs', 'Observations mises à jour');
    renderHistory();
    scheduleRemoteSync();

    saveObsBtn.textContent = '✓ Enregistré';
    saveObsBtn.classList.add('saved');

    setTimeout(() => {
      saveObsBtn.textContent = 'Enregistrer';
      saveObsBtn.classList.remove('saved');
    }, 2000);

    showToast('Observations enregistrées');
  });

  authBtn?.addEventListener('click', () => {
    if (state.user) {
      handleLogout();
    } else {
      openModal('auth-modal');
    }
  });

  modalCloseBtn?.addEventListener('click', () => closeModal('auth-modal'));
  techniqueModalClose?.addEventListener('click', () => closeModal('technique-modal'));

  if (closeCompareBtn) {
    closeCompareBtn.addEventListener('click', () => {
      compareRadarContainer?.classList.add('hidden');
    });
  }

  loginBtnEl?.addEventListener('click', handleLogin);
  registerBtnEl?.addEventListener('click', handleRegister);
  installBtn?.addEventListener('click', handleInstallApp);

  addTechniqueBtn?.addEventListener('click', () => {
    openModal('technique-modal');
  });

  addTechniqueConfirm?.addEventListener('click', () => {
    const name = newTechniqueName?.value.trim() || '';
    const cat = newTechniqueCategory?.value || 'Autre';

    if (!name) {
      showToast('Entrez un nom de technique');
      return;
    }

    state.techniques.push({ name, category: cat, mastered: false });
    addHistory('tech', `Nouvelle technique ajoutée : ${name}`);
    renderTechniques();
    renderHistory();
    scheduleRemoteSync();
    closeModal('technique-modal');

    if (newTechniqueName) newTechniqueName.value = '';

    showToast(`"${name}" ajoutée`);
  });

  if (supabaseClient) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    await applySession(session);

    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      await applySession(session);
    });
  }
});

// ── SERVICE WORKER ───────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/Gong/sw.js')
      .then((r) => console.log('[Gōng] SW enregistré', r.scope))
      .catch((e) => console.warn('[Gōng] SW erreur', e));
  });
}
