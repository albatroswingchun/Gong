/* ═══════════════════════════════════════════
   GŌNG — Arts Martiaux · App Logic
═══════════════════════════════════════════ */

'use strict';

// ── DEFAULT SKILLS ──────────────────────────────────────────────────────────
const DEFAULT_SKILLS = [
  { id: 'relachement', name: 'Relâchement', value: 0 },
  { id: 'precision',   name: 'Précision', value: 0 },
  { id: 'structure',   name: 'Structure', value: 0 },
  { id: 'ancrage',     name: 'Ancrage', value: 0 },
  { id: 'vitesse',     name: 'Vitesse', value: 0 },
  { id: 'coordination', name: 'Coordination', value: 0 },
  { id: 'endurance',   name: 'Endurance', value: 0 },
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

const SUPABASE_URL = window.GONG_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.GONG_SUPABASE_ANON_KEY || '';
const SUPABASE_TABLE = 'gong_users';
const supabaseClient = (
  window.supabase &&
  SUPABASE_URL &&
  SUPABASE_ANON_KEY
) ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let remoteSyncTimer = null;


// ── STATE ────────────────────────────────────────────────────────────────────
let state = {
  user: null,           // { pseudo, passwordHash }
  skills: [],
  techniques: [],
  history: [],
  observations: '',
  users: [],            // tous les comptes locaux
};

// ── STORAGE HELPERS ─────────────────────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem('gong_state');
    if (raw) {
      const saved = JSON.parse(raw);
      state = { ...state, ...saved };
    }
  } catch(e) { /* ignore */ }
  state.skills = normalizeSkills(state.skills);
  if (!state.techniques.length) state.techniques = DEFAULT_TECHNIQUES.map(t => ({ ...t }));
  if (!state.users) state.users = [];
}

function normalizeSkills(skillsFromStorage) {
  const incoming = Array.isArray(skillsFromStorage) ? skillsFromStorage : [];
  const byId = new Map(incoming.map(s => [s.id, s]));
  const byName = new Map(incoming.map(s => [s.name, s]));
  return DEFAULT_SKILLS.map(base => {
    const fromId = byId.get(base.id);
    const fromName = byName.get(base.name);
    const source = fromId || fromName;
    const val = Number.isFinite(source?.value) ? source.value : base.value;
    return { ...base, value: Math.max(0, Math.min(10, val)) };
  });
}

function saveState() {
  localStorage.setItem('gong_state', JSON.stringify(state));
  scheduleRemoteSync();
}

function isSupabaseReady() {
  return !!(supabaseClient && state.user?.pseudo);
}

async function loadRemoteUserState(pseudo) {
  if (!supabaseClient || !pseudo) return;
  try {
    const { data, error } = await supabaseClient
      .from(SUPABASE_TABLE)
      .select('skills, techniques, history, observations')
      .eq('pseudo', pseudo)
      .maybeSingle();
    if (error || !data) return;
    if (Array.isArray(data.skills) && data.skills.length) state.skills = normalizeSkills(data.skills);
    if (Array.isArray(data.techniques) && data.techniques.length) state.techniques = data.techniques;
    if (Array.isArray(data.history)) state.history = data.history;
    if (typeof data.observations === 'string') state.observations = data.observations;
    saveState();
  } catch (e) {
    console.warn('[Gōng] Supabase load error', e);
  }
}

async function syncRemoteUserState() {
  if (!isSupabaseReady()) return;
  try {
    const payload = {
      pseudo: state.user.pseudo,
      skills: state.skills,
      techniques: state.techniques,
      history: state.history,
      observations: state.observations,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabaseClient
      .from(SUPABASE_TABLE)
      .upsert(payload, { onConflict: 'pseudo' });
    if (error) console.warn('[Gōng] Supabase sync error', error);
  } catch (e) {
    console.warn('[Gōng] Supabase sync exception', e);
  }
}

function scheduleRemoteSync() {
  if (!isSupabaseReady()) return;
  if (remoteSyncTimer) clearTimeout(remoteSyncTimer);
  remoteSyncTimer = setTimeout(() => {
    syncRemoteUserState();
  }, 600);
}

// ── SIMPLE HASH (non-cryptographic, pour démo locale) ───────────────────────
async function simpleHash(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ── COLOR FROM VALUE ─────────────────────────────────────────────────────────
// 0 = gris #3a3a3a  →  10 = jaune vif #ffd000
function valueColor(v) {
  const t = v / 10;
  if (t === 0) return { r: 58, g: 58, b: 58 };
  // interpolation grey → deep amber → yellow
  const stops = [
    { t: 0,    r: 58,  g: 58,  b: 58  },
    { t: 0.3,  r: 80,  g: 60,  b: 5   },
    { t: 0.6,  r: 160, g: 110, b: 0   },
    { t: 0.8,  r: 220, g: 160, b: 0   },
    { t: 1,    r: 255, g: 208, b: 0   },
  ];
  let i = 0;
  while (i < stops.length - 1 && stops[i+1].t <= t) i++;
  const a = stops[i], b2 = stops[Math.min(i+1, stops.length-1)];
  const f = b2.t === a.t ? 1 : (t - a.t) / (b2.t - a.t);
  return {
    r: Math.round(a.r + (b2.r - a.r) * f),
    g: Math.round(a.g + (b2.g - a.g) * f),
    b: Math.round(a.b + (b2.b - a.b) * f),
  };
}

function colorStr(v) {
  const { r, g, b } = valueColor(v);
  return `rgb(${r},${g},${b})`;
}

function colorHex(v) {
  const { r, g, b } = valueColor(v);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// ── RADAR DRAW ───────────────────────────────────────────────────────────────
function drawRadar(canvasId, skills, secondarySkills = null, secondaryColor = null) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) * 0.38;
  const N = skills.length;
  const levels = 5;

  ctx.clearRect(0, 0, W, H);

  // Background rings
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
    ctx.strokeStyle = l === levels
      ? 'rgba(255,255,255,0.12)'
      : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = l === levels ? 1.5 : 1;
    ctx.stroke();
  }

  // Axis lines
  for (let i = 0; i < N; i++) {
    const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Helper: draw a data polygon
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

  // Main polygon — gradient fill using average color
  const avg = skills.reduce((s, k) => s + k.value, 0) / N;
  drawPolygon(
    skills,
    `rgba(${Object.values(valueColor(avg)).join(',')},0.13)`,
    colorStr(avg * 0.9 + 1)
  );

  // Dots on vertices
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

  // Secondary polygon (comparison)
  if (secondarySkills) {
    drawPolygon(
      secondarySkills,
      'rgba(120,180,255,0.08)',
      'rgba(120,180,255,0.6)',
      1
    );
  }

  // Labels
  for (let i = 0; i < N; i++) {
    const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
    const labelR = R + 22;
    const x = cx + labelR * Math.cos(angle);
    const y = cy + labelR * Math.sin(angle);

    ctx.font = '600 11px Barlow, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colorStr(skills[i].value);
    ctx.fillText(skills[i].name.toUpperCase(), x, y);
  }

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fill();
}

// ── SKILLS UI ────────────────────────────────────────────────────────────────
function renderSkills() {
  const container = document.getElementById('skills-list');
  container.innerHTML = '';
  state.skills.forEach(skill => {
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
  slider.style.setProperty('--track-bg',
    `linear-gradient(to right, ${col} 0%, ${col} ${pct}%, var(--bg-4) ${pct}%, var(--bg-4) 100%)`
  );
}

function onSliderInput(e) {
  const id = e.target.dataset.id;
  const v = parseInt(e.target.value);
  const skill = state.skills.find(s => s.id === id);
  skill.value = v;
  const valEl = document.getElementById(`val-${id}`);
  valEl.textContent = v;
  valEl.style.color = colorStr(v);
  updateSliderStyle(e.target, v);
  drawRadar('radar-canvas', state.skills);
}

function onSliderChange(e) {
  const id = e.target.dataset.id;
  const v = parseInt(e.target.value);
  const skill = state.skills.find(s => s.id === id);
  addHistory('skill', `${skill.name} → ${v}/10`);
  saveState();
}

// ── TECHNIQUES UI ────────────────────────────────────────────────────────────
function renderTechniques() {
  const container = document.getElementById('techniques-list');
  container.innerHTML = '';
  if (!state.techniques.length) {
    container.innerHTML = '<p style="color:var(--text-3);font-size:.88rem;text-align:center;padding:30px 0">Aucune technique. Appuyez sur + pour en ajouter.</p>';
    return;
  }
  state.techniques.forEach((tech, idx) => {
    const div = document.createElement('div');
    div.className = 'technique-item';
    div.innerHTML = `
      <div class="technique-check ${tech.mastered ? 'mastered' : ''}" data-idx="${idx}"></div>
      <div class="technique-info">
        <div class="technique-name">${tech.name}</div>
        <div class="technique-category">${tech.category}</div>
      </div>
      <button class="technique-delete" data-idx="${idx}" title="Supprimer">✕</button>
    `;
    div.querySelector('.technique-check').addEventListener('click', () => toggleTechnique(idx));
    div.querySelector('.technique-delete').addEventListener('click', () => deleteTechnique(idx));
    container.appendChild(div);
  });
}

function toggleTechnique(idx) {
  state.techniques[idx].mastered = !state.techniques[idx].mastered;
  const status = state.techniques[idx].mastered ? 'maîtrisée' : 'non maîtrisée';
  addHistory('tech', `${state.techniques[idx].name} marquée ${status}`);
  saveState();
  renderTechniques();
}

function deleteTechnique(idx) {
  const name = state.techniques[idx].name;
  state.techniques.splice(idx, 1);
  addHistory('tech', `Technique supprimée : ${name}`);
  saveState();
  renderTechniques();
}

// ── HISTORY ──────────────────────────────────────────────────────────────────
function addHistory(type, desc) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  state.history.unshift({ type, desc, date: dateStr });
  if (state.history.length > 200) state.history.pop();
}

function renderHistory() {
  const container = document.getElementById('history-list');
  if (!state.history.length) {
    container.innerHTML = '<p class="history-empty">Aucune modification enregistrée.</p>';
    return;
  }
  container.innerHTML = state.history.map(h => `
    <div class="history-item type-${h.type}">
      <span class="history-date">${h.date}</span>
      <span class="history-desc">${h.desc}</span>
    </div>
  `).join('');
}

// ── COMMUNITY ────────────────────────────────────────────────────────────────
function getDemoUsers() {
  return [
    { pseudo: 'TigerChen', skills: DEFAULT_SKILLS.map((s,i) => ({ ...s, value: [8, 9, 7, 8, 6, 8, 9][i] })) },
    { pseudo: 'SilentWave', skills: DEFAULT_SKILLS.map((s,i) => ({ ...s, value: [5, 7, 9, 6, 9, 7, 5][i] })) },
    { pseudo: 'IronDragon', skills: DEFAULT_SKILLS.map((s,i) => ({ ...s, value: [9, 6, 6, 9, 5, 7, 8][i] })) },
    { pseudo: 'WillowFist', skills: DEFAULT_SKILLS.map((s,i) => ({ ...s, value: [4, 8, 8, 5, 10, 9, 6][i] })) },
  ];
}

function renderCommunity() {
  const container = document.getElementById('community-list');
  const users = getDemoUsers();
  // Add real users from localStorage except current
  state.users.filter(u => u.pseudo !== state.user?.pseudo).forEach(u => {
    if (u.skills) users.push({ pseudo: u.pseudo, skills: u.skills });
  });

  container.innerHTML = users.map((u, idx) => {
    const avg = (u.skills.reduce((s,k) => s + k.value, 0) / u.skills.length).toFixed(1);
    return `
      <div class="community-item">
        <div>
          <div class="community-pseudo">${u.pseudo}</div>
          <div class="community-avg">Moyenne : ${avg}/10</div>
        </div>
        <button class="btn-compare" data-idx="${idx}">Comparer</button>
      </div>`;
  }).join('');

  container.querySelectorAll('.btn-compare').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      showComparison(users[idx]);
    });
  });
}

function showComparison(other) {
  document.getElementById('compare-title').textContent = `Vous vs ${other.pseudo}`;
  document.getElementById('compare-radar-container').classList.remove('hidden');
  drawRadar('compare-canvas', state.skills, other.skills, 'rgba(120,180,255,0.6)');
}

// ── AUTH ─────────────────────────────────────────────────────────────────────
function updateAuthUI() {
  const btn = document.getElementById('auth-btn');
  const disp = document.getElementById('user-display');
  if (state.user) {
    btn.textContent = 'Déconnexion';
    btn.classList.add('logged-in');
    disp.textContent = state.user.pseudo;
    disp.classList.remove('hidden');
  } else {
    btn.textContent = 'Se connecter';
    btn.classList.remove('logged-in');
    disp.classList.add('hidden');
  }
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

// ── TABS ─────────────────────────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  document.querySelectorAll('.tab-section').forEach(s => {
    s.classList.toggle('active', s.id === `tab-${name}`);
  });
  if (name === 'profil')    { drawRadar('radar-canvas', state.skills); }
  if (name === 'techniques'){ renderTechniques(); }
  if (name === 'historique'){ renderHistory(); }
  if (name === 'communaute'){ renderCommunity(); }
}

// ── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateAuthUI();
  renderSkills();
  drawRadar('radar-canvas', state.skills);

  // Restore observations
  const obsEl = document.getElementById('observations');
  obsEl.value = state.observations || '';

  // ── TAB NAVIGATION
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // ── OBSERVATIONS SAVE
  document.getElementById('save-obs-btn').addEventListener('click', () => {
    state.observations = obsEl.value;
    addHistory('obs', 'Observations mises à jour');
    saveState();
    const btn = document.getElementById('save-obs-btn');
    btn.textContent = '✓ Enregistré';
    btn.classList.add('saved');
    setTimeout(() => { btn.textContent = 'Enregistrer'; btn.classList.remove('saved'); }, 2000);
    showToast('Observations enregistrées');
  });

  // ── AUTH BUTTON
  document.getElementById('auth-btn').addEventListener('click', () => {
    if (state.user) {
      // Logout
      state.user = null;
      saveState();
      updateAuthUI();
      showToast('Déconnecté');
    } else {
      openModal('auth-modal');
    }
  });

  // ── MODAL CLOSE
  document.getElementById('modal-close-btn').addEventListener('click', () => closeModal('auth-modal'));
  document.getElementById('technique-modal-close').addEventListener('click', () => closeModal('technique-modal'));
  document.getElementById('close-compare').addEventListener('click', () => {
    document.getElementById('compare-radar-container').classList.add('hidden');
  });

  // Close on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    });
  });

  // ── MODAL TABS (login / register)
  document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const which = tab.dataset.modalTab;
      document.getElementById('modal-login').classList.toggle('hidden', which !== 'login');
      document.getElementById('modal-register').classList.toggle('hidden', which !== 'register');
    });
  });

  // ── LOGIN
  document.getElementById('login-btn').addEventListener('click', async () => {
    const pseudo = document.getElementById('login-pseudo').value.trim();
    const pw = document.getElementById('login-password').value;
    if (!pseudo || !pw) { showError('login-error', 'Pseudo et mot de passe requis.'); return; }
    const hash = await simpleHash(pw);
    const found = state.users.find(u => u.pseudo === pseudo && u.passwordHash === hash);
    if (!found) { showError('login-error', 'Pseudo ou mot de passe incorrect.'); return; }
    state.user = { pseudo };
    // Restore this user's skills if saved
    if (found.skills) state.skills = normalizeSkills(found.skills);
    if (found.observations) state.observations = found.observations;
    if (found.techniques) state.techniques = found.techniques;
    if (found.history) state.history = found.history;
    saveState();
    updateAuthUI();
    closeModal('auth-modal');
    renderSkills();
    drawRadar('radar-canvas', state.skills);
    obsEl.value = state.observations || '';
    await loadRemoteUserState(pseudo);
    renderSkills();
    drawRadar('radar-canvas', state.skills);
    obsEl.value = state.observations || '';
    showToast(`Bienvenue, ${pseudo} !`);
  });

  // ── REGISTER
  document.getElementById('register-btn').addEventListener('click', async () => {
    const pseudo = document.getElementById('reg-pseudo').value.trim();
    const pw = document.getElementById('reg-password').value;
    if (!pseudo || !pw) { showError('reg-error', 'Pseudo et mot de passe requis.'); return; }
    if (pw.length < 4) { showError('reg-error', 'Mot de passe trop court (4 car. min).'); return; }
    if (state.users.find(u => u.pseudo === pseudo)) {
      showError('reg-error', 'Ce pseudo est déjà utilisé.'); return;
    }
    const hash = await simpleHash(pw);
    const newUser = {
      pseudo,
      passwordHash: hash,
      skills: DEFAULT_SKILLS.map(s => ({ ...s })),
      techniques: DEFAULT_TECHNIQUES.map(t => ({ ...t })),
      history: [],
      observations: '',
    };
    state.users.push(newUser);
    state.user = { pseudo };
    state.skills = newUser.skills;
    state.techniques = DEFAULT_TECHNIQUES.map(t => ({ ...t }));
    state.history = [];
    state.observations = '';
    saveState();
    updateAuthUI();
    closeModal('auth-modal');
    renderSkills();
    drawRadar('radar-canvas', state.skills);
    obsEl.value = '';
    scheduleRemoteSync();
    showToast(`Compte créé. Bienvenue, ${pseudo} !`);
  });

  // Save user-specific data on change
  function syncUserData() {
    if (!state.user) return;
    const u = state.users.find(u => u.pseudo === state.user.pseudo);
    if (!u) return;
    u.skills = state.skills;
    u.techniques = state.techniques;
    u.history = state.history;
    u.observations = state.observations;
    saveState();
  }

  // Hook syncUserData into existing saves
  const origSave = saveState;
  window.syncAndSave = function() { syncUserData(); origSave(); };

  // Override all saveState calls to also sync
  // We patch the slider change and technique events
  document.addEventListener('gong:save', syncUserData);

  // Re-wire slider change to dispatch event
  document.getElementById('skills-list').addEventListener('change', () => {
    document.dispatchEvent(new Event('gong:save'));
  });

  // ── ADD TECHNIQUE
  document.getElementById('add-technique-btn').addEventListener('click', () => {
    openModal('technique-modal');
  });

  document.getElementById('add-technique-confirm').addEventListener('click', () => {
    const name = document.getElementById('new-technique-name').value.trim();
    const cat  = document.getElementById('new-technique-category').value;
    if (!name) { showToast('Entrez un nom de technique'); return; }
    state.techniques.push({ name, category: cat, mastered: false });
    addHistory('tech', `Nouvelle technique ajoutée : ${name}`);
    syncUserData();
    saveState();
    renderTechniques();
    closeModal('technique-modal');
    document.getElementById('new-technique-name').value = '';
    showToast(`"${name}" ajoutée`);
  });
});

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// ── SERVICE WORKER REGISTRATION ──────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(r => console.log('[Gōng] SW enregistré', r.scope))
      .catch(e => console.warn('[Gōng] SW erreur', e));
  });
}
