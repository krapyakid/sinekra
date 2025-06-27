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
            event.stopPropagation(); // Mencegah klik trigger ikut menutup menu
            mainNav.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        // Event listener global untuk menutup menu jika klik di luar
        document.addEventListener('click', (event) => {
            // Cek apakah menu aktif dan klik terjadi di luar menu dan bukan pada pemicu
            if (mainNav.classList.contains('active') && !mainNav.contains(event.target) && !menuTrigger.contains(event.target)) {
                closeMenu();
            }
        });
    }

    // Mobile Search Logic
    const mobileSearchTrigger = document.getElementById('mobile-search-trigger');
    const searchSection = document.querySelector('.search-and-filter-section');

    if (mobileSearchTrigger && searchSection) {
        mobileSearchTrigger.addEventListener('click', (event) => {
            event.stopPropagation();
            searchSection.classList.toggle('active');
        });
    }
    
    // --- FUNGSI GLOBAL & DATA BERSAMA ---
    const membersSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGe6AOx8Dsnq--KPToMl0Q4lF20650_IQ6VoLQxyy3heEFW43LSTIqB0UAUeTV0QOvr8O_YnaeU-om/pub?gid=0&output=csv";
    const olshopSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGe6AOx8Dsnq--KPToMl0Q4lF20650_IQ6VoLQxyy3heEFW43LSTIqB0UAUeTV0QOvr8O_YnaeU-om/pub?gid=1048998840&output=csv";
    
    let allMembers = [];

    // Fungsi untuk mengambil dan mem-parsing data
    async function fetchData() {
        if (allMembers.length > 0) return allMembers; // Kembalikan dari cache jika sudah ada

        try {
            const [membersResponse, olshopResponse] = await Promise.all([
                fetch(membersSheetUrl, { cache: 'no-cache' }),
                fetch(olshopSheetUrl, { cache: 'no-cache' })
            ]);

            if (!membersResponse.ok || !olshopResponse.ok) {
                throw new Error('Gagal mengambil data dari Google Sheets.');
            }

            const membersCsv = await membersResponse.text();
            const olshopCsv = await olshopResponse.text();

            const parsedMembers = parseCsv(membersCsv);
            const parsedOlshops = parseCsv(olshopCsv);

            allMembers = mergeData(parsedMembers, parsedOlshops);
            return allMembers;
        } catch (error) {
            console.error("Gagal memuat data:", error);
            return [];
        }
    }
    
    // --- Logika untuk Halaman Beranda (index.html) ---
    if (document.getElementById('directory-grid')) {
        displayDirectory();
    }

    async function displayDirectory() {
        const directoryGrid = document.getElementById('directory-grid');
        if (!directoryGrid) return;
        
        directoryGrid.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Memuat data usaha...</p>
            </div>
        `;

        const members = await fetchData();
        
        if (members.length === 0) {
            directoryGrid.innerHTML = '<p>Gagal memuat data usaha atau tidak ada data.</p>';
            return;
        }

        directoryGrid.innerHTML = '';
        members.forEach(member => {
            directoryGrid.appendChild(createMemberCard(member));
        });
    }

    // --- FUNGSI PEMBUATAN KARTU ---
    function createMemberCard(member) {
        // --- Create Elements ---
        const card = document.createElement('div');
        card.className = 'member-card';

        const banner = document.createElement('div');
        banner.className = 'card-banner';

        const content = document.createElement('div');
        content.className = 'card-content';

        const businessName = document.createElement('h3');
        businessName.className = 'card-business-name';

        const description = document.createElement('p');
        description.className = 'card-description';

        const footer = document.createElement('div');
        footer.className = 'card-footer';

        const contactBar = document.createElement('div');
        contactBar.className = 'card-contact-bar';

        // --- Populate & Assemble ---
        const namaUsaha = member.nama_usaha || 'Nama Usaha Belum Diisi';
        businessName.textContent = namaUsaha;
        
        const deskripsiText = member.detail_profesi || 'Deskripsi usaha tidak tersedia.';
        description.textContent = deskripsiText.substring(0, 100) + (deskripsiText.length > 100 ? '...' : '');

        const gmapsUrl = member.url_gmaps;
        const lokasiText = [member.nama_panggilan, member.domisili].filter(Boolean).join(' - ');
        const locationTag = gmapsUrl ? document.createElement('a') : document.createElement('div');
        if (gmapsUrl) {
            locationTag.href = gmapsUrl;
            locationTag.target = '_blank';
        }
        locationTag.className = 'location-tag';
        locationTag.innerHTML = `<i class="fas fa-map-marker-alt"></i><span>${lokasiText}</span>`;
        
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        placeholder.textContent = namaUsaha.charAt(0);

        if (member.id_anggota) {
            const bannerImg = document.createElement('img');
            bannerImg.src = `assets/usaha/${member.id_anggota}.jpg`;
            bannerImg.alt = namaUsaha;
            bannerImg.className = 'card-banner-img';
            bannerImg.onerror = function() {
                this.onerror = null;
                this.src = 'assets/usaha/default_image_usaha.jpg';
            };
            banner.appendChild(bannerImg);
        } else {
            const defaultImg = document.createElement('img');
            defaultImg.src = 'assets/usaha/default_image_usaha.jpg';
            defaultImg.alt = namaUsaha;
            defaultImg.className = 'card-banner-img';
            banner.appendChild(defaultImg);
        }
        banner.appendChild(locationTag);
        
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

        footer.appendChild(contactBar);
        content.append(businessName, description, footer);
        card.append(banner, content);
        
        card.addEventListener('click', (e) => {
            if (!e.target.closest('a')) window.location.href = `detail.html?id=${member.id_anggota}`;
        });

        return card;
    }

    // --- FUNGSI UTILITAS ---
    function parseCsv(csvText) {
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        return lines.slice(1).map(line => {
            const values = line.match(/(".*?"|[^",]*)(?=\s*,|\s*$)/g) || [];
            const entry = {};
            headers.forEach((header, i) => {
                let value = values[i] || '';
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                entry[header] = value.replace(/""/g, '"').trim();
            });
            // Fallback jika id_anggota tidak ada
            if (!entry.id_anggota) {
                entry.id_anggota = 'gen_' + Math.random().toString(36).substr(2, 9);
            }
            return entry;
        });
    }

    function mergeData(members, olshops) {
        const olshopMap = olshops.reduce((acc, shop) => {
            if (!shop.id_anggota) return acc;
            if (!acc[shop.id_anggota]) {
                acc[shop.id_anggota] = {};
            }
            const platform = (shop.platform || '').toLowerCase().replace(' ', '_');
            const url = shop.url || '';

            if (platform === 'shopee') acc[shop.id_anggota].link_shopee = url;
            else if (platform === 'tokopedia') acc[shop.id_anggota].link_tokopedia = url;
            else if (platform === 'tiktok_shop') acc[shop.id_anggota].link_tiktok = url;
            else if (platform === 'facebook') acc[shop.id_anggota].link_facebook = url;
            else if (platform === 'instagram') acc[shop.id_anggota].link_instagram = url;
            else if (platform === 'website') acc[shop.id_anggota].link_website = url;
            
            return acc;
        }, {});
        return members.map(member => ({ ...member, ...(olshopMap[member.id_anggota] || {}) }));
    }

    // Fungsi Haversine untuk menghitung jarak
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
}); 
