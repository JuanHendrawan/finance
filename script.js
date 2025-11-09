// script.js - FinanceTracker with Firebase

// Firebase configuration - GANTI DENGAN KONFIGURASI ANDA SENDIRI
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
} catch (error) {
    console.log("Firebase already initialized");
}

const auth = firebase.auth();
const db = firebase.firestore();

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
    // Check Firebase auth state
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in
            currentUser = {
                uid: user.uid,
                email: user.email,
                name: user.displayName || user.email.split('@')[0]
            };
            
            await loadUserData();
            updateUI();
            
            // Redirect from login page to dashboard
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                window.location.href = 'dashboard.html';
            }
        } else {
            // User is signed out
            currentUser = null;
            
            // Redirect to login if not on auth page
            if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
                window.location.href = 'index.html';
            }
        }
    });

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
    
    // Event listener for change password form
    if (document.getElementById('changePasswordForm')) {
        document.getElementById('changePasswordForm').addEventListener('submit', handleChangePassword);
    }
});

// --- FIREBASE AUTHENTICATION FUNCTIONS ---
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log("User logged in:", userCredential.user);
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        // Create user document in Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Registration successful!');
        switchAuthTab('login');
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

async function logout() {
    try {
        await auth.signOut();
        currentUser = null;
        transactions = [];
        budgets = [];
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function switchAuthTab(tab) {
    const loginBtn = document.querySelector('.tab-btn:nth-child(1)');
    const registerBtn = document.querySelector('.tab-btn:nth-child(2)');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (tab === 'login') {
        loginBtn.classList.add('active');
        registerBtn.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        document.getElementById('authTitle').textContent = 'Login';
    } else {
        loginBtn.classList.remove('active');
        registerBtn.classList.add('active');
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        document.getElementById('authTitle').textContent = 'Register';
    }
}

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

// --- FIREBASE DATA FUNCTIONS ---
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        // Load transactions
        const transactionsSnapshot = await db.collection('users')
            .doc(currentUser.uid)
            .collection('transactions')
            .orderBy('date', 'desc')
            .get();
        
        transactions = transactionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Load budgets
        const budgetsSnapshot = await db.collection('users')
            .doc(currentUser.uid)
            .collection('budgets')
            .get();
        
        budgets = budgetsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
    } catch (error) {
        console.error("Error loading user data:", error);
    }
}

async function saveTransaction(transaction) {
    if (!currentUser) return null;
    
    try {
        const docRef = await db.collection('users')
            .doc(currentUser.uid)
            .collection('transactions')
            .add(transaction);
        
        return docRef.id;
    } catch (error) {
        console.error("Error saving transaction:", error);
        return null;
    }
}

async function deleteTransactionFromFirebase(transactionId) {
    if (!currentUser) return;
    
    try {
        await db.collection('users')
            .doc(currentUser.uid)
            .collection('transactions')
            .doc(transactionId)
            .delete();
    } catch (error) {
        console.error("Error deleting transaction:", error);
    }
}

async function saveBudget(budget) {
    if (!currentUser) return null;
    
    try {
        const docRef = await db.collection('users')
            .doc(currentUser.uid)
            .collection('budgets')
            .add(budget);
        
        return docRef.id;
    } catch (error) {
        console.error("Error saving budget:", error);
        return null;
    }
}

async function deleteBudgetFromFirebase(budgetId) {
    if (!currentUser) return;
    
    try {
        await db.collection('users')
            .doc(currentUser.uid)
            .collection('budgets')
            .doc(budgetId)
            .delete();
    } catch (error) {
        console.error("Error deleting budget:", error);
    }
}

// --- APP FUNCTIONS ---
function updateUI() {
    if (currentUser) {
        const userNameEl = document.getElementById('userName');
        if (userNameEl) userNameEl.textContent = currentUser.name;
        
        const profileNameEl = document.getElementById('profileName');
        if(profileNameEl) profileNameEl.textContent = currentUser.name;
        
        const profileEmailEl = document.getElementById('profileEmail');
        if(profileEmailEl) profileEmailEl.textContent = currentUser.email;
    }
    
    updateDashboard();
    renderTransactions();
    renderBudgets();
    updateReports();
}

async function handleChangePassword(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmNewPassword) {
        alert('New passwords do not match!');
        return;
    }
    
    try {
        // Re-authenticate user
        const user = auth.currentUser;
        const credential = firebase.auth.EmailAuthProvider.credential(
            user.email, 
            currentPassword
        );
        
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPassword);
        
        alert('Password changed successfully!');
        document.getElementById('changePasswordForm').reset();
    } catch (error) {
        alert('Error changing password: ' + error.message);
    }
}

// --- TRANSACTION FUNCTIONS ---
function showAddTransactionModal() {
    document.getElementById('addTransactionModal').classList.remove('hidden');
    document.getElementById('transactionForm').reset();
    document.getElementById('transactionDate').valueAsDate = new Date();
    populateMainCategoryOptions();
}

function closeAddTransactionModal() {
    document.getElementById('addTransactionModal').classList.add('hidden');
}

async function addTransaction(e) {
    e.preventDefault();
    
    const transaction = {
        type: document.getElementById('transactionType').value,
        mainCategory: document.getElementById('transactionMainCategory').value,
        subCategory: document.getElementById('transactionSubCategory').value,
        amount: parseFloat(document.getElementById('transactionAmount').value),
        description: document.getElementById('transactionDescription').value,
        date: document.getElementById('transactionDate').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const transactionId = await saveTransaction(transaction);
    
    if (transactionId) {
        transactions.unshift({ id: transactionId, ...transaction });
        updateUI();
        closeAddTransactionModal();
    } else {
        alert('Error saving transaction. Please try again.');
    }
}

async function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        await deleteTransactionFromFirebase(id);
        transactions = transactions.filter(t => t.id !== id);
        updateUI();
    }
}

function renderTransactions() {
    const tbody = document.getElementById('transactionsBody');
    if (!tbody) return;
    
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('typeFilter')?.value || 'all';
    
    let filteredTransactions = transactions.filter(t => {
        const searchMatch = 
            t.description.toLowerCase().includes(searchTerm) || 
            t.subCategory.toLowerCase().includes(searchTerm) || 
            t.mainCategory.toLowerCase().includes(searchTerm);
        const typeMatch = typeFilter === 'all' || t.type === typeFilter;
        return searchMatch && typeMatch;
    });
    
    tbody.innerHTML = filteredTransactions.map(t => `
        <tr>
            <td>${t.date}</td>
            <td>${t.subCategory} <br><small style="color: #888;">${t.mainCategory}</small></td>
            <td>${t.description}</td>
            <td class="${t.type}">${t.type === 'income' ? '+' : '-'} Rp${t.amount.toLocaleString('id-ID')}</td>
            <td><button class="action-btn" onclick="deleteTransaction('${t.id}')"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

function filterTransactions() {
    renderTransactions();
}

// --- BUDGET FUNCTIONS ---
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

function closeAddBudgetModal() {
    document.getElementById('addBudgetModal').classList.add('hidden');
}

async function addBudget(e) {
    e.preventDefault();
    
    const budget = {
        mainCategory: document.getElementById('budgetMainCategory').value,
        subCategory: document.getElementById('budgetSubCategory').value,
        amount: parseFloat(document.getElementById('budgetAmount').value),
        period: document.getElementById('budgetPeriod').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const budgetId = await saveBudget(budget);
    
    if (budgetId) {
        budgets.push({ id: budgetId, ...budget });
        updateUI();
        closeAddBudgetModal();
    } else {
        alert('Error saving budget. Please try again.');
    }
}

async function deleteBudget(id) {
    if (confirm('Are you sure you want to delete this budget?')) {
        await deleteBudgetFromFirebase(id);
        budgets = budgets.filter(b => b.id !== id);
        updateUI();
    }
}

function renderBudgets() {
    const budgetsGrid = document.getElementById('budgetsGrid');
    if(!budgetsGrid) return;
    
    budgetsGrid.innerHTML = budgets.map(budget => {
        const spent = transactions
            .filter(t => t.type === 'expense' && t.subCategory === budget.subCategory)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const progress = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
        const progressClass = progress > 80 ? 'high' : progress > 60 ? 'medium' : 'low';
        
        return `
            <div class="budget-card">
                <div class="budget-card-header">
                    <div class="budget-card-category">${budget.subCategory} <br><small style="color: #888;">${budget.mainCategory}</small></div>
                    <button class="delete-budget" onclick="deleteBudget('${budget.id}')"><i class="fas fa-trash"></i></button>
                </div>
                <div class="budget-card-amount">Rp${spent.toLocaleString('id-ID')} / Rp${budget.amount.toLocaleString('id-ID')}</div>
                <div class="budget-card-progress">
                    <div class="budget-card-progress-bar ${progressClass}" style="width: ${progress}%"></div>
                </div>
                <div class="budget-card-period">${budget.period === 'monthly' ? 'Monthly' : 'Weekly'}</div>
            </div>
        `;
    }).join('');
}

// --- DASHBOARD & REPORTS FUNCTIONS ---
function updateDashboard() {
    // Update summary cards
    const totalIncomeEl = document.getElementById('totalIncome');
    if(!totalIncomeEl) return;
    
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpenses;
    
    document.getElementById('totalIncome').textContent = `Rp${totalIncome.toLocaleString('id-ID')}`;
    document.getElementById('totalExpenses').textContent = `Rp${totalExpenses.toLocaleString('id-ID')}`;
    document.getElementById('balance').textContent = `Rp${balance.toLocaleString('id-ID')}`;
    
    // Update budget list
    const budgetList = document.getElementById('budgetList');
    if(!budgetList) return;
    
    budgetList.innerHTML = budgets.map(budget => {
        const spent = transactions
            .filter(t => t.type === 'expense' && t.subCategory === budget.subCategory)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const progress = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
        const progressClass = progress > 80 ? 'high' : progress > 60 ? 'medium' : 'low';
        
        return `
            <div class="budget-item">
                <div class="budget-header">
                    <span class="budget-category">${budget.subCategory}</span>
                    <span class="budget-amount">Rp${spent.toLocaleString('id-ID')} / Rp${budget.amount.toLocaleString('id-ID')}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress ${progressClass}" style="width: ${progress}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function updateReports() {
    const incomeReport = document.getElementById('incomeReport');
    if(!incomeReport) return;
    
    const incomeData = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => {
            acc[curr.subCategory] = (acc[curr.subCategory] || 0) + curr.amount;
            return acc;
        }, {});
    
    incomeReport.innerHTML = Object.keys(incomeData).map(category => `
        <div class="report-item">
            <span>${category}</span>
            <span>Rp${incomeData[category].toLocaleString('id-ID')}</span>
        </div>
    `).join('') || "No income data.";
    
    const expenseReport = document.getElementById('expenseReport');
    if(!expenseReport) return;
    
    const expenseData = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => {
            acc[curr.subCategory] = (acc[curr.subCategory] || 0) + curr.amount;
            return acc;
        }, {});
    
    expenseReport.innerHTML = Object.keys(expenseData).map(category => `
        <div class="report-item">
            <span>${category}</span>
            <span>Rp${expenseData[category].toLocaleString('id-ID')}</span>
        </div>
    `).join('') || "No expense data.";
}

// --- EXPORT FUNCTION ---
function exportReport() {
    const data = {
        user: currentUser,
        transactions: transactions,
        budgets: budgets,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `finance-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}
