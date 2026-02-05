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
let hierarchyBtn;
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
        // Wait for elements to be ready
        setTimeout(() => {
            showRegulationDetail(initialCategory);
            try {
                document.querySelectorAll('.regulation-card').forEach(c => c.classList.remove('primary-card'));
                const sel = document.querySelector(`.regulation-card[data-category="${CSS.escape(initialCategory)}"]`);
                if (sel) sel.classList.add('primary-card');
            } catch {}
        }, 100);
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
    hierarchyBtn = document.getElementById('hierarchyBtn');
    elibraryTable = document.getElementById('elibraryTable');
    thActions = document.getElementById('th-actions');
    btnEnterEdit = document.getElementById('btnEnterEdit');
    editToolbar = document.getElementById('editToolbar');
    btnAddRow = document.getElementById('btnAddRow');
    btnExportCSV = document.getElementById('btnExportCSV');
    btnImport = document.getElementById('btnImport');
    fileInput = document.getElementById('fileInput');
    btnExitEdit = document.getElementById('btnExitEdit');
}

function setupEventListeners() {
    const regulationCards = document.querySelectorAll('.regulation-card');
    regulationCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default if any
            const category = this.getAttribute('data-category');
            if (!category) return;
            
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

    if (hierarchyBtn) hierarchyBtn.addEventListener('click', () => {
        const url = new URL(location.href);
        url.searchParams.delete('category');
        history.replaceState(null, '', url.toString());
        if (currentCategory) saveElibPage(currentCategory, 1);
        showRegulationHierarchy();
    });

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

    // Modal Events
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
        
        currentCategory = null;
        rows = [];
        setEditMode(false);
        try { document.querySelectorAll('.regulation-card').forEach(c => c.classList.remove('primary-card')); } catch {}
        updateCategoryCounts();
        startCountsAutoRefresh();
        stopDetailAutoRefresh();
        
        // Ensure grid is visible
        regulationGrid.classList.remove('hidden');
    }
}

function showRegulationDetail(category) {
    if (!regulationGrid || !regulationDetail || !detailTitle || !detailTableBody) {
        console.error('Required elements not found for detail view');
        // Try to re-init
        initializeElements();
        if (!regulationGrid || !regulationDetail) return;
    }

    currentCategory = category;
    regulationGrid.style.display = 'none';
    regulationDetail.style.display = 'block';
    
    // Ensure detail is visible (remove hidden if present)
    regulationDetail.classList.remove('hidden');
    
    if (detailTitle) detailTitle.textContent = categoryTitles[category] || 'Regulation Detail';

    currentPage = getSavedElibPage(category);
    
    (async () => {
      try {
        const resp = await fetch('/legal/api/elibrary-counts');
        const counts = resp.ok ? await resp.json() : null;
        // Logic for total pages if needed
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
        
        // Fields: No, Departemen, Regulasi, Lingkup, Status, Catatan, Aksi
        const departemen = row.departemen || row.year || '-'; // Fallback to year if old data
        const regulasi = row.regulasi || row.number || '-';
        const lingkup = row.lingkup || row.title || '-';
        const status = row.status || 'applicable';
        const catatan = row.notes || row.desc || '-';
        const link = row.link || row.file || '';
        
        const statusBadge = status === 'applicable' 
            ? '<span class="status-active">Berlaku</span>' 
            : '<span class="status-inactive">Tidak Berlaku</span>';

        if (isEditing) {
            tr.innerHTML = `
                <td class="p-3 text-center w-16">${row.no || index + 1}</td>
                <td class="p-3"><input type="text" class="w-full border rounded p-1" value="${departemen}" onchange="updateRow(${index}, 'departemen', this.value)"></td>
                <td class="p-3"><input type="text" class="w-full border rounded p-1" value="${regulasi}" onchange="updateRow(${index}, 'regulasi', this.value)"></td>
                <td class="p-3"><input type="text" class="w-full border rounded p-1" value="${lingkup}" onchange="updateRow(${index}, 'lingkup', this.value)"></td>
                <td class="p-3">
                    <select class="w-full border rounded p-1" onchange="updateRow(${index}, 'status', this.value)">
                        <option value="applicable" ${status === 'applicable' ? 'selected' : ''}>Berlaku</option>
                        <option value="not-applicable" ${status === 'not-applicable' ? 'selected' : ''}>Tidak Berlaku</option>
                    </select>
                </td>
                <td class="p-3"><input type="text" class="w-full border rounded p-1" value="${catatan}" onchange="updateRow(${index}, 'notes', this.value)"></td>
                <td class="p-3 text-center">
                    <button class="text-red-500 hover:text-red-700" onclick="deleteRow(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="text-blue-500 hover:text-blue-700 ml-2" onclick="openEditModalFromRow(${index})">
                        <i class="fas fa-pen"></i>
                    </button>
                </td>
            `;
        } else {
            tr.innerHTML = `
                <td class="p-3 text-center text-gray-500">${row.no || index + 1}</td>
                <td class="p-3 font-medium text-gray-900">${departemen}</td>
                <td class="p-3 text-blue-600 font-medium">${regulasi}</td>
                <td class="p-3 text-gray-800">${lingkup}</td>
                <td class="p-3 text-center">${statusBadge}</td>
                <td class="p-3 text-gray-600 text-sm max-w-md truncate" title="${catatan}">${catatan}</td>
                <td class="p-3 text-center">
                    ${link ? `<a href="${link}" target="_blank" class="text-blue-500 hover:text-blue-700 transition-colors"><i class="fas fa-file-pdf text-lg"></i></a>` : '<span class="text-gray-300"><i class="fas fa-minus"></i></span>'}
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
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
        rows[index].__deleted = true;
        renderTable(); 
    }
}

function addRow() {
    const newRow = { 
        id: Date.now(), 
        departemen: '', 
        regulasi: '', 
        lingkup: '', 
        status: 'applicable', 
        notes: '', 
        link: '', 
        __new: true 
    };
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
        alert('Gagal menyimpan perubahan. Cek koneksi.');
    }
}

async function updateCategoryCounts() {
    try {
        const res = await fetch(`${API_BASE}-counts`);
        if (res.ok) {
            const counts = await res.json();
            for (const [cat, count] of Object.entries(counts)) {
                const el = document.querySelector(`.regulation-card[data-category="${cat}"] .regulation-count`);
                if (el) el.textContent = `${count} Peraturan`;
            }
        }
    } catch {}
}

function exportCSV() {
    if (!rows || !rows.length) return alert('Tidak ada data untuk diekspor');
    const headers = ['Departemen', 'Regulasi', 'Lingkup', 'Status', 'Catatan', 'Link'];
    const csvContent = [
        headers.join(','),
        ...rows.filter(r => !r.__deleted).map(r => 
            [
                r.departemen, 
                r.regulasi, 
                r.lingkup, 
                r.status, 
                r.notes, 
                r.link
            ].map(f => `"${String(f||'').replace(/"/g, '""')}"`).join(',')
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
            const parts = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (parts && parts.length >= 6) {
                 const clean = s => s.replace(/^"|"$/g, '').replace(/""/g, '"');
                 rows.push({
                     id: Date.now() + Math.random(),
                     departemen: clean(parts[0]||''),
                     regulasi: clean(parts[1]||''),
                     lingkup: clean(parts[2]||''),
                     status: clean(parts[3]||'applicable'),
                     notes: clean(parts[4]||''),
                     link: clean(parts[5]||''),
                     __new: true
                 });
            }
        }
        renderTable();
        alert(`Berhasil impor ${lines.length - 1} baris.`);
    };
    reader.readAsText(file);
    e.target.value = ''; 
}

// Modal Handling
let currentRowRef = null;
const modalTitle = document.getElementById('modalTitle');
const fDepartemen = document.getElementById('fDepartemen');
const fRegulasi = document.getElementById('fRegulasi');
const fLingkup = document.getElementById('fLingkup');
const fStatus = document.getElementById('fStatus');
const fLink = document.getElementById('fLink');
const fNotes = document.getElementById('fNotes');
const editModal = document.getElementById('editModal');

function openEditModal(row, index) {
    currentRowRef = row;
    newRowIndex = index;
    if (modalTitle) modalTitle.textContent = row.regulasi || 'Edit Regulasi';
    
    if (fDepartemen) fDepartemen.value = row.departemen || row.year || '';
    if (fRegulasi) fRegulasi.value = row.regulasi || row.number || '';
    if (fLingkup) fLingkup.value = row.lingkup || row.title || '';
    if (fStatus) fStatus.value = row.status || 'applicable';
    if (fLink) fLink.value = row.link || row.file || '';
    if (fNotes) fNotes.value = row.notes || row.desc || '';
    
    if (editModal) editModal.classList.remove('hidden');
}

function openEditModalFromRow(index) {
    if (rows[index]) openEditModal(rows[index], index);
}

function closeEditModal() {
    if (editModal) editModal.classList.add('hidden');
    currentRowRef = null;
    newRowIndex = null;
}

function deleteRowCurrent() {
    if (currentRowRef && confirm('Hapus regulasi ini?')) {
        currentRowRef.__deleted = true;
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
        if (fDepartemen) currentRowRef.departemen = fDepartemen.value;
        if (fRegulasi) currentRowRef.regulasi = fRegulasi.value;
        if (fLingkup) currentRowRef.lingkup = fLingkup.value;
        if (fStatus) currentRowRef.status = fStatus.value;
        if (fLink) currentRowRef.link = fLink.value;
        if (fNotes) currentRowRef.notes = fNotes.value;
        
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
}

function startCountsAutoRefresh() {
    stopCountsAutoRefresh();
    autoRefreshCountsTimer = setInterval(async () => {
        if (document.visibilityState === 'visible') {
            await updateCategoryCounts();
        }
    }, 10000);
}

function stopCountsAutoRefresh() {
    if (autoRefreshCountsTimer) clearInterval(autoRefreshCountsTimer);
}
