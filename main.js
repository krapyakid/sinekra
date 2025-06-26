document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Logic
    const menuTrigger = document.getElementById('mobile-menu-trigger');
    const mainNav = document.getElementById('main-nav');
    const overlay = document.getElementById('menu-overlay');

    if (menuTrigger && mainNav && overlay) {
        const closeMenu = () => {
            mainNav.classList.remove('active');
            overlay.classList.remove('active');
        };

        menuTrigger.addEventListener('click', (event) => {
            event.stopPropagation();
            mainNav.classList.add('active');
            overlay.classList.add('active');
        });

        overlay.addEventListener('click', closeMenu);
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
    
    // Klik di luar untuk menutup search/menu
    document.addEventListener('click', (event) => {
        // Tutup menu jika klik di luar
        if (mainNav && mainNav.classList.contains('active') && !mainNav.contains(event.target)) {
            mainNav.classList.remove('active');
            overlay.classList.remove('active');
        }
        // Tutup search jika klik di luar
        if (searchSection && searchSection.classList.contains('active') && !searchSection.contains(event.target) && !mobileSearchTrigger.contains(event.target)) {
            searchSection.classList.remove('active');
        }
    });

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
            // Mengembalikan array kosong jika terjadi error
            return [];
        }
    }
    
    // --- Logika untuk Halaman Beranda (index.html) ---
    if (document.getElementById('nearby-grid') && document.getElementById('recommended-grid')) {
        displayHomepageSections();
    }

    async function displayHomepageSections() {
        const nearbyGrid = document.getElementById('nearby-grid');
        const recommendedGrid = document.getElementById('recommended-grid');
        
        // Tampilkan placeholder loading sederhana
        nearbyGrid.innerHTML = '<p>Mencari usaha terdekat...</p>';
        recommendedGrid.innerHTML = '<p>Memuat rekomendasi...</p>';

        const members = await fetchData();
        
        if (members.length === 0) {
            nearbyGrid.innerHTML = '<p>Gagal memuat data usaha.</p>';
            recommendedGrid.innerHTML = '<p>Gagal memuat data usaha.</p>';
            return;
        }

        // Tampilkan Rekomendasi (4 acak)
        const shuffled = [...members].sort(() => 0.5 - Math.random());
        const recommended = shuffled.slice(0, 4);
        recommendedGrid.innerHTML = ''; // Hapus loading
        recommended.forEach(member => {
            recommendedGrid.appendChild(createMemberCard(member));
        });

        // Tampilkan Terdekat (jika geolokasi diizinkan)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLon = position.coords.longitude;
                    
                    const membersWithDistance = members.map(member => {
                        if (member.latitude && member.longitude) {
                            member.distance = getDistance(userLat, userLon, member.latitude, member.longitude);
                        } else {
                            member.distance = Infinity;
                        }
                        return member;
                    });
                    
                    const sortedByDistance = membersWithDistance.sort((a, b) => a.distance - b.distance);
                    const nearby = sortedByDistance.slice(0, 4);
                    
                    nearbyGrid.innerHTML = ''; // Hapus loading
                    nearby.forEach(member => {
                        nearbyGrid.appendChild(createMemberCard(member, { showDistance: true }));
                    });
                },
                () => {
                    // Jika user menolak geolokasi, tampilkan 4 anggota acak lainnya
                    nearbyGrid.innerHTML = '';
                    const randomNearby = shuffled.slice(4, 8); // Ambil 4 berikutnya dari list acak
                    randomNearby.forEach(member => {
                        nearbyGrid.appendChild(createMemberCard(member));
                    });
                }
            );
        } else {
            // Jika browser tidak support, tampilkan 4 acak
            nearbyGrid.innerHTML = '';
             const randomNearby = shuffled.slice(4, 8);
             randomNearby.forEach(member => {
                nearbyGrid.appendChild(createMemberCard(member));
            });
        }
    }

    // --- FUNGSI PEMBUATAN KARTU ---
    function createMemberCard(member, options = {}) {
        const card = document.createElement('div');
        card.className = 'member-card';
        card.dataset.id = member.id_anggota;

        // Data fallbacks
        const namaUsaha = member.nama_usaha || 'Nama Usaha Belum Diisi';
        const deskripsi = member.detail_profesi ? member.detail_profesi.substring(0, 100) + (member.detail_profesi.length > 100 ? '...' : '') : 'Deskripsi usaha tidak tersedia.';
        const lokasiText = [member.nama_panggilan, member.domisili].filter(Boolean).join(' - ');
        const gmapsUrl = member.url_gmaps || null;

        // Banner Image or Placeholder
        const placeholderChar = namaUsaha.charAt(0);
        const placeholderDiv = `<div class="placeholder">${placeholderChar}</div>`;
        const bannerImg = member.id_anggota 
            ? `<img src="assets/usaha/${member.id_anggota}.jpg" class="card-banner-img" alt="${namaUsaha}" onerror="this.outerHTML = '${placeholderDiv.replace(/'/g, "\\'")}';">`
            : placeholderDiv;
        
        // Location Tag (can be a link)
        const locationTagContent = `<i class="fas fa-map-marker-alt"></i><span>${lokasiText}</span>`;
        const locationTag = gmapsUrl 
            ? `<a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" class="location-tag">${locationTagContent}</a>`
            : `<div class="location-tag">${locationTagContent}</div>`;

        // Social & Marketplace Icons
        const icons = [
            { link: member.no_hp_wa ? `https://wa.me/${member.no_hp_wa.replace(/[^0-9]/g, '')}` : null, asset: 'assets/icon-whatsapp.svg' },
            { link: member.link_facebook, asset: 'assets/icon-facebook.svg' },
            { link: member.link_shopee, asset: 'assets/marketplace/icon-shopee.svg' },
            { link: member.link_tokopedia, asset: 'assets/marketplace/icon-tokopedia.svg' },
            { link: member.link_tiktok, asset: 'assets/marketplace/icon-tiktok.svg' },
            { link: member.link_website, asset: 'assets/webicon.svg' },
        ].filter(item => item.link).map(item => `
            <a href="${item.link}" target="_blank" rel="noopener noreferrer">
                <img src="${item.asset}" class="marketplace-icon" />
            </a>
        `).join('');

        card.innerHTML = `
            <div class="card-banner">
                ${bannerImg}
                ${locationTag}
            </div>
            <div class="card-content">
                <h3 class="card-business-name">${namaUsaha}</h3>
                <p class="card-description">${deskripsi}</p>
                <div class="card-footer">
                    <div class="card-contact-bar">
                        ${icons}
                    </div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', (event) => {
            if (!event.target.closest('a') && member.id_anggota) {
                window.location.href = `detail.html?id=${member.id_anggota}`;
            }
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
