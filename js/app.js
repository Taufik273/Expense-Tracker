// --------------------------------------------------
// STATE
// --------------------------------------------------
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let customCategories = JSON.parse(localStorage.getItem('customCategories')) || [];
let spendingLimit = parseInt(localStorage.getItem('spendingLimit')) || 0;
let sortMode = 'default';
let isDarkMode = localStorage.getItem('darkMode') === 'true';

// --------------------------------------------------
// DOM ELEMENTS
// --------------------------------------------------
const form = document.getElementById('transactionForm');
const itemNameInput = document.getElementById('itemName');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const customCategoryInput = document.getElementById('customCategory');
const catDropdown = document.getElementById('catDropdown');
const catTrigger = document.getElementById('catTrigger');
const catTriggerLabel = document.getElementById('catTriggerLabel');
const catMenu = document.getElementById('catMenu');
const totalSpentEl = document.getElementById('totalSpent');
const transactionListEl = document.getElementById('transactionList');
const listCountEl = document.getElementById('listCount');
const pieCanvas = document.getElementById('pieChart');
const sortBtn = document.getElementById('sortBtn');
const monthlyViewBtn = document.getElementById('monthlyViewBtn');
const monthlyModal = document.getElementById('monthlyModal');
const closeBtn = document.querySelector('.close-btn');
const monthlyContent = document.getElementById('monthlyContent');
const themeToggle = document.getElementById('themeToggle');
const limitInput = document.getElementById('spendingLimit');
const limitWarning = document.getElementById('limitWarning');

// --------------------------------------------------
// THEME
// --------------------------------------------------
function applyTheme() {
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️ Light Mode';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.textContent = '🌙 Dark Mode';
    }
}

themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    applyTheme();
});

// --------------------------------------------------
// INITIALIZE
// --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    rebuildCategoryOptions();
    limitInput.value = spendingLimit || '';
    renderAll();
});

// --------------------------------------------------
// UTILITY FUNCTIONS
// --------------------------------------------------
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
    }).format(angka);
}

function saveData() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
    localStorage.setItem('spendingLimit', spendingLimit.toString());
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --------------------------------------------------
// CATEGORY MANAGEMENT
// --------------------------------------------------
const CATEGORY_ICONS = { Food: '🍔', Transport: '🚌', Fun: '🎉' };
const DEFAULT_CATEGORIES = Object.keys(CATEGORY_ICONS);

function categoryLabel(name) {
    if (name === '') return 'Select Category';
    if (name === 'custom') return '➕ Add Custom...';
    return CATEGORY_ICONS[name] ? `${CATEGORY_ICONS[name]} ${name}` : name;
}

function syncCustomInput() {
    const isCustom = categorySelect.value === 'custom';
    customCategoryInput.classList.toggle('hidden', !isCustom);
    customCategoryInput.required = isCustom;
}

categorySelect.addEventListener('change', syncCustomInput);

function rebuildCategoryOptions() {
    const currentVal = categorySelect.value;
    categorySelect.innerHTML = `
        <option value="">Select Category</option>
        <option value="Food">🍔 Food</option>
        <option value="Transport">🚌 Transport</option>
        <option value="Fun">🎉 Fun</option>
    `;

    customCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
    });

    const optCustom = document.createElement('option');
    optCustom.value = 'custom';
    optCustom.textContent = '➕ Add Custom...';
    categorySelect.appendChild(optCustom);
    // Nilai lama bisa sudah tidak ada (mis. kategori yang baru dihapus) -> reset
    categorySelect.value = [...categorySelect.options].some(o => o.value === currentVal) ? currentVal : '';
    renderCategoryMenu();
}

// ---- Dropdown custom (pengganti tampilan <select>) ----
// <select> bawaan tidak bisa menampilkan tombol/icon di dalam pilihannya,
// jadi menu ini digambar sendiri pakai <div>, lengkap dengan icon hapus
// di kategori custom. Nilai pilihan tetap disimpan di <select> tersembunyi,
// sehingga logika form tidak berubah.
function renderCategoryMenu() {
    catTriggerLabel.textContent = categoryLabel(categorySelect.value);
    catMenu.innerHTML = '';

    const names = [...DEFAULT_CATEGORIES, ...customCategories, 'custom'];
    names.forEach(name => {
        const item = document.createElement('div');
        item.className = 'cat-item' + (categorySelect.value === name ? ' selected' : '');
        item.setAttribute('role', 'option');

        const check = document.createElement('span');
        check.className = 'cat-check';
        check.textContent = categorySelect.value === name ? '✔' : '';
        item.appendChild(check);

        const label = document.createElement('span');
        label.className = 'cat-label';
        label.textContent = categoryLabel(name);
        item.appendChild(label);

        // Icon hapus HANYA untuk kategori custom (bawaan tidak bisa dihapus)
        if (customCategories.includes(name)) {
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'cat-del-btn';
            del.textContent = '🗑️';
            del.title = `Hapus kategori ${name}`;
            del.setAttribute('aria-label', `Hapus kategori ${name}`);
            del.addEventListener('click', (e) => {
                e.stopPropagation(); // klik trash jangan ikut memilih kategori
                deleteCustomCategory(name);
            });
            item.appendChild(del);
        }

        item.addEventListener('click', () => selectCategory(name));
        catMenu.appendChild(item);
    });
}

function selectCategory(name) {
    categorySelect.value = name;
    syncCustomInput();
    closeCategoryMenu();
    renderCategoryMenu();
    if (name === 'custom') customCategoryInput.focus();
}

function closeCategoryMenu() {
    catMenu.classList.add('hidden');
    catTrigger.setAttribute('aria-expanded', 'false');
}

catTrigger.addEventListener('click', () => {
    const willOpen = catMenu.classList.contains('hidden');
    catMenu.classList.toggle('hidden', !willOpen);
    catTrigger.setAttribute('aria-expanded', String(willOpen));
});

document.addEventListener('click', (e) => {
    if (!catDropdown.contains(e.target)) closeCategoryMenu();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCategoryMenu();
});

function deleteCustomCategory(name) {
    const usedCount = transactions.filter(t => t.category === name).length;
    const note = usedCount > 0
        ? `\n\nAda ${usedCount} transaksi yang memakai kategori ini. Transaksinya TIDAK ikut terhapus, hanya kategorinya yang hilang dari daftar pilihan.`
        : '';
    if (!confirm(`Hapus kategori "${name}"?${note}`)) return;

    customCategories = customCategories.filter(c => c !== name);
    if (categorySelect.value === name) {
        categorySelect.value = '';
        syncCustomInput();
    }
    saveData();
    rebuildCategoryOptions();
}

// --------------------------------------------------
// FORM SUBMIT
// --------------------------------------------------
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = itemNameInput.value.trim();
    const amount = parseInt(amountInput.value);
    let category = categorySelect.value;
    if (!name || !amount || !category) {
        alert('Harap isi semua kolom!');
        return;
    }

    if (category === 'custom') {
        const customName = customCategoryInput.value.trim();
        if (!customName) {
            alert('Masukkan nama kategori baru!');
            return;
        }
        category = customName;
        if (!customCategories.includes(customName)) {
            customCategories.push(customName);
        }
    }

    transactions.unshift({
        id: Date.now(),
        name,
        amount,
        category,
        date: new Date().toISOString()
    });

    saveData();
    rebuildCategoryOptions();
    renderAll();
    form.reset();
    customCategoryInput.classList.add('hidden');
    customCategoryInput.required = false;
    renderCategoryMenu(); // form.reset() mengosongkan <select>, samakan label dropdown-nya
});

// --------------------------------------------------
// CALCULATION HELPERS
// --------------------------------------------------
function getTotal() {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
}

function getCategoryTotals() {
    return transactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {});
}

function getCategoryColor(category) {
    const fixedColors = {
        Food: '#f97316',
        Transport: '#8b5cf6',
        Fun: '#ec4899'
    };

    const customColors = [
        '#06b6d4',
        '#84cc16',
        '#eab308',
        '#f43f5e',
        '#14b8a6',
        '#a855f7'
    ];

    if (fixedColors[category]) {
        return fixedColors[category];
    }

    const index = customCategories.indexOf(category);

    return customColors[index % customColors.length];
}

// --------------------------------------------------
// RENDER TOTAL BALANCE
// --------------------------------------------------
function renderBalance() {
    const total = getTotal();
    totalSpentEl.textContent = formatRupiah(total);
    if (spendingLimit > 0 && total > spendingLimit) {
        const minBalance = total - spendingLimit;
        limitWarning.textContent = `⚠️ Melebihi Batas! Batas: ${formatRupiah(spendingLimit)} (BALANCE : - ${formatRupiah(minBalance)})`;
        limitWarning.style.color = 'var(--danger)';
    } else if (spendingLimit > 0) {
        const pct = ((total / spendingLimit) * 100).toFixed(1);
        const balance = spendingLimit - total;
        limitWarning.textContent = `${pct}% dari batas bulanan terpakai (BALANCE : ${formatRupiah(balance)})`;
        limitWarning.style.color = pct > 75 ? 'var(--warning)' : 'var(--success)';
    } else {
        limitWarning.textContent = '';
    }
}

// --------------------------------------------------
// RENDER TRANSACTION LIST
// --------------------------------------------------
function renderList() {
    let sorted = [...transactions];
    if (sortMode === 'amount') {
        sorted.sort((a, b) => b.amount - a.amount);
    } else if (sortMode === 'category') {
        sorted.sort((a, b) => a.category.localeCompare(b.category));
    }

    listCountEl.textContent = `(${sorted.length})`;
    if (sorted.length === 0) {
        transactionListEl.innerHTML = '<p class="empty-message">Belum ada transaksi. Tambahkan yang pertama di atas!</p>';
        return;
    }

    transactionListEl.innerHTML = sorted.map(t => `
        <div class="transaction-item">
            <div class="item-info">
                <h4>${escapeHtml(t.name)}</h4>
                <div class="item-meta">${escapeHtml(t.category)} • ${new Date(t.date).toLocaleDateString('id-ID')}</div>
            </div>
            <div class="item-amount">
                <div class="amount">${formatRupiah(t.amount)}</div>
                <button class="delete-btn" data-id="${t.id}">🗑️</button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            transactions = transactions.filter(t => t.id !== parseInt(btn.dataset.id));
            saveData();
            renderAll();
        });
    });
}

// --------------------------------------------------
// PIE CHART
// ===================================================
function renderChart() {
    const totals = getCategoryTotals();
    const labels = Object.keys(totals);
    const data = Object.values(totals);
    const colors = labels.map(getCategoryColor);
    const ctx = pieCanvas.getContext('2d');
    ctx.clearRect(0, 0, pieCanvas.width, pieCanvas.height);
    if (labels.length === 0) return;
    const containerWidth = pieCanvas.parentElement.clientWidth;
    const size = Math.min(containerWidth, 320);
    pieCanvas.width = size;
    pieCanvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 10;
    let cumulative = -Math.PI / 2;
    const total = data.reduce((a, b) => a + b, 0);
    data.forEach((val, i) => {
        const slice = (val / total) * Math.PI * 2;
        const percentage = ((val / total) * 100).toFixed(1);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, cumulative, cumulative + slice);
        ctx.closePath();
        ctx.fillStyle = colors[i];
        ctx.fill();
        const midAngle = cumulative + slice / 2;
        const labelRadius = r * 0.7;
        const labelX = cx + labelRadius * Math.cos(midAngle);
        const labelY = cy + labelRadius * Math.sin(midAngle);
        const fontSize = size < 300 ? 10 : 12;
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontSize}px Segoe UI, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 2;
        ctx.fillText(labels[i], labelX, labelY - 9);
        ctx.fillText(`${percentage}%`, labelX, labelY + 9);
        ctx.shadowBlur = 0;
        cumulative += slice;
    });
}

// --------------------------------------------------
// RENDER SEMUA
// --------------------------------------------------
function renderAll() {
    renderBalance();
    renderList();
    renderChart();
}

// --------------------------------------------------
// SORT
// --------------------------------------------------
sortBtn.addEventListener('click', () => {
    if (sortMode === 'default') sortMode = 'amount';
    else if (sortMode === 'amount') sortMode = 'category';
    else sortMode = 'default';
    sortBtn.textContent = `Urut: ${sortMode === 'default' ? 'Standar' : sortMode === 'amount' ? 'Jumlah' : 'Kategori'}`;
    renderList();
});

// --------------------------------------------------
// MONTHLY SUMMARY
// --------------------------------------------------
monthlyViewBtn.addEventListener('click', () => {
    monthlyModal.classList.remove('hidden');
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const monthly = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const catTotals = monthly.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {});
    const grandTotal = monthly.reduce((s, t) => s + t.amount, 0);
    monthlyContent.innerHTML = `
        <p style="font-weight:bold; margin-bottom:1rem;">Total Bulan Ini: ${formatRupiah(grandTotal)}</p>
        ${Object.entries(catTotals).map(([cat, val]) => `
            <div class="monthly-category">
                <strong>${escapeHtml(cat)}</strong>
                <span style="float:right;">${formatRupiah(val)}</span>
            </div>
        `).join('') || '<p style="color:var(--secondary)">Belum ada transaksi bulan ini.</p>'}
    `;
});

closeBtn.addEventListener('click', () => monthlyModal.classList.add('hidden'));
monthlyModal.addEventListener('click', e => {
    if (e.target === monthlyModal) monthlyModal.classList.add('hidden');
});

// --------------------------------------------------
// LIMIT SETTING
// --------------------------------------------------
limitInput.addEventListener('change', () => {
    spendingLimit = parseInt(limitInput.value) || 0;
    saveData();
    renderBalance();
});