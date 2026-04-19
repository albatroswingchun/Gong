/* ═══════════════════════════════════════════
   GŌNG — Arts Martiaux · App Logic (Supabase)
═══════════════════════════════════════════ */

'use strict';

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
  { name: 'Pak Sao', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Pak Sao Latéral', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Pak Sao Inversé', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Tan Sao', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Bon Sao', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Jut Sao', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Jut Sao Bas', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Jut Sao Intérieur', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Bil Sao', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Fook Sao', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Garn Sao', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Gum Sao', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Fut Sao', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Chuen Sao', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Huen Sao', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Huen Sao Large', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Huen Sao Ouverture', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Wu Sao', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Tarn Sao', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Larp Sao', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Larn Sao', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Kuan Sao', category: 'Wing Chun', mastered: false, locked: true },
  { name: 'Kan Sao', category: 'Wing Chun', mastered: false, locked: true },

  { name: 'Shil Lim Tao', category: 'Formes', mastered: false, locked: true },
  { name: 'Chum Kil', category: 'Formes', mastered: false, locked: true },
  { name: 'Bil Jee', category: 'Formes', mastered: false, locked: true },
  { name: 'Shil Lim Tao Avancée', category: 'Formes', mastered: false, locked: true },
  { name: 'Mannequin de bois - 108 Mouvements', category: 'Formes', mastered: false, locked: true },
  { name: 'Arme - Couteaux Papillons', category: 'Formes', mastered: false, locked: true },
  { name: 'Arme - Bâton Long', category: 'Formes', mastered: false, locked: true },
];

const DEFAULT_FORMS = DEFAULT_TECHNIQUES.filter((t) => t.category === 'Formes');
const DEFAULT_FORMS_TOTAL = DEFAULT_FORMS.length;

function cloneSkills() {
  return DEFAULT_SKILLS.map((s) => ({ ...s }));
}

function cloneTechniques() {
  return DEFAULT_TECHNIQUES.map((t) => ({ ...t }));
}

function techniqueKey(tech) {
  return `${String(tech.category || '').trim()}::${String(tech.name || '').trim()}`;
}

function legacyTechniqueName(name) {
  const normalized = String(name || '').trim();
  if (normalized === 'Quan Sao') return 'Kuan Sao';
  if (normalized === 'Qan Sao') return 'Kan Sao';
  if (normalized === 'Siu Lim Tao') return 'Shil Lim Tao';
  if (normalized === 'Chum Kiu') return 'Chum Kil';
  if (normalized === 'Siu Lim Tao Avancée') return 'Shil Lim Tao Avancée';
  return normalized;
}

function getCanonicalTechnique(tech) {
  return {
    ...tech,
    name: legacyTechniqueName(tech?.name),
    category: String(tech?.category || 'Autre').trim() || 'Autre',
  };
}

function getFormsTechniques(techniques) {
  const canonical = Array.isArray(techniques)
    ? techniques.map((t) => getCanonicalTechnique(t))
    : [];

  const incomingByName = new Map(
    canonical
      .filter((t) => t.category === 'Formes')
      .map((t) => [t.name, !!t.mastered])
  );

  return DEFAULT_FORMS.map((form) => ({
    name: form.name,
    category: 'Formes',
    mastered: incomingByName.get(form.name) || false,
  }));
}

function getFormsSummary(techniques) {
  const forms = getFormsTechniques(techniques);
  const validated = forms.filter((t) => t.mastered).length;

  return {
    total: DEFAULT_FORMS_TOTAL,
    validated,
    display: `${validated}/${DEFAULT_FORMS_TOTAL}`,
    forms,
  };
}

let state = {
  user: null,
  skills: cloneSkills(),
  techniques: cloneTechniques(),
  history: [],
  observations: '',
  techniqueFilter: 'Toutes',
};

let remoteSyncTimer = null;
let isInitialLoading = false;
let deferredInstallPrompt = null;
let forceAuthModalOnStartup = true;
const LOCAL_STATE_KEY = 'gong_local_state_v1';

const obsEl = document.getElementById('observations');
const authBtn = document.getElementById('auth-btn');
const userDisplay = document.getElementById('user-display');
const modalCloseBtn = document.getElementById('modal-close-btn');
const loginPseudoEl = document.getElementById('login-pseudo');
const loginPasswordEl = document.getElementById('login-password');
const loginBtnEl = document.getElementById('login-btn');
const loginErrorEl = document.getElementById('login-error');
const regPseudoEl = document.getElementById('reg-pseudo');
const regEmailEl = document.getElementById('reg-email');
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
const compareFormsEl = document.getElementById('compare-forms');
const installBtn = document.getElementById('install-btn');

function injectDynamicStyles() {
  if (document.getElementById('gong-dynamic-styles')) return;
  const style = document.createElement('style');
  style.id = 'gong-dynamic-styles';
  style.textContent = `
    .technique-filters { display:flex; flex-wrap:wrap; gap:10px; margin:0 0 18px 0; }
    .technique-filter-btn { border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.78); border-radius:999px; padding:8px 14px; font-size:0.82rem; letter-spacing:0.04em; cursor:pointer; transition:all 0.18s ease; }
    .technique-filter-btn:hover { border-color:rgba(255,208,0,0.28); color:#f0f0f0; }
    .technique-filter-btn.active { background:rgba(255,208,0,0.12); color:#ffd000; border-color:rgba(255,208,0,0.3); box-shadow:0 0 0 1px rgba(255,208,0,0.08) inset; }
    .technique-item.locked .technique-delete { display:none !important; }
    .community-item { display:flex; justify-content:space-between; gap:16px; align-items:center; }
    .community-item-main { display:flex; flex-direction:column; gap:6px; }
    .community-stats { display:flex; flex-wrap:wrap; gap:14px; }
    .community-stat-label { color:rgba(255,255,255,0.82); }
    .community-stat-value { color:#ffd000; font-weight:700; }
    .forms-count { color:#ffd000; font-weight:700; }
    .community-item-self { border-color:rgba(255,208,0,0.32); background:linear-gradient(90deg, rgba(255,208,0,0.10), rgba(255,255,255,0.03)); }
    .community-pseudo-line { display:flex; align-items:center; gap:8px; }
    .community-badge { font-size:0.68rem; letter-spacing:0.08em; text-transform:uppercase; color:#ffd000; border:1px solid rgba(255,208,0,0.35); border-radius:999px; padding:2px 8px; }
    .compare-forms { display:none !important; }
  `;
  document.head.appendChild(style);
}

function ensureTechniqueFiltersContainer() {
  if (document.getElementById('technique-filters')) return;
  const techniquesSection = document.getElementById('tab-techniques');
  const techniquesHeader = techniquesSection?.querySelector('.techniques-header');
  if (!techniquesSection || !techniquesHeader) return;
  const filters = document.createElement('div');
  filters.id = 'technique-filters';
  filters.className = 'technique-filters';
  techniquesHeader.insertAdjacentElement('afterend', filters);
}

function ensureFormesOption() {
  if (!newTechniqueCategory) return;
  const exists = Array.from(newTechniqueCategory.options).some((opt) => opt.value === 'Formes');
  if (!exists) {
    const opt = document.createElement('option');
    opt.value = 'Formes';
    opt.textContent = 'Formes';
    newTechniqueCategory.appendChild(opt);
  }
}

function getTechniqueCategories() {
  const seen = new Set();
  const categories = [];
  state.techniques.forEach((tech) => {
    const category = String(tech.category || 'Autre').trim() || 'Autre';
    if (!seen.has(category)) {
      seen.add(category);
      categories.push(category);
    }
  });
  return categories;
}

function renderTechniqueFilters() {
  ensureTechniqueFiltersContainer();
  const container = document.getElementById('technique-filters');
  if (!container) return;
  const categories = getTechniqueCategories();
  const filters = ['Toutes', ...categories];
  if (!filters.includes(state.techniqueFilter)) state.techniqueFilter = 'Toutes';
  container.innerHTML = filters.map((category) => `
    <button type="button" class="technique-filter-btn ${state.techniqueFilter === category ? 'active' : ''}" data-category="${category}">${category}</button>
  `).join('');
  container.querySelectorAll('.technique-filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.techniqueFilter = btn.dataset.category;
      renderTechniqueFilters();
      renderTechniques();
    });
  });
}

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

function normalizeTechniques(techniquesFromDb) {
  const incoming = Array.isArray(techniquesFromDb) ? techniquesFromDb : [];
  const normalizedIncoming = incoming.map((t) => ({
    name: legacyTechniqueName(t.name),
    category: String(t.category || 'Autre').trim() || 'Autre',
    mastered: !!t.mastered,
    locked: !!t.locked,
  })).filter((t) => t.name);
  const incomingByKey = new Map(normalizedIncoming.map((t) => [techniqueKey(t), t]));
  const mergedDefaults = DEFAULT_TECHNIQUES.map((base) => {
    const existing = incomingByKey.get(techniqueKey(base));
    return { ...base, mastered: existing ? !!existing.mastered : !!base.mastered, locked: true };
  });
  const defaultKeys = new Set(DEFAULT_TECHNIQUES.map((t) => techniqueKey(t)));
  const customTechniques = normalizedIncoming.filter((t) => !defaultKeys.has(techniqueKey(t))).map((t) => ({ ...t, locked: !!t.locked }));
  return [...mergedDefaults, ...customTechniques];
}

function resetStateToDefaults() {
  state.skills = cloneSkills();
  state.techniques = cloneTechniques();
  state.history = [];
  state.observations = '';
  state.techniqueFilter = 'Toutes';
  if (obsEl) obsEl.value = '';
}

function normalizePseudo(pseudo) {
  return String(pseudo || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9._-]/g, '');
}

function pseudoToEmail(pseudo) {
  return `${normalizePseudo(pseudo)}@gong.app`;
}

function safePseudoFromEmail(email) {
  return String(email || '').split('@')[0] || '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
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
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

function saveLocalState() {
  try {
    const payload = {
      skills: normalizeSkills(state.skills),
      techniques: normalizeTechniques(state.techniques),
      history: Array.isArray(state.history) ? state.history : [],
      observations: typeof state.observations === 'string' ? state.observations : '',
      updated_at: new Date().toISOString(),
    };
    window.localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[Gōng] Local save error', err);
  }
}

function readLocalStateSnapshot() {
  try {
    const raw = window.localStorage.getItem(LOCAL_STATE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    return {
      skills: normalizeSkills(payload?.skills),
      techniques: normalizeTechniques(payload?.techniques),
      history: Array.isArray(payload?.history) ? payload.history : [],
      observations: typeof payload?.observations === 'string' ? payload.observations : '',
      updatedAtTs: Date.parse(payload?.updated_at || '') || 0,
    };
  } catch (err) {
    console.warn('[Gōng] Local read error', err);
    return null;
  }
}

function hasLocalStateSnapshot() {
  try {
    return !!window.localStorage.getItem(LOCAL_STATE_KEY);
  } catch {
    return false;
  }
}

function loadLocalState() {
  const snapshot = readLocalStateSnapshot();
  if (!snapshot) return false;
  state.skills = snapshot.skills;
  state.techniques = snapshot.techniques;
  state.history = snapshot.history;
  state.observations = snapshot.observations;
  state.techniqueFilter = 'Toutes';
  if (obsEl) obsEl.value = state.observations;
  return true;
}

function enforceAuthModalPriority() {
  if (forceAuthModalOnStartup) {
    if (!state.user && hasLocalStateSnapshot()) return;
    openModal('auth-modal');
    return;
  }
  if (state.user) {
    closeModal('auth-modal');
    return;
  }
  openModal('auth-modal');
}

function releaseStartupAuthGate() {
  forceAuthModalOnStartup = false;
}

function updateAuthUI() {
  if (state.user) {
    if (authBtn) { authBtn.textContent = 'Déconnexion'; authBtn.classList.add('logged-in'); }
    if (userDisplay) { userDisplay.textContent = state.user.pseudo; userDisplay.classList.remove('hidden'); }
  } else {
    if (authBtn) { authBtn.textContent = 'Se connecter'; authBtn.classList.remove('logged-in'); }
    if (userDisplay) { userDisplay.textContent = ''; userDisplay.classList.add('hidden'); }
  }
}

function scrollAppToTop() {
  const mainContent = document.getElementById('main-content');
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  if (mainContent) mainContent.scrollTop = 0;
}

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab-section').forEach((s) => s.classList.toggle('active', s.id === `tab-${name}`));
  const mainContent = document.getElementById('main-content');
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (mainContent) mainContent.scrollTop = 0;
  if (name === 'profil') drawRadar('radar-canvas', state.skills);
  if (name === 'techniques') { renderTechniqueFilters(); renderTechniques(); }
  if (name === 'historique') renderHistory();
  if (name === 'communaute') renderCommunity();
  scrollAppToTop();
  requestAnimationFrame(scrollAppToTop);
}

document.querySelectorAll('.tab-btn').forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
document.querySelectorAll('.modal-backdrop').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.modal').forEach((m) => {
    if (m.id === 'auth-modal' && !state.user) return;
    if (m.id === 'auth-modal') releaseStartupAuthGate();
    m.classList.add('hidden');
  });
}));
document.querySelectorAll('.modal-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.modal-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const which = tab.dataset.modalTab;
    document.getElementById('modal-login')?.classList.toggle('hidden', which !== 'login');
    document.getElementById('modal-register')?.classList.toggle('hidden', which !== 'register');
  });
});

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
  return { r: Math.round(a.r + (b.r - a.r) * f), g: Math.round(a.g + (b.g - a.g) * f), b: Math.round(a.b + (b.b - a.b) * f) };
}
function colorStr(v) { const { r, g, b } = valueColor(v); return `rgb(${r},${g},${b})`; }
function colorHex(v) { const { r, g, b } = valueColor(v); return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`; }

function drawRadar(canvasId, skills, secondarySkills = null) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) * 0.31;
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
  drawPolygon(skills, `rgba(${Object.values(valueColor(avg)).join(',')},0.13)`, colorStr(avg * 0.9 + 1));
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
  if (secondarySkills) drawPolygon(secondarySkills, 'rgba(120,180,255,0.08)', 'rgba(120,180,255,0.6)', 1);
  for (let i = 0; i < N; i++) {
    const angle = (Math.PI * 2 * i / N) - Math.PI / 2;
    let labelR = R + 34;
    let offsetX = 0;
    if (skills[i].name === 'Structure') { labelR = R + 26; offsetX = -18; }
    const x = cx + labelR * Math.cos(angle) + offsetX;
    const y = cy + labelR * Math.sin(angle);
    ctx.font = '600 11px Barlow, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.74)';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 6;
    ctx.fillText(skills[i].name.toUpperCase(), x, y);
    ctx.shadowBlur = 0;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fill();
}

async function ensureRemoteRow() {
  if (!isLoggedIn() || !supabaseClient) return;
  const isoNow = new Date().toISOString();
  const normalizedTechniques = normalizeTechniques(state.techniques);
  state.techniques = normalizedTechniques;
  const privatePayload = { id: state.user.id, pseudo: state.user.pseudo, skills: state.skills, techniques: normalizedTechniques, history: state.history, observations: state.observations, updated_at: isoNow };
  const publicPayload = { id: state.user.id, pseudo: state.user.pseudo, skills: state.skills, techniques: normalizedTechniques, updated_at: isoNow };
  const { error: privateError } = await supabaseClient.from('gong_users').upsert(privatePayload, { onConflict: 'id' });
  if (privateError) console.warn('[Gōng] ensureRemoteRow private error', privateError);
  const { error: publicError } = await supabaseClient.from('gong_public_profiles').upsert(publicPayload, { onConflict: 'id' });
  if (publicError) console.warn('[Gōng] ensureRemoteRow public error', publicError);
}

async function loadRemoteUserState() {
  if (!isLoggedIn() || !supabaseClient) return;
  const { data, error } = await supabaseClient.from('gong_users').select('id, pseudo, skills, techniques, history, observations, updated_at').eq('id', state.user.id).maybeSingle();
  if (error) { console.warn('[Gōng] Supabase load error', error); return; }
  if (!data) { await ensureRemoteRow(); return; }
  const remoteUpdatedAtTs = Date.parse(data.updated_at || '') || 0;
  const localSnapshot = readLocalStateSnapshot();
  const useLocalSnapshot = !!localSnapshot && localSnapshot.updatedAtTs > remoteUpdatedAtTs;

  state.user.pseudo = data.pseudo || state.user.pseudo;
  state.skills = useLocalSnapshot ? localSnapshot.skills : normalizeSkills(data.skills);
  state.techniques = useLocalSnapshot ? localSnapshot.techniques : normalizeTechniques(data.techniques);
  state.history = useLocalSnapshot ? localSnapshot.history : (Array.isArray(data.history) ? data.history : []);
  state.observations = useLocalSnapshot ? localSnapshot.observations : (typeof data.observations === 'string' ? data.observations : '');
  state.techniqueFilter = 'Toutes';
  if (obsEl) obsEl.value = state.observations;
  saveLocalState();
  renderSkills(); renderTechniqueFilters(); renderTechniques(); renderHistory(); drawRadar('radar-canvas', state.skills);
}

async function syncRemoteUserState() {
  if (!isLoggedIn() || !supabaseClient) return;
  const isoNow = new Date().toISOString();
  const normalizedTechniques = normalizeTechniques(state.techniques);
  state.techniques = normalizedTechniques;
  const privatePayload = { id: state.user.id, pseudo: state.user.pseudo, skills: state.skills, techniques: normalizedTechniques, history: state.history, observations: state.observations, updated_at: isoNow };
  const publicPayload = { id: state.user.id, pseudo: state.user.pseudo, skills: state.skills, techniques: normalizedTechniques, updated_at: isoNow };
  const { error: privateError } = await supabaseClient.from('gong_users').upsert(privatePayload, { onConflict: 'id' });
  if (privateError) console.warn('[Gōng] Supabase private sync error', privateError);
  const { error: publicError } = await supabaseClient.from('gong_public_profiles').upsert(publicPayload, { onConflict: 'id' });
  if (publicError) console.warn('[Gōng] Supabase public sync error', publicError);
  if (document.getElementById('tab-communaute')?.classList.contains('active')) await renderCommunity();
}

function scheduleRemoteSync() {
  saveLocalState();
  if (!isLoggedIn() || !supabaseClient || isInitialLoading) return;
  if (remoteSyncTimer) clearTimeout(remoteSyncTimer);
  remoteSyncTimer = setTimeout(() => { syncRemoteUserState(); }, 400);
}

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
        <input type="range" min="0" max="10" step="1" value="${skill.value}" id="slider-${skill.id}" data-id="${skill.id}" />
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
  slider.style.setProperty('--track-bg', `linear-gradient(to right, ${col} 0%, ${col} ${pct}%, var(--bg-4) ${pct}%, var(--bg-4) 100%)`);
}

function onSliderInput(e) {
  const id = e.target.dataset.id;
  const v = parseInt(e.target.value, 10);
  const skill = state.skills.find((s) => s.id === id);
  if (!skill) return;
  skill.value = v;
  const valEl = document.getElementById(`val-${id}`);
  if (valEl) { valEl.textContent = v; valEl.style.color = colorStr(v); }
  updateSliderStyle(e.target, v);
  drawRadar('radar-canvas', state.skills);
  scheduleRemoteSync();
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

function renderTechniques() {
  const container = document.getElementById('techniques-list');
  if (!container) return;
  container.innerHTML = '';
  const filteredTechniques = state.techniques.filter((tech) => state.techniqueFilter === 'Toutes' || tech.category === state.techniqueFilter);
  if (!filteredTechniques.length) {
    container.innerHTML = '<p style="color:var(--text-3);font-size:.88rem;text-align:center;padding:30px 0">Aucune technique dans cette catégorie.</p>';
    return;
  }
  filteredTechniques.forEach((tech) => {
    const idx = state.techniques.findIndex((t) => techniqueKey(t) === techniqueKey(tech));
    const div = document.createElement('div');
    div.className = `technique-item ${tech.mastered ? 'mastered' : ''} ${tech.locked ? 'locked' : ''}`;
    div.innerHTML = `
      <div class="technique-check" data-idx="${idx}"></div>
      <div class="technique-info">
        <div class="technique-name">${tech.name}</div>
        <div class="technique-category">${tech.category}</div>
      </div>
      ${tech.locked ? '' : `<button class="technique-delete" data-idx="${idx}" title="Supprimer" type="button">✕</button>`}
    `;
    div.addEventListener('click', (e) => { if (e.target.closest('.technique-delete')) return; toggleTechnique(idx); });
    const deleteBtn = div.querySelector('.technique-delete');
    if (deleteBtn) deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteTechnique(idx); });
    container.appendChild(div);
  });
}

function toggleTechnique(idx) {
  if (!state.techniques[idx]) return;
  state.techniques[idx].mastered = !state.techniques[idx].mastered;
  const status = state.techniques[idx].mastered ? 'maîtrisée' : 'non maîtrisée';
  addHistory('tech', `${state.techniques[idx].name} marquée ${status}`);
  renderTechniques();
  renderHistory();
  scheduleRemoteSync();
}

function deleteTechnique(idx) {
  if (!state.techniques[idx] || state.techniques[idx].locked) return;
  const name = state.techniques[idx].name;
  state.techniques.splice(idx, 1);
  if (state.techniqueFilter !== 'Toutes') {
    const categories = getTechniqueCategories();
    if (!categories.includes(state.techniqueFilter)) state.techniqueFilter = 'Toutes';
  }
  addHistory('tech', `Technique supprimée : ${name}`);
  renderTechniqueFilters();
  renderTechniques();
  renderHistory();
  scheduleRemoteSync();
}

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

function renderFormsComparison() {
  if (!compareFormsEl) return;
  compareFormsEl.innerHTML = '';
}

async function renderCommunity() {
  const container = document.getElementById('community-list');
  if (!container) return;
  if (!supabaseClient) {
    container.innerHTML = '<p class="community-empty">Communauté indisponible.</p>';
    return;
  }
  container.innerHTML = '<p class="community-empty">Chargement…</p>';
  const { data, error } = await supabaseClient.from('gong_public_profiles').select('id, pseudo, skills, techniques, updated_at').order('updated_at', { ascending: false });
  if (error) {
    console.error('[Gōng] Community load error:', error);
    container.innerHTML = '<p class="community-empty">Erreur de chargement.</p>';
    return;
  }
  const allUsers = data || [];
  const currentUserProfile = allUsers.find((u) => u.id === state.user?.id);
  const users = allUsers.filter((u) => u.id !== state.user?.id);

  const ownCard = currentUserProfile ? (() => {
    const ownSkills = normalizeSkills(currentUserProfile.skills);
    const ownAvg = ownSkills.length ? (ownSkills.reduce((s, k) => s + (k.value || 0), 0) / ownSkills.length).toFixed(1) : '0';
    const ownFormsSummary = getFormsSummary(currentUserProfile.techniques);
    return `
      <div class="community-item community-item-self">
        <div class="community-item-main">
          <div class="community-pseudo-line">
            <div class="community-pseudo">${currentUserProfile.pseudo}</div>
            <span class="community-badge">Votre score</span>
          </div>
          <div class="community-stats">
            <span class="community-stat"><span class="community-stat-label">Moyenne :</span> <span class="community-stat-value">${ownAvg}/10</span></span>
            <span class="community-stat"><span class="community-stat-label">Formes :</span> <span class="community-stat-value forms-count">${ownFormsSummary.display}</span></span>
          </div>
        </div>
      </div>
    `;
  })() : '';

  if (!users.length) {
    container.innerHTML = `${ownCard}<p class="community-empty">Aucun autre utilisateur pour le moment.</p>`;
    return;
  }

  const others = users.map((user) => {
    const skills = normalizeSkills(user.skills);
    const avg = skills.length ? (skills.reduce((s, k) => s + (k.value || 0), 0) / skills.length).toFixed(1) : '0';
    const formsSummary = getFormsSummary(user.techniques);
    return `
      <div class="community-item">
        <div class="community-item-main">
          <div class="community-pseudo-line">
            <div class="community-pseudo">${user.pseudo}</div>
          </div>
          <div class="community-stats">
            <span class="community-stat"><span class="community-stat-label">Moyenne :</span> <span class="community-stat-value">${avg}/10</span></span>
            <span class="community-stat"><span class="community-stat-label">Formes :</span> <span class="community-stat-value forms-count">${formsSummary.display}</span></span>
          </div>
        </div>
        <button class="btn-compare" data-id="${user.id}">Comparer</button>
      </div>
    `;
  }).join('');

  container.innerHTML = `${ownCard}${others}`;
  container.querySelectorAll('.btn-compare').forEach((btn) => {
    btn.addEventListener('click', () => {
      const user = users.find((u) => u.id === btn.dataset.id);
      if (!user) return;
      showComparison({ pseudo: user.pseudo, skills: normalizeSkills(user.skills), techniques: normalizeTechniques(user.techniques) });
    });
  });
}

function showComparison(other) {
  const title = document.getElementById('compare-title');
  if (title) title.textContent = `Vous vs ${other.pseudo}`;
  if (compareRadarContainer) compareRadarContainer.classList.remove('hidden');
  drawRadar('compare-canvas', state.skills, other.skills);
  renderFormsComparison();
}

async function handleRegister() {
  hideError(regErrorEl);
  if (!supabaseClient) { showError(regErrorEl, 'Supabase non configuré.'); return; }
  const pseudo = regPseudoEl?.value.trim() || '';
  const email = regEmailEl?.value.trim().toLowerCase() || '';
  const password = regPasswordEl?.value || '';
  if (!pseudo || !email || !password) { showError(regErrorEl, 'Pseudo, email et mot de passe requis.'); return; }
  if (!isValidEmail(email)) { showError(regErrorEl, 'Adresse email invalide.'); return; }
  if (normalizePseudo(pseudo).length < 3) { showError(regErrorEl, 'Pseudo trop court.'); return; }
  if (password.length < 4) { showError(regErrorEl, 'Mot de passe trop court (4 caractères min.).'); return; }
  const { data, error } = await supabaseClient.auth.signUp({ email, password, options: { data: { pseudo } } });
  if (error) { showError(regErrorEl, error.message || 'Inscription impossible.'); return; }
  const signIn = await supabaseClient.auth.signInWithPassword({ email, password });
  if (signIn.error) { showError(regErrorEl, signIn.error.message || 'Connexion impossible après inscription.'); return; }
  console.log('REGISTER RESULT', data);
  showToast(`Compte créé. Bienvenue, ${pseudo} !`);
  releaseStartupAuthGate();
  closeModal('auth-modal');
}

async function handleLogin() {
  hideError(loginErrorEl);
  if (!supabaseClient) { showError(loginErrorEl, 'Supabase non configuré.'); return; }
  const identifier = loginPseudoEl?.value.trim() || '';
  const password = loginPasswordEl?.value || '';
  if (!identifier || !password) { showError(loginErrorEl, 'Email et mot de passe requis.'); return; }
  const email = identifier.includes('@') ? identifier.toLowerCase() : pseudoToEmail(identifier);
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) { showError(loginErrorEl, 'Identifiant ou mot de passe incorrect.'); return; }
  releaseStartupAuthGate();
  closeModal('auth-modal');
  showToast('Connexion réussie');
}

async function handleLogout() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  state.user = null;
  resetStateToDefaults();
  updateAuthUI();
  renderSkills();
  renderTechniqueFilters();
  renderTechniques();
  renderHistory();
  drawRadar('radar-canvas', state.skills);
  showToast('Déconnecté');
}

async function applySession(session) {
  if (!session?.user) {
    state.user = null;
    resetStateToDefaults();
    loadLocalState();
    if (obsEl) obsEl.value = state.observations || '';
    updateAuthUI();
    renderSkills();
    renderTechniqueFilters();
    renderTechniques();
    renderHistory();
    drawRadar('radar-canvas', state.skills);
    enforceAuthModalPriority();
    return;
  }
  const user = session.user;
  state.user = { id: user.id, pseudo: user.user_metadata?.pseudo || safePseudoFromEmail(user.email), email: user.email };
  releaseStartupAuthGate();
  updateAuthUI();
  enforceAuthModalPriority();
  isInitialLoading = true;
  await loadRemoteUserState();
  isInitialLoading = false;
  await syncRemoteUserState();
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installBtn?.classList.remove('hidden');
});
window.addEventListener('appinstalled', () => { deferredInstallPrompt = null; installBtn?.classList.add('hidden'); });
async function handleInstallApp() { if (!deferredInstallPrompt) return; deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; installBtn?.classList.add('hidden'); }

document.addEventListener('DOMContentLoaded', async () => {
  injectDynamicStyles();
  ensureTechniqueFiltersContainer();
  ensureFormesOption();
  loadLocalState();
  renderSkills();
  renderTechniqueFilters();
  renderTechniques();
  renderHistory();
  drawRadar('radar-canvas', state.skills);
  enforceAuthModalPriority();
  if (obsEl) obsEl.value = state.observations || '';
  saveObsBtn?.addEventListener('click', () => {
    state.observations = obsEl?.value || '';
    addHistory('obs', 'Observations mises à jour');
    renderHistory();
    scheduleRemoteSync();
    saveObsBtn.textContent = '✓ Enregistré';
    saveObsBtn.classList.add('saved');
    setTimeout(() => { saveObsBtn.textContent = 'Enregistrer'; saveObsBtn.classList.remove('saved'); }, 2000);
    showToast('Observations enregistrées');
  });
  authBtn?.addEventListener('click', () => { if (state.user) handleLogout(); else openModal('auth-modal'); });
  modalCloseBtn?.addEventListener('click', () => {
    if (!state.user) return;
    releaseStartupAuthGate();
    closeModal('auth-modal');
  });
  techniqueModalClose?.addEventListener('click', () => closeModal('technique-modal'));
  if (closeCompareBtn) closeCompareBtn.addEventListener('click', () => { compareRadarContainer?.classList.add('hidden'); renderFormsComparison(); });
  loginBtnEl?.addEventListener('click', handleLogin);
  registerBtnEl?.addEventListener('click', handleRegister);
  installBtn?.addEventListener('click', handleInstallApp);
  addTechniqueBtn?.addEventListener('click', () => openModal('technique-modal'));
  addTechniqueConfirm?.addEventListener('click', () => {
    const name = legacyTechniqueName(newTechniqueName?.value.trim() || '');
    const cat = newTechniqueCategory?.value || 'Autre';
    if (!name) { showToast('Entrez un nom de technique'); return; }
    state.techniques.push({ name, category: cat, mastered: false, locked: false });
    state.techniqueFilter = cat;
    addHistory('tech', `Nouvelle technique ajoutée : ${name}`);
    renderTechniqueFilters();
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
    supabaseClient.auth.onAuthStateChange(async (_event, session) => { await applySession(session); });
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/Gong/sw.js').then((r) => console.log('[Gōng] SW enregistré', r.scope)).catch((e) => console.warn('[Gōng] SW erreur', e));
  });
}
