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
    const mobileSearchBar = document.getElementById('mobile-search-bar');
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

            allMembers = mergeData(parsedMembers, parsedOlshops)
                .filter(member => member.id_anggota && member.id_anggota.startsWith('SINEKRA-'));

            // Setelah data siap, coba dapatkan lokasi pengguna
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        // Jika berhasil, urutkan berdasarkan jarak
                        const userCoords = { lat: position.coords.latitude, lon: position.coords.longitude };
                        sortMembersByDistance(userCoords);
                        finishLoading();
                    },
                    (error) => {
                        // Jika gagal (izin ditolak), gunakan urutan default
                        console.warn(`Geolocation error: ${error.message}.`);
                        finishLoading();
                    }
                );
            } else {
                // Jika browser tidak mendukung geolocation
                console.warn("Geolocation is not supported by this browser.");
                finishLoading();
            }

        } catch (error) {
            console.error("Gagal memuat aplikasi:", error);
            showError("Gagal memuat data. Periksa koneksi atau URL sheet.");
            showLoading(false);
        }
    }
    
    function finishLoading() {
        populateFilters();
        renderPage();
        showLoading(false);
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
        let phoneNumber = (member.no_hp || '').replace(/[^0-9]/g, '');
        if (phoneNumber) {
            if (phoneNumber.startsWith('0')) {
                phoneNumber = '62' + phoneNumber.substring(1);
            } else if (!phoneNumber.startsWith('62')) {
                phoneNumber = '62' + phoneNumber;
            }
        }
        const waLink = phoneNumber ? `https://wa.me/${phoneNumber}` : null;
        const ownerName = member.panggilan || member.nama_lengkap || 'Nama Pemilik';
        const gmapsUrl = member.url_gmaps || null;
        const locationText = member.domisili || 'Lokasi tidak diketahui';

        const locationTag = gmapsUrl 
            ? `<a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" class="location-tag"><i class="fas fa-map-marker-alt"></i> ${locationText}</a>`
            : `<span class="location-tag"><i class="fas fa-map-marker-alt"></i> ${locationText}</span>`;

        // --- IMAGE & PLACEHOLDER (FIXED) ---
        const initial = (member.nama_usaha || 'A').charAt(0).toUpperCase();
        const placeholderDiv = `<div class="card-img" style="display: flex; align-items: center; justify-content: center; background-color: #e9e9e9; color: #333; font-size: 3rem; font-weight: bold;">${initial}</div>`;
        
        // Ganti hanya gambar (bukan parent-nya) saat error, agar tag lokasi tidak hilang
        const imageContent = member.id_anggota
             ? `<img src="assets/usaha/${member.id_anggota}.jpg" alt="${member.nama_usaha || ''}" class="card-img" onerror="this.outerHTML = \`${placeholderDiv.replace(/"/g, "'")}\`;">`
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
                    ${imageContent}
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
        let cardsHtml = '';
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageItems = filteredMembers.slice(startIndex, endIndex);

        pageItems.forEach(item => {
            if (currentView === 'usaha') {
                cardsHtml += createBusinessCard(item);
            } else {
                cardsHtml += createMemberCard(item);
            }
        });
        gridContainer.innerHTML = cardsHtml; // Set innerHTML sekali saja
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
        // Parser CSV yang jauh lebih andal, mampu menangani baris baru dan koma di dalam kolom.
        const result = [];
        let pos = 0;
        let line = 1;

        // Mendapatkan header
        const headerMatch = csvText.match(/^.*(\r\n|\n|\r)/);
        if (!headerMatch) return []; // Tidak ada data
        const headerLine = headerMatch[0].trim();
        const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        pos += headerLine.length;

        let row = {};
        let colIndex = 0;
        
        while (pos < csvText.length) {
            if (colIndex === 0) {
                row = {}; // Mulai baris baru
            }

            let value;
            // Jika field dimulai dengan tanda kutip
            if (csvText.charAt(pos) === '"') {
                let endPos = pos + 1;
                while (endPos < csvText.length) {
                    if (csvText.charAt(endPos) === '"') {
                        // Cek apakah ini escaped quote ("")
                        if (endPos + 1 < csvText.length && csvText.charAt(endPos + 1) === '"') {
                            endPos++; // Lewati escaped quote
                        } else {
                            break; // Ini penutup quote
                        }
                    }
                    endPos++;
                }
                value = csvText.substring(pos + 1, endPos).replace(/""/g, '"');
                pos = endPos + 1;
            } else { // Jika field tidak diapit tanda kutip
                let endPos = pos;
                while (endPos < csvText.length && csvText.charAt(endPos) !== ',' && csvText.charAt(endPos) !== '\n' && csvText.charAt(endPos) !== '\r') {
                    endPos++;
                }
                value = csvText.substring(pos, endPos);
                pos = endPos;
            }
            
            row[headers[colIndex]] = value.trim();
            colIndex++;
            
            // Cek akhir dari field/baris
            if (pos < csvText.length) {
                const char = csvText.charAt(pos);
                if (char === ',') {
                    pos++;
                } else if (char === '\r' || char === '\n') {
                    if (csvText.substring(pos, pos + 2) === '\r\n') {
                        pos += 2;
                    } else {
                        pos++;
                    }
                    if (Object.keys(row).length > 0) {
                        result.push(row);
                    }
                    colIndex = 0;
                    line++;
                }
            }
        }
        // Tambahkan baris terakhir jika ada
        if (Object.keys(row).length > 0 && colIndex > 0) {
            result.push(row);
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
        const pageCount = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
        if (pageCount <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHtml = '';
        // Tombol Previous
        paginationHtml += `<button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>Prev</button>`;

        // Tombol Angka
        for (let i = 1; i <= pageCount; i++) {
            paginationHtml += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        // Tombol Next
        paginationHtml += `<button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === pageCount ? 'disabled' : ''}>Next</button>`;
        
        paginationContainer.innerHTML = paginationHtml;
    }

    function applyFilters() {
        const searchTerm = searchBar.value.toLowerCase();
        const mobileSearchTerm = mobileSearchBar.value.toLowerCase();
        const finalSearchTerm = searchTerm || mobileSearchTerm;

        const selectedCategory = categoryFilter.value;
        const selectedDomicile = domicileFilter.value;

        // Hapus filter ketat yang memerlukan `nama_usaha`
        // Biarkan semua anggota ditampilkan di view 'usaha', 
        // kartu akan menampilkan fallback jika nama usaha kosong.
        let baseMembers = allMembers;

        filteredMembers = baseMembers.filter(member => {
            const matchesSearch = finalSearchTerm === '' ||
                (member.nama_usaha && member.nama_usaha.toLowerCase().includes(finalSearchTerm)) ||
                (member.nama_lengkap && member.nama_lengkap.toLowerCase().includes(finalSearchTerm)) ||
                (member.detail_profesi && member.detail_profesi.toLowerCase().includes(finalSearchTerm));
            
            const matchesCategory = selectedCategory === '' || member.kategori === selectedCategory;
            const matchesDomicile = selectedDomicile === '' || member.domisili === selectedDomicile;

            return matchesSearch && matchesCategory && matchesDomicile;
        });
        
        // Jangan reset sorting jika sudah diurutkan berdasarkan jarak
        // currentPage = 1; // Reset ke halaman pertama setiap kali filter berubah
        if (filteredMembers.length > 0 && !filteredMembers[0].hasOwnProperty('distance')) {
            currentPage = 1;
        } else if (filteredMembers.length === 0) {
             currentPage = 1;
        }
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

    function syncSearchBars(source, destination) {
        destination.value = source.value;
    }

    searchBar.addEventListener('keyup', () => {
        syncSearchBars(searchBar, mobileSearchBar);
        renderPage();
    });

    mobileSearchBar.addEventListener('keyup', () => {
        syncSearchBars(mobileSearchBar, searchBar);
        renderPage();
    });

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

    // --- FUNGSI GEOLOCATION & SORTING ---
    function getCoordsFromUrl(url) {
        if (!url) return null;
        const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (match && match.length >= 3) {
            return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
        }
        return null;
    }

    function haversineDistance(coords1, coords2) {
        const toRad = (x) => x * Math.PI / 180;
        const R = 6371; // Radius bumi dalam km

        const dLat = toRad(coords2.lat - coords1.lat);
        const dLon = toRad(coords2.lon - coords1.lon);
        const lat1 = toRad(coords1.lat);
        const lat2 = toRad(coords2.lat);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Jarak dalam km
    }

    function sortMembersByDistance(userCoords) {
        allMembers.forEach(member => {
            const businessCoords = getCoordsFromUrl(member.url_gmaps);
            if (businessCoords) {
                member.distance = haversineDistance(userCoords, businessCoords);
            } else {
                member.distance = Infinity; // Dorong yang tidak punya lokasi ke paling akhir
            }
        });

        allMembers.sort((a, b) => a.distance - b.distance);
    }

    // --- INISIALISASI ---
    loadApp();
}); 
