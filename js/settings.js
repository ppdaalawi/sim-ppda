/* js/settings.js - FINAL REVISED */

let cachedSettingsData = { users: [], menus: [] };
const AVAILABLE_ICONS = [ 'fa-home', 'fa-user', 'fa-users', 'fa-cog', 'fa-book', 'fa-graduation-cap', 'fa-chart-bar', 'fa-money-bill', 'fa-calendar', 'fa-envelope', 'fa-file-alt', 'fa-folder', 'fa-image', 'fa-video', 'fa-link', 'fa-lock', 'fa-mosque' ];
const HIDDEN_MENUS = ['pages/dashboard.html', 'pages/settings.html'];

function initSettingsLogic() { 
    checkRoleVisibility(); 
    loadSettingsData(); 
    initIconPicker(); 
    bindSettingsForms(); 
    bindSettingsEvents(); 
}

function checkRoleVisibility() {
    const role = window.CURRENT_USER_ROLE;
    // Default: Sembunyikan tombol Tambah
    document.querySelectorAll('.btn-add-user, .btn-add-menu').forEach(btn => btn.style.display = 'none');

    // PPDB: Hanya Admin
    const ppdbToggle = document.getElementById('ppdb-toggle');
    if (role !== 'admin') {
        if(ppdbToggle) {
            ppdbToggle.disabled = true;
            ppdbToggle.style.cursor = 'not-allowed';
            ppdbToggle.style.opacity = '0.5';
        }
    } else {
        if(ppdbToggle) ppdbToggle.disabled = false;
        // Admin boleh tambah user & menu
        document.querySelectorAll('.btn-add-user, .btn-add-menu').forEach(btn => btn.style.display = 'inline-flex');
    }
    
    // Staf: Tidak boleh CRUD di Settings, jadi tombol tambah tetap hidden (sudah di default)
}

function bindSettingsEvents() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    contentArea.onclick = (e) => {
        if (e.target.closest('.btn-add-user')) {
            document.getElementById('form-user').reset();
            document.getElementById('u-id').value = '';
            document.getElementById('title-user').innerText = 'Tambah User';
            document.getElementById('modal-user').classList.add('active');
        }
        if (e.target.closest('.btn-add-menu')) {
            document.getElementById('form-menu').reset();
            document.getElementById('m-id').value = '';
            document.getElementById('title-menu').innerText = 'Tambah Menu';
            document.getElementById('icon-preview-display').className = ''; 
            document.getElementById('icon-text-display').innerText = 'Pilih...';
            document.getElementById('m-sort').value = '1';
            resetSegmentButtons('internal');
            toggleSourceUI('internal'); 
            populateGithubFiles(null); 
            document.getElementById('modal-menu').classList.add('active');
        }
        
        if (e.target.closest('.btn-edit-row')) {
            // Hanya Admin yang bisa Edit
            if (window.CURRENT_USER_ROLE !== 'admin') {
                showToast("Anda tidak memiliki akses untuk mengedit data.", "error");
                return;
            }
            const btn = e.target.closest('.btn-edit-row');
            openEditModal(btn.getAttribute('data-sheet'), btn.getAttribute('data-id'));
        }
        
        if (e.target.closest('.btn-delete-row')) {
            // Hanya Admin yang bisa Hapus
            if (window.CURRENT_USER_ROLE !== 'admin') {
                showToast("Anda tidak memiliki akses untuk menghapus data.", "error");
                return;
            }
            const btn = e.target.closest('.btn-delete-row');
            showConfirm("Yakin hapus data ini?", () => { deleteSettingsRow(btn.getAttribute('data-sheet'), btn.getAttribute('data-id')); });
        }

        if (e.target.closest('#btn-pick-icon')) { e.preventDefault(); document.getElementById('modal-icon-picker').classList.add('active'); }
        if (e.target.closest('.icon-item')) {
            const iconItem = e.target.closest('.icon-item');
            document.getElementById('m-icon').value = iconItem.getAttribute('data-icon');
            document.getElementById('icon-preview-display').className = `fa-solid ${iconItem.getAttribute('data-icon')}`;
            document.getElementById('icon-text-display').innerText = iconItem.getAttribute('data-icon');
            document.getElementById('modal-icon-picker').classList.remove('active');
        }
    };
}

function resetSegmentButtons(value) {
    document.querySelectorAll('.segment-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-value') === value);
    });
}

function bindSettingsForms() {
    const formUser = document.getElementById('form-user');
    if(formUser) {
        const newFormUser = formUser.cloneNode(true); formUser.parentNode.replaceChild(newFormUser, formUser);
        newFormUser.addEventListener('submit', async (e) => {
            e.preventDefault(); showLoader(true, "Menyimpan");
            const id = document.getElementById('u-id').value;
            const rowData = [document.getElementById('u-username').value, document.getElementById('u-password').value, document.getElementById('u-role').value, document.getElementById('u-nama').value, document.getElementById('u-status').value];
            let res = id ? await fetchData('edit_data', { sheetName: 'users', id: id, rowData: rowData }) : await fetchData('add_data', { sheetName: 'users', rowData: rowData });
            showLoader(false);
            if(res.status === 'success') { document.getElementById('modal-user').classList.remove('active'); showToast('User Disimpan'); loadSettingsData(); }
        });
    }

    const formMenu = document.getElementById('form-menu');
    if(formMenu) {
        const newFormMenu = formMenu.cloneNode(true); formMenu.parentNode.replaceChild(newFormMenu, formMenu);

        newFormMenu.querySelectorAll('.segment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                newFormMenu.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                toggleSourceUI(btn.getAttribute('data-value'));
            });
        });

        newFormMenu.addEventListener('submit', async (e) => {
            e.preventDefault(); showLoader(true, "Menyimpan");
            const id = document.getElementById('m-id').value;
            const activeBtn = document.querySelector('.segment-btn.active');
            const sourceType = activeBtn ? activeBtn.getAttribute('data-value') : 'internal';
            let url = sourceType === 'internal' ? document.getElementById('m-file-list').value : document.getElementById('m-url-manual').value;
            let targetMode = sourceType === 'internal' ? 'same' : document.getElementById('m-target').value;
            const sortOrder = parseInt(document.getElementById('m-sort').value) || 0;

            const rowData = [document.getElementById('m-label').value, url, document.getElementById('m-icon').value, document.getElementById('m-access').value, document.getElementById('m-status').value, sourceType, targetMode, sortOrder];
            
            let res = id ? await fetchData('edit_data', { sheetName: 'menus', id: id, rowData: rowData }) : await fetchData('add_data', { sheetName: 'menus', rowData: rowData });
            showLoader(false);
            if(res.status === 'success') { 
                document.getElementById('modal-menu').classList.remove('active'); 
                showToast('Menu Disimpan'); 
                initDashboard(); 
                loadSettingsData(); 
            }
        });
    }
    
    const ppdbToggle = document.getElementById('ppdb-toggle');
    if(ppdbToggle) {
        ppdbToggle.addEventListener('change', async function() {
            if (window.CURRENT_USER_ROLE !== 'admin') {
                this.checked = !this.checked;
                showToast("Hanya Admin yang bisa mengubah status ini.", "error");
                return;
            }

            const newState = this.checked;
            const statusText = newState ? "Membuka" : "Menutup";
            
            this.checked = !newState;

            showConfirm(`Anda yakin ingin ${statusText} pendaftaran PPDB?`, async () => {
                showLoader(true, "Update PPDB"); 
                const newStatus = newState ? 'OPEN' : 'CLOSED'; 
                const res = await fetchData('update_settings', { settings: { 'status_ppdb': newStatus } }); 
                showLoader(false); 
                if(res.status === 'success') {
                    this.checked = newState; 
                    document.getElementById('ppdb-text').innerText = newStatus === 'OPEN' ? "Dibuka" : "Ditutup"; 
                    showToast('Status PPDB diperbarui');
                }
            });
        });
    }
    
    const btnRefresh = document.getElementById('btn-refresh-files');
    if(btnRefresh) { 
        const newRefresh = btnRefresh.cloneNode(true); btnRefresh.parentNode.replaceChild(newRefresh, btnRefresh); 
        newRefresh.addEventListener('click', async (e) => { 
            e.preventDefault(); 
            newRefresh.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; 
            const editId = document.getElementById('m-id').value;
            await populateGithubFiles(editId); 
            newRefresh.innerHTML = '<i class="fa-solid fa-sync-alt"></i>'; 
        }); 
    }
}

function toggleSourceUI(type) {
    const divInternal = document.getElementById('div-internal'); 
    const divExternal = document.getElementById('div-external'); 
    const selectTarget = document.getElementById('m-target').parentElement; 
    if (type === 'internal') { divInternal.style.display = 'block'; divExternal.style.display = 'none'; selectTarget.style.display = 'none'; } 
    else { divInternal.style.display = 'none'; divExternal.style.display = 'block'; selectTarget.style.display = 'block'; }
}

async function populateGithubFiles(editMenuId) { 
    const select = document.getElementById('m-file-list'); 
    const files = await fetchGithubFiles(); 
    const usedUrls = cachedSettingsData.menus.map(m => m[2]);
    
    select.innerHTML = ''; 
    if(files.length === 0) { select.innerHTML = '<option value="">Gagal Memuat</option>'; return; }

    files.forEach(file => { 
        const fullPath = `pages/${file}`;
        const isUsed = usedUrls.includes(fullPath);
        const isEditingThis = editMenuId && cachedSettingsData.menus.find(m => m[0] == editMenuId && m[2] === fullPath);

        if (!isUsed || isEditingThis) {
            const opt = document.createElement('option'); 
            opt.value = fullPath; 
            opt.innerText = file; 
            select.appendChild(opt); 
        }
    });
    
    if (editMenuId) {
        const currentMenu = cachedSettingsData.menus.find(m => m[0] == editMenuId);
        if(currentMenu) select.value = currentMenu[2];
    }
}

function initIconPicker() { 
    const pickerContainer = document.getElementById('icon-picker-grid'); 
    if(!pickerContainer) return; 
    pickerContainer.innerHTML = ''; 
    AVAILABLE_ICONS.forEach(icon => { 
        const div = document.createElement('div'); 
        div.className = 'icon-item'; 
        div.setAttribute('data-icon', icon); 
        div.innerHTML = `<i class="fa-solid ${icon}"></i>`; 
        pickerContainer.appendChild(div); 
    }); 
}

async function loadSettingsData() {
    showLoader(true, "Memuat Data");
    
    // Ambil ID User Login untuk proteksi hapus akun sendiri
    const userSession = localStorage.getItem('ppda_user');
    const currentUser = userSession ? JSON.parse(userSession) : null;
    const currentUserId = currentUser ? currentUser.id : null;

    await Promise.all([
        (async () => { 
            const resU = await fetchData('get_data', { sheetName: 'users' }); 
            if(resU.status === 'success') { 
                cachedSettingsData.users = resU.data; 
                const tbodyU = document.getElementById('body-user'); 
                if(tbodyU) { 
                    tbodyU.innerHTML = ''; 
                    for(let i=0; i<resU.data.length; i++) { 
                        const r = resU.data[i]; 
                        let actionBtns = '';
                        
                        // Logika Tombol Aksi
                        if (window.CURRENT_USER_ROLE === 'admin') {
                            // Jika ID user di tabel SAMA DENGAN ID login saat ini -> Sembunyikan tombol Hapus
                            const isSelf = (r[0] === currentUserId);
                            const deleteBtn = isSelf ? 
                                `<button class="btn-icon btn-red" disabled style="opacity:0.3; cursor:no-drop;"><i class="fa-solid fa-trash"></i></button>` : 
                                `<button class="btn-icon btn-red btn-delete-row" data-sheet="users" data-id="${r[0]}"><i class="fa-solid fa-trash"></i></button>`;

                            actionBtns = `
                                <button class="btn-icon btn-orange btn-edit-row" data-sheet="users" data-id="${r[0]}"><i class="fa-solid fa-pen"></i></button>
                                ${deleteBtn}`;
                        } else {
                            // Staf/Guru tidak ada tombol
                            actionBtns = `<span style="font-size:10px; color:#999;">-</span>`;
                        }

                        tbodyU.innerHTML += `<tr>
                            <td><b>${r[1]}</b><br><small style="color:var(--text-grey)">${r[4]}</small></td>
                            <td>${r[3]}</td>
                            <td style="text-align:right">${actionBtns}</td>
                        </tr>`; 
                    } 
                } 
            } 
        })(),
        (async () => { 
            const resM = await fetchData('get_data', { sheetName: 'menus' }); 
            if(resM.status === 'success') { 
                cachedSettingsData.menus = resM.data; 
                const tbodyM = document.getElementById('body-menu'); 
                if(tbodyM) { 
                    tbodyM.innerHTML = ''; 
                    for(let i=0; i<resM.data.length; i++) { 
                        const r = resM.data[i]; 
                        if (HIDDEN_MENUS.includes(r[2])) continue; 

                        let actionBtns = '';
                        // Hanya Admin yang bisa Edit/Hapus Menu
                        if (window.CURRENT_USER_ROLE === 'admin') {
                            actionBtns = `
                                <button class="btn-icon btn-orange btn-edit-row" data-sheet="menus" data-id="${r[0]}"><i class="fa-solid fa-pen"></i></button>
                                <button class="btn-icon btn-red btn-delete-row" data-sheet="menus" data-id="${r[0]}"><i class="fa-solid fa-trash"></i></button>`;
                        } else {
                            // Staf/Guru tidak ada tombol
                            actionBtns = `<span style="font-size:10px; color:#999;">-</span>`;
                        }

                        const order = r[8] || 0;
                        tbodyM.innerHTML += `<tr>
                            <td><i class="fa-solid ${r[3]}" style="margin-right:5px; color:var(--primary-main)"></i> ${r[1]}</td>
                            <td style="text-align:center">${order}</td>
                            <td style="text-align:right">${actionBtns}</td>
                        </tr>`; 
                    } 
                } 
            } 
        })(),
        (async () => { 
            const resS = await fetchData('get_data', { sheetName: 'app_settings' }); 
            if(resS.status === 'success') { 
                const text = document.getElementById('ppdb-text'); 
                const toggle = document.getElementById('ppdb-toggle'); 
                for(let i=0; i<resS.data.length; i++) { 
                    const row = resS.data[i];
                    if(row.key === 'status_ppdb') { 
                        const status = row.value; 
                        const isOpen = (status === 'OPEN'); 
                        if(toggle) { toggle.checked = isOpen; text.innerText = isOpen ? "Dibuka" : "Ditutup"; } break; 
                    } 
                } 
            } 
        })()
    ]);
    showLoader(false);
}

async function deleteSettingsRow(sheet, id) { 
    showLoader(true, "Menghapus"); 
    const res = await fetchData('delete_data', { sheetName: sheet, id: id }); 
    showLoader(false); 
    if(res.status === 'success') { 
        showToast('Data berhasil dihapus'); 
        loadSettingsData(); 
        if(sheet === 'menus') initDashboard(); 
    } 
}

function openEditModal(sheet, id) {
    let dataRow = null;
    if(sheet === 'users') { 
        dataRow = cachedSettingsData.users.find(r => r[0] == id); if(!dataRow) return; 
        document.getElementById('u-id').value = dataRow[0]; 
        document.getElementById('u-username').value = dataRow[1]; 
        document.getElementById('u-password').value = ''; 
        document.getElementById('u-nama').value = dataRow[4]; 
        document.getElementById('u-role').value = dataRow[3]; 
        document.getElementById('u-status').value = dataRow[5]; 
        document.getElementById('title-user').innerText = 'Edit User'; 
        document.getElementById('modal-user').classList.add('active'); 
    } 
    else if(sheet === 'menus') { 
        dataRow = cachedSettingsData.menus.find(r => r[0] == id); if(!dataRow) return; 
        document.getElementById('m-id').value = dataRow[0]; 
        document.getElementById('m-label').value = dataRow[1]; 
        document.getElementById('m-icon').value = dataRow[3]; 
        document.getElementById('icon-preview-display').className = `fa-solid ${dataRow[3]}`;
        document.getElementById('icon-text-display').innerText = dataRow[3];
        document.getElementById('m-access').value = dataRow[4]; 
        document.getElementById('m-status').value = dataRow[5];
        document.getElementById('m-sort').value = dataRow[8] || 0;

        const sourceType = dataRow[6] || 'internal';
        resetSegmentButtons(sourceType);
        toggleSourceUI(sourceType);
        if (sourceType === 'internal') { populateGithubFiles(id); } 
        else { document.getElementById('m-url-manual').value = dataRow[2]; document.getElementById('m-target').value = dataRow[7] || 'tab_new'; } 
        document.getElementById('title-menu').innerText = 'Edit Menu'; 
        document.getElementById('modal-menu').classList.add('active'); 
    }
}