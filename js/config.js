/* js/config.js */

const SUPABASE_URL = 'https://zlwrdxkjvxjfxkapudwj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Pastikan kunci lengkap

// --- KONFIGURASI GITHUB ---
const GITHUB_OWNER = 'ppdaalawi'; 
const GITHUB_REPO = 'sim-ppda';   
const GITHUB_PATH = 'pages';      

const LOCAL_FILES = [
    'dashboard.html',
    'settings.html',
    'struktur.html'
];

// --- INISIALISASI ---
try {
    if (typeof supabase !== 'undefined') {
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("SUCCESS: Supabase Connected!");
    } else {
        console.error("ERROR: Library Supabase tidak ketemu.");
    }
} catch (err) {
    console.error("ERROR: Gagal inisialisasi Supabase.", err);
}
