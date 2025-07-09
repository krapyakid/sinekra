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
    let filteredBusinessData = [];
    let currentPage = 1;
    const CARDS_PER_PAGE = 40; // Diubah dari 12 menjadi 40 card per halaman
    let currentSort = { by: 'newest' };

    function masterFilterHandler() {
        currentPage = 1; // Reset ke halaman pertama saat filter berubah
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

        // Populate filters dan terapkan filter awal
        populateFilters();
        
        // Sembunyikan filter angkatan pada awal load (tampilan usaha)
        const angkatanFilter = document.getElementById('filter-angkatan');
        if (angkatanFilter) {
            angkatanFilter.style.display = 'none';
        }
        
        // Terapkan filter awal
        const urlParams = new URLSearchParams(window.location.search);
        const initialDomicile = urlParams.get('domisili');
        if (initialDomicile) {
            const domicileFilter = document.getElementById('filter-domisili'); // Fix ID to match HTML
            if (domicileFilter) {
                domicileFilter.value = initialDomicile;
            }
        }
        
        masterFilterHandler();
    }

    function setupHomepageEventListeners() {
        const viewToggleLink = document.getElementById('view-toggle-link');
        const searchBar = document.getElementById('desktop-search-bar');
        const categoryFilter = document.getElementById('filter-category');
        const professionFilter = document.getElementById('filter-profession');
        const domicileFilter = document.getElementById('filter-domisili'); // Fix ID to match HTML
        const angkatanFilter = document.getElementById('filter-angkatan');
        const sortBtn = document.getElementById('sortDropdownBtn');
        const sortMenu = document.getElementById('sortDropdownMenu');

        // Log status elemen filter
        console.log('Filter elements status:', {
            domicileFilter: domicileFilter ? 'found' : 'not found',
            domicileFilterId: domicileFilter?.id,
            domicileFilterValue: domicileFilter?.value
        });

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
                    if(angkatanFilter) angkatanFilter.style.display = ''; // Tampilkan filter angkatan
                    if(searchBar) searchBar.placeholder = 'Cari Nama Anggota';
                    if(sortBtn) sortBtn.style.display = '';
                    directoryGrid.classList.add('list-view');
                } else {
                    currentView = 'usaha';
                    gridTitle.textContent = 'Daftar Usaha Santri';
                    viewToggleLink.textContent = 'Lihat Daftar Anggota';
                    if(categoryFilter) categoryFilter.style.display = '';
                    if(professionFilter) professionFilter.style.display = 'none';
                    if(angkatanFilter) angkatanFilter.style.display = 'none'; // Sembunyikan filter angkatan
                    if(searchBar) searchBar.placeholder = 'Cari Nama Usaha atau Anggota';
                    if(sortBtn) sortBtn.style.display = '';
                    directoryGrid.classList.remove('list-view');
                }
                masterFilterHandler();
            });
        }

        // Tambahkan event listener untuk setiap filter
        if (searchBar) {
            searchBar.addEventListener('input', () => {
                console.log('Search input event triggered');
                masterFilterHandler();
            });
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                console.log('Category filter changed:', categoryFilter.value);
                masterFilterHandler();
            });
        }
        
        if (professionFilter) {
            professionFilter.addEventListener('change', () => {
                console.log('Profession filter changed:', professionFilter.value);
                masterFilterHandler();
            });
        }
        
        if (domicileFilter) {
            // Hapus event listener lama jika ada
            domicileFilter.removeEventListener('change', masterFilterHandler);
            // Tambahkan event listener baru
            domicileFilter.addEventListener('change', () => {
                const selectedValue = domicileFilter.value;
                console.log('Domicile filter changed:', {
                    value: selectedValue,
                    element: domicileFilter.id,
                    options: Array.from(domicileFilter.options).map(opt => ({
                        value: opt.value,
                        text: opt.text
                    }))
                });
                masterFilterHandler();
            });
        } else {
            console.error('Failed to attach event listener to domicile filter - element not found');
        }
        
        if (angkatanFilter) {
            angkatanFilter.addEventListener('change', () => {
                console.log('Angkatan filter changed:', angkatanFilter.value);
                masterFilterHandler();
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
    
    function populateFilters() {
        const categoryFilter = document.getElementById('filter-category');
        const domicileFilter = document.getElementById('filter-domisili');
        const professionFilter = document.getElementById('filter-profession');
        const angkatanFilter = document.getElementById('filter-angkatan');

        console.log('Filter elements found:', {
            categoryFilter: categoryFilter?.id,
            domicileFilter: domicileFilter?.id,
            professionFilter: professionFilter?.id,
            angkatanFilter: angkatanFilter?.id
        });

        // Populate category filter
        if (categoryFilter) {
            const categories = [...new Set(allBusinessData
                .map(b => b.kategori_usaha)
                .filter(Boolean)
                .map(c => c.toLowerCase())
            )].sort();

            categoryFilter.innerHTML = '<option value="">Semua Kategori Usaha</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                categoryFilter.appendChild(option);
            });
        }

        // Populate domicile filter
        if (domicileFilter) {
            console.log('Populating domicile filter...');
            
            // Get unique domiciles from both members and businesses
            const domiciles = new Set();
            
            // Add member domiciles
            allDataCache.forEach(member => {
                if (member.domisili) {
                    const cleanDomicile = member.domisili.trim();
                    if (cleanDomicile) {
                        domiciles.add(cleanDomicile);
                        console.log('Added member domicile:', {
                            member: member.nama_lengkap,
                            domicile: cleanDomicile
                        });
                    }
                }
            });
            
            // Add business domiciles
            allBusinessData.forEach(business => {
                if (business.domisili) {
                    const cleanDomicile = business.domisili.trim();
                    if (cleanDomicile) {
                        domiciles.add(cleanDomicile);
                        console.log('Added business domicile:', {
                            business: business.nama_usaha,
                            domicile: cleanDomicile
                        });
                    }
                }
            });

            // Convert to array and sort
            const sortedDomiciles = Array.from(domiciles).sort();
            
            // Clear existing options
            domicileFilter.innerHTML = '<option value="">Semua Domisili</option>';
            
            // Add sorted options
            sortedDomiciles.forEach(domicile => {
                const option = document.createElement('option');
                option.value = domicile;
                option.textContent = domicile;
                domicileFilter.appendChild(option);
                
                console.log('Added domicile option:', {
                    value: option.value,
                    text: option.textContent
                });
            });

            console.log('Populated domicile filter:', {
                total_options: sortedDomiciles.length + 1,
                options: ['', ...sortedDomiciles]
            });
        }

        // Populate profession filter
        if (professionFilter) {
            const professions = [...new Set(allDataCache
                .map(m => m.profesi)
                .filter(Boolean)
                .map(p => p.toLowerCase())
            )].sort();

            professionFilter.innerHTML = '<option value="">Semua Profesi</option>';
            professions.forEach(profession => {
                const option = document.createElement('option');
                option.value = profession;
                option.textContent = profession.charAt(0).toUpperCase() + profession.slice(1);
                professionFilter.appendChild(option);
            });
        }

        // Populate angkatan filter
        if (angkatanFilter) {
            const angkatans = [...new Set(allDataCache
                .map(m => m.angkatan)
                .filter(Boolean)
            )].sort((a, b) => b - a); // Sort descending

            angkatanFilter.innerHTML = '<option value="">Semua Angkatan</option>';
            angkatans.forEach(angkatan => {
                const option = document.createElement('option');
                option.value = angkatan.toString();
                option.textContent = `Angkatan ${angkatan}`;
                angkatanFilter.appendChild(option);
            });
        }
    }

    function applyAndRenderBusinessFilters() {
        const searchBar = document.getElementById('desktop-search-bar');
        const categoryFilter = document.getElementById('filter-category');
        const domicileFilter = document.getElementById('filter-domisili');
        const angkatanFilter = document.getElementById('filter-angkatan');
        
        const searchTerm = searchBar ? searchBar.value.toLowerCase() : '';
        const selectedCategory = categoryFilter ? categoryFilter.value : '';
        const selectedDomicile = domicileFilter ? domicileFilter.value.trim() : '';
        const selectedAngkatan = angkatanFilter ? angkatanFilter.value : '';

        console.log('Starting business filter with values:', { 
            searchTerm, 
            selectedCategory, 
            selectedDomicile,
            selectedAngkatan,
            totalData: allBusinessData.length
        });

        // Filter data
        filteredBusinessData = allBusinessData.filter(business => {
            const matchesSearch = !searchTerm || 
                business.nama_usaha?.toLowerCase().includes(searchTerm) ||
                business.deskripsi_usaha?.toLowerCase().includes(searchTerm) ||
                business.nama_lengkap?.toLowerCase().includes(searchTerm);

            const matchesCategory = !selectedCategory || 
                business.kategori_usaha?.toLowerCase() === selectedCategory.toLowerCase();

            const matchesDomicile = !selectedDomicile || 
                (business.domisili?.toLowerCase().trim() === selectedDomicile.toLowerCase().trim());

            const matchesAngkatan = !selectedAngkatan || 
                business.angkatan?.toString() === selectedAngkatan;

            const result = matchesSearch && matchesCategory && matchesDomicile && matchesAngkatan;

            // Log filter results for debugging
            if (selectedDomicile && !matchesDomicile) {
                console.log('Domicile mismatch:', {
                    businessDomicile: business.domisili?.toLowerCase().trim(),
                    selectedDomicile: selectedDomicile.toLowerCase().trim(),
                    businessId: business.id_usaha,
                    businessName: business.nama_usaha
                });
            }

            return result;
        });

        // Sort filtered data
        filteredBusinessData = sortBusinessData(filteredBusinessData, currentSort.by);

        // Get paginated data
        const paginatedData = getPaginatedData(filteredBusinessData, currentPage);

        // Update total count
        updateTotalCount(filteredBusinessData.length);

        // Log filter results
        console.log('Business filter results:', {
            total: filteredBusinessData.length,
            filtered: paginatedData.length,
            domicileFilter: selectedDomicile,
            sample_filtered: paginatedData.length > 0 ? {
                first_item: {
                    name: paginatedData[0].nama_usaha,
                    domicile: paginatedData[0].domisili
                }
            } : null
        });

        // Render data
        renderBusinessList(paginatedData);
        renderPaginationControls(filteredBusinessData.length, currentPage, 'pagination-container');
    }
    
    function applyAndRenderMemberFilters() {
        const searchBar = document.getElementById('desktop-search-bar');
        const domicileFilter = document.getElementById('filter-domisili');
        const professionFilter = document.getElementById('filter-profession');
        const angkatanFilter = document.getElementById('filter-angkatan');

        const searchTerm = searchBar ? searchBar.value.toLowerCase() : '';
        const selectedDomicile = domicileFilter ? domicileFilter.value.trim() : '';
        const selectedProfession = professionFilter ? professionFilter.value : '';
        const selectedAngkatan = angkatanFilter ? angkatanFilter.value : '';

        console.log('Starting member filter with values:', { 
            searchTerm, 
            selectedDomicile,
            selectedProfession,
            selectedAngkatan,
            totalData: allDataCache.length
        });

        // Filter data
        const filteredData = allDataCache.filter(member => {
            const matchesSearch = !searchTerm || 
                member.nama_lengkap?.toLowerCase().includes(searchTerm) ||
                member.profesi?.toLowerCase().includes(searchTerm);

            const matchesDomicile = !selectedDomicile || 
                (member.domisili?.toLowerCase().trim() === selectedDomicile.toLowerCase().trim());

            const matchesProfession = !selectedProfession || 
                member.profesi?.toLowerCase() === selectedProfession.toLowerCase();

            const matchesAngkatan = !selectedAngkatan || 
                member.angkatan?.toString() === selectedAngkatan;

            const result = matchesSearch && matchesDomicile && matchesProfession && matchesAngkatan;

            // Log filter results for debugging
            if (selectedDomicile && !matchesDomicile) {
                console.log('Domicile mismatch:', {
                    memberDomicile: member.domisili?.toLowerCase().trim(),
                    selectedDomicile: selectedDomicile.toLowerCase().trim(),
                    memberId: member.id_anggota,
                    memberName: member.nama_lengkap
                });
            }

            return result;
        });

        // Sort filtered data
        const sortedData = sortMemberData(filteredData, currentSort.by);

        // Get paginated data
        const paginatedData = getPaginatedData(sortedData, currentPage);

        // Update total count
        updateTotalCount(filteredData.length);

        // Log filter results
        console.log('Member filter results:', {
            total: filteredData.length,
            filtered: paginatedData.length,
            domicileFilter: selectedDomicile,
            sample_filtered: paginatedData.length > 0 ? {
                first_item: {
                    name: paginatedData[0].nama_lengkap,
                    domicile: paginatedData[0].domisili
                }
            } : null
        });

        // Render data
        renderMemberList(paginatedData);
        renderPaginationControls(filteredData.length, currentPage, 'pagination-container');
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
        
        // Get paginated data
        const paginatedData = getPaginatedData(memberList, currentPage);
        paginatedData.forEach(member => {
            const card = createMemberListItem(member);
            directoryGrid.appendChild(card);
        });
        
        // Render pagination controls
        renderPaginationControls(memberList.length, currentPage, 'pagination-container');
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
