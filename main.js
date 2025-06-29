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
    
    let allDataCache = []; // Cache untuk menyimpan data anggota yang sudah di-fetch
    let allBusinessData = []; // Cache untuk menyimpan data usaha yang sudah di-flatten

    // Fungsi untuk mengambil dan mem-parsing data dari Apps Script
    async function fetchData() {
        if (allDataCache.length > 0) {
            return allDataCache; // Kembalikan dari cache jika sudah ada
        }

        try {
            const response = await fetch(SCRIPT_URL, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`Gagal mengambil data: ${response.statusText}`);
            }
            const result = await response.json();
            if (result.status === "success") {
                allDataCache = result.data; // Simpan data mentah
                
                // Flatten data usaha untuk kemudahan filtering dan rendering
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
            // Menampilkan pesan error di UI
            const directoryGrid = document.getElementById('directory-grid');
            if (directoryGrid) {
                directoryGrid.innerHTML = `<p class="error-message">Gagal memuat data. Silakan coba muat ulang halaman.</p>`;
            }
            return [];
        }
    }
    
    // --- Logika untuk Halaman Beranda (index.html) ---
    if (document.getElementById('directory-grid')) {
        let currentView = 'usaha'; // 'usaha' or 'anggota'
        const gridTitle = document.getElementById('grid-title');
        const viewToggleLink = document.getElementById('view-toggle-link');
        const searchBar = document.getElementById('desktop-search-bar');
        const categoryFilter = document.getElementById('filter-category');
        const domicileFilter = document.getElementById('filter-domicile');
        const searchFilterSection = document.querySelector('.search-and-filter-section');

        async function initializePage() {
            showLoading(document.getElementById('directory-grid'), 'Memuat data...');
            await fetchData();
            populateFilters();
            masterFilterHandler(); // Panggil filter utama untuk tampilan awal
        }
        
        // Panggil tampilan awal
        initializePage();

        viewToggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentView === 'usaha') {
                currentView = 'anggota';
                gridTitle.textContent = 'Daftar Seluruh Anggota';
                viewToggleLink.textContent = 'Lihat Daftar Usaha';
                
                categoryFilter.style.display = 'none'; // Sembunyikan filter kategori
                searchBar.placeholder = 'Cari Nama Anggota';

            } else {
                currentView = 'usaha';
                gridTitle.textContent = 'Daftar Usaha Santri';
                viewToggleLink.textContent = 'Lihat Daftar Anggota';

                categoryFilter.style.display = ''; // Tampilkan kembali filter kategori
                searchBar.placeholder = 'Cari Nama Usaha atau Anggota';
            }
            masterFilterHandler(); // Terapkan filter untuk view yang baru
        });

        function masterFilterHandler() {
             if (currentView === 'usaha') {
                applyAndRenderBusinessFilters();
            } else {
                applyAndRenderMemberFilters();
            }
        }

        // Event listeners untuk filter
        searchBar.addEventListener('input', masterFilterHandler);
        categoryFilter.addEventListener('change', masterFilterHandler);
        domicileFilter.addEventListener('change', masterFilterHandler);
    }

    function populateFilters() {
        const categoryFilter = document.getElementById('filter-category');
        const domicileFilter = document.getElementById('filter-domicile');

        // Populate Categories from business data
        const categories = [...new Set(allBusinessData.map(b => b.kategori_usaha).filter(Boolean))];
        categoryFilter.innerHTML = '<option value="">Semua Kategori</option>';
        categories.sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
        
        // Populate Domiciles from ALL member data for consistency
        const domiciles = [...new Set(allDataCache.map(m => m.domisili).filter(Boolean))];
        domicileFilter.innerHTML = '<option value="">Semua Domisili</option>';
        domiciles.sort().forEach(domicile => {
            const option = document.createElement('option');
            option.value = domicile;
            option.textContent = domicile;
            domicileFilter.appendChild(option);
        });
    }

    function applyAndRenderBusinessFilters() {
        const searchBar = document.getElementById('desktop-search-bar');
        const categoryFilter = document.getElementById('filter-category');
        const domicileFilter = document.getElementById('filter-domicile');
        
        const searchTerm = searchBar.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const selectedDomicile = domicileFilter.value;

        const filteredData = allBusinessData.filter(business => {
            const nameMatch = business.nama_usaha.toLowerCase().includes(searchTerm);
            const ownerMatch = business.nama_lengkap.toLowerCase().includes(searchTerm);
            const categoryMatch = !selectedCategory || business.kategori_usaha === selectedCategory;
            const domicileMatch = !selectedDomicile || business.domisili === selectedDomicile;

            return (nameMatch || ownerMatch) && categoryMatch && domicileMatch;
        });

        renderBusinessList(filteredData);
    }
    
    function applyAndRenderMemberFilters() {
        const searchBar = document.getElementById('desktop-search-bar');
        const domicileFilter = document.getElementById('filter-domicile');

        const searchTerm = searchBar.value.toLowerCase();
        const selectedDomicile = domicileFilter.value;

        const filteredData = allDataCache.filter(member => {
            const nameMatch = member.nama_lengkap.toLowerCase().includes(searchTerm);
            const domicileMatch = !selectedDomicile || member.domisili === selectedDomicile;
            return nameMatch && domicileMatch;
        });
        
        renderMemberList(filteredData);
    }

    function renderBusinessList(businessList) {
        const directoryGrid = document.getElementById('directory-grid');
        if (!directoryGrid) return;

        directoryGrid.innerHTML = ''; // Clear previous results
        if (businessList.length === 0) {
            directoryGrid.innerHTML = '<p>Tidak ada usaha yang cocok dengan kriteria pencarian Anda.</p>';
            return;
        }

        businessList.forEach(businessData => {
            directoryGrid.appendChild(createMemberCard(businessData));
        });
    }

    function renderMemberList(memberList) {
        const directoryGrid = document.getElementById('directory-grid');
        if (!directoryGrid) return;

        directoryGrid.innerHTML = ''; // Clear previous results
        if (memberList.length === 0) {
            directoryGrid.innerHTML = '<p>Tidak ada anggota yang cocok dengan kriteria pencarian Anda.</p>';
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

    // Fungsi ini tidak lagi dipakai untuk tampilan awal, tapi untuk toggle
    async function displayDirectory() {
       initializeBusinessView();
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

    // Fungsi ini tidak lagi dipakai, digantikan oleh applyAndRenderMemberFilters dan renderMemberList
    async function displayAllMembers() {
        const directoryGrid = document.getElementById('directory-grid');
        if (!directoryGrid) return;

        showLoading(directoryGrid, 'Memuat data anggota...');

        const members = await fetchData();
        if (members.length === 0) {
            directoryGrid.innerHTML = '<p>Gagal memuat data anggota atau tidak ada data.</p>';
            return;
        }

        directoryGrid.innerHTML = '';
        members.forEach(member => {
            directoryGrid.appendChild(createSimpleMemberCard(member));
        });
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

    // --- FUNGSI PEMBUATAN KARTU ---
    function createSimpleMemberCard(member) {
        const card = document.createElement('div');
        card.className = 'member-card'; // Re-use styling
        card.style.cursor = 'pointer'; // Menambahkan kursor pointer
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
        const card = document.createElement('div');
        card.className = 'member-card';
        card.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            if (businessData.id_anggota) {
                window.location.href = `detail.html?id=${businessData.id_anggota}`;
            }
        });

        // --- Gambar Usaha ---
        const banner = document.createElement('div');
        banner.className = 'card-banner';
        
        const img = document.createElement('img');
        const baseRepoUrl = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/usaha/';
        const defaultImgUrl = `${baseRepoUrl}default_image_usaha.jpg`;

        // --- [FIX] Mencoba id_usaha, lalu id_anggota, lalu default ---
        img.src = `${baseRepoUrl}${businessData.id_usaha}.jpg`;
        img.alt = `Gambar usaha ${businessData.nama_usaha}`;

        img.onerror = function() {
            // Jika id_usaha gagal, coba id_anggota
            this.src = `${baseRepoUrl}${businessData.id_anggota}.jpg`;
            this.onerror = function() {
                // Jika id_anggota juga gagal, gunakan default
                this.onerror = null; // Mencegah loop tak terbatas
                this.src = defaultImgUrl;
            };
        };
        
        // --- Overlay Lokasi ---
        const locationOverlay = document.createElement(businessData.url_gmaps_perusahaan ? 'a' : 'div');
        locationOverlay.className = 'card-location-overlay';
        if (businessData.url_gmaps_perusahaan) {
            locationOverlay.href = businessData.url_gmaps_perusahaan;
            locationOverlay.target = '_blank';
            locationOverlay.rel = 'noopener noreferrer';
        }
        
        const namaPanggilan = businessData.nama_panggilan || businessData.nama_lengkap.split(' ')[0];
        locationOverlay.innerHTML = `<i class="fas fa-map-marker-alt"></i> <span>${namaPanggilan} - ${businessData.domisili}</span>`;

        banner.append(locationOverlay, img);

        // --- Konten Kartu ---
        const content = document.createElement('div');
        content.className = 'card-content';

        const businessName = document.createElement('h3');
        businessName.className = 'card-business-name';
        businessName.textContent = businessData.nama_usaha;

        const description = document.createElement('p');
        description.className = 'card-description';
        description.textContent = businessData.jenis_usaha || 'Jenis usaha tidak tersedia.';

        const owner = document.createElement('p');
        owner.className = 'card-owner';
        owner.innerHTML = `<i class="fas fa-user"></i> ${businessData.nama_lengkap}`;
        
        content.append(businessName, description, owner);
        card.append(banner, content);
        
        return card;
    }

    // --- FUNGSI UTILITAS ---
    function getDistance(lat1, lon1, lat2, lon2) {
        if ((lat1 == lat2) && (lon1 == lon2)) {
            return 0;
        }
        if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
        const R = 6371; // Radius bumi dalam km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}); 
