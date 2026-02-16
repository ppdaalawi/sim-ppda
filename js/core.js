/* js/core.js - REVISED */

let loaderInterval = null;
window.CURRENT_USER_ROLE = null; 

function showLoader(isLoading, text = "Memproses") {
    const loader = document.getElementById('app-loader');
    if (!loader) return;
    if (isLoading) {
        loader.classList.remove('hidden');
        if (!loader.querySelector('.loader-content')) {
            loader.innerHTML = `<div class="loader-content"><div class="spinner"></div><div class="loader-text" id="loader-text-display">Memproses</div></div>`;
        }
        startLoaderAnimation(text);
    } else {
        if (loaderInterval) { clearInterval(loaderInterval); loaderInterval = null; }
        loader.classList.add('hidden');
    }
}

function startLoaderAnimation(baseText) {
    const display = document.getElementById('loader-text-display');
    if (!display) return;
    if (loaderInterval) clearInterval(loaderInterval);
    let dots = 0;
    display.textContent = baseText;
    loaderInterval = setInterval(() => {
        dots++; if (dots > 3) dots = 0;
        display.textContent = baseText + '.'.repeat(dots) + ' '.repeat(3 - dots);
    }, 500);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span> <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showConfirm(message, callback) {
    const modal = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');
    if(!modal) { if(confirm(message)) callback(); return; }
    msgEl.textContent = message;
    modal.classList.add('active', 'confirm-modal-overlay'); 
    const close = () => {
        modal.classList.remove('active');
        yesBtn.onclick = null; noBtn.onclick = null; modal.onclick = null;
    };
    yesBtn.onclick = () => { close(); if (typeof callback === 'function') callback(); };
    noBtn.onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };
}

function logoutUser() {
    showConfirm("Apakah Anda yakin ingin keluar dari sistem?", () => {
        localStorage.removeItem('ppda_user');
        window.location.href = 'index.html';
    });
}

document.addEventListener('click', function(e) {
    if (e.target.closest('#btn-logout')) { logoutUser(); }
    if (e.target.classList.contains('close-modal')) {
        const targetId = e.target.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('active');
    }
    if (e.target.classList.contains('modal-overlay') && !e.target.classList.contains('confirm-modal-overlay')) {
        e.target.classList.remove('active');
    }
    if (e.target.id === 'sidebar-overlay') closeSidebar();
});

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const isLoginPage = (window.location.pathname.includes('index.html') || window.location.pathname === '/');
    
    if (isLoginPage && loginForm) {
        const toggleBtn = document.getElementById('toggle-password');
        const passInput = document.getElementById('password');
        if(toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passInput.setAttribute('type', type);
                toggleBtn.innerHTML = type === 'password' ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
            });
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const u = document.getElementById('username').value;
            const p = document.getElementById('password').value;
            const btnLogin = document.getElementById('btn-login');
            
            btnLogin.disabled = true;
            btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
            
            const res = await fetchData('login', { username: u, password: p });
            
            if (res.status === 'success') {
                showToast('Login Berhasil!', 'success');
                localStorage.setItem('ppda_user', JSON.stringify(res.data));
                btnLogin.innerHTML = '<i class="fa-solid fa-check"></i> Berhasil';
                btnLogin.style.background = 'var(--primary-light)';
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            } else {
                showToast(res.message || 'Login Gagal', 'error');
                btnLogin.disabled = false;
                btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Masuk';
            }
        });
    } else if (!isLoginPage) {
        initDashboard();
    }
});

async function initDashboard() {
    const userSession = localStorage.getItem('ppda_user');
    if (!userSession) { window.location.href = 'index.html'; return; }
    
    const user = JSON.parse(userSession);
    window.CURRENT_USER_ROLE = user.role; 

    const namaLengkap = user.nama || 'User';
    document.getElementById('user-name-display').textContent = namaLengkap;
    document.getElementById('user-avatar-display').textContent = namaLengkap.charAt(0).toUpperCase();
    
    const roleDisplay = document.getElementById('user-role-display');
    if (roleDisplay) {
        roleDisplay.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }

    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('sidebar');

    if (mobileToggle) {
        mobileToggle.onclick = () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('sidebar-active');
                document.getElementById('sidebar-overlay').classList.toggle('active');
            } else {
                sidebar.classList.toggle('sidebar-closed');
            }
        };
    }

    showLoader(true, "Memuat Menu");
    // Kirim role user ke API untuk filtering
    const res = await fetchData('get_menu', { role: user.role });
    showLoader(false);

    if (res.status === 'success') {
        renderSidebar(res.data);
        const contentArea = document.getElementById('content-area');
        const isEmpty = contentArea.innerText.includes('Memuat') || contentArea.innerText.trim() === '';
        
        if (isEmpty && res.data.length > 0) {
            const firstLink = document.querySelector('.nav-link');
            if(firstLink) firstLink.click();
        }
    }
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('sidebar-active');
    document.getElementById('sidebar-overlay').classList.remove('active');
}

function renderSidebar(menus) {
    const list = document.getElementById('sidebar-menu-list');
    list.innerHTML = '';
    menus.forEach(menu => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" data-url="${menu[2]}" data-label="${menu[1]}" data-type="${menu[6]}" data-target="${menu[7]}" class="nav-link"><i class="fa-solid ${menu[3]}"></i> ${menu[1]}</a>`;
        list.appendChild(li);
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const el = e.currentTarget;
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            el.classList.add('active');
            if (window.innerWidth <= 768) closeSidebar();
            const menuData = { 
                url: el.getAttribute('data-url'), label: el.getAttribute('data-label'), 
                source_type: el.getAttribute('data-type'), target_mode: el.getAttribute('data-target') 
            };
            handleMenuClick(menuData, false);
        });
    });
}

function handleMenuClick(menu, isFirstLoad) {
    const contentArea = document.getElementById('content-area');
    if (menu.source_type === 'external') {
        if (menu.target_mode === 'tab_new') window.open(menu.url, '_blank');
        else {
            showLoader(true, "Memuat Konten");
            contentArea.innerHTML = `<div style="height: 100%; width: 100%;"><iframe src="${menu.url}" frameborder="0" style="width: 100%; height: calc(100vh - 60px); border: none;"></iframe></div>`;
            document.title = menu.label + " - SIM PPDA";
            setTimeout(() => showLoader(false), 1500);
        }
    } else loadPage(menu.url, null, menu.label);
}

// --- BAGIAN PALING PENTING: FIX SCRIPT EXECUTION ---
async function loadPage(url, elementClick, pageTitle) {
    showLoader(true, "Memuat Halaman " + pageTitle);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('File tidak ditemukan');
        const htmlContent = await response.text();
        
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = htmlContent;
        
        // FIX: Eksekusi script di dalam HTML yang baru di-load
        const scripts = contentArea.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            // Copy attributes
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            // Copy content
            newScript.textContent = oldScript.textContent;
            // Replace old with new to trigger execution
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });

        if (pageTitle) document.title = pageTitle + " - SIM PPDA";
        
        // Trigger custom event jika diperlukan
        if(url.includes('settings.html')) {
            if(typeof initSettingsLogic === 'function') initSettingsLogic();
        }
    } catch (error) {
        document.getElementById('content-area').innerHTML = `<div class="card text-center"><h3>Error</h3><p>${error.message}</p></div>`;
    } finally { showLoader(false); }
}
