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
    
    // --- Hero Slider Logic ---
    const sliderContainer = document.querySelector('.slider-container');
    if (sliderContainer) {
        const slides = document.querySelectorAll('.slide');
        const dotsContainer = document.querySelector('.slider-dots');
        let currentSlide = 0;
        let slideInterval;

        function createDots() {
            slides.forEach((_, i) => {
                const dot = document.createElement('div');
                dot.classList.add('dot');
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => {
                    goToSlide(i);
                    resetInterval();
                });
                dotsContainer.appendChild(dot);
            });
        }

        function goToSlide(n) {
            slides[currentSlide].classList.remove('active');
            dotsContainer.children[currentSlide].classList.remove('active');
            currentSlide = (n + slides.length) % slides.length;
            slides[currentSlide].classList.add('active');
            dotsContainer.children[currentSlide].classList.add('active');
        }

        function nextSlide() {
            goToSlide(currentSlide + 1);
        }

        function startInterval() {
            slideInterval = setInterval(nextSlide, 5000);
        }

        function resetInterval() {
            clearInterval(slideInterval);
            startInterval();
        }

        if (slides.length > 0) {
            slides[0].classList.add('active'); // Activate first slide before anything else
            createDots();
            startInterval();
        }
    }

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
    const CARDS_PER_PAGE = 12; // Reduced from 120 to a more reasonable number
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
        const professionFilter = document.getElementById('filter-profession');
        const domicileFilter = document.getElementById('filter-domicile');
        const angkatanFilter = document.getElementById('filter-angkatan');
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
                    if(categoryFilter) categoryFilter.style.display = 'none';
                    if(professionFilter) professionFilter.style.display = '';
                    if(searchBar) searchBar.placeholder = 'Cari Nama Anggota';
                    if(sortBtn) sortBtn.style.display = '';
                    directoryGrid.classList.add('list-view');
                } else {
                    currentView = 'usaha';
                    gridTitle.textContent = 'Daftar Usaha Santri';
                    viewToggleLink.textContent = 'Lihat Daftar Anggota';
                    if(categoryFilter) categoryFilter.style.display = '';
                    if(professionFilter) professionFilter.style.display = 'none';
                    if(searchBar) searchBar.placeholder = 'Cari Nama Usaha atau Anggota';
                    if(sortBtn) sortBtn.style.display = '';
                    directoryGrid.classList.remove('list-view');
                }
                masterFilterHandler();
            });
        }
        
        if(searchBar) searchBar.addEventListener('input', masterFilterHandler);
        if(categoryFilter) categoryFilter.addEventListener('change', masterFilterHandler);
        if(professionFilter) professionFilter.addEventListener('change', masterFilterHandler);
        if(domicileFilter) domicileFilter.addEventListener('change', masterFilterHandler);
        if(angkatanFilter) angkatanFilter.addEventListener('change', masterFilterHandler);

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
        const professionFilter = document.getElementById('filter-profession');
        const angkatanFilter = document.getElementById('filter-angkatan');

        if (categoryFilter) {
            const categories = [...new Set(allBusinessData.map(b => b.kategori_usaha ? b.kategori_usaha.trim() : b.kategori_usaha).filter(Boolean))];
            categoryFilter.innerHTML = '<option value="">Semua Kategori Usaha</option>';
            categories.sort().forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }
        
        if (domicileFilter) {
            // Kumpulkan dari domisili anggota dan domisili usaha
            const memberDomiciles = allDataCache.map(m => m.domisili ? m.domisili.trim() : null);
            const businessDomiciles = allBusinessData.map(b => b.domisili_usaha ? b.domisili_usaha.trim() : null);
            
            // Gabungkan, hilangkan duplikat, dan urutkan
            const domiciles = [...new Set([...memberDomiciles, ...businessDomiciles].filter(Boolean))];
            
            domicileFilter.innerHTML = '<option value="">Semua Domisili</option>';
            domiciles.sort().forEach(domicile => {
                const option = document.createElement('option');
                option.value = domicile;
                option.textContent = domicile;
                domicileFilter.appendChild(option);
            });
        }
        
        if (professionFilter) {
            const professions = [...new Set(allDataCache.map(m => m.profesi ? m.profesi.trim() : m.profesi).filter(Boolean))];
            professionFilter.innerHTML = '<option value="">Semua Profesi</option>';
            professions.sort().forEach(p => {
                const option = document.createElement('option');
                option.value = p;
                option.textContent = p;
                professionFilter.appendChild(option);
            });
        }

        if (angkatanFilter) {
            const angkatan = [...new Set(allDataCache.map(m => m.tahun_keluar).filter(Boolean))].sort((a, b) => b - a);
            angkatanFilter.innerHTML = '<option value="">Semua Angkatan</option>';
            angkatan.forEach(a => {
                const option = document.createElement('option');
                option.value = a;
                option.textContent = a;
                angkatanFilter.appendChild(option);
            });
        }
    }

    function applyAndRenderBusinessFilters() {
        const searchBar = document.getElementById('desktop-search-bar');
        const categoryFilter = document.getElementById('filter-category');
        const domicileFilter = document.getElementById('filter-domicile');
        const angkatanFilter = document.getElementById('filter-angkatan');
        
        const searchTerm = searchBar ? searchBar.value.toLowerCase() : '';
        const selectedCategory = categoryFilter ? categoryFilter.value : '';
        const selectedDomicile = domicileFilter ? domicileFilter.value : '';
        const selectedAngkatan = angkatanFilter ? angkatanFilter.value : '';

        const filteredData = allBusinessData.filter(business => {
            const nameMatch = business.nama_usaha.toLowerCase().includes(searchTerm);
            const ownerMatch = business.nama_lengkap.toLowerCase().includes(searchTerm);
            const categoryMatch = !selectedCategory || business.kategori_usaha === selectedCategory;
            const domicileMatch = !selectedDomicile || business.domisili === selectedDomicile || business.domisili_usaha === selectedDomicile;
            const angkatanMatch = !selectedAngkatan || business.tahun_keluar == selectedAngkatan;

            return (nameMatch || ownerMatch) && categoryMatch && domicileMatch && angkatanMatch;
        });

        renderBusinessList(filteredData);
        updateTotalCount(filteredData.length);
    }
    
    function applyAndRenderMemberFilters() {
        const searchBar = document.getElementById('desktop-search-bar');
        const domicileFilter = document.getElementById('filter-domicile');
        const professionFilter = document.getElementById('filter-profession');
        const angkatanFilter = document.getElementById('filter-angkatan');

        const searchTerm = searchBar ? searchBar.value.toLowerCase() : '';
        const selectedDomicile = domicileFilter ? domicileFilter.value : '';
        const selectedProfession = professionFilter ? professionFilter.value : '';
        const selectedAngkatan = angkatanFilter ? angkatanFilter.value : '';

        const filteredData = allDataCache.filter(member => {
            const nameMatch = member.nama_lengkap.toLowerCase().includes(searchTerm);
            const domicileMatch = !selectedDomicile || member.domisili === selectedDomicile;
            const professionMatch = !selectedProfession || member.profesi === selectedProfession;
            const angkatanMatch = !selectedAngkatan || member.tahun_keluar == selectedAngkatan;
            return nameMatch && domicileMatch && professionMatch && angkatanMatch;
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
        } else { // 'newest' is the default
            sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        return sorted;
    }

    function getPaginatedData(data, page) {
        const startIndex = (page - 1) * CARDS_PER_PAGE;
        const endIndex = startIndex + CARDS_PER_PAGE;
        return data.slice(startIndex, endIndex);
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
        
        // Get paginated data
        const paginatedData = getPaginatedData(sortedData, currentPage);
        paginatedData.forEach(business => {
            const card = createBusinessCard(business);
            directoryGrid.appendChild(card);
        });
        
        // Render pagination controls
        renderPaginationControls(sortedData.length, currentPage, 'pagination-container');
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
        const defaultImgUrl = `assets/usaha/default_image_usaha.jpg`;
        const businessImgUrl = `${baseAssetUrl}${businessData.id_usaha}.jpg`;
    
        const gmapsUrl = businessData.url_gmaps_perusahaan || 
            (businessData.domisili_usaha ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessData.domisili_usaha)}` : '#');
        const locationText = businessData.domisili_usaha || businessData.domisili || 'Lokasi';
        const nickname = businessData.nama_panggilan ? ` &nbsp;&bull;&nbsp; ${businessData.nama_panggilan}` : '';
    
        const contactIcons = [];
        const waNumber = (businessData.whatsapp || '').replace(/[^0-9]/g, '');
        if (waNumber) {
            contactIcons.push(`<a href="https://wa.me/62${waNumber}" target="_blank" class="card-icon-link" onclick="event.stopPropagation()" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>`);
        }
        if (businessData.website_usaha) {
            contactIcons.push(`<a href="${businessData.website_usaha}" target="_blank" class="card-icon-link" onclick="event.stopPropagation()" title="Website"><i class="fas fa-globe"></i></a>`);
        }
        
        const socialMediaMap = {
            instagram: { icon: 'fa-instagram', url: businessData.instagram },
            facebook: { icon: 'fa-facebook', url: businessData.facebook },
            tiktok: { icon: 'fa-tiktok', url: businessData.tiktok },
            youtube: { icon: 'fa-youtube', url: businessData.youtube }
        };

        for (const [key, value] of Object.entries(socialMediaMap)) {
            if (value.url) {
                contactIcons.push(`<a href="${value.url}" target="_blank" class="card-icon-link" onclick="event.stopPropagation()" title="${key.charAt(0).toUpperCase() + key.slice(1)}"><i class="fab ${value.icon}"></i></a>`);
            }
        }

        const olshops = {
            tokopedia: { icon: 'tokopedia.svg', url: businessData.tokopedia },
            shopee: { icon: 'shopee.svg', url: businessData.shopee },
            bukalapak: { icon: 'bukalapak.svg', url: businessData.bukalapak },
            blibli: { icon: 'blibli.svg', url: businessData.blibli },
            tiktokshop: { icon: 'tiktokshop.svg', url: businessData.tiktok }
        };

        for (const [key, value] of Object.entries(olshops)) {
            if (value.url) {
                contactIcons.push(`<a href="${value.url}" target="_blank" class="card-icon-link" onclick="event.stopPropagation()" title="${key.charAt(0).toUpperCase() + key.slice(1)}"><img src="assets/marketplace/${value.icon}" class="marketplace-icon"></a>`);
            }
        }
        
        card.innerHTML = `
            <div class="card-banner">
                <img src="${businessImgUrl}" alt="Gambar ${businessData.nama_usaha}" loading="lazy" onerror="this.onerror=null; this.src='${defaultImgUrl}';">
                <a href="${gmapsUrl}" target="_blank" class="card-location-overlay" onclick="event.stopPropagation()">
                    <i class="fas fa-map-marker-alt"></i><span>${locationText}${nickname}</span>
                </a>
            </div>
            <div class="card-content">
                <h3 class="card-business-name">${businessData.nama_usaha}</h3>
                <p class="card-description">${businessData.jenis_usaha || ''}</p>
                <div class="card-bottom-row">
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
