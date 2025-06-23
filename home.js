document.addEventListener('DOMContentLoaded', function() {
    // --- KONFIGURASI ---
    const membersSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGe6AOx8Dsnq--KPToMl0Q4lF20650_IQ6VoLQxyy3heEFW43LSTIqB0UAUeTV0QOvr8O_YnaeU-om/pub?gid=0&output=csv";
    const olshopSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGe6AOx8Dsnq--KPToMl0Q4lF20650_IQ6VoLQxyy3heEFW43LSTIqB0UAUeTV0QOvr8O_YnaeU-om/pub?gid=1048998840&output=csv";
    const ITEMS_PER_PAGE = 8; // Jumlah anggota per halaman
    
    // --- ELEMEN DOM ---
    const gridContainer = document.getElementById('directory-grid');
    const gridTitle = document.getElementById('grid-title');
    const loadingIndicator = document.getElementById('directory-loading');
    const paginationContainer = document.getElementById('pagination-container');
    const searchBar = document.getElementById('search-bar');
    const categoryFilter = document.getElementById('filter-category');
    const domicileFilter = document.getElementById('filter-domicile');
    const noResults = document.getElementById('no-results');
    const viewSwitchBtn = document.getElementById('view-switch-btn');

    // --- STATE APLIKASI ---
    let allMembers = [];
    let filteredMembers = [];
    let currentPage = 1;
    let currentView = 'usaha'; // 'usaha' atau 'anggota'

    // --- FUNGSI UTAMA ---

    async function loadApp() {
        showLoading(true);
        
        try {
            // Ambil data dari kedua sheet secara bersamaan
            const [membersResponse, olshopResponse] = await Promise.all([
                fetch(membersSheetUrl, { cache: 'no-cache' }),
                fetch(olshopSheetUrl, { cache: 'no-cache' })
            ]);

            if (!membersResponse.ok || !olshopResponse.ok) {
                throw new Error(`Gagal mengambil data dari Google Sheets.`);
            }
            
            const membersCsv = await membersResponse.text();
            const olshopCsv = await olshopResponse.text();
            
            const parsedMembers = parseCsv(membersCsv);
            const parsedOlshops = parseCsv(olshopCsv);

            // Gabungkan data olshop ke data member
            allMembers = mergeData(parsedMembers, parsedOlshops)
                .filter(member => member.id_anggota && member.id_anggota.startsWith('SINEKRA-')); // Filter HANYA data dengan ID yang valid

            console.log(`Total anggota yang valid: ${allMembers.length}`);
            filteredMembers = [...allMembers];
            
            if (allMembers.length > 0) {
                populateFilters();
                renderPage();
            } else {
                showError("Tidak ada data anggota untuk ditampilkan.");
            }
        } catch (error) {
            console.error("Gagal memuat aplikasi:", error);
            showError("Gagal memuat data. Periksa koneksi atau URL sheet.");
        } finally {
            showLoading(false);
        }
    }

    function renderPage() {
        applyFilters();
        updateUI();
        
        if (filteredMembers.length === 0) {
            noResults.style.display = 'block';
            gridContainer.innerHTML = '';
            paginationContainer.innerHTML = '';
        } else {
            noResults.style.display = 'none';
            displayCurrentPageItems();
            setupPagination();
        }
    }

    // --- FUNGSI TAMPILAN ---

    function createBusinessCard(member) {
        // --- DATA PREPARATION ---
        const waLink = member.no_hp ? `https://wa.me/62${member.no_hp.replace(/[^0-9]/g, '').replace(/^0/, '')}` : null;
        // Prioritaskan nama panggilan, fallback ke nama lengkap
        const ownerName = member.panggilan || member.nama_lengkap || 'Nama Pemilik';
        const gmapsUrl = member.url_gmaps || null;
        const locationText = member.domisili || 'Lokasi tidak diketahui';

        // Membuat tag lokasi menjadi link jika gmapsUrl ada
        const locationTag = gmapsUrl 
            ? `<a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" class="location-tag"><i class="fas fa-map-marker-alt"></i> ${locationText}</a>`
            : `<span class="location-tag"><i class="fas fa-map-marker-alt"></i> ${locationText}</span>`;

        // --- IMAGE & PLACEHOLDER ---
        const initial = (member.nama_usaha || 'A').charAt(0).toUpperCase();
        // Placeholder HTML yang akan digunakan jika gambar gagal dimuat
        const placeholderDiv = `<div class="card-img" style="display: flex; align-items: center; justify-content: center; background-color: #e9e9e9; color: #333; font-size: 3rem; font-weight: bold;">${initial}</div>`;
        
        // Cek apakah ada nama file gambar di data
        const imageHtml = member.foto_usaha
            ? `<img src="assets/usaha/${member.foto_usaha}" alt="${member.nama_usaha}" class="card-img" onerror="this.onerror=null; this.parentElement.innerHTML = '${placeholderDiv.replace(/"/g, "'")}';">`
            : placeholderDiv;

        // --- SOCIAL & MARKETPLACE ICONS ---
        const socialIcons = [
            { link: waLink, icon: 'fab fa-whatsapp' },
            { link: member.link_facebook, icon: 'fab fa-facebook-f' },
            { link: member.link_website, icon: 'fas fa-globe' }, // Cek jika ada kolom 'link_website'
            { link: member.link_shopee, icon: 'fas fa-shopping-bag' },
            { link: member.link_tokopedia, icon: 'fas fa-store' },
            { link: member.link_tiktok, icon: 'fab fa-tiktok' }
        ]
        .filter(item => item.link) // Hanya tampilkan ikon yang linknya ada
        .map(item => `<a href="${item.link}" target="_blank" rel="noopener noreferrer"><i class="${item.icon}"></i></a>`)
        .join('');

        // --- RENDER HTML CARD ---
        return `
            <div class="directory-card">
                <div class="card-image-container">
                    ${imageHtml}
                    ${locationTag}
                </div>
                <div class="card-content">
                    <h3 class="card-title">${member.nama_usaha || 'Nama Usaha Belum Diisi'}</h3>
                    <p class="card-description">${member.detail_profesi || 'Deskripsi usaha tidak tersedia.'}</p>
                    <p class="card-owner">${ownerName}</p>
                    <div class="social-icons">
                        ${socialIcons || '<span style="font-size: 0.8rem; color: #999;">Toko online tidak tersedia</span>'}
                    </div>
                </div>
            </div>
        `;
    }

    function createMemberCard(member) {
        // Tampilan kartu anggota yang lebih simpel
        return `
            <div class="directory-card simple">
                <div class="card-content">
                    <h3 class="card-title">${member.nama_lengkap || 'Nama Anggota'}</h3>
                    <p class="card-description">Angkatan: ${member.angkatan || 'N/A'}</p>
                    <p class="card-owner">Komplek: ${member.komplek || 'N/A'}</p>
                    <div class="social-icons">
                         <span style="font-size: 0.9rem; color: #666;"><i class="fas fa-map-marker-alt"></i> ${member.domisili || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    function displayCurrentPageItems() {
        gridContainer.innerHTML = '';
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageItems = filteredMembers.slice(startIndex, endIndex);

        pageItems.forEach(item => {
            if (currentView === 'usaha') {
                gridContainer.innerHTML += createBusinessCard(item);
            } else {
                gridContainer.innerHTML += createMemberCard(item);
            }
        });
    }
    
    function updateUI() {
        if (currentView === 'usaha') {
            // Judul di header section sudah statis sesuai desain baru
            // gridTitle.textContent = 'Usaha Santri Terdekat sama Kamu'; 
            viewSwitchBtn.textContent = 'Lihat Daftar Anggota';
            searchBar.placeholder = 'Cari Nama Usaha';
            if(categoryFilter) categoryFilter.style.display = '';
        } else {
            // gridTitle.textContent = 'Daftar Anggota';
            viewSwitchBtn.textContent = 'Lihat Daftar Usaha';
            searchBar.placeholder = 'Cari nama anggota atau domisili...';
            if(categoryFilter) categoryFilter.style.display = 'none'; // Sembunyikan filter kategori di view anggota
        }
    }

    // --- FUNGSI LOGIKA ---

    function toggleView() {
        currentView = (currentView === 'usaha') ? 'anggota' : 'usaha';
        renderPage();
    }

    function mergeData(members, olshops) {
        // Buat map olshop untuk pencarian cepat
        const olshopMap = olshops.reduce((acc, shop) => {
            if (!shop.id_anggota) return acc;
            
            if (!acc[shop.id_anggota]) {
                acc[shop.id_anggota] = {};
            }

            const platform = (shop.platform || '').toLowerCase();
            const url = shop.url || '';
            
            if (platform === 'shopee') acc[shop.id_anggota].link_shopee = url;
            else if (platform === 'tokopedia') acc[shop.id_anggota].link_tokopedia = url;
            else if (platform === 'tiktok shop') acc[shop.id_anggota].link_tiktok = url;
            else if (platform === 'lainnya') {
                if (url.includes('bukalapak.com')) acc[shop.id_anggota].link_bukalapak = url;
                else if (url.includes('facebook.com')) acc[shop.id_anggota].link_facebook = url;
                // Asumsi link lain adalah website general
                else acc[shop.id_anggota].link_website = url;
            }

            return acc;
        }, {});

        // Gabungkan map ke data member
        return members.map(member => ({
            ...member,
            ...(olshopMap[member.id_anggota] || {})
        }));
    }

    function parseCsv(csvText) {
        // This is a more robust CSV parser that handles quoted fields,
        // including commas and newlines inside the quotes.
        const result = [];
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) return result;

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

        const regex = /(?:"([^"]*(?:""[^"]*)*)"|([^,]*?))(?:,|$)/g;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;

            const entry = {};
            let headerIndex = 0;
            let match;
            
            while ((match = regex.exec(line))) {
                if (headerIndex >= headers.length) break;
                
                // Group 1 is for quoted fields, Group 2 is for unquoted.
                const value = match[1] !== undefined 
                    ? match[1].replace(/""/g, '"') // Unescape double quotes
                    : match[2];
                
                entry[headers[headerIndex]] = value.trim();
                headerIndex++;
            }
            // Ensure all headers have a key, even if the value is empty (for trailing commas)
            while (headerIndex < headers.length) {
                entry[headers[headerIndex]] = '';
                headerIndex++;
            }
            
            result.push(entry);
        }
        return result;
    }

    function populateFilters() {
        const categories = [...new Set(allMembers.map(m => m.kategori).filter(Boolean))];
        const domiciles = [...new Set(allMembers.map(m => m.domisili).filter(Boolean))];
        
        categories.forEach(cat => categoryFilter.add(new Option(cat, cat)));
        domiciles.forEach(dom => domicileFilter.add(new Option(dom, dom)));
    }
    
    function setupPagination() {
        paginationContainer.innerHTML = '';
        const pageCount = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
        if (pageCount <= 1) return;

        // Tombol Previous
        paginationContainer.innerHTML += `<button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>`;

        // Tombol Angka
        for (let i = 1; i <= pageCount; i++) {
            paginationContainer.innerHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        // Tombol Next
        paginationContainer.innerHTML += `<button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === pageCount ? 'disabled' : ''}>Next</button>`;
    }

    function applyFilters() {
        const searchTerm = searchBar.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const selectedDomicile = domicileFilter.value;

        // Hapus filter ketat yang memerlukan `nama_usaha`
        // Biarkan semua anggota ditampilkan di view 'usaha', 
        // kartu akan menampilkan fallback jika nama usaha kosong.
        let baseMembers = allMembers;

        filteredMembers = baseMembers.filter(member => {
            const matchesSearch = searchTerm === '' ||
                (member.nama_usaha && member.nama_usaha.toLowerCase().includes(searchTerm)) ||
                (member.nama_lengkap && member.nama_lengkap.toLowerCase().includes(searchTerm)) ||
                (member.detail_profesi && member.detail_profesi.toLowerCase().includes(searchTerm));
            
            const matchesCategory = selectedCategory === '' || member.kategori === selectedCategory;
            const matchesDomicile = selectedDomicile === '' || member.domisili === selectedDomicile;

            return matchesSearch && matchesCategory && matchesDomicile;
        });
        
        currentPage = 1; // Reset ke halaman pertama setiap kali filter berubah
    }

    function showLoading(isLoading) {
        loadingIndicator.style.display = isLoading ? 'block' : 'none';
        if (isLoading) {
            gridContainer.innerHTML = '';
            paginationContainer.innerHTML = '';
            noResults.style.display = 'none';
        }
    }

    function showError(message) {
        loadingIndicator.innerHTML = `<p>${message}</p>`;
        showLoading(true);
    }

    // --- EVENT LISTENERS ---
    viewSwitchBtn.addEventListener('click', toggleView);
    searchBar.addEventListener('keyup', renderPage);
    categoryFilter.addEventListener('change', renderPage);
    domicileFilter.addEventListener('change', renderPage);

    paginationContainer.addEventListener('click', (e) => {
        if (e.target.matches('.pagination-btn') && !e.target.disabled) {
            currentPage = parseInt(e.target.dataset.page);
            displayCurrentPageItems();
            setupPagination();
            const gridElement = document.getElementById('directory-grid');
            if (gridElement) {
                window.scrollTo({
                    top: gridElement.offsetTop - 100, // Beri sedikit offset karena header sticky
                    behavior: 'smooth'
                });
            }
        }
    });

    // --- INISIALISASI ---
    loadApp();
}); 
