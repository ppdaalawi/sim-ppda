/* js/config.js - Konfigurasi Supabase */

// --- 1. KONFIGURASI KUNCI ---
const SUPABASE_URL = 'https://zlwrdxkjvxjfxkapudwj.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsd3JkeGtqdnhqZnhrYXB1ZHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzEwMTYsImV4cCI6MjA4Njc0NzAxNn0.S_Y4i_JO1YR9bVYHkGtWDaIH-1CxCNcBLIdXUo0KSm0';

// --- 2. INISIALISASI KONEKSI ---
// Jangan hapus bagian ini! Ini yang menghubungkan JS ke Supabase
try {
    // Cek apakah library Supabase sudah dimuat dari index.html
    if (typeof supabase !== 'undefined') {
        // Membuat koneksi dan disimpan ke variabel global
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("SUCCESS: Supabase Connected!");
    } else {
        console.error("ERROR: Library Supabase tidak ketemu. Cek script CDN di index.html.");
    }
} catch (err) {
    console.error("ERROR: Gagal inisialisasi Supabase.", err);
}