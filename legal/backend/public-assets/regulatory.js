// Data regulasi berdasarkan departemen
const departmentData = {};
// State management
let currentDepartment = 'HRGA';
let rows = [];
let editingIndex = null;
let isEditing = false;
let editingOriginalRow = null;
let currentPage = 1;
let pageSize = 50;
const deptCounts = {};
const LS_PAGE_SIZE_KEY = 'reg_page_size';
const LS_PAGE_KEY_PREFIX = 'reg_current_page_';

function getSavedPage(dept){
  try { const v = Number(localStorage.getItem(LS_PAGE_KEY_PREFIX + String(dept||'')) || 0); return v > 0 ? v : 1; } catch { return 1; }
}
function saveCurrentPage(dept, page){
  try { localStorage.setItem(LS_PAGE_KEY_PREFIX + String(dept||''), String(page)); } catch {}
}

const API_BASE = '/legal/api/regulations';


function showToast(message, type = 'info') {
  try {
    const container = document.getElementById('toastContainer');
    if (!container) { console.warn('Toast container not found'); return; }
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.textContent = message;
    container.appendChild(div);
    setTimeout(() => { div.remove(); }, 3000);
  } catch (e) {
    console.warn('Toast error:', e);
  }
}

async function loadDepartmentFromServer(dept) {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(dept)}?limit=${pageSize}&page=${currentPage}`);
    let data = [];
    try {
      data = await res.json();
    } catch (_) { data = []; }
    if (!res.ok) {
      console.warn('HTTP error when fetching regulations:', res.status);
      departmentData[dept] = Array.isArray(data) ? data : [];
    } else {
      departmentData[dept] = Array.isArray(data) ? data : [];
    }
    if (dept === currentDepartment) rows = departmentData[currentDepartment];
    const pageNoEl = document.getElementById('pageNo');
    const btnPrev = document.getElementById('btnPrevPage');
    const btnNext = document.getElementById('btnNextPage');
    if (pageNoEl) pageNoEl.textContent = String(currentPage);
    if (btnPrev) btnPrev.disabled = currentPage <= 1;
    if (btnNext) btnNext.disabled = (rows.length < pageSize);
    try {
      const sRes = await fetch(`${API_BASE}/${encodeURIComponent(dept)}/stats`);
      const s = await sRes.json().catch(() => ({ total: rows.length, articles: (rows || []).filter(r => (r.pasal||'').trim()!=='').length, maxNo: rows.reduce((m,r)=>Math.max(m, Number(r.no||0)),0) }));
      deptCounts[dept] = { total: Number(s.total||0), articles: Number(s.articles||0), maxNo: Number(s.maxNo||0) };
    } catch (_) { deptCounts[dept] = { total: rows.length, articles: (rows || []).filter(r => (r.pasal||'').trim()!=='').length, maxNo: rows.reduce((m,r)=>Math.max(m, Number(r.no||0)),0) }; }
  } catch (e) {
    console.warn('Gagal memuat data dari server, menggunakan data lokal sementara:', e);
    departmentData[dept] = departmentData[dept] || [];
  }
}

async function saveDepartmentToServer(dept) {
  try {
    const payload = departmentData[dept] || [];
    const res = await fetch(`${API_BASE}/${encodeURIComponent(dept)}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (e) {
    console.warn('Gagal menyimpan ke server:', e);
    showToast('Gagal menyimpan ke database. Periksa koneksi server.', 'error');
    return false;
  }
}

async function seedAllFromLocal() {
  try {
    const deptButtons = document.querySelectorAll('.dept-btn');
    const depts = Array.from(deptButtons).map(b => b.dataset.dept).filter(Boolean);
    for (const dept of depts) {
      const local = departmentData[dept] || [];
      if (Array.isArray(local) && local.length > 0) {
    
        local.forEach((r, i) => { r.no = i + 1; });
        departmentData[dept] = local;
        const ok = await saveDepartmentToServer(dept);
        console.log(`Seed ${dept}:`, ok ? `OK (${local.length} rows)` : 'FAILED');
      }
    }
  } catch (e) {
    console.warn('Seed all failed:', e);
  }
}

const DEPARTMENT_MAP = [
  { key: 'HRGA', label: 'HRGA' },
  { key: 'MAINTENANCE', label: 'Maintenance' },
  { key: 'IT', label: 'IT' },
  { key: 'HSE', label: 'HSE' },
  { key: 'LEGAL_COMPLIANCE', label: 'Legal Compliance' },
  { key: 'PPIC_DMW_WAREHOUSE', label: 'PPIC DMW Warehouse' },
  { key: 'FAT', label: 'FAT' }
];

const DEPT_KEYS = DEPARTMENT_MAP.map(d => d.key);
function ensureValidCurrentDepartment() {
  if (!DEPT_KEYS.includes(String(currentDepartment || ''))) {
    currentDepartment = DEPARTMENT_MAP[0].key;
  }
}

function ensureNavButtons() {
  const nav = document.querySelector('.department-nav .nav-container');
  if (!nav) return;
  const current = Array.from(nav.querySelectorAll('.dept-btn')).map(b => b.dataset.dept).filter(Boolean);
  const missing = DEPT_KEYS.filter(k => !current.includes(k));
  if (missing.length) {
    loadDepartmentList();
  }
}

async function loadDepartmentList() {
  const nav = document.querySelector('.department-nav .nav-container');
  if (!nav) return;
  ensureValidCurrentDepartment();
  nav.innerHTML = '';
  DEPARTMENT_MAP.forEach(({ key, label }) => {
    const btn = document.createElement('button');
    btn.className = 'dept-btn' + (key === currentDepartment ? ' active' : '');
    btn.dataset.dept = key;
    btn.textContent = label;
    nav.appendChild(btn);
  });
}

function getInitialDepartment(depts) {
  const urlDept = new URLSearchParams(location.search).get('dept');
  if (urlDept && depts.includes(urlDept)) return urlDept;
  return depts[0] || 'HRGA';
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadDepartmentList();
  ensureNavButtons();
  const depts = Array.from(document.querySelectorAll('.dept-btn')).map(b => b.dataset.dept).filter(Boolean);
  currentDepartment = getInitialDepartment(depts);
  const pageSizeSel = document.getElementById('pageSizeSel');
  const savedPageSize = Number(localStorage.getItem(LS_PAGE_SIZE_KEY) || 0);
  if (savedPageSize && pageSizeSel) { pageSize = savedPageSize; pageSizeSel.value = String(savedPageSize); }
  currentPage = getSavedPage(currentDepartment);
  document.querySelectorAll('.dept-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.dept === currentDepartment);
  });

  await loadDepartmentFromServer(currentDepartment);
  if (typeof renderTable === 'function') renderTable();
  if (typeof updateDepartmentInfo === 'function') updateDepartmentInfo(currentDepartment, rows);
  if (typeof renderHierarchyChart === 'function') {
      renderHierarchyChart([
        { label: 'Regulation', value: 10 },
        { label: 'Articles', value: 30 },
        { label: 'Criteria', value: 18 }
      ]);
  }

  document.querySelectorAll('.dept-btn').forEach(btn => {
    if (!btn.dataset.dept) return;
    btn.addEventListener('click', (e) => {
      const dept = e.currentTarget.dataset.dept;
      if (typeof switchDepartment === 'function') switchDepartment(dept);
      const url = new URL(location.href);
      url.searchParams.set('dept', dept);
      history.replaceState(null, '', url.toString());
    });
  });

  document.querySelectorAll('.dept-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dept = e.currentTarget.dataset.dept; 
      if (typeof switchDepartment === 'function') switchDepartment(dept);
    });
  });

  const btnEnterEdit = document.getElementById('btnEnterEdit');
  if (btnEnterEdit) {
      btnEnterEdit.addEventListener('click', () => {
        if (isEditing) {
          if (typeof exitEditMode === 'function') exitEditMode();
        } else {
          if (typeof enterEditMode === 'function') enterEditMode();
        }
      });
  }
});
