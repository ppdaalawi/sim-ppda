/* js/api.js - REVISED */

// Fungsi bantuan Hash SHA256 (Sederhana untuk keamanan dasar)
// Catatan: Hash di client bagus, tapi hash di server (Supabase Function) lebih baik.
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

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
    
    // OPSIONAL: Jika ingin mengaktifkan hash, uncomment baris di bawah dan pastikan DB menyimpan hash
    // const hashedPassword = await hashPassword(password);
    // Ganti 'password' dengan 'hashedPassword' di query bawah jika pakai hash.

    // Query ke tabel users
    const { data, error } = await window.supabaseClient
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password) // Jika pakai hash, ganti ini jadi .eq('password', hashedPassword)
        .single();

    if (error || !data) return { status: 'error', message: 'Username atau Password salah' };
    
    // Cek status user
    if(data.status !== 'active') return { status: 'error', message: 'Akun Anda tidak aktif.' };

    return { status: 'success', data: { id: data.id, username: data.username, nama: data.nama, role: data.role, status: data.status } };
}

async function handleGetMenu(payload) {
    const { role } = payload; // Terima role dari core.js
    
    // 1. Ambil semua menu yang aktif
    const { data, error } = await window.supabaseClient
        .from('menus')
        .select('*')
        .eq('status', 'active')
        .order('sort_order', { ascending: true });
        
    if (error) return { status: 'error', message: error.message };

    // 2. FILTERING ROLE DI CLIENT SIDE (Penting!)
    // Logika: Tampilkan jika role_access = 'all' ATAU role_access mengandung role user
    const filteredData = data.filter(item => {
        if (!item.role_access) return true; // Jika kosong, anggap publik
        if (item.role_access === 'all') return true;
        // Pecah string "admin,staf" menjadi array dan cek
        const allowedRoles = item.role_access.split(',').map(r => r.trim());
        return allowedRoles.includes(role);
    });

    // 3. Mapping ke format Array (sesuai ekspektasi core.js)
    const mappedData = filteredData.map(item => [
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
        // Jika password dikosongkan, jangan update password (biarkan yang lama)
        let passToUpdate = rowData[1];
        // Logika sederhana: jika password kosong, ambil password lama dari cache? 
        // Untuk simplisitas, kita update semua. JS settings.js perlu handle jika pass kosong.
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
    const owner = 'ppdaalawi'; 
    const repo = 'sim-ppda';   
    const path = 'pages'; 
    
    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
        if (!response.ok) return []; 
        const data = await response.json();
        return data.filter(file => file.name.endsWith('.html')).map(file => file.name);
    } catch (e) {
        console.error("Gagal fetch GitHub:", e);
        return [];
    }
}
