document.addEventListener('DOMContentLoaded', function() {
    // --- KONFIGURASI ---
    const membersSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGe6AOx8Dsnq--KPToMl0Q4lF20650_IQ6VoLQxyy3heEFW43LSTIqB0UAUeTV0QOvr8O_YnaeU-om/pub?gid=0&output=csv";
    const olshopSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGe6AOx8Dsnq--KPToMl0Q4lF20650_IQ6VoLQxyy3heEFW43LSTIqB0UAUeTV0QOvr8O_YnaeU-om/pub?gid=1048998840&output=csv";
    const ITEMS_PER_PAGE = 8;
    
    // --- ELEMEN DOM ---
    const gridContainer = document.getElementById('directory-grid');
    const loadingIndicator = document.getElementById('directory-loading');
    const paginationContainer = document.getElementById('pagination-container');
    const searchBar = document.getElementById('search-bar');
    const categoryFilter = document.getElementById('filter-category');
    const domicileFilter = document.getElementById('filter-domicile');
    const noResults = document.getElementById('no-results');
    const gridTitle = document.getElementById('grid-title');
    const viewSwitchBtn = document.getElementById('view-switch-btn');
    const mobileSearchBar = document.getElementById('mobile-search-bar');

    // --- STATE APLIKASI ---
    let allMembers = [];
    let filteredMembers = [];
    let currentPage = 1;
    let currentView = 'nearby'; // 'nearby', 'all', 'search'

    // --- FUNGSI UTAMA ---
    async function initialize() {
        showLoading(true, "Memuat data anggota...");
        
        // Setup event listener untuk view switcher
        if(viewSwitchBtn) {
            viewSwitchBtn.addEventListener('click', toggleView);
        }
        
        try {
            const [membersResponse, olshopResponse] = await Promise.all([
                fetch(membersSheetUrl, { cache: 'no-cache' }),
                fetch(olshopSheetUrl, { cache: 'no-cache' })
            ]);

            if (!membersResponse.ok || !olshopResponse.ok) {
                throw new Error('Gagal mengambil data.');
            }
            
            const membersCsv = await membersResponse.text();
            const olshopCsv = await olshopResponse.text();
            
            allMembers = mergeData(parseCsv(membersCsv), parseCsv(olshopCsv));
            
            if (allMembers.length > 0) {
                populateFilters();
                await renderInitialView();
            } else {
                showError("Tidak ada data anggota untuk ditampilkan.");
            }
        } catch (error) {
            console.error("Gagal inisialisasi:", error);
            showError("Gagal memuat data. Periksa koneksi atau URL sheet.");
        } finally {
            showLoading(false);
        }
    }

    async function renderInitialView() {
        if (navigator.geolocation) {
            showLoading(true, "Mencari usaha terdekat...");
            try {
                const position = await new Promise((resolve, reject) => 
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
                );
                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;
                
                const membersWithDistance = allMembers.map(member => {
                    if (member.latitude && member.longitude) {
                        member.distance = getDistance(userLat, userLon, parseFloat(member.latitude), parseFloat(member.longitude));
                    } else {
                        member.distance = Infinity;
                    }
                    return member;
                });
                
                filteredMembers = membersWithDistance.sort((a, b) => a.distance - b.distance);
                currentView = 'nearby';
                updateUIForViewChange();
                
            } catch (error) {
                console.warn("Geolokasi gagal atau ditolak. Menampilkan semua anggota.", error);
                await switchToAllMembersView(false);
            }
        } else {
            console.log("Geolokasi tidak didukung. Menampilkan semua anggota.");
            await switchToAllMembersView(false);
        }
        renderPage();
    }
    
    async function switchToAllMembersView(isUserAction = true) {
        currentView = 'all';
        // Hanya shuffle jika ini adalah aksi dari user, bukan fallback
        if (isUserAction) {
            filteredMembers = [...allMembers].sort(() => 0.5 - Math.random());
        } else {
            filteredMembers = [...allMembers];
        }
        updateUIForViewChange();
        renderPage();
    }

    function renderPage() {
        showLoading(true);
        
        if (currentView !== 'search') {
             applyFilters(); // Terapkan filter dropdown tapi abaikan search bar
        }
       
        if (filteredMembers.length === 0) {
            noResults.style.display = 'block';
            gridContainer.innerHTML = '';
            paginationContainer.innerHTML = '';
        } else {
            noResults.style.display = 'none';
            displayCurrentPageMembers();
            setupPagination();
        }
        showLoading(false);
    }
    
    // --- FUNGSI TAMPILAN & KONTROL ---

    function createMemberCard(member) {
        const card = document.createElement('div');
        card.className = 'directory-card';
        card.addEventListener('click', e => {
            if (e.target.closest('a')) return;
            if(member.id_anggota) {
                window.location.href = `detail.html?id=${member.id_anggota}`;
            }
        });
        
        const initial = (member.nama_usaha || member.nama_lengkap || 'A').charAt(0).toUpperCase();
        const placeholder = `<div class="placeholder-initial">${initial}</div>`;
        const image = `<img src="assets/usaha/${member.id_anggota}.jpg" alt="${member.nama_usaha}" class="card-img" onerror="this.outerHTML = \`${placeholder}\`;">`;
        
        let description = member.detail_profesi || 'Deskripsi tidak tersedia.';
        if(description.length > 80) description = description.substring(0, 80) + '...';

        card.innerHTML = `
            <div class="card-image-container">
                ${image}
                ${member.domisili ? `<a href="#" class="location-tag" onclick="event.stopPropagation(); filterByLocation('${member.domisili}')">${member.domisili}</a>` : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${member.nama_usaha || 'Nama Usaha Belum Diisi'}</h3>
                <p class="card-description">${description}</p>
                <p class="card-owner">${member.nama_lengkap}</p>
                 <div class="social-icons">
                    ${member.no_hp ? `<a href="https://wa.me/${member.no_hp.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp"></i></a>` : ''}
                    ${member.link_tokopedia ? `<a href="${member.link_tokopedia}" target="_blank" rel="noopener noreferrer"><i class="fas fa-store"></i></a>` : ''}
                    ${member.link_shopee ? `<a href="${member.link_shopee}" target="_blank" rel="noopener noreferrer"><i class="fas fa-shopping-bag"></i></a>` : ''}
                    ${member.link_tiktok ? `<a href="${member.link_tiktok}" target="_blank" rel="noopener noreferrer"><i class="fab fa-tiktok"></i></a>` : ''}
                    ${member.link_facebook ? `<a href="${member.link_facebook}" target="_blank" rel="noopener noreferrer"><i class="fab fa-facebook-f"></i></a>` : ''}
                </div>
            </div>
        `;
        return card;
    }

    window.filterByLocation = function(domicile) {
        domicileFilter.value = domicile;
        handleSearchAndFilter();
    }
    
    function populateFilters() {
        const categories = [...new Set(allMembers.map(m => m.kategori).filter(Boolean))].sort();
        const domiciles = [...new Set(allMembers.map(m => m.domisili).filter(Boolean))].sort();
        
        categories.forEach(cat => categoryFilter.add(new Option(cat, cat)));
        domiciles.forEach(dom => domicileFilter.add(new Option(dom, dom)));
    }
    
    function displayCurrentPageMembers() {
        gridContainer.innerHTML = '';
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageMembers = filteredMembers.slice(startIndex, endIndex);

        pageMembers.forEach(member => {
            gridContainer.appendChild(createMemberCard(member));
        });
    }

    function setupPagination() {
        paginationContainer.innerHTML = '';
        const pageCount = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
        if (pageCount <= 1) return;

        // Tombol Previous
        paginationContainer.innerHTML += `<button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-angle-left"></i></button>`;

        // Logika pembuatan tombol angka yang lebih cerdas
        const pages = generatePaginationArray(currentPage, pageCount, 7);
        pages.forEach(p => {
            if (p === '...') {
                paginationContainer.innerHTML += `<span class="pagination-ellipsis">...</span>`;
            } else {
                paginationContainer.innerHTML += `<button class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
            }
        });
        
        // Tombol Next
        paginationContainer.innerHTML += `<button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === pageCount ? 'disabled' : ''}><i class="fas fa-angle-right"></i></button>`;
    }
    
    function handleSearchAndFilter() {
        currentView = 'search';
        updateUIForViewChange();
        applyFilters(true); // Terapkan semua filter termasuk search bar
        renderPage();
    }

    function applyFilters(includeSearch = false) {
        const searchTerm = includeSearch ? (searchBar.value || mobileSearchBar.value).toLowerCase() : '';
        const selectedCategory = categoryFilter.value;
        const selectedDomicile = domicileFilter.value;

        filteredMembers = allMembers.filter(member => {
            const matchesSearch = !includeSearch || searchTerm === '' ||
                (member.nama_usaha && member.nama_usaha.toLowerCase().includes(searchTerm)) ||
                (member.nama_lengkap && member.nama_lengkap.toLowerCase().includes(searchTerm)) ||
                (member.detail_profesi && member.detail_profesi.toLowerCase().includes(searchTerm));
            
            const matchesCategory = selectedCategory === '' || member.kategori === selectedCategory;
            const matchesDomicile = selectedDomicile === '' || member.domisili === selectedDomicile;

            return matchesSearch && matchesCategory && matchesDomicile;
        });
        
        currentPage = 1; 
    }
    
    function toggleView() {
        if (currentView === 'nearby') {
            switchToAllMembersView();
        } else {
            renderInitialView(); // Kembali ke tampilan terdekat
        }
    }

    function updateUIForViewChange() {
        if (currentView === 'nearby') {
            gridTitle.textContent = "Usaha Santri Terdekat sama Kamu";
            if(viewSwitchBtn) viewSwitchBtn.textContent = "Lihat Semua Anggota";
            paginationContainer.style.display = 'none'; // Sembunyikan pagination untuk 'nearby'
        } else if (currentView === 'all') {
            gridTitle.textContent = "Semua Anggota";
            if(viewSwitchBtn) viewSwitchBtn.textContent = "Lihat Terdekat";
            paginationContainer.style.display = 'flex';
        } else { // search
            gridTitle.textContent = "Hasil Pencarian";
            if(viewSwitchBtn) viewSwitchBtn.textContent = "Lihat Terdekat";
            paginationContainer.style.display = 'flex';
        }
    }
    
    function showLoading(isLoading, message = "Memuat...") {
        if (isLoading) {
            loadingIndicator.style.display = 'flex';
            loadingIndicator.querySelector('p').textContent = message;
            gridContainer.innerHTML = '';
            paginationContainer.innerHTML = '';
            noResults.style.display = 'none';
        } else {
            loadingIndicator.style.display = 'none';
        }
    }

    function showError(message) {
        gridContainer.innerHTML = '';
        loadingIndicator.style.display = 'flex';
        loadingIndicator.querySelector('p').innerHTML = `<span style="color: red;">${message}</span>`;
    }

    // --- EVENT LISTENERS ---
    searchBar.addEventListener('input', handleSearchAndFilter);
    mobileSearchBar.addEventListener('input', handleSearchAndFilter);
    categoryFilter.addEventListener('change', handleSearchAndFilter);
    domicileFilter.addEventListener('change', handleSearchAndFilter);
    
    paginationContainer.addEventListener('click', e => {
        if (e.target.matches('.pagination-btn') && !e.target.disabled) {
            const page = parseInt(e.target.dataset.page);
            if (page) {
                currentPage = page;
                renderPage();
            }
        }
    });

    // --- FUNGSI UTILITAS ---
    function parseCsv(csvText) {
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        return lines.slice(1).map(line => {
            const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            const entry = {};
            headers.forEach((header, i) => {
                let value = values[i] || '';
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                entry[header] = value.replace(/""/g, '"').trim();
            });
            if (!entry.id_anggota) entry.id_anggota = 'gen_' + Math.random().toString(36).substr(2, 9);
            return entry;
        });
    }

    function mergeData(members, olshops) {
        const olshopMap = olshops.reduce((acc, shop) => {
            if (!shop.id_anggota) return acc;
            if (!acc[shop.id_anggota]) acc[shop.id_anggota] = {};
            const platform = (shop.platform || '').toLowerCase();
            const url = shop.url || '';
            if (platform === 'shopee') acc[shop.id_anggota].link_shopee = url;
            else if (platform === 'tokopedia') acc[shop.id_anggota].link_tokopedia = url;
            else if (platform === 'tiktok shop') acc[shop.id_anggota].link_tiktok = url;
            else if (platform === 'lainnya') {
                if(url.includes('facebook.com')) acc[shop.id_anggota].link_facebook = url;
                else acc[shop.id_anggota].link_website = url;
            }
            return acc;
        }, {});
        return members.map(member => ({...member, ...olshopMap[member.id_anggota]}));
    }

    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius bumi dalam km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function generatePaginationArray(current, max, width) {
        if (max <= width) {
            return Array.from({length: max}, (_, i) => i + 1);
        }
        let
            left = Math.max(1, current - Math.floor(width / 2)),
            right = Math.min(max, left + width - 1);
        if (right === max) {
            left = max - width + 1;
        }
        const pages = Array.from({length: right - left + 1}, (_, i) => i + left);
        if (pages[0] > 1) {
            if (pages[0] > 2) pages.unshift('...');
            pages.unshift(1);
        }
        if (pages[pages.length - 1] < max) {
            if (pages[pages.length - 1] < max - 1) pages.push('...');
            pages.push(max);
        }
        return pages;
    }

    // --- INISIALISASI ---
    initialize();
}); 
