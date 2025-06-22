document.addEventListener('DOMContentLoaded', function() {
    // --- KONFIGURASI ---
    const membersSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGe6AOx8Dsnq--KPToMl0Q4lF20650_IQ6VoLQxyy3heEFW43LSTIqB0UAUeTV0QOvr8O_YnaeU-om/pub?gid=0&output=csv";
    const olshopSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGe6AOx8Dsnq--KPToMl0Q4lF20650_IQ6VoLQxyy3heEFW43LSTIqB0UAUeTV0QOvr8O_YnaeU-om/pub?gid=1048998840&output=csv";
    const ITEMS_PER_PAGE = 8; // Jumlah anggota per halaman
    
    // --- ELEMEN DOM ---
    const gridContainer = document.getElementById('directory-grid');
    const recommendedGrid = document.getElementById('recommended-grid');
    const loadingIndicator = document.getElementById('directory-loading');
    const paginationContainer = document.getElementById('pagination-container');
    const searchBar = document.getElementById('search-bar');
    const categoryFilter = document.getElementById('filter-category');
    const domicileFilter = document.getElementById('filter-domicile');
    const noResults = document.getElementById('no-results');

    // --- STATE APLIKASI ---
    let allMembers = [];
    let filteredMembers = [];
    let currentPage = 1;

    // --- FUNGSI UTAMA ---

    async function loadDirectory() {
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
            allMembers = mergeData(parsedMembers, parsedOlshops);
            filteredMembers = [...allMembers];
            
            if (allMembers.length > 0) {
                populateFilters();
                displayRecommendations();
                renderPage();
            } else {
                showError("Tidak ada data anggota untuk ditampilkan.");
            }
        } catch (error) {
            console.error("Gagal memuat direktori:", error);
            showError("Gagal memuat data direktori. Periksa koneksi atau URL sheet.");
        } finally {
            showLoading(false);
        }
    }

    function renderPage() {
        applyFilters();
        
        if (filteredMembers.length === 0) {
            noResults.style.display = 'block';
            gridContainer.innerHTML = '';
            paginationContainer.innerHTML = '';
        } else {
            noResults.style.display = 'none';
            displayCurrentPageMembers();
            setupPagination();
        }
    }

    // --- FUNGSI BANTU ---

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
                // Bisa ditambahkan kondisi lain di sini
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
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            const values = line.split(',');
            const entry = {};
            headers.forEach((header, i) => {
                entry[header] = values[i] ? values[i].trim() : '';
            });
            return entry;
        });
    }
    
    function createMemberCard(member) {
        const waLink = member.no_hp ? `https://wa.me/${member.no_hp.replace(/[^0-9]/g, '')}` : null;
        const banner = member.banner_url 
            ? `<img src="${member.banner_url}" alt="Banner ${member.nama_usaha}" class="card-banner-img">`
            : `<div class="placeholder">${(member.nama_usaha || 'A').charAt(0)}</div>`;

        const marketplaces = `
            ${member.link_shopee ? `<a href="${member.link_shopee}" target="_blank" rel="noopener noreferrer"><img src="assets/marketplace/shopee.svg" alt="Shopee" class="marketplace-icon"></a>` : ''}
            ${member.link_tokopedia ? `<a href="${member.link_tokopedia}" target="_blank" rel="noopener noreferrer"><img src="assets/marketplace/tokopedia.svg" alt="Tokopedia" class="marketplace-icon"></a>` : ''}
            ${member.link_bukalapak ? `<a href="${member.link_bukalapak}" target="_blank" rel="noopener noreferrer"><img src="assets/marketplace/bukalapak.svg" alt="Bukalapak" class="marketplace-icon"></a>` : ''}
            ${member.link_tiktok ? `<a href="${member.link_tiktok}" target="_blank" rel="noopener noreferrer"><img src="assets/marketplace/tiktok.svg" alt="TikTok Shop" class="marketplace-icon"></a>` : ''}
            ${member.link_facebook ? `<a href="${member.link_facebook}" target="_blank" rel="noopener noreferrer"><img src="assets/social/facebook.svg" alt="Facebook" class="marketplace-icon"></a>` : ''}
        `.trim();

        return `
            <div class="member-card">
                <div class="card-banner">${banner}</div>
                <div class="card-content">
                    <h3 class="card-business-name">${member.nama_usaha || 'Nama Usaha'}</h3>
                    <p class="card-owner-name">${member.nama_lengkap || 'Nama Pemilik'}</p>
                    <div class="card-contact-bar">
                        <div class="card-marketplaces">${marketplaces || '<span style="font-size: 0.8rem; color: #999;">Toko online tidak tersedia</span>'}</div>
                        ${waLink ? `<a href="${waLink}" target="_blank" rel="noopener noreferrer"><img src="assets/social/whatsapp.svg" alt="WhatsApp" class="whatsapp-icon"></a>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    function populateFilters() {
        const categories = [...new Set(allMembers.map(m => m.kategori).filter(Boolean))];
        const domiciles = [...new Set(allMembers.map(m => m.domisili).filter(Boolean))];
        
        categories.forEach(cat => categoryFilter.add(new Option(cat, cat)));
        domiciles.forEach(dom => domicileFilter.add(new Option(dom, dom)));
    }
    
    function displayRecommendations() {
        recommendedGrid.innerHTML = '';
        const shuffled = [...allMembers].sort(() => 0.5 - Math.random());
        const recommended = shuffled.slice(0, 4); // Ambil 4 rekomendasi acak
        recommended.forEach(member => {
            recommendedGrid.innerHTML += createMemberCard(member);
        });
    }
    
    function displayCurrentPageMembers() {
        gridContainer.innerHTML = '';
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageMembers = filteredMembers.slice(startIndex, endIndex);

        pageMembers.forEach(member => {
            gridContainer.innerHTML += createMemberCard(member);
        });
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

        filteredMembers = allMembers.filter(member => {
            const matchesSearch = searchTerm === '' ||
                (member.nama_usaha && member.nama_usaha.toLowerCase().includes(searchTerm)) ||
                (member.nama_lengkap && member.nama_lengkap.toLowerCase().includes(searchTerm));
            
            const matchesCategory = selectedCategory === '' || member.kategori === selectedCategory;
            const matchesDomicile = selectedDomicile === '' || member.domisili === selectedDomicile;

            return matchesSearch && matchesCategory && matchesDomicile;
        });
        
        currentPage = 1; // Reset ke halaman pertama setiap kali filter berubah
    }

    function showLoading(isLoading) {
        loadingIndicator.style.display = isLoading ? 'flex' : 'none';
        if (isLoading) {
            gridContainer.innerHTML = '';
            recommendedGrid.innerHTML = '';
            paginationContainer.innerHTML = '';
            noResults.style.display = 'none';
        }
    }

    function showError(message) {
        loadingIndicator.innerHTML = `<p>${message}</p>`;
        showLoading(true);
    }

    // --- EVENT LISTENERS ---

    searchBar.addEventListener('keyup', renderPage);
    categoryFilter.addEventListener('change', renderPage);
    domicileFilter.addEventListener('change', renderPage);

    paginationContainer.addEventListener('click', (e) => {
        if (e.target.matches('.pagination-btn') && !e.target.disabled) {
            currentPage = parseInt(e.target.dataset.page);
            displayCurrentPageMembers();
            setupPagination();
            window.scrollTo(0, document.getElementById('all-members-section').offsetTop);
        }
    });

    // --- INISIALISASI ---
    loadDirectory();
}); 
