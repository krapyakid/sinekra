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
    
    // --- Sticky Filter Logic ---
    const stickyFilterSection = document.querySelector('.search-and-filter-section');
    const heroSection = document.querySelector('.hero-section');
    
    if (stickyFilterSection && heroSection) {
        let isSticky = false;
        
        function handleStickyFilter() {
            const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop >= heroBottom && !isSticky) {
                // Activate sticky when hero is scrolled past
                stickyFilterSection.classList.add('sticky-active');
                isSticky = true;
            } else if (scrollTop < heroBottom && isSticky) {
                // Deactivate sticky when back to top
                stickyFilterSection.classList.remove('sticky-active');
                isSticky = false;
            }
        }
        
        // Add scroll listener
        window.addEventListener('scroll', handleStickyFilter);
        
        // Check initial state
        handleStickyFilter();
    }
    
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
                console.log('Raw data from server:', result.data);
                
                // Log sample member data
                if (result.data.length > 0) {
                    console.log('Sample member data:', {
                        first: result.data[0],
                        domisili_field: result.data[0].domisili,
                        total_members: result.data.length
                    });
                }
                
                allDataCache = result.data;
                allBusinessData = allDataCache.flatMap(member => 
                    (member.usaha && member.usaha.length > 0) 
                    ? member.usaha.map(u => ({ ...member, ...u })) 
                    : []
                );

                // Log processed business data
                console.log('Processed business data:', {
                    total_businesses: allBusinessData.length,
                    sample: allBusinessData.length > 0 ? allBusinessData[0] : null
                });

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
    let currentPage = 1;
    const CARDS_PER_PAGE = 40; // Diubah dari 12 menjadi 40 card per halaman
    let currentSort = { by: 'newest' };
    
    // State untuk pencarian dan filter
    let currentSearch = '';
    let currentFilters = {
        filter1: '', // Kategori Usaha atau Profesi
        filter2: ''  // Domisili
    };
    let filteredData = [];

    function updateTotalCount(count) {
        const countEl = document.getElementById('total-count');
        if (countEl) {
            countEl.textContent = `${count} Data`;
        }
    }

    // Master filter handler - menggabungkan pencarian, filter, dan sorting
    function masterFilterHandler() {
        currentPage = 1; // Reset ke halaman pertama saat filter berubah
        
        if (currentView === 'usaha') {
            applyAndRenderBusinessFilters();
        } else {
            applyAndRenderMemberFilters();
        }
    }
    
    // Fungsi pencarian untuk usaha
    function searchBusinessData(data, searchTerm) {
        if (!searchTerm) return data;
        
        const term = searchTerm.toLowerCase();
        return data.filter(business => {
            const namaUsaha = (business.nama_usaha || '').toLowerCase();
            const namaAnggota = (business.nama_lengkap || '').toLowerCase();
            return namaUsaha.includes(term) || namaAnggota.includes(term);
        });
    }
    
    // Fungsi pencarian untuk anggota
    function searchMemberData(data, searchTerm) {
        if (!searchTerm) return data;
        
        const term = searchTerm.toLowerCase();
        return data.filter(member => {
            const namaAnggota = (member.nama_lengkap || '').toLowerCase();
            return namaAnggota.includes(term);
        });
    }
    
    // Filter usaha berdasarkan kategori dan domisili
    function filterBusinessData(data, filters) {
        let filtered = [...data];
        
        if (filters.filter1) { // Kategori Usaha
            filtered = filtered.filter(business => 
                (business.kategori_usaha || '').toLowerCase().includes(filters.filter1.toLowerCase())
            );
        }
        
        if (filters.filter2) { // Domisili Usaha
            filtered = filtered.filter(business => {
                const domisiliUsaha = business.domisili_usaha || business.domisili || '';
                return domisiliUsaha.toLowerCase().includes(filters.filter2.toLowerCase());
            });
        }
        
        return filtered;
    }
    
    // Filter anggota berdasarkan profesi dan domisili
    function filterMemberData(data, filters) {
        let filtered = [...data];
        
        if (filters.filter1) { // Profesi
            filtered = filtered.filter(member => 
                (member.profesi || '').toLowerCase().includes(filters.filter1.toLowerCase())
            );
        }
        
        if (filters.filter2) { // Domisili Anggota
            filtered = filtered.filter(member => 
                (member.domisili || '').toLowerCase().includes(filters.filter2.toLowerCase())
            );
        }
        
        return filtered;
    }
    
    // Aplikasi filter dan render untuk usaha
    function applyAndRenderBusinessFilters() {
        let data = [...allBusinessData];
        
        // Aplikasi pencarian
        data = searchBusinessData(data, currentSearch);
        
        // Aplikasi filter
        data = filterBusinessData(data, currentFilters);
        
        // Simpan data yang sudah difilter
        filteredData = data;
        
        // Render dengan data yang sudah difilter
        renderBusinessList(data);
    }
    
    // Aplikasi filter dan render untuk anggota
    function applyAndRenderMemberFilters() {
        let data = [...allDataCache];
        
        // Aplikasi pencarian
        data = searchMemberData(data, currentSearch);
        
        // Aplikasi filter
        data = filterMemberData(data, currentFilters);
        
        // Simpan data yang sudah difilter
        filteredData = data;
        
        // Render dengan data yang sudah difilter
        renderMemberList(data);
    }
    
    // Update UI berdasarkan konteks (Usaha atau Anggota)
    function updateContextualUI() {
        const searchInput = document.getElementById('search-input');
        const filter1Label = document.getElementById('filter-1-label');
        const filter2Label = document.getElementById('filter-2-label');
        
        if (currentView === 'usaha') {
            if (searchInput) searchInput.placeholder = 'Cari nama usaha atau anggota...';
            if (filter1Label) filter1Label.textContent = 'Kategori Usaha';
            if (filter2Label) filter2Label.textContent = 'Domisili Usaha';
            populateBusinessFilters();
        } else {
            if (searchInput) searchInput.placeholder = 'Cari nama anggota...';
            if (filter1Label) filter1Label.textContent = 'Profesi';
            if (filter2Label) filter2Label.textContent = 'Domisili Anggota';
            populateMemberFilters();
        }
    }
    
    // Populate filter options untuk usaha
    function populateBusinessFilters() {
        const filter1 = document.getElementById('filter-1');
        const filter2 = document.getElementById('filter-2');
        
        if (!filter1 || !filter2) return;
        
        // Kategori Usaha (filter 1)
        const categories = [...new Set(allBusinessData
            .map(business => business.kategori_usaha)
            .filter(category => category && category.trim() !== '')
        )].sort();
        
        filter1.innerHTML = '<option value="">Semua Kategori</option>';
        categories.forEach(category => {
            filter1.innerHTML += `<option value="${category}">${category}</option>`;
        });
        
        // Domisili Usaha (filter 2)
        const locations = [...new Set(allBusinessData
            .map(business => business.domisili_usaha || business.domisili)
            .filter(location => location && location.trim() !== '')
        )].sort();
        
        filter2.innerHTML = '<option value="">Semua Lokasi</option>';
        locations.forEach(location => {
            filter2.innerHTML += `<option value="${location}">${location}</option>`;
        });
    }
    
    // Populate filter options untuk anggota
    function populateMemberFilters() {
        const filter1 = document.getElementById('filter-1');
        const filter2 = document.getElementById('filter-2');
        
        if (!filter1 || !filter2) return;
        
        // Profesi (filter 1)
        const professions = [...new Set(allDataCache
            .map(member => member.profesi)
            .filter(profession => profession && profession.trim() !== '')
        )].sort();
        
        filter1.innerHTML = '<option value="">Semua Profesi</option>';
        professions.forEach(profession => {
            filter1.innerHTML += `<option value="${profession}">${profession}</option>`;
        });
        
        // Domisili Anggota (filter 2)
        const locations = [...new Set(allDataCache
            .map(member => member.domisili)
            .filter(location => location && location.trim() !== '')
        )].sort();
        
        filter2.innerHTML = '<option value="">Semua Lokasi</option>';
        locations.forEach(location => {
            filter2.innerHTML += `<option value="${location}">${location}</option>`;
        });
    }

    async function initializeHomepage() {
        showLoading(directoryGrid, 'Memuat data...');
        await fetchData();
        
        // Pastikan data sudah ter-load dengan benar
        console.log('Data loaded:', {
            members: allDataCache.length,
            businesses: allBusinessData.length
        });
        
        // Setup event listeners setelah data siap
        setupHomepageEventListeners();
        
        // Setup initial contextual UI and filters
        updateContextualUI();

        // Load default data
        applyAndRenderBusinessFilters();
    }

    function setupHomepageEventListeners() {
        const viewToggleLink = document.getElementById('view-toggle-link');
        const sortBtn = document.getElementById('sortDropdownBtn');
        const sortMenu = document.getElementById('sortDropdownMenu');
        const searchInput = document.getElementById('search-input');
        const clearSearchBtn = document.getElementById('clear-search');
        const filter1 = document.getElementById('filter-1');
        const filter2 = document.getElementById('filter-2');
        const resetFiltersBtn = document.getElementById('reset-filters');

        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                currentSearch = this.value.trim();
                
                // Show/hide clear button
                if (clearSearchBtn) {
                    clearSearchBtn.style.display = currentSearch ? 'block' : 'none';
                }
                
                // Trigger filter with debounce
                clearTimeout(searchInput.debounceTimer);
                searchInput.debounceTimer = setTimeout(() => {
                    masterFilterHandler();
                }, 300);
            });
        }

        // Clear search functionality
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                if (searchInput) {
                    searchInput.value = '';
                    currentSearch = '';
                    this.style.display = 'none';
                    masterFilterHandler();
                }
            });
        }

        // Filter functionality
        if (filter1) {
            filter1.addEventListener('change', function() {
                currentFilters.filter1 = this.value;
                masterFilterHandler();
            });
        }

        if (filter2) {
            filter2.addEventListener('change', function() {
                currentFilters.filter2 = this.value;
                masterFilterHandler();
            });
        }

        // Reset filters functionality
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', function() {
                // Reset search
                if (searchInput) {
                    searchInput.value = '';
                    currentSearch = '';
                }
                if (clearSearchBtn) {
                    clearSearchBtn.style.display = 'none';
                }
                
                // Reset filters
                currentFilters.filter1 = '';
                currentFilters.filter2 = '';
                if (filter1) filter1.value = '';
                if (filter2) filter2.value = '';
                
                masterFilterHandler();
            });
        }

        if (viewToggleLink) {
            viewToggleLink.addEventListener('click', (e) => {
                e.preventDefault();
                const gridTitle = document.getElementById('grid-title');
                const directoryGrid = document.getElementById('directory-grid');
                
                // Reset search and filters when switching views
                currentSearch = '';
                currentFilters.filter1 = '';
                currentFilters.filter2 = '';
                if (searchInput) searchInput.value = '';
                if (clearSearchBtn) clearSearchBtn.style.display = 'none';
                if (filter1) filter1.value = '';
                if (filter2) filter2.value = '';
                
                if (currentView === 'usaha') {
                    currentView = 'anggota';
                    gridTitle.textContent = 'Daftar Anggota';
                    viewToggleLink.textContent = 'Lihat Daftar Usaha';
                    if(sortBtn) sortBtn.style.display = '';
                    directoryGrid.classList.add('list-view');
                    updateContextualUI();
                    applyAndRenderMemberFilters();
                } else {
                    currentView = 'usaha';
                    gridTitle.textContent = 'Daftar Usaha';
                    viewToggleLink.textContent = 'Lihat Daftar Anggota';
                    if(sortBtn) sortBtn.style.display = '';
                    directoryGrid.classList.remove('list-view');
                    updateContextualUI();
                    applyAndRenderBusinessFilters();
                }
            });
        }
        


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

    function renderPaginationControls(totalItems, currentPageNum, containerId) {
        const totalPages = Math.ceil(totalItems / CARDS_PER_PAGE);
        const container = document.getElementById(containerId);
        
        console.log('Rendering pagination:', { totalItems, currentPageNum, totalPages, containerId });
        
        if (!container) {
            console.error('Pagination container not found:', containerId);
            return;
        }
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'flex';

        let html = '';
        
        // Tombol Previous
        html += `<button type="button" class="pagination-btn prev-btn" ${currentPageNum === 1 ? 'disabled' : ''} data-page="${currentPageNum - 1}">
            <i class="fas fa-chevron-left"></i>
        </button>`;

        // Generate nomor halaman dengan ellipsis
        const pages = generatePaginationArray(currentPageNum, totalPages);
        pages.forEach(page => {
            if (page === '...') {
                html += `<span class="pagination-ellipsis">...</span>`;
            } else {
                html += `<button type="button" class="pagination-btn number-btn${page === currentPageNum ? ' active' : ''}" data-page="${page}">${page}</button>`;
            }
        });

        // Tombol Next
        html += `<button type="button" class="pagination-btn next-btn" ${currentPageNum === totalPages ? 'disabled' : ''} data-page="${currentPageNum + 1}">
            <i class="fas fa-chevron-right"></i>
        </button>`;

        container.innerHTML = html;

        // Event listener untuk tombol-tombol pagination
        const paginationButtons = container.querySelectorAll('.pagination-btn:not(:disabled)');
        console.log('Found pagination buttons:', paginationButtons.length);
        
        paginationButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const newPage = parseInt(this.dataset.page);
                console.log('Pagination clicked:', { newPage, currentPage, totalPages });
                
                if (!isNaN(newPage) && newPage !== currentPage && newPage >= 1 && newPage <= totalPages) {
                    // Update global currentPage
                    currentPage = newPage;
                    
                    // Re-render dengan filter dan pencarian yang sama
                    if (currentView === 'usaha') {
                        applyAndRenderBusinessFilters();
                    } else {
                        applyAndRenderMemberFilters();
                    }
                    
                    // Scroll ke atas halaman
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
    }

    function generatePaginationArray(current, total) {
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        if (current <= 3) {
            return [1, 2, 3, 4, '...', total];
        }

        if (current >= total - 2) {
            return [1, '...', total - 3, total - 2, total - 1, total];
        }

        return [1, '...', current - 1, current, current + 1, '...', total];
    }

    function renderBusinessList(businessList) {
        directoryGrid.innerHTML = '';
        const sortedData = sortBusinessData(businessList, currentSort.by);
        if (sortedData.length === 0) {
            directoryGrid.innerHTML = '<div class="no-results-card"><i class="fas fa-info-circle"></i><p>Tidak ada data usaha yang sesuai dengan pencarian/filter</p></div>';
            document.getElementById('pagination-container').style.display = 'none';
            updateTotalCount(0);
            return;
        }
        
        // Update total count
        updateTotalCount(sortedData.length);
        
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
        const sortedData = sortMemberData(memberList, currentSort.by);
        if (sortedData.length === 0) {
            directoryGrid.innerHTML = '<div class="no-results-card"><i class="fas fa-info-circle"></i><p>Tidak ada data anggota yang sesuai dengan pencarian/filter</p></div>';
            document.getElementById('pagination-container').style.display = 'none';
            updateTotalCount(0);
            return;
        }
        
        // Update total count
        updateTotalCount(sortedData.length);
        
        // Get paginated data
        const paginatedData = getPaginatedData(sortedData, currentPage);
        paginatedData.forEach(member => {
            const card = createMemberListItem(member);
            directoryGrid.appendChild(card);
        });
        
        // Render pagination controls
        renderPaginationControls(sortedData.length, currentPage, 'pagination-container');
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

        // Format lokasi: SVG [Nama Panggilan] | [Domisili]
        const domisiliText = member.domisili || 'Lokasi tidak diketahui';
        const nickname = member.nama_panggilan || '';
        const locationSvg = '<svg class="icon-location" width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
        const locationButtonText = nickname ? `${locationSvg}<span>${nickname}</span> | <span>${domisiliText}</span>` : `${locationSvg}<span>${domisiliText}</span>`;
        const gmapsUrl = member.domisili ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(member.domisili)}` : '#';

        item.innerHTML = `
            <div class="member-list-avatar">${member.nama_lengkap.charAt(0)}</div>
            <div class="member-list-details">
                <h3 class="member-list-name">${member.nama_lengkap}</h3>
                <p class="member-list-profession">${profession}</p>
                <a href="${gmapsUrl}" target="_blank" class="member-location-btn" onclick="event.stopPropagation()">
                    ${locationButtonText}
                </a>
                <div class="member-list-posting-date">Diposting: ${formatPostingDate(member.timestamp)}</div>
            </div>
        `;
        return item;
    }

    function showLoading(container, message) {
        if (container) {
            container.innerHTML = `<div class="loading-container"><div class="spinner"></div><p>${message || 'Memuat...'}</p></div>`;
        }
    }
    
    // Format tanggal posting
    function formatPostingDate(timestamp) {
        if (!timestamp) return 'Tanggal tidak tersedia';
        try {
            const date = new Date(timestamp);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            return 'Tanggal tidak valid';
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
            (businessData.domisili_usaha ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessData.domisili_usaha)}` : 
            (businessData.domisili ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessData.domisili)}` : '#'));
        
        // Format: SVG [Nama Panggilan] | [Domisili]
        const domisiliText = businessData.domisili_usaha || businessData.domisili || 'Lokasi tidak diketahui';
        const nickname = businessData.nama_panggilan || '';
        const locationSvg = '<svg class="icon-location" width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
        const locationButtonText = nickname ? `${locationSvg}<span>${nickname}</span> | <span>${domisiliText}</span>` : `${locationSvg}<span>${domisiliText}</span>`;

        const contactIcons = [];
        
        // WhatsApp icon
        const waNumber = (businessData.whatsapp || '').replace(/[^0-9]/g, '');
        if (waNumber) {
            contactIcons.push(`<a href="https://wa.me/62${waNumber}" target="_blank" class="card-icon-link" onclick="event.stopPropagation()" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>`);
        }
        
        // Website icon
        if (businessData.website_usaha) {
            contactIcons.push(`<a href="${businessData.website_usaha}" target="_blank" class="card-icon-link" onclick="event.stopPropagation()" title="Website"><i class="fas fa-globe"></i></a>`);
        }
        
        // Social Media icons
        const socialMediaMap = {
            instagram: { icon: 'fa-instagram', url: businessData.instagram },
            facebook: { icon: 'fa-facebook', url: businessData.facebook },
            tiktok: { icon: 'fa-tiktok', url: businessData.tiktok },
            youtube: { icon: 'fa-youtube', url: businessData.youtube }
        };

        // Add social media icons
        for (const [platform, data] of Object.entries(socialMediaMap)) {
            if (data.url && data.url.trim() !== '') {
                const url = data.url.startsWith('http') ? data.url : `https://${data.url}`;
                contactIcons.push(`<a href="${url}" target="_blank" class="card-icon-link" onclick="event.stopPropagation()" title="${platform.charAt(0).toUpperCase() + platform.slice(1)}"><i class="fab ${data.icon}"></i></a>`);
            }
        }

        // Marketplace icons
        const olshops = {
            tokopedia: { icon: 'icon-tokopedia.svg', url: businessData.tokopedia },
            shopee: { icon: 'icon-shopee.svg', url: businessData.shopee },
            bukalapak: { icon: 'icon-bukalapak.svg', url: businessData.bukalapak },
            blibli: { icon: 'icon-blibli.svg', url: businessData.blibli },
            tiktokshop: { icon: 'icon-tiktok.svg', url: businessData.tiktok_shop }
        };

        // Add marketplace icons
        for (const [platform, data] of Object.entries(olshops)) {
            if (data.url && data.url.trim() !== '') {
                const url = data.url.startsWith('http') ? data.url : `https://${data.url}`;
                contactIcons.push(`<a href="${url}" target="_blank" class="card-icon-link marketplace-icon-link" onclick="event.stopPropagation()" title="${platform.charAt(0).toUpperCase() + platform.slice(1)}"><img src="assets/marketplace/${data.icon}" alt="${platform}" class="marketplace-icon"></a>`);
            }
        }

        // Log icon generation results
        console.log('Generated contact icons for business:', {
            businessName: businessData.nama_usaha,
            totalIcons: contactIcons.length,
            socialMedia: Object.entries(socialMediaMap).filter(([_, data]) => data.url && data.url.trim() !== '').map(([platform]) => platform),
            marketplaces: Object.entries(olshops).filter(([_, data]) => data.url && data.url.trim() !== '').map(([platform]) => platform)
        });
        
        card.innerHTML = `
            <div class="card-banner">
                <img src="${businessImgUrl}" alt="Gambar ${businessData.nama_usaha}" loading="lazy" onerror="this.onerror=null; this.src='${defaultImgUrl}';">
            </div>
            <div class="card-location-info">
                <a href="${gmapsUrl}" target="_blank" class="card-location-btn" onclick="event.stopPropagation()">
                    ${locationButtonText}
                </a>
            </div>
            <div class="card-content">
                <h3 class="card-business-name">${businessData.nama_usaha}</h3>
                <p class="card-description">${businessData.jenis_usaha || ''}</p>
                <div class="card-bottom-row">
                    <div class="card-icon-container">${contactIcons.join('')}</div>
                </div>
                <div class="card-posting-date">Diposting: ${formatPostingDate(businessData.timestamp)}</div>
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
