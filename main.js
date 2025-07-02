document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Logic
    const menuTrigger = document.getElementById('burger-menu-trigger');
    const mainNav = document.getElementById('main-nav');
    const overlay = document.getElementById('menu-overlay');

    if (menuTrigger && mainNav && overlay) {
        const closeMenu = () => {
            mainNav.classList.remove('active');
            overlay.classList.remove('active');
        };

        menuTrigger.addEventListener('click', (event) => {
            event.stopPropagation();
            mainNav.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        // Event listener untuk tombol close 'X' di dalam menu
        const closeBtn = document.getElementById('nav-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeMenu);
        }

        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }

    // Mobile Search Logic (REMOVED as it's now always visible)
    
    // --- FUNGSI GLOBAL & DATA BERSAMA ---
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvsDmDoerDTDgV39Op65g8D_fGyCyTy82StbSzsACbpQoYnetw96E4mQ1T0suIHfhR/exec";
    
    let allDataCache = [];
    let allBusinessData = [];

    async function fetchData() {
        if (allDataCache.length > 0) return allDataCache;
        try {
            const response = await fetch(SCRIPT_URL, { cache: 'no-cache' });
            if (!response.ok) throw new Error(`Gagal mengambil data: ${response.statusText}`);
            const result = await response.json();
            if (result.status === "success") {
                allDataCache = result.data;
                allBusinessData = allDataCache.flatMap(member => 
                    (member.usaha && member.usaha.length > 0) 
                    ? member.usaha.map(u => ({ ...member, ...u })) 
                    : []
                );
                return allDataCache;
            } else {
                throw new Error(result.message || 'Terjadi kesalahan dari server.');
            }
        } catch (error) {
            console.error("Gagal memuat data:", error);
            const directoryGrid = document.getElementById('directory-grid');
            if (directoryGrid) {
                directoryGrid.innerHTML = `<p class="error-message">Gagal memuat data. Silakan coba muat ulang halaman.</p>`;
            }
            return [];
        }
    }
    
    // --- Logika untuk Halaman Beranda (index.html) ---
    const directoryGrid = document.getElementById('directory-grid');
    if (directoryGrid) {
        initializeHomepage();
    }

    let currentView = 'usaha';
    let filteredBusinessData = [];
    let currentPage = 1;
    const CARDS_PER_PAGE = 120;
    let currentSort = { by: 'newest' };

    function masterFilterHandler() {
        currentPage = 1; 
        if (currentView === 'usaha') {
            applyAndRenderBusinessFilters();
        } else {
            applyAndRenderMemberFilters();
        }
    }

    function updateTotalCount(count) {
        const countEl = document.getElementById('total-count');
        if (countEl) {
            countEl.textContent = `${count} Data`;
        }
    }

    async function initializeHomepage() {
        showLoading(directoryGrid, 'Memuat data...');
        await fetchData();
        
        // Setup event listeners setelah data siap
        setupHomepageEventListeners();

        populateFilters();
        masterFilterHandler();
    }

    function setupHomepageEventListeners() {
        const viewToggleLink = document.getElementById('view-toggle-link');
        const searchBar = document.getElementById('desktop-search-bar');
        const categoryFilter = document.getElementById('filter-category');
        const domicileFilter = document.getElementById('filter-domicile');
        const sortBtn = document.getElementById('sortDropdownBtn');
        const sortMenu = document.getElementById('sortDropdownMenu');

        if (viewToggleLink) {
            viewToggleLink.addEventListener('click', (e) => {
                e.preventDefault();
                const gridTitle = document.getElementById('grid-title');
                const directoryGrid = document.getElementById('directory-grid');
                if (currentView === 'usaha') {
                    currentView = 'anggota';
                    gridTitle.textContent = 'Daftar Seluruh Anggota';
                    viewToggleLink.textContent = 'Lihat Daftar Usaha';
                    if(categoryFilter) categoryFilter.parentElement.style.display = 'none';
                    if(searchBar) searchBar.placeholder = 'Cari Nama Anggota';
                    if(sortBtn) sortBtn.style.display = 'none';
                    directoryGrid.classList.add('list-view');
                } else {
                    currentView = 'usaha';
                    gridTitle.textContent = 'Daftar Usaha Santri';
                    viewToggleLink.textContent = 'Lihat Daftar Anggota';
                    if(categoryFilter) categoryFilter.parentElement.style.display = '';
                    if(searchBar) searchBar.placeholder = 'Cari Nama Usaha atau Anggota';
                    if(sortBtn) sortBtn.style.display = '';
                    directoryGrid.classList.remove('list-view');
                }
                masterFilterHandler();
            });
        }
        
        if(searchBar) searchBar.addEventListener('input', masterFilterHandler);
        if(categoryFilter) categoryFilter.addEventListener('change', masterFilterHandler);
        if(domicileFilter) domicileFilter.addEventListener('change', masterFilterHandler);

        if (sortBtn && sortMenu) {
            sortBtn.onclick = function(e) {
                e.stopPropagation();
                sortMenu.parentElement.classList.toggle('open');
            };
            document.body.addEventListener('click', function() {
                sortMenu.parentElement.classList.remove('open');
            });
            sortMenu.querySelectorAll('.sort-option').forEach(opt => {
                opt.onclick = function(e) {
                    e.stopPropagation();
                    currentSort.by = opt.dataset.sort;
                    let label = opt.textContent;
                    sortBtn.innerHTML = `${label} <i class="fas fa-chevron-down"></i>`;
                    sortMenu.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
                    opt.classList.add('active');
                    sortMenu.parentElement.classList.remove('open');
                    masterFilterHandler();
                };
            });
            const defaultSortOption = sortMenu.querySelector('.sort-option[data-sort="newest"]');
            if (defaultSortOption) {
                defaultSortOption.classList.add('active');
                sortBtn.innerHTML = `Post Terbaru <i class="fas fa-chevron-down"></i>`;
            }
        }
    }
    
    function populateFilters() {
        const categoryFilter = document.getElementById('filter-category');
        const domicileFilter = document.getElementById('filter-domicile');

        if (categoryFilter) {
            const categories = [...new Set(allBusinessData.map(b => b.kategori_usaha).filter(Boolean))];
            categoryFilter.innerHTML = '<option value="">Semua Kategori</option>';
            categories.sort().forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }
        
        if (domicileFilter) {
            const domiciles = [...new Set(allDataCache.map(m => m.domisili).filter(Boolean))];
            domicileFilter.innerHTML = '<option value="">Semua Domisili</option>';
            domiciles.sort().forEach(domicile => {
                const option = document.createElement('option');
                option.value = domicile;
                option.textContent = domicile;
                domicileFilter.appendChild(option);
            });
        }
    }

    function applyAndRenderBusinessFilters() {
        const searchBar = document.getElementById('desktop-search-bar');
        const categoryFilter = document.getElementById('filter-category');
        const domicileFilter = document.getElementById('filter-domicile');
        
        const searchTerm = searchBar ? searchBar.value.toLowerCase() : '';
        const selectedCategory = categoryFilter ? categoryFilter.value : '';
        const selectedDomicile = domicileFilter ? domicileFilter.value : '';

        const filteredData = allBusinessData.filter(business => {
            const nameMatch = business.nama_usaha.toLowerCase().includes(searchTerm);
            const ownerMatch = business.nama_lengkap.toLowerCase().includes(searchTerm);
            const categoryMatch = !selectedCategory || business.kategori_usaha === selectedCategory;
            const domicileMatch = !selectedDomicile || business.domisili === selectedDomicile;

            return (nameMatch || ownerMatch) && categoryMatch && domicileMatch;
        });

        renderBusinessList(filteredData);
        updateTotalCount(filteredData.length);
    }
    
    function applyAndRenderMemberFilters() {
        const searchBar = document.getElementById('desktop-search-bar');
        const domicileFilter = document.getElementById('filter-domicile');

        const searchTerm = searchBar ? searchBar.value.toLowerCase() : '';
        const selectedDomicile = domicileFilter ? domicileFilter.value : '';

        const filteredData = allDataCache.filter(member => {
            const nameMatch = member.nama_lengkap.toLowerCase().includes(searchTerm);
            const domicileMatch = !selectedDomicile || member.domisili === selectedDomicile;
            return nameMatch && domicileMatch;
        });
        
        const sortedData = sortMemberData(filteredData, currentSort.by);
        renderMemberList(sortedData);
        updateTotalCount(sortedData.length);
    }

    // --- PAGINATION & SORTING ---
    function sortBusinessData(data, sortBy) {
        let sorted = [...data];
        if (sortBy === 'az') {
            sorted.sort((a, b) => (a.nama_usaha || '').localeCompare(b.nama_usaha || '', 'id'));
        } else if (sortBy === 'za') {
            sorted.sort((a, b) => (b.nama_usaha || '').localeCompare(a.nama_usaha || '', 'id'));
        } else if (sortBy === 'oldest') {
            sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } else {
            // newest
            sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        return sorted;
    }

    function sortMemberData(data, sortBy) {
        let sorted = [...data];
        if (sortBy === 'az') {
            sorted.sort((a, b) => (a.nama_lengkap || '').localeCompare(b.nama_lengkap || '', 'id'));
        } else if (sortBy === 'za') {
            sorted.sort((a, b) => (b.nama_lengkap || '').localeCompare(a.nama_lengkap || '', 'id'));
        } else if (sortBy === 'oldest') {
            sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        } else { // newest
            sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        return sorted;
    }

    function getPaginatedData(data, page) {
        const start = (page - 1) * CARDS_PER_PAGE;
        const end = start + CARDS_PER_PAGE;
        return data.slice(start, end);
    }

    function renderPaginationControls(totalItems, currentPage, containerId) {
        const totalPages = Math.ceil(totalItems / CARDS_PER_PAGE);
        const container = document.getElementById(containerId);
        if (!container) return;
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="pagination-btn${i === currentPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
        }
        container.innerHTML = html;
        container.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.onclick = e => {
                currentPage = parseInt(btn.dataset.page);
                masterFilterHandler();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
        });
    }

    function renderBusinessList(businessList) {
        directoryGrid.innerHTML = '';
        const sortedData = sortBusinessData(businessList, currentSort.by);
        if (sortedData.length === 0) {
            directoryGrid.innerHTML = '<div class="no-results-card"><i class="fas fa-info-circle"></i><p>Tidak ada hasil yang ditemukan</p><span>Coba kata kunci atau filter yang berbeda.</span></div>';
            return;
        }
        sortedData.forEach(business => {
            const card = createBusinessCard(business);
            directoryGrid.appendChild(card);
        });
    }

    function renderMemberList(memberList) {
        directoryGrid.innerHTML = '';
        if (memberList.length === 0) {
            directoryGrid.innerHTML = '<div class="no-results-card"><i class="fas fa-info-circle"></i><p>Tidak ada hasil yang ditemukan</p><span>Coba kata kunci atau filter yang berbeda.</span></div>';
            return;
        }
        memberList.forEach(member => {
            const card = createMemberListItem(member);
            directoryGrid.appendChild(card);
        });
    }

    // --- RENDER FUNCTIONS (CARD CREATION) ---

    function createMemberListItem(member) {
        const item = document.createElement('a');
        item.href = `detail-anggota.html?id=${member.id_anggota}`;
        item.className = 'member-list-item';

        let profession = member.profesi || 'Belum diisi';
        if (member.nama_lembaga) {
            profession += ` di ${member.nama_lembaga}`;
        }

        item.innerHTML = `
            <div class="member-list-avatar">${member.nama_lengkap.charAt(0)}</div>
            <div class="member-list-details">
                <h3 class="member-list-name">${member.nama_lengkap}</h3>
                <p class="member-list-profession">${profession}</p>
                <span class="member-list-domicile"><i class="fas fa-map-marker-alt"></i> ${member.domisili || 'Lokasi tidak diketahui'}</span>
            </div>
        `;
        return item;
    }

    function showLoading(container, message) {
        if (container) {
            container.innerHTML = `<div class="loading-container"><div class="spinner"></div><p>${message || 'Memuat...'}</p></div>`;
        }
    }
    
    function createBusinessCard(businessData) {
        const card = document.createElement('a');
        card.href = `detail-usaha.html?id=${businessData.id_usaha}`;
        card.className = 'member-card';

        const baseAssetUrl = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/usaha/';
        const defaultImgUrl = `${baseAssetUrl}default_image_usaha.jpg`;
        const businessImgUrl = `${baseAssetUrl}${businessData.id_usaha}.jpg`;

        const contactIcons = [];
        if (businessData.whatsapp) {
            contactIcons.push(`<a href="https://wa.me/${businessData.whatsapp.replace(/\D/g, '')}" target="_blank" class="card-icon-link" onclick="event.stopPropagation()"><i class="fab fa-whatsapp"></i></a>`);
        }
        if (businessData.website_usaha) {
            contactIcons.push(`<a href="${businessData.website_usaha}" target="_blank" class="card-icon-link" onclick="event.stopPropagation()"><i class="fas fa-globe"></i></a>`);
        }
        // Simplified check for online shops
        const olshops = {'tokopedia': 'icon-tokopedia.svg', 'shopee': 'icon-shopee.svg', 'bukalapak':'icon-bukalapak.svg', 'blibli': 'icon-blibli.svg', 'tiktok': 'icon-tiktok.svg'};
        for(const key in olshops) {
            if(businessData[key]) {
                contactIcons.push(`<a href="${businessData[key]}" target="_blank" class="card-icon-link" onclick="event.stopPropagation()"><img src="assets/marketplace/${olshops[key]}" class="marketplace-icon"></a>`);
            }
        }
        
        card.innerHTML = `
            <div class="card-banner">
                <img src="${businessImgUrl}" alt="Gambar ${businessData.nama_usaha}" loading="lazy" onerror="this.onerror=null; this.src='${defaultImgUrl}';">
                <div class="card-location-overlay"><i class="fas fa-map-marker-alt"></i><span>${businessData.domisili_usaha || businessData.domisili || 'Lokasi'}</span></div>
            </div>
            <div class="card-content">
                <h3 class="card-business-name">${businessData.nama_usaha}</h3>
                <p class="card-description">${businessData.jenis_usaha || ''}</p>
                <div class="card-bottom-row">
                    <div class="card-owner"><i class="fas fa-user"></i> ${businessData.nama_lengkap}</div>
                    <div class="card-icon-container">${contactIcons.join('')}</div>
                </div>
            </div>
        `;
        return card;
    }

    function getDistance(lat1, lon1, lat2, lon2) {
        if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0;
        }
        if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}); 
