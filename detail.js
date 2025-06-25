document.addEventListener('DOMContentLoaded', function() {
    // --- KONFIGURASI ---
    const membersSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGe6AOx8Dsnq--KPToMl0Q4lF20650_IQ6VoLQxyy3heEFW43LSTIqB0UAUeTV0QOvr8O_YnaeU-om/pub?gid=0&output=csv";
    const olshopSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGe6AOx8Dsnq--KPToMl0Q4lF20650_IQ6VoLQxyy3heEFW43LSTIqB0UAUeTV0QOvr8O_YnaeU-om/pub?gid=1048998840&output=csv";

    // --- ELEMEN DOM ---
    const loadingIndicator = document.getElementById('detail-loading');
    const errorMessage = document.getElementById('detail-error');
    const detailContent = document.getElementById('detail-content');

    // --- FUNGSI UTAMA ---
    async function loadMemberDetail() {
        const urlParams = new URLSearchParams(window.location.search);
        const memberId = urlParams.get('id');

        if (!memberId) {
            showError("ID anggota tidak ditemukan di URL.");
            return;
        }

        try {
            // Tampilkan loading saat mulai fetch
            if(loadingIndicator) loadingIndicator.style.display = 'flex';
            if(errorMessage) errorMessage.style.display = 'none';

            const [membersResponse, olshopResponse] = await Promise.all([
                fetch(membersSheetUrl, { cache: 'no-cache' }),
                fetch(olshopSheetUrl, { cache: 'no-cache' })
            ]);
            
            if (!membersResponse.ok || !olshopResponse.ok) {
                throw new Error('Gagal mengambil data dari Google Sheets.');
            }

            const membersCsv = await membersResponse.text();
            const olshopCsv = await olshopResponse.text();
            const allMembers = mergeData(parseCsv(membersCsv), parseCsv(olshopCsv));
            
            const member = allMembers.find(m => m.id_anggota === memberId);

            if (member) {
                displayMember(member);
            } else {
                showError(`Anggota dengan ID "${memberId}" tidak ditemukan.`);
            }

        } catch (error) {
            console.error("Error loading member details:", error);
            showError("Terjadi kesalahan saat memuat data. Periksa konsol untuk detail.");
        }
    }

    function displayMember(member) {
        // Sembunyikan indikator loading
        if(loadingIndicator) loadingIndicator.style.display = 'none';
        
        // Pastikan kontainer ada sebelum mengisi
        if (!detailContent) {
            console.error("Elemen 'detail-content' tidak ditemukan.");
            return;
        }

        const placeholderDiv = `<div class="main-image-placeholder">${(member.nama_usaha || member.nama_lengkap || 'A').charAt(0)}</div>`;

        // Kontak dan Tombol Aksi
        let contactButtonsHtml = '';
        if (member.no_hp) {
            const phoneNumber = member.no_hp.replace(/\D/g, ''); // Hapus semua non-digit
            contactButtonsHtml += `<a href="https://wa.me/${phoneNumber}" class="contact-btn whatsapp" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp"></i> Hubungi via WhatsApp</a>`;
        }
        if (member.url_gmaps) {
            contactButtonsHtml += `<a href="${member.url_gmaps}" class="contact-btn gmaps" target="_blank" rel="noopener noreferrer"><i class="fas fa-map-marker-alt"></i> Lihat di Google Maps</a>`;
        }
        if (member.website_url) {
            contactButtonsHtml += `<a href="${member.website_url}" class="contact-btn website" target="_blank" rel="noopener noreferrer"><i class="fas fa-globe"></i> Kunjungi Website</a>`;
        }

        // Toko Online
        let olshopsHtml = '';
        const olshopPlatforms = {
            link_shopee: { name: 'Shopee', icon: 'fa-shopping-bag' },
            link_tokopedia: { name: 'Tokopedia', icon: 'fa-store' },
            link_tiktok: { name: 'TikTok Shop', icon: 'fa-tiktok' },
            link_bukalapak: { name: 'Bukalapak', icon: 'fa-store-alt' },
            link_facebook: { name: 'Facebook', icon: 'fa-facebook-f' }
        };

        let olshopLinks = '';
        for (const key in olshopPlatforms) {
            if (member[key]) {
                const platform = olshopPlatforms[key];
                olshopLinks += `
                    <a href="${member[key]}" class="olshop-link" target="_blank" rel="noopener noreferrer">
                        <i class="fab ${platform.icon}"></i> <span>${platform.name}</span>
                    </a>`;
            }
        }
        if (olshopLinks) {
            olshopsHtml = `<div class="detail-section"><h3>Toko Online & Media Sosial</h3><div class="olshop-container">${olshopLinks}</div></div>`;
        }
        
        const bannerSrc = member.id_anggota ? `assets/usaha/${member.id_anggota}.jpg` : (member.banner_url || '');

        // Langsung isi innerHTML dari 'detail-content'
        detailContent.innerHTML = `
            <div class="product-gallery">
                <div class="main-image">
                    <img src="${bannerSrc}" alt="${member.nama_usaha || ''}" onerror="this.parentElement.innerHTML = \`${placeholderDiv}\`;">
                </div>
            </div>
            <div class="product-details">
                <h1 class="detail-title">${member.nama_usaha || 'Usaha Belum Bernama'}</h1>
                <p class="detail-owner">Oleh: <strong>${member.nama_lengkap || 'N/A'}</strong> (Angkatan: ${member.angkatan || 'N/A'})</p>
                
                <div class="contact-buttons">${contactButtonsHtml || '<p>Tidak ada kontak yang bisa dihubungi.</p>'}</div>

                <div class="detail-section">
                    <h3>Deskripsi</h3>
                    <p class="detail-description">${member.detail_profesi || 'Tidak ada deskripsi.'}</p>
                </div>

                 <div class="detail-section">
                    <h3>Prospek & Kerjasama</h3>
                    <p class="detail-description">${member.prospek_kerjasama || 'Tidak ada informasi prospek.'}</p>
                </div>

                ${olshopsHtml}

                <div class="detail-section">
                    <h3>Info Tambahan</h3>
                    <p><strong>Domisili:</strong> ${member.domisili || 'N/A'}</p>
                    <p><strong>Komplek:</strong> ${member.komplek || 'N/A'}</p>
                </div>
            </div>
        `;
    }

    function showError(message = "Gagal memuat data atau anggota tidak ditemukan.") {
        if(loadingIndicator) loadingIndicator.style.display = 'none';
        if(errorMessage) {
            errorMessage.style.display = 'flex'; // Gunakan flex agar bisa center align
            const p = errorMessage.querySelector('p');
            if (p) p.textContent = message;
        }
    }


    // --- FUNGSI UTILITAS (DUPLIKAT DARI main.js) ---
    // NOTE: Dalam proyek nyata, ini sebaiknya ada di file utilitas terpisah
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

    // --- Mulai proses ---
    loadMemberDetail();
}); 
