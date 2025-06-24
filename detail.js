 document.addEventListener('DOMContentLoaded', function() {
    // --- KONFIGURASI ---
    const membersSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGe6AOx8Dsnq--KPToMl0Q4lF20650_IQ6VoLQxyy3heEFW43LSTIqB0UAUeTV0QOvr8O_YnaeU-om/pub?gid=0&output=csv";
    const olshopSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGe6AOx8Dsnq--KPToMl0Q4lF20650_IQ6VoLQxyy3heEFW43LSTIqB0UAUeTV0QOvr8O_YnaeU-om/pub?gid=1048998840&output=csv";

    // --- ELEMEN DOM ---
    const loadingIndicator = document.getElementById('detail-loading');
    const contentContainer = document.getElementById('detail-content');
    const errorIndicator = document.getElementById('detail-error');

    // --- FUNGSI UTAMA ---
    async function loadProfile() {
        const urlParams = new URLSearchParams(window.location.search);
        const memberId = urlParams.get('id');

        if (!memberId) {
            showError();
            return;
        }

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
            const allMembers = mergeData(parseCsv(membersCsv), parseCsv(olshopCsv));
            
            const member = allMembers.find(m => m.id_anggota === memberId);

            if (member) {
                displayProfile(member);
                showContent();
            } else {
                showError();
            }

        } catch (error) {
            console.error("Gagal memuat profil:", error);
            showError();
        }
    }
    
    function displayProfile(member) {
        // Set Judul Halaman
        document.title = `${member.nama_usaha || member.nama_lengkap} - Sinergi Ekonomi Krapyak`;

        // 1. Gambar/Logo Usaha
        const imageContainer = document.getElementById('detail-image');
        if (member.id_anggota) {
             const initial = (member.nama_usaha || member.nama_lengkap || 'A').charAt(0).toUpperCase();
             const placeholderDiv = `<div class="placeholder-initial">${initial}</div>`;
             imageContainer.innerHTML = `<img src="assets/usaha/${member.id_anggota}.jpg" alt="${member.nama_usaha || ''}" onerror="this.outerHTML = \`${placeholderDiv}\`;">`;
        } else {
             imageContainer.innerHTML = `<div class="placeholder-initial">A</div>`;
        }

        // 2. Info Dasar
        document.getElementById('detail-title').textContent = member.nama_usaha || 'Nama Usaha Belum Diisi';
        document.getElementById('detail-owner-name').textContent = member.nama_lengkap || 'Nama Pemilik';
        
        // 3. Tombol Kontak
        const contactButtons = document.getElementById('contact-buttons');
        contactButtons.innerHTML = ''; // Clear existing
        
        let phoneNumber = (member.no_hp || '').replace(/[^0-9]/g, '');
        if (phoneNumber) {
            if (phoneNumber.startsWith('0')) phoneNumber = '62' + phoneNumber.substring(1);
            else if (!phoneNumber.startsWith('62')) phoneNumber = '62' + phoneNumber;
            contactButtons.innerHTML += `<a href="https://wa.me/${phoneNumber}" target="_blank" rel="noopener noreferrer" class="contact-btn whatsapp"><i class="fab fa-whatsapp"></i> Hubungi via WhatsApp</a>`;
        }
        if (member.url_gmaps) {
            contactButtons.innerHTML += `<a href="${member.url_gmaps}" target="_blank" rel="noopener noreferrer" class="contact-btn gmaps"><i class="fas fa-map-marker-alt"></i> Lihat di Google Maps</a>`;
        }
        if (member.link_website) {
            contactButtons.innerHTML += `<a href="${member.link_website}" target="_blank" rel="noopener noreferrer" class="contact-btn website"><i class="fas fa-globe"></i> Kunjungi Website</a>`;
        }
        
        // 4. Deskripsi dan Info Lainnya
        document.getElementById('detail-description').textContent = member.detail_profesi || 'Tidak ada deskripsi.';
        document.getElementById('detail-prospect').textContent = member.prospek || 'Tidak ada informasi prospek/kerjasama.';
        document.getElementById('detail-domicile').textContent = member.domisili || 'N/A';
        document.getElementById('detail-angkatan').textContent = member.angkatan || 'N/A';
        document.getElementById('detail-komplek').textContent = member.komplek || 'N/A';
    }

    // --- FUNGSI HELPER TAMPILAN ---
    function showLoading() {
        loadingIndicator.style.display = 'block';
        contentContainer.style.display = 'none';
        errorIndicator.style.display = 'none';
    }

    function showContent() {
        loadingIndicator.style.display = 'none';
        contentContainer.style.display = 'grid';
        errorIndicator.style.display = 'none';
    }
    
    function showError() {
        loadingIndicator.style.display = 'none';
        contentContainer.style.display = 'none';
        errorIndicator.style.display = 'block';
    }
    
    // --- FUNGSI PARSING & MERGE (diambil dari home.js) ---
    function parseCsv(csvText) {
        const result = [];
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            for (let j = 0; j < headers.length; j++) {
                row[headers[j]] = (values[j] || '').trim().replace(/^"|"$/g, '');
            }
            result.push(row);
        }
        return result;
    }

    function mergeData(members, olshops) {
        const olshopMap = olshops.reduce((acc, shop) => {
            if (!shop.id_anggota) return acc;
            if (!acc[shop.id_anggota]) acc[shop.id_anggota] = {};
            const platform = (shop.platform || '').toLowerCase();
            const url = shop.url || '';
            if (platform === 'shopee') acc[shop.id_anggota].link_shopee = url;
            else if (platform === 'tokopedia') acc[shop.id_anggota].link_tokopedia = url;
            else if (platform === 'lainnya') {
                if(url.includes('facebook.com')) acc[shop.id_anggota].link_facebook = url;
                else acc[shop.id_anggota].link_website = url;
            }
            return acc;
        }, {});
        return members.map(member => ({...member, ...olshopMap[member.id_anggota]}));
    }

    // --- INISIALISASI ---
    loadProfile();
}); 
