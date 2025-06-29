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

        // Panggil tampilan awal
        initializeBusinessView();

        viewToggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentView === 'usaha') {
                currentView = 'anggota';
                gridTitle.textContent = 'Daftar Seluruh Anggota';
                viewToggleLink.textContent = 'Lihat Daftar Usaha';
                if (searchFilterSection) searchFilterSection.style.display = 'none'; // Sembunyikan filter
                displayAllMembers();
            } else {
                currentView = 'usaha';
                gridTitle.textContent = 'Daftar Usaha Santri';
                viewToggleLink.textContent = 'Lihat Daftar Anggota';
                if (searchFilterSection) searchFilterSection.style.display = 'block'; // Tampilkan filter
                initializeBusinessView();
            }
        });

        // Event listeners untuk filter
        searchBar.addEventListener('input', applyFilters);
        categoryFilter.addEventListener('change', applyFilters);
        domicileFilter.addEventListener('change', applyFilters);
    }

    async function initializeBusinessView() {
        const directoryGrid = document.getElementById('directory-grid');
        if (!directoryGrid) return;
        
        showLoading(directoryGrid, 'Memuat data usaha...');

        await fetchData(); // Memastikan allDataCache dan allBusinessData terisi
        
        populateFilters();
        applyFilters(); // Tampilkan semua usaha pada awalnya
    }

    function populateFilters() {
        const categoryFilter = document.getElementById('filter-category');
        const domicileFilter = document.getElementById('filter-domicile');

        const categories = [...new Set(allBusinessData.map(b => b.kategori_usaha).filter(Boolean))];
        const domiciles = [...new Set(allBusinessData.map(b => b.domisili).filter(Boolean))];

        // Kosongkan opsi lama (kecuali yang default)
        categoryFilter.innerHTML = '<option value="">Semua Kategori</option>';
        domicileFilter.innerHTML = '<option value="">Semua Domisili</option>';
        
        categories.sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        domiciles.sort().forEach(domicile => {
            const option = document.createElement('option');
            option.value = domicile;
            option.textContent = domicile;
            domicileFilter.appendChild(option);
        });
    }

    function applyFilters() {
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

    function renderBusinessList(businessList) {
        const directoryGrid = document.getElementById('directory-grid');
        if (!directoryGrid) return;

        if (businessList.length === 0) {
            directoryGrid.innerHTML = '<p>Tidak ada usaha yang cocok dengan kriteria pencarian Anda.</p>';
            return;
        }

        directoryGrid.innerHTML = '';
        businessList.forEach(businessData => {
            directoryGrid.appendChild(createMemberCard(businessData));
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
            member.detail_profesi,
            member.domisili
        ].filter(Boolean).join(' • ');
        description.textContent = detailParts || 'Informasi tidak tersedia.';

        content.append(name, description);
        card.append(content);
        return card;
    }

    function createMemberCard(member) {
        // --- Create Elements ---
        const card = document.createElement('div');
        card.className = 'member-card';
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            // Jangan navigasi jika yang diklik adalah link (seperti gmaps atau no wa)
            if (e.target.closest('a')) return;
            
            if (member.id_anggota) {
                window.location.href = `detail.html?id=${member.id_anggota}`;
            }
        });

        const banner = document.createElement('div');
        banner.className = 'card-banner';

        const content = document.createElement('div');
        content.className = 'card-content';

        const businessName = document.createElement('h3');
        businessName.className = 'card-business-name';
        businessName.textContent = member.nama_usaha || 'Nama Usaha Tidak Tersedia';

        const description = document.createElement('p');
        description.className = 'card-description';
        description.textContent = `${member.kategori_usaha || 'Kategori tidak tersedia'} • Oleh: ${member.nama_lengkap || 'Pemilik tidak diketahui'}`;

        const footer = document.createElement('div');
        footer.className = 'card-footer';

        const contactBar = document.createElement('div');
        contactBar.className = 'card-contact-bar';

        // --- Populate & Assemble ---
        const ownerInfo = document.createElement('div');
        ownerInfo.className = 'card-owner';
        ownerInfo.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${member.domisili || 'Lokasi tidak tersedia'}`;

        const icons = [
            { link: member.no_hp_wa ? `https://wa.me/${member.no_hp_wa.replace(/[^0-9]/g, '')}` : null, asset: 'assets/icon-whatsapp.svg' },
            { link: member.link_facebook, asset: 'assets/icon-facebook.svg' },
            { link: member.link_shopee, asset: 'assets/marketplace/icon-shopee.svg' },
            { link: member.link_tokopedia, asset: 'assets/marketplace/icon-tokopedia.svg' },
            { link: member.link_tiktok, asset: 'assets/marketplace/icon-tiktok.svg' },
            { link: member.link_website, asset: 'assets/webicon.svg' },
        ];

        icons.forEach(item => {
            if (item.link) {
                const anchor = document.createElement('a');
                anchor.href = item.link;
                anchor.target = '_blank';
                const iconImg = document.createElement('img');
                iconImg.src = item.asset;
                iconImg.className = 'marketplace-icon';
                anchor.appendChild(iconImg);
                contactBar.appendChild(anchor);
            }
        });

        footer.append(ownerInfo);
        footer.appendChild(contactBar);
        content.append(businessName, description, footer);
        card.append(banner, content);
        
        card.addEventListener('click', (e) => {
            if (!e.target.closest('a')) window.location.href = `detail.html?id=${member.id_anggota}`;
        });

        return card;
    }

    // --- FUNGSI UTILITAS ---
    function getDistance(lat1, lon1, lat2, lon2) {
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
