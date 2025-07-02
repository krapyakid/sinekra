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
                if (currentView === 'usaha') {
                    currentView = 'anggota';
                    gridTitle.textContent = 'Daftar Seluruh Anggota';
                    viewToggleLink.textContent = 'Lihat Daftar Usaha';
                    if(categoryFilter) categoryFilter.style.display = 'none';
                    if(sortBtn) sortBtn.style.display = 'none';
                    if(searchBar) searchBar.placeholder = 'Cari Nama Anggota';
                } else {
                    currentView = 'usaha';
                    gridTitle.textContent = 'Daftar Usaha Santri';
                    viewToggleLink.textContent = 'Lihat Daftar Anggota';
                    if(categoryFilter) categoryFilter.style.display = '';
                    if(sortBtn) sortBtn.style.display = '';
                    if(searchBar) searchBar.placeholder = 'Cari Nama Usaha atau Anggota';
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
        const directoryGrid = document.getElementById('directory-grid');
        if (!directoryGrid) return;
        directoryGrid.innerHTML = '';
        if (businessList.length === 0) {
            directoryGrid.innerHTML = '<p>Tidak ada usaha yang cocok dengan kriteria pencarian Anda.</p>';
            renderPaginationControls(0, 1, 'pagination-top');
            renderPaginationControls(0, 1, 'pagination-bottom');
            return;
        }
        filteredBusinessData = sortBusinessData(businessList, currentSort.by);
        const paginated = getPaginatedData(filteredBusinessData, currentPage);
        paginated.forEach((businessData, idx) => {
            directoryGrid.appendChild(createMemberCard(businessData));
        });
        renderPaginationControls(filteredBusinessData.length, currentPage, 'pagination-top');
        renderPaginationControls(filteredBusinessData.length, currentPage, 'pagination-bottom');
    }

    function renderMemberList(memberList) {
        const directoryGrid = document.getElementById('directory-grid');
        if (!directoryGrid) return;

        directoryGrid.innerHTML = '';
        if (memberList.length === 0) {
            directoryGrid.innerHTML = '<p>Tidak ada anggota yang cocok dengan kriteria pencarian Anda.</p>';
            updateTotalCount(0);
            return;
        }

        memberList.forEach(member => {
            directoryGrid.appendChild(createSimpleMemberCard(member));
        });
    }

    // --- Logika untuk Halaman Direktori (direktori.html) ---
    if (document.getElementById('direktori-list-container')) {
        displayMemberList();
    }
    
    async function displayMemberList() {
        const listContainer = document.getElementById('direktori-list-container');
        if (!listContainer) return;

        listContainer.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Memuat data anggota...</p>
            </div>`;

        const members = await fetchData();
        
        if (members.length === 0) {
            listContainer.innerHTML = '<p>Gagal memuat data atau tidak ada anggota.</p>';
            return;
        }

        listContainer.innerHTML = '';
        members.forEach(member => {
            listContainer.appendChild(createMemberListItem(member));
        });
    }

    // --- FUNGSI PEMBUATAN ITEM LIST ANGGOTA ---
    function createMemberListItem(member) {
        const item = document.createElement('div');
        item.className = 'member-list-item';

        const name = document.createElement('h3');
        name.className = 'member-name';
        name.textContent = member.nama_lengkap || 'Nama Tidak Tersedia';

        const details = document.createElement('p');
        details.className = 'member-details';
        const detailParts = [
            member.nama_panggilan ? `(${member.nama_panggilan})` : '',
            member.detail_profesi,
            member.domisili
        ].filter(Boolean).join(' • '); // Menyaring nilai kosong
        details.textContent = detailParts || 'Informasi tidak tersedia';

        item.append(name, details);
        return item;
    }

    function showLoading(container, message) {
        if (!container) return;
        container.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }

    function createSimpleMemberCard(member) {
        const card = document.createElement('div');
        card.className = 'member-card';
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            if (member.id_anggota) {
                window.location.href = `detail.html?id=${member.id_anggota}`;
            }
        });

        const content = document.createElement('div');
        content.className = 'card-content';

        const name = document.createElement('h3');
        name.className = 'card-business-name';
        name.textContent = member.nama_lengkap || 'Nama Tidak Tersedia';

        const description = document.createElement('p');
        description.className = 'card-description';
        const detailParts = [
            member.profesi,
            member.detail_profesi,
        ].filter(Boolean).join(' / ');
        description.textContent = detailParts || 'Informasi tidak tersedia.';

        content.append(name, description);
        card.append(content);
        return card;
    }

    function createMemberCard(businessData) {
        const baseRepoUrl = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/usaha/';
        const defaultImgUrl = `${baseRepoUrl}default_image_usaha.jpg`;
        const memberImgUrl = `${baseRepoUrl}${businessData.id_anggota}.jpg`;
        const businessImgUrl = `${baseRepoUrl}${businessData.id_usaha}.jpg`;

        const mapsUrl = businessData.url_gmaps_perusahaan 
            || (businessData.domisili ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessData.domisili)}` : '#');
        const hasMapsUrl = mapsUrl !== '#' ? 'clickable' : '';

        // --- CONTACT ICONS LOGIC ---
        const contactIcons = [];
        // 1. WhatsApp
        if (businessData.whatsapp) {
            contactIcons.push(`<a href="https://wa.me/${businessData.whatsapp.replace(/\D/g, '')}" target="_blank" rel="noopener noreferrer" class="card-contact-icon" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>`);
        }
        // 2. Website
        if (businessData.website_usaha) {
            contactIcons.push(`<a href="${businessData.website_usaha}" target="_blank" rel="noopener noreferrer" class="card-contact-icon" title="Website"><i class="fas fa-globe"></i></a>`);
        }
        // 3. Olshop
        const olshops = ['tokopedia', 'shopee', 'bukalapak', 'blibli', 'tiktok'];
        olshops.forEach(shop => {
            if (businessData[shop]) {
                contactIcons.push(`<a href="${businessData[shop]}" target="_blank" rel="noopener noreferrer" class="card-contact-icon" title="${shop.charAt(0).toUpperCase() + shop.slice(1)}"><img src="assets/marketplace/icon-${shop}.svg" class="olshop-icon"></a>`);
            }
        });
        // 4. Social Media
        if (businessData.sosmed_usaha) {
            contactIcons.push(`<a href="${businessData.sosmed_usaha}" target="_blank" rel="noopener noreferrer" class="card-contact-icon" title="Social Media"><i class="fas fa-share-alt"></i></a>`);
        }

        const card = document.createElement('div');
        card.className = 'member-card';
        card.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            if (businessData.id_anggota) {
                window.location.href = `detail.html?id=${businessData.id_anggota}`;
            }
        });

        card.innerHTML = `
            <div class="card-header">
                <div class="card-contact-links">
                    
                </div>
            </div>
            <div class="card-banner">
                <a href="detail.html?id=${businessData.id_anggota}" class="card-banner-link">
                    <img src="${businessImgUrl}" alt="Gambar Usaha ${businessData.nama_usaha}" 
                         onerror="this.onerror=null; this.src='${memberImgUrl}'; this.onerror=function(){this.onerror=null; this.src='${defaultImgUrl}';};">
                </a>
                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="card-location-overlay ${hasMapsUrl}">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${businessData.domisili || 'Lokasi'}</span>
                </a>
            </div>
            <div class="card-content">
                <h3 class="card-business-name">
                    ${businessData.nama_usaha}
                </h3>
                <p class="card-description">
                    ${businessData.jenis_usaha || 'Jenis usaha tidak tersedia.'}
                </p>
                <div class="card-owner-icons">
                    ${contactIcons.join('')}
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
