const API_BASE = '/legal/api/elibrary';

const categoryTitles = {
    'undang-undang': 'Undang - Undang',
    'peraturan-pemerintah': 'Peraturan Pemerintah',
    'peraturan-presiden': 'Peraturan Presiden',
    'peraturan-daerah': 'Peraturan Daerah Provinsi dan Kabupaten/Kota',
    'peraturan-kawasan': 'Peraturan Kawasan Industri',
    'peraturan-lainnya': 'Peraturan Lainnya'
};

let regulationGrid;
let regulationDetail;
let detailTitle;
let detailTableBody;
let backBtn;
let hierarchyBtn;
let nextBtn;
let elibraryTable;
let thActions;
let btnEnterEdit;
let editToolbar;
let btnAddRow;
let btnExportCSV;
let btnImport;
let fileInput;
let btnExitEdit;

let currentCategory = null;
let rows = [];
let isEditing = false;
let autoRefreshDetailTimer = null;
let autoRefreshCountsTimer = null;
let currentPage = 1;
let pageSize = 50;
const LS_ELIB_PAGE_SIZE_KEY = 'elib_page_size';
const LS_ELIB_PAGE_KEY_PREFIX = 'elib_current_page_';
function getSavedElibPage(cat){ try { const v = Number(localStorage.getItem(LS_ELIB_PAGE_KEY_PREFIX + String(cat||'')) || 0); return v>0?v:1; } catch { return 1; } }
function saveElibPage(cat,page){ try { localStorage.setItem(LS_ELIB_PAGE_KEY_PREFIX + String(cat||''), String(page)); } catch {} }
let newRowIndex = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    const url = new URL(location.href);
    const initialCategory = url.searchParams.get('category');
    if (initialCategory) {
        showRegulationDetail(initialCategory);
        try {
            document.querySelectorAll('.regulation-card').forEach(c => c.classList.remove('primary-card'));
            const sel = document.querySelector(`.regulation-card[data-category="${CSS.escape(initialCategory)}"]`);
            if (sel) sel.classList.add('primary-card');
        } catch {}
    } else {
        showRegulationHierarchy();
    }
    setTimeout(addScrollAnimations, 100);
    if (typeof updateCategoryCounts === 'function') updateCategoryCounts();
    if (!initialCategory && typeof startCountsAutoRefresh === 'function') startCountsAutoRefresh();
});

function initializeElements() {
    regulationGrid = document.getElementById('regulationGrid');
    regulationDetail = document.getElementById('regulationDetail');
    detailTitle = document.getElementById('detailTitle');
    detailTableBody = document.getElementById('detailTableBody');
    backBtn = document.getElementById('backBtn');
    hierarchyBtn = document.getElementById('hierarchyBtn');
    nextBtn = document.getElementById('nextBtn');
    elibraryTable = document.getElementById('elibraryTable');
    thActions = document.getElementById('th-actions');
    btnEnterEdit = document.getElementById('btnEnterEdit');
    editToolbar = document.getElementById('editToolbar');
    btnAddRow = document.getElementById('btnAddRow');
    btnExportCSV = document.getElementById('btnExportCSV');
    btnImport = document.getElementById('btnImport');
    fileInput = document.getElementById('fileInput');
    btnExitEdit = document.getElementById('btnExitEdit');
    const pageSizeSel = document.getElementById('pageSizeSel');
    const savedPageSize = Number(localStorage.getItem(LS_ELIB_PAGE_SIZE_KEY) || 0);
    if (pageSizeSel) {
      if (savedPageSize && [25,50,100].includes(savedPageSize)) { pageSize = savedPageSize; pageSizeSel.value = String(savedPageSize); }
      pageSizeSel.addEventListener('change', async () => {
        pageSize = Number(pageSizeSel.value || 50);
        try { localStorage.setItem(LS_ELIB_PAGE_SIZE_KEY, String(pageSize)); } catch {}
        currentPage = 1;
        await refreshDetailPage();
      });
    }
}

function setupEventListeners() {
    const regulationCards = document.querySelectorAll('.regulation-card');
    regulationCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            try {
                document.querySelectorAll('.regulation-card').forEach(c => c.classList.remove('primary-card'));
                this.classList.add('primary-card');
            } catch {}
            const url = new URL(location.href);
            url.searchParams.set('category', category);
            history.replaceState(null, '', url.toString());
            saveElibPage(category, 1);
            showRegulationDetail(category);
        });
        card.addEventListener('mouseenter', function() { this.style.transform = 'translateY(-5px)'; });
        card.addEventListener('mouseleave', function() { this.style.transform = 'translateY(0)'; });
    });

    if (backBtn) backBtn.addEventListener('click', () => {
        const url = new URL(location.href);
        url.searchParams.delete('category');
        history.replaceState(null, '', url.toString());
        if (currentCategory) saveElibPage(currentCategory, 1);
        showRegulationHierarchy();
    });
    if (hierarchyBtn) hierarchyBtn.addEventListener('click', () => {
        const url = new URL(location.href);
        url.searchParams.delete('category');
        history.replaceState(null, '', url.toString());
        if (currentCategory) saveElibPage(currentCategory, 1);
        showRegulationHierarchy();
    });
    const prevBtn = document.getElementById('prevBtn');
    const pageNoEl = document.getElementById('pageNo');
    if (nextBtn) nextBtn.addEventListener('click', async () => {
        const knownTotalPages = typeof window.ELibTotalPages === 'number' ? window.ELibTotalPages : null;
        const allowNext = knownTotalPages != null ? (currentPage < knownTotalPages) : (rows.length === pageSize);
        if (!allowNext) return;
        currentPage++;
        await refreshDetailPage();
        saveElibPage(currentCategory, currentPage);
    });
    if (prevBtn) prevBtn.addEventListener('click', async () => { if (currentPage > 1) { currentPage--; await refreshDetailPage(); saveElibPage(currentCategory, currentPage); } });

    if (btnEnterEdit) btnEnterEdit.addEventListener('click', () => setEditMode(true));
    if (btnExitEdit) btnExitEdit.addEventListener('click', async () => {
        setEditMode(false);
        if (currentCategory) {
            await saveCategoryToServer(currentCategory);
            const fresh = await loadCategoryFromServer(currentCategory);
            rows = normalizeRows(fresh || []);
            renderTable();
            updateCategoryCounts();
            startDetailAutoRefresh();
        }
    });
    if (btnAddRow) btnAddRow.addEventListener('click', addRow);
    if (btnExportCSV) btnExportCSV.addEventListener('click', exportCSV);
    if (btnImport) btnImport.addEventListener('click', () => fileInput && fileInput.click());
    if (fileInput) fileInput.addEventListener('change', handleImportCSV);

    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancel = document.getElementById('btnCancel');
    const btnDelete = document.getElementById('btnDelete');
    const btnSave = document.getElementById('btnSave');
    const modalBackdrop = document.getElementById('modalBackdrop');

    if (btnCloseModal) btnCloseModal.addEventListener('click', closeEditModal);
    if (btnCancel) btnCancel.addEventListener('click', closeEditModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeEditModal);
    if (btnDelete) btnDelete.addEventListener('click', deleteRowCurrent);
    if (btnSave) btnSave.addEventListener('click', saveRowFromModal);
}

function showRegulationHierarchy() {
    if (regulationGrid && regulationDetail) {
        regulationGrid.style.display = 'grid';
        regulationDetail.style.display = 'none';
        if (hierarchyBtn) hierarchyBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'block';
        currentCategory = null;
        rows = [];
        setEditMode(false);
        try { document.querySelectorAll('.regulation-card').forEach(c => c.classList.remove('primary-card')); } catch {}
        updateCategoryCounts();
        startCountsAutoRefresh();
        stopDetailAutoRefresh();
    }
}

function showRegulationDetail(category) {
    if (!regulationGrid || !regulationDetail || !detailTitle || !detailTableBody) {
        console.error('Required elements not found');
        return;
    }

    currentCategory = category;
    regulationGrid.style.display = 'none';
    regulationDetail.style.display = 'block';
    detailTitle.textContent = categoryTitles[category] || 'Regulation Detail';

    currentPage = getSavedElibPage(category);
    (async () => {
      try {
        const resp = await fetch('/legal/api/elibrary-counts');
        const counts = resp.ok ? await resp.json() : null;
        const total = counts && counts[category] ? Number(counts[category]) : null;
        window.ELibTotalPages = total ? Math.ceil(total / pageSize) : null;
      } catch {}
      await refreshDetailPage();
      startDetailAutoRefresh();
    })();

    if (hierarchyBtn) hierarchyBtn.style.display = 'inline-flex';
}

async function refreshDetailPage() {
    if (!currentCategory) return;
    const fresh = await loadCategoryFromServer(currentCategory);
    rows = normalizeRows(fresh || []);
    renderTable();
    updatePaginationUI();
}

function updatePaginationUI(){
    const pageNoEl = document.getElementById('pageNo');
    const btnPrev = document.getElementById('prevBtn');
    const btnNext = document.getElementById('nextBtn');
    if (pageNoEl) pageNoEl.textContent = String(currentPage);
    if (btnPrev) btnPrev.disabled = currentPage <= 1;
    if (btnNext) {
        const knownTotalPages = typeof window.ELibTotalPages === 'number' ? window.ELibTotalPages : null;
        const allowNext = knownTotalPages != null ? (currentPage < knownTotalPages) : (rows.length === pageSize);
        btnNext.disabled = !allowNext;
    }
}

function normalizeRows(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map((r, i) => {
        if (!r.id) r.id = Date.now() + Math.random(); 
        r.no = (currentPage - 1) * pageSize + (i + 1);
        return r;
    });
}

function renderTable() {
    if (!detailTableBody) return;
    detailTableBody.innerHTML = '';
    
    rows.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition-colors';
        
        if (isEditing) {
            tr.innerHTML = `
                <td class="p-3 text-center w-16">${row.no || index + 1}</td>
                <td class="p-3"><input type="text" class="w-full border rounded p-1" value="${row.year || ''}" onchange="updateRow(${index}, 'year', this.value)"></td>
                <td class="p-3"><input type="text" class="w-full border rounded p-1" value="${row.number || ''}" onchange="updateRow(${index}, 'number', this.value)"></td>
                <td class="p-3"><input type="text" class="w-full border rounded p-1" value="${row.title || ''}" onchange="updateRow(${index}, 'title', this.value)"></td>
                <td class="p-3"><input type="text" class="w-full border rounded p-1" value="${row.desc || ''}" onchange="updateRow(${index}, 'desc', this.value)"></td>
                <td class="p-3"><input type="text" class="w-full border rounded p-1" value="${row.file || ''}" onchange="updateRow(${index}, 'file', this.value)"></td>
                <td class="p-3 text-center">
                    <button class="text-red-500 hover:text-red-700" onclick="deleteRow(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        } else {
            const displayNo = row.no || ((currentPage - 1) * pageSize + index + 1);
            tr.innerHTML = `
                <td class="p-3 text-center text-gray-500">${displayNo}</td>
                <td class="p-3 font-medium text-gray-900">${row.year || '-'}</td>
                <td class="p-3 text-blue-600 font-medium">${row.number || '-'}</td>
                <td class="p-3 text-gray-800">${row.title || '-'}</td>
                <td class="p-3 text-gray-600 text-sm max-w-md truncate" title="${row.desc || ''}">${row.desc || '-'}</td>
                <td class="p-3 text-center">
                    ${row.file ? `<a href="${row.file}" target="_blank" class="text-blue-500 hover:text-blue-700 transition-colors"><i class="fas fa-file-pdf text-lg"></i></a>` : '<span class="text-gray-300"><i class="fas fa-minus"></i></span>'}
                </td>
                ${isEditing ? '<td class="p-3"></td>' : ''}
            `;
            tr.addEventListener('click', (e) => {
                if (!isEditing && !e.target.closest('a')) openEditModal(row, index);
            });
            tr.style.cursor = isEditing ? 'default' : 'pointer';
        }
        detailTableBody.appendChild(tr);
    });

    if (thActions) thActions.style.display = isEditing ? 'table-cell' : 'none';
}

function updateRow(index, field, value) {
    if (rows[index]) {
        rows[index][field] = value;
        rows[index].__modified = true;
    }
}

function deleteRow(index) {
    if (confirm('Are you sure you want to delete this row?')) {
        rows[index].__deleted = true;
        renderTable(); 
    }
}

function addRow() {
    const newRow = { id: Date.now(), year: '', number: '', title: '', desc: '', file: '', __new: true };
    rows.push(newRow);
    renderTable();
    window.scrollTo(0, document.body.scrollHeight);
}

function setEditMode(active) {
    isEditing = active;
    if (editToolbar) editToolbar.style.display = active ? 'flex' : 'none';
    if (btnEnterEdit) btnEnterEdit.style.display = active ? 'none' : 'inline-flex';
    if (hierarchyBtn) hierarchyBtn.style.display = active ? 'none' : 'inline-flex';
    if (thActions) thActions.style.display = active ? 'table-cell' : 'none';
    renderTable();
}

function addScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-4');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.regulation-card').forEach(el => {
        el.classList.add('opacity-0', 'translate-y-4', 'transition-all', 'duration-700');
        observer.observe(el);
    });
}

// Data Handling
async function loadCategoryFromServer(cat) {
    try {
        const res = await fetch(`${API_BASE}/category/${encodeURIComponent(cat)}?limit=${pageSize}&page=${currentPage}`);
        if (res.ok) {
             const data = await res.json();
             return Array.isArray(data) ? data : [];
        }
        return [];
    } catch (e) {
        console.error('Failed to load category:', e);
        return [];
    }
}

async function saveCategoryToServer(cat) {
    try {
        const toSave = rows.filter(r => r.__modified || r.__new || r.__deleted);
        if (toSave.length === 0) return;
        
        const res = await fetch(`${API_BASE}/category/${encodeURIComponent(cat)}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(toSave)
        });
        if (!res.ok) throw new Error('Sync failed');
    } catch (e) {
        console.error('Failed to save category:', e);
        alert('Failed to save changes. Check connection.');
    }
}

async function updateCategoryCounts() {
    try {
        const res = await fetch(`${API_BASE}-counts`);
        if (res.ok) {
            const counts = await res.json();
            for (const [cat, count] of Object.entries(counts)) {
                const el = document.querySelector(`.regulation-card[data-category="${cat}"] .regulation-count`);
                if (el) el.textContent = count;
            }
        }
    } catch {}
}

function exportCSV() {
    if (!rows || !rows.length) return alert('No data to export');
    const headers = ['Year', 'Number', 'Title', 'Description', 'File Link'];
    const csvContent = [
        headers.join(','),
        ...rows.filter(r => !r.__deleted).map(r => 
            [r.year, r.number, r.title, r.desc, r.file].map(f => `"${String(f||'').replace(/"/g, '""')}"`).join(',')
        )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `regulation_${currentCategory}_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}

function handleImportCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        const text = evt.target.result;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) return; 
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
            // Simple CSV parser (assumes quotes)
            const parts = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (parts && parts.length >= 4) {
                 const clean = s => s.replace(/^"|"$/g, '').replace(/""/g, '"');
                 rows.push({
                     id: Date.now() + Math.random(),
                     year: clean(parts[0]||''),
                     number: clean(parts[1]||''),
                     title: clean(parts[2]||''),
                     desc: clean(parts[3]||''),
                     file: clean(parts[4]||''),
                     __new: true
                 });
            }
        }
        renderTable();
        alert(`Imported ${lines.length - 1} rows. Click Exit Edit to save.`);
    };
    reader.readAsText(file);
    e.target.value = ''; 
}

// Modal Handling
let currentRowRef = null;
const modalTitle = document.getElementById('modalTitle');
const inpYear = document.getElementById('inpYear');
const inpNumber = document.getElementById('inpNumber');
const inpTitle = document.getElementById('inpTitle');
const inpDesc = document.getElementById('inpDesc');
const inpFile = document.getElementById('inpFile');
const editModal = document.getElementById('editModal');

function openEditModal(row, index) {
    currentRowRef = row;
    newRowIndex = index;
    if (modalTitle) modalTitle.textContent = row.title || 'Edit Regulation';
    if (inpYear) inpYear.value = row.year || '';
    if (inpNumber) inpNumber.value = row.number || '';
    if (inpTitle) inpTitle.value = row.title || '';
    if (inpDesc) inpDesc.value = row.desc || '';
    if (inpFile) inpFile.value = row.file || '';
    if (editModal) editModal.classList.remove('hidden');
}

function closeEditModal() {
    if (editModal) editModal.classList.add('hidden');
    currentRowRef = null;
    newRowIndex = null;
}

function deleteRowCurrent() {
    if (currentRowRef && confirm('Delete this regulation?')) {
        currentRowRef.__deleted = true;
        // In view mode, we probably want to save immediately or just hide it?
        // Let's assume view mode deletion requires immediate sync or it's just local until refresh.
        // For better UX, let's try to sync one deletion if not in edit mode.
        if (!isEditing) {
            saveCategoryToServer(currentCategory).then(() => {
                refreshDetailPage();
                closeEditModal();
            });
        } else {
            renderTable();
            closeEditModal();
        }
    }
}

function saveRowFromModal() {
    if (currentRowRef) {
        currentRowRef.year = inpYear.value;
        currentRowRef.number = inpNumber.value;
        currentRowRef.title = inpTitle.value;
        currentRowRef.desc = inpDesc.value;
        currentRowRef.file = inpFile.value;
        currentRowRef.__modified = true;
        
        if (!isEditing) {
             saveCategoryToServer(currentCategory).then(() => {
                refreshDetailPage();
                closeEditModal();
            });
        } else {
            renderTable();
            closeEditModal();
        }
    }
}

function startDetailAutoRefresh() {
    stopDetailAutoRefresh();
    autoRefreshDetailTimer = setInterval(async () => {
        if (!isEditing && currentCategory && document.visibilityState === 'visible') {
            await refreshDetailPage();
        }
    }, 5000);
}

function stopDetailAutoRefresh() {
    if (autoRefreshDetailTimer) clearInterval(autoRefreshDetailTimer);
    autoRefreshDetailTimer = null;
}

function startCountsAutoRefresh() {
    if (autoRefreshCountsTimer) clearInterval(autoRefreshCountsTimer);
    autoRefreshCountsTimer = setInterval(() => {
        if (!currentCategory && document.visibilityState === 'visible') {
            updateCategoryCounts();
        }
    }, 10000);
}
