// --- GITHUB API INTEGRATION (REVISED) ---
async function fetchGithubFiles() {
    // 1. Coba ambil konfigurasi GitHub
    const owner = (typeof GITHUB_OWNER !== 'undefined') ? GITHUB_OWNER : null;
    const repo = (typeof GITHUB_REPO !== 'undefined') ? GITHUB_REPO : null;
    const path = (typeof GITHUB_PATH !== 'undefined') ? GITHUB_PATH : 'pages';

    // 2. Jika Konfigurasi GitHub ada, coba fetch dari GitHub
    if (owner && repo) {
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
            if (response.ok) {
                const data = await response.json();
                return data.filter(file => file.name.endsWith('.html')).map(file => file.name);
            } else {
                console.warn("GitHub API Error (Mungkin Repo Private/Belum ada):", response.status);
            }
        } catch (e) {
            console.error("Gagal fetch GitHub (Cek Koneksi):", e);
        }
    }

    // 3. Jika GitHub gagal atau tidak dikonfigurasi, pakai Fallback Lokal
    console.log("Menggunakan daftar file lokal (LOCAL_FILES)...");
    if (typeof LOCAL_FILES !== 'undefined') {
        return LOCAL_FILES;
    }
    
    return [];
}
