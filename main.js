document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Logic
    const menuTrigger = document.getElementById('mobile-menu-trigger');
    const mainNav = document.getElementById('main-nav');

    if (menuTrigger && mainNav) {
        menuTrigger.addEventListener('click', function() {
            mainNav.classList.toggle('active');
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

        // Event listener untuk membuat kartu bisa diklik
        card.addEventListener('click', (event) => {
            // Cek jika target klik BUKAN sebuah link <a> atau elemen di dalam link
            if (!event.target.closest('a') && member.id_anggota) {
                window.location.href = `detail.html?id=${member.id_anggota}`;
            }
        });

        const waLink = member.no_hp ? `https://wa.me/${member.no_hp.replace(/[^0-9]/g, '')}` : null;
        
        // Banner
        const banner = member.banner_url 
            ? `<img src="assets/usaha/${member.banner_url}" alt="Banner ${member.nama_usaha}" class="card-banner-img">`
            : `<div class="placeholder">${(member.nama_usaha || 'A').charAt(0)}</div>`;

        // Detail Profesi (Deskripsi)
        let detailProfesi = member.detail_profesi || '';
        if (detailProfesi.length > 60) {
            detailProfesi = detailProfesi.substring(0, 60) + '...';
        }
        
        let prospek = member.pengembangan_profesi || '';
        if (prospek.length > 70) {
            prospek = prospek.substring(0, 70) + '...';
        }

        // Ikon Marketplace
        const marketplaces = `
            ${member.link_shopee ? `<a href="${member.link_shopee}" target="_blank" rel="noopener noreferrer"><img src="assets/marketplace/shopee.svg" alt="Shopee" class="marketplace-icon"></a>` : ''}
            ${member.link_tokopedia ? `<a href="${member.link_tokopedia}" target="_blank" rel="noopener noreferrer"><img src="assets/marketplace/tokopedia.svg" alt="Tokopedia" class="marketplace-icon"></a>` : ''}
            ${member.link_bukalapak ? `<a href="${member.link_bukalapak}" target="_blank" rel="noopener noreferrer"><img src="assets/marketplace/bukalapak.svg" alt="Bukalapak" class="marketplace-icon"></a>` : ''}
            ${member.link_tiktok ? `<a href="${member.link_tiktok}" target="_blank" rel="noopener noreferrer"><img src="assets/marketplace/tiktok.svg" alt="TikTok Shop" class="marketplace-icon"></a>` : ''}
            ${member.link_facebook ? `<a href="${member.link_facebook}" target="_blank" rel="noopener noreferrer"><img src="assets/social/facebook.svg" alt="Facebook" class="marketplace-icon"></a>` : ''}
        `.trim();
        
        // Tampilkan jarak jika diminta
        let distanceInfo = '';
        if (options.showDistance && member.distance !== Infinity) {
            distanceInfo = `<p class="card-distance">~ ${member.distance.toFixed(1)} km dari lokasi Anda</p>`;
        }

        card.innerHTML = `
            <div class="card-banner">${banner}</div>
            <div class="card-content">
                <h3 class="card-business-name">${member.nama_usaha || 'Nama Usaha Belum Diisi'}</h3>
                <p class="card-description">${prospek || detailProfesi}</p>
                <p class="card-owner-name">${member.nama_lengkap || ''}</p>
                ${distanceInfo}
                <div class="card-contact-bar">
                    <div class="card-marketplaces">
                        ${marketplaces || '<span style="font-size: 0.8rem; color: #999;">Toko online tidak tersedia</span>'}
                    </div>
                    ${waLink ? `<a href="${waLink}" target="_blank" rel="noopener noreferrer"><img src="assets/social/whatsapp.svg" alt="WhatsApp" class="whatsapp-icon"></a>` : ''}
                </div>
            </div>
        `;
        return card;
    }

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
            const platform = (shop.platform || '').toLowerCase();
            const url = shop.url || '';
            if (platform === 'shopee') acc[shop.id_anggota].link_shopee = url;
            else if (platform === 'tokopedia') acc[shop.id_anggota].link_tokopedia = url;
            else if (platform === 'tiktok shop') acc[shop.id_anggota].link_tiktok = url;
            else if (platform === 'lainnya') {
                if (url.includes('bukalapak.com')) acc[shop.id_anggota].link_bukalapak = url;
                else if (url.includes('facebook.com')) acc[shop.id_anggota].link_facebook = url;
            }
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
