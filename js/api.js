/* js/api.js */

async function fetchData(action, payload = {}) {
    try {
        let result;
        if (typeof window.supabaseClient === 'undefined') throw new Error("Supabase Client belum siap.");

        switch (action) {
            case 'login': result = await handleLogin(payload); break;
            case 'get_menu': result = await handleGetMenu(payload); break;
            case 'get_data': result = await handleGetData(payload); break;
            case 'add_data': result = await handleAddData(payload); break;
            case 'edit_data': result = await handleEditData(payload); break;
            case 'delete_data': result = await handleDeleteData(payload); break;
            case 'update_settings': result = await handleUpdateSettings(payload); break;
            default: result = { status: 'error', message: 'Aksi tidak dikenali' };
        }
        return result;
    } catch (error) {
        console.error("Supabase Error:", error);
        return { status: 'error', message: error.message };
    }
}

async function handleLogin(payload) {
    const { username, password } = payload;
    const { data, error } = await window.supabaseClient.from('users').select('*').eq('username', username).eq('password', password).single();
    if (error || !data) return { status: 'error', message: 'Username atau Password salah' };
    return { status: 'success', data: { id: data.id, username: data.username, nama: data.nama, role: data.role, status: data.status } };
}

async function handleGetMenu(payload) {
    const { data, error } = await window.supabaseClient.from('menus').select('*').eq('status', 'active').order('sort_order', { ascending: true });
    if (error) return { status: 'error', message: error.message };
    const mappedData = data.map(item => [
        item.id, item.label, item.url, item.icon, item.role_access, item.status, item.source_type, item.target_mode, item.sort_order
    ]);
    return { status: 'success', data: mappedData };
}

async function handleGetData(payload) {
    const { sheetName } = payload;
    const { data, error } = await window.supabaseClient.from(sheetName).select('*');
    if (error) return { status: 'error', message: error.message };

    if (sheetName === 'users') {
        const mapped = data.map(item => [ item.id, item.username, item.password, item.role, item.nama, item.status ]);
        return { status: 'success', data: mapped };
    }
    if (sheetName === 'menus') {
        const mapped = data.map(item => [ item.id, item.label, item.url, item.icon, item.role_access, item.status, item.source_type, item.target_mode, item.sort_order ]);
        return { status: 'success', data: mapped };
    }
    return { status: 'success', data: data };
}

async function handleAddData(payload) {
    const { sheetName, rowData } = payload;
    let insertData = {};
    if (sheetName === 'users') {
        insertData = { username: rowData[0], password: rowData[1], role: rowData[2], nama: rowData[3], status: rowData[4] };
    } else if (sheetName === 'menus') {
        insertData = { label: rowData[0], url: rowData[1], icon: rowData[2], role_access: rowData[3], status: rowData[4], source_type: rowData[5], target_mode: rowData[6], sort_order: rowData[7] || 0 };
    }
    const { error } = await window.supabaseClient.from(sheetName).insert([insertData]);
    if (error) return { status: 'error', message: error.message };
    return { status: 'success' };
}

async function handleEditData(payload) {
    const { sheetName, id, rowData } = payload;
    let updateData = {};
    if (sheetName === 'users') {
        updateData = { username: rowData[0], password: rowData[1], role: rowData[2], nama: rowData[3], status: rowData[4] };
    } else if (sheetName === 'menus') {
        updateData = { label: rowData[0], url: rowData[1], icon: rowData[2], role_access: rowData[3], status: rowData[4], source_type: rowData[5], target_mode: rowData[6], sort_order: rowData[7] || 0 };
    }
    const { error } = await window.supabaseClient.from(sheetName).update(updateData).eq('id', id);
    if (error) return { status: 'error', message: error.message };
    return { status: 'success' };
}

async function handleDeleteData(payload) {
    const { sheetName, id } = payload;
    const { error } = await window.supabaseClient.from(sheetName).delete().eq('id', id);
    if (error) return { status: 'error', message: error.message };
    return { status: 'success' };
}

async function handleUpdateSettings(payload) {
    const { settings } = payload;
    const key = Object.keys(settings)[0];
    const value = settings[key];
    const { error } = await window.supabaseClient.from('app_settings').upsert({ key: key, value: value });
    if (error) return { status: 'error', message: error.message };
    return { status: 'success' };
}

// --- GITHUB API INTEGRATION ---
async function fetchGithubFiles() {
    const owner = 'ppdaalawi'; // Dari config Anda
    const repo = 'sim-ppda';   // Dari config Anda
    const path = 'pages';      // Folder pages
    
    try {
        // Fetch langsung ke GitHub API
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
        if (!response.ok) return []; // Jika error (private ratelimit), kembalikan kosong
        
        const data = await response.json();
        // Filter hanya file HTML
        return data.filter(file => file.name.endsWith('.html')).map(file => file.name);
    } catch (e) {
        console.error("Gagal fetch GitHub:", e);
        return [];
    }
}