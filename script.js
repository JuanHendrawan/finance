// script.js

// --- STRUKTUR KATEGORI BARU ---
const incomeCategories = [
    {
        main: "Pribadi",
        sub: ["Gaji / Upah Kerja", "Bonus & Tunjangan", "Uang Lembur", "THR", "Hadiah / Uang Pemberian", "Uang Kembali / Refund", "Investasi / Dividen", "Hasil Jual Barang Pribadi", "Pendapatan Sewa", "Lain-lain"]
    },
    {
        main: "Bisnis",
        sub: ["Penjualan Produk / Barang", "Penjualan Jasa / Proyek", "Pendapatan Retainer / Langganan", "Pendapatan Iklan / Sponsorship", "Pendapatan Komisi / Affiliate", "Investasi Masuk / Modal Tambahan", "Pendapatan Bunga Tabungan", "Pendapatan Piutang / Tagihan Dibayar"]
    }
];

const expenseCategories = [
    {
        main: "Kebutuhan Pribadi / Rumah Tangga",
        sub: ["Makanan & Minuman", "Belanja Harian", "Sewa Rumah / Kontrakan / Kos", "Listrik, Air, Gas", "Internet & Telepon", "Kebersihan / Laundry", "Perabotan & Alat Rumah Tangga", "Perawatan Rumah"]
    },
    {
        main: "Transportasi",
        sub: ["Bensin / Solar", "Parkir", "Tol", "Servis & Perawatan Kendaraan", "Pajak Kendaraan", "Transportasi Online (Gojek, Grab, dsb.)", "Tiket & Perjalanan"]
    },
    {
        main: "Kebutuhan Finansial",
        sub: ["Cicilan", "Kartu Kredit / PayLater", "Tabungan", "Investasi", "Asuransi", "Donasi / Sedekah / Zakat", "Pajak"]
    },
    {
        main: "Pekerjaan / Bisnis",
        sub: ["Perlengkapan Kerja", "Biaya Kantor / Studio", "Gaji / Upah Karyawan", "Transportasi Bisnis", "Bahan Baku / Stok Barang", "Pengiriman & Logistik", "Iklan / Marketing", "Langganan SaaS (Canva, ChatGPT, dsb.)", "Pajak Bisnis / Perizinan"]
    },
    {
        main: "Kesehatan & Kebugaran",
        sub: ["Obat & Vitamin", "Dokter / Rumah Sakit", "Asuransi Kesehatan", "Gym / Olahraga", "Perawatan Diri (spa, pijat, terapi)"]
    },
    {
        main: "Pendidikan & Pengembangan Diri",
        sub: ["Buku", "Kursus / Pelatihan", "Seminar / Webinar", "Langganan Edukasi"]
    },
    {
        main: "Hiburan & Gaya Hidup",
        sub: ["Langganan Streaming (Netflix, Spotify, dsb.)", "Hobi", "Jalan-jalan / Liburan", "Belanja Fashion", "Makan di Luar / Kafe", "Hadiah untuk Orang Lain"]
    },
    {
        main: "Keluarga & Sosial",
        sub: ["Uang Saku / Tunjangan Keluarga", "Uang untuk Orang Tua", "Ulang Tahun / Pernikahan", "Kegiatan Sosial / Komunitas"]
    },
    {
        main: "Lain-lain",
        sub: ["Biaya Tak Terduga", "Kerugian / Kehilangan", "Pembayaran Gagal / Koreksi Data"]
    }
];
// --- AKHIR STRUKTUR KATEGORI ---


// Global variables
let currentUser = null;
let transactions = [];
let budgets = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    const savedUser = localStorage.getItem('currentUser');

    if (document.getElementById('app')) {
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            loadSavedData();
        } else {
            window.location.href = 'index.html';
        }
    } else if (document.getElementById('authModal')) {
        if (savedUser) {
            window.location.href = 'dashboard.html';
        }
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
        document.getElementById('registerForm').addEventListener('submit', handleRegister);
    }
    
    // Event listeners for transaction form
    if (document.getElementById('transactionForm')) {
        document.getElementById('transactionForm').addEventListener('submit', addTransaction);
        document.getElementById('transactionDate').valueAsDate = new Date();
        document.getElementById('transactionType').addEventListener('change', populateMainCategoryOptions);
        document.getElementById('transactionMainCategory').addEventListener('change', () => populateSubCategoryOptions());
    }
    // Event listeners for budget form
    if (document.getElementById('budgetForm')) {
        document.getElementById('budgetForm').addEventListener('submit', addBudget);
        document.getElementById('budgetMainCategory').addEventListener('change', () => populateSubCategoryOptions('budget'));
    }
});

// --- FUNGSI BARU UNTUK DROPDOWN DINAMIS ---
function populateMainCategoryOptions() {
    const type = document.getElementById('transactionType').value;
    const mainCategorySelect = document.getElementById('transactionMainCategory');
    const subCategorySelect = document.getElementById('transactionSubCategory');
    
    const categories = (type === 'income') ? incomeCategories : expenseCategories;
    
    mainCategorySelect.innerHTML = '<option value="" disabled selected>Pilih kategori utama</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.main;
        option.textContent = cat.main;
        mainCategorySelect.appendChild(option);
    });

    subCategorySelect.innerHTML = '<option value="" disabled selected>Pilih sub-kategori</option>';
    subCategorySelect.disabled = true;
}

function populateSubCategoryOptions(formType = 'transaction') {
    const mainCategorySelectId = formType === 'transaction' ? 'transactionMainCategory' : 'budgetMainCategory';
    const subCategorySelectId = formType === 'transaction' ? 'transactionSubCategory' : 'budgetSubCategory';
    const type = formType === 'transaction' ? document.getElementById('transactionType').value : 'expense';

    const mainCategorySelect = document.getElementById(mainCategorySelectId);
    const subCategorySelect = document.getElementById(subCategorySelectId);
    const selectedMain = mainCategorySelect.value;
    
    const categories = (type === 'income') ? incomeCategories : expenseCategories;
    const selectedCategoryData = categories.find(cat => cat.main === selectedMain);

    subCategorySelect.innerHTML = '<option value="" disabled selected>Pilih sub-kategori</option>';
    if (selectedCategoryData) {
        selectedCategoryData.sub.forEach(subCat => {
            const option = document.createElement('option');
            option.value = subCat;
            option.textContent = subCat;
            subCategorySelect.appendChild(option);
        });
        subCategorySelect.disabled = false;
    } else {
        subCategorySelect.disabled = true;
    }
}

// Authentication Functions (Sama seperti sebelumnya, tidak ada perubahan)
function handleLogin(e) { e.preventDefault(); const email = document.getElementById('loginEmail').value; const password = document.getElementById('loginPassword').value; const users = JSON.parse(localStorage.getItem('users') || '[]'); const user = users.find(u => u.email === email && u.password === password); if (user) { currentUser = user; localStorage.setItem('currentUser', JSON.stringify(user)); window.location.href = 'dashboard.html'; } else { alert('Invalid email or password!'); } }
function handleRegister(e) { e.preventDefault(); const name = document.getElementById('registerName').value; const email = document.getElementById('registerEmail').value; const password = document.getElementById('registerPassword').value; const confirmPassword = document.getElementById('confirmPassword').value; if (password !== confirmPassword) { alert('Passwords do not match!'); return; } const users = JSON.parse(localStorage.getItem('users') || '[]'); if (users.some(u => u.email === email)) { alert('Email already registered!'); return; } const newUser = { name, email, password }; users.push(newUser); localStorage.setItem('users', JSON.stringify(users)); alert('Registration successful! Please login.'); switchAuthTab('login'); }
function logout() { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; }
function switchAuthTab(tab) { const loginBtn = document.querySelector('.tab-btn:nth-child(1)'); const registerBtn = document.querySelector('.tab-btn:nth-child(2)'); const loginForm = document.getElementById('loginForm'); const registerForm = document.getElementById('registerForm'); if (tab === 'login') { loginBtn.classList.add('active'); registerBtn.classList.remove('active'); loginForm.classList.remove('hidden'); registerForm.classList.add('hidden'); document.getElementById('authTitle').textContent = 'Login'; } else { loginBtn.classList.remove('active'); registerBtn.classList.add('active'); loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); document.getElementById('authTitle').textContent = 'Register'; } }

// App Functions
function updateUI() { if (currentUser) { const userNameEl = document.getElementById('userName'); if (userNameEl) userNameEl.textContent = currentUser.name; const profileNameEl = document.getElementById('profileName'); if(profileNameEl) profileNameEl.textContent = currentUser.name; const profileEmailEl = document.getElementById('profileEmail'); if(profileEmailEl) profileEmailEl.textContent = currentUser.email; } updateDashboard(); renderTransactions(); renderBudgets(); updateReports(); }
function handleChangePassword(e) { e.preventDefault(); const currentPassword = document.getElementById('currentPassword').value; const newPassword = document.getElementById('newPassword').value; const confirmNewPassword = document.getElementById('confirmNewPassword').value; if (newPassword !== confirmNewPassword) { alert('New passwords do not match!'); return; } const users = JSON.parse(localStorage.getItem('users') || '[]'); const userIndex = users.findIndex(u => u.email === currentUser.email); if (users[userIndex].password !== currentPassword) { alert('Current password is incorrect!'); return; } users[userIndex].password = newPassword; localStorage.setItem('users', JSON.stringify(users)); currentUser.password = newPassword; localStorage.setItem('currentUser', JSON.stringify(currentUser)); alert('Password changed successfully!'); document.getElementById('changePasswordForm').reset(); }

// Transaction Functions
function showAddTransactionModal() { document.getElementById('addTransactionModal').classList.remove('hidden'); document.getElementById('transactionForm').reset(); document.getElementById('transactionDate').valueAsDate = new Date(); populateMainCategoryOptions(); }
function closeAddTransactionModal() { document.getElementById('addTransactionModal').classList.add('hidden'); }
function addTransaction(e) {
    e.preventDefault();
    const transaction = {
        id: Date.now(),
        type: document.getElementById('transactionType').value,
        mainCategory: document.getElementById('transactionMainCategory').value,
        subCategory: document.getElementById('transactionSubCategory').value,
        amount: parseFloat(document.getElementById('transactionAmount').value),
        description: document.getElementById('transactionDescription').value,
        date: document.getElementById('transactionDate').value
    };
    transactions.unshift(transaction);
    saveData();
    renderTransactions();
    closeAddTransactionModal();
}
function deleteTransaction(id) { transactions = transactions.filter(t => t.id !== id); saveData(); renderTransactions(); }
function renderTransactions() {
    const tbody = document.getElementById('transactionsBody');
    if (!tbody) return;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    let filteredTransactions = transactions.filter(t => { const searchMatch = t.description.toLowerCase().includes(searchTerm) || t.subCategory.toLowerCase().includes(searchTerm) || t.mainCategory.toLowerCase().includes(searchTerm); const typeMatch = typeFilter === 'all' || t.type === typeFilter; return searchMatch && typeMatch; });
    tbody.innerHTML = filteredTransactions.map(t => `<tr><td>${t.date}</td><td>${t.subCategory} <br><small style="color: #888;">${t.mainCategory}</small></td><td>${t.description}</td><td class="${t.type}">${t.type === 'income' ? '+' : '-'} Rp${t.amount.toLocaleString('id-ID')}</td><td><button class="action-btn" onclick="deleteTransaction(${t.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}
function filterTransactions() { renderTransactions(); }

// Budget Functions
function showAddBudgetModal() {
    document.getElementById('addBudgetModal').classList.remove('hidden');
    document.getElementById('budgetForm').reset();
    const mainCategorySelect = document.getElementById('budgetMainCategory');
    mainCategorySelect.innerHTML = '<option value="" disabled selected>Pilih kategori utama</option>';
    expenseCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.main;
        option.textContent = cat.main;
        mainCategorySelect.appendChild(option);
    });
    const subCategorySelect = document.getElementById('budgetSubCategory');
    subCategorySelect.innerHTML = '<option value="" disabled selected>Pilih sub-kategori</option>';
    subCategorySelect.disabled = true;
}
function closeAddBudgetModal() { document.getElementById('addBudgetModal').classList.add('hidden'); }
function addBudget(e) {
    e.preventDefault();
    const budget = {
        id: Date.now(),
        mainCategory: document.getElementById('budgetMainCategory').value,
        subCategory: document.getElementById('budgetSubCategory').value,
        amount: parseFloat(document.getElementById('budgetAmount').value),
        period: document.getElementById('budgetPeriod').value,
    };
    budgets.push(budget);
    saveData();
    renderBudgets();
    closeAddBudgetModal();
}
function deleteBudget(id) { budgets = budgets.filter(b => b.id !== id); saveData(); renderBudgets(); }
function renderBudgets() {
    const budgetsGrid = document.getElementById('budgetsGrid');
    if(!budgetsGrid) return;
    budgetsGrid.innerHTML = budgets.map(budget => {
        const spent = transactions.filter(t => t.type === 'expense' && t.subCategory === budget.subCategory).reduce((sum, t) => sum + t.amount, 0);
        const progress = Math.min((spent / budget.amount) * 100, 100);
        const progressClass = progress > 80 ? 'high' : progress > 60 ? 'medium' : 'low';
        return `<div class="budget-card"><div class="budget-card-header"><div class="budget-card-category">${budget.subCategory} <br><small style="color: #888;">${budget.mainCategory}</small></div><button class="delete-budget" onclick="deleteBudget(${budget.id})"><i class="fas fa-trash"></i></button></div><div class="budget-card-amount">Rp${spent.toLocaleString('id-ID')} / Rp${budget.amount.toLocaleString('id-ID')}</div><div class="budget-card-progress"><div class="budget-card-progress-bar ${progressClass}" style="width: ${progress}%"></div></div><div class="budget-card-period">${budget.period === 'monthly' ? 'Monthly' : 'Weekly'}</div></div>`;
    }).join('');
}

// Dashboard & Reports
function updateDashboard() { const totalIncomeEl = document.getElementById('totalIncome'); if(!totalIncomeEl) return; const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0); const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0); const balance = totalIncome - totalExpenses; document.getElementById('totalIncome').textContent = `Rp${totalIncome.toLocaleString('id-ID')}`; document.getElementById('totalExpenses').textContent = `Rp${totalExpenses.toLocaleString('id-ID')}`; document.getElementById('balance').textContent = `Rp${balance.toLocaleString('id-ID')}`; const budgetList = document.getElementById('budgetList'); if(!budgetList) return; budgetList.innerHTML = budgets.map(budget => { const spent = transactions.filter(t => t.type === 'expense' && t.subCategory === budget.subCategory).reduce((sum, t) => sum + t.amount, 0); const progress = Math.min((spent / budget.amount) * 100, 100); const progressClass = progress > 80 ? 'high' : progress > 60 ? 'medium' : 'low'; return `<div class="budget-item"><div class="budget-header"><span class="budget-category">${budget.subCategory}</span><span class="budget-amount">Rp${spent.toLocaleString('id-ID')} / Rp${budget.amount.toLocaleString('id-ID')}</span></div><div class="progress-bar"><div class="progress ${progressClass}" style="width: ${progress}%"></div></div></div>`; }).join(''); }
function updateReports() {
    const incomeReport = document.getElementById('incomeReport');
    if(!incomeReport) return;
    const incomeData = transactions.filter(t => t.type === 'income').reduce((acc, curr) => { acc[curr.subCategory] = (acc[curr.subCategory] || 0) + curr.amount; return acc; }, {});
    incomeReport.innerHTML = Object.keys(incomeData).map(category => `<div class="report-item"><span>${category}</span><span>Rp${incomeData[category].toLocaleString('id-ID')}</span></div>`).join('') || "No income data.";
    
    const expenseReport = document.getElementById('expenseReport');
    const expenseData = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => { acc[curr.subCategory] = (acc[curr.subCategory] || 0) + curr.amount; return acc; }, {});
    expenseReport.innerHTML = Object.keys(expenseData).map(category => `<div class="report-item"><span>${category}</span><span>Rp${expenseData[category].toLocaleString('id-ID')}</span></div>`).join('') || "No expense data.";
}

// Data Persistence
function saveData() { if (currentUser) { localStorage.setItem(`transactions_${currentUser.email}`, JSON.stringify(transactions)); localStorage.setItem(`budgets_${currentUser.email}`, JSON.stringify(budgets)); } }
function loadSavedData() { if (currentUser) { const savedTransactions = localStorage.getItem(`transactions_${currentUser.email}`); const savedBudgets = localStorage.getItem(`budgets_${currentUser.email}`); transactions = savedTransactions ? JSON.parse(savedTransactions) : []; budgets = savedBudgets ? JSON.parse(savedBudgets) : []; updateUI(); } }