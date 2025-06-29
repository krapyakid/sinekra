document.addEventListener('DOMContentLoaded', function() {
    // --- KONFIGURASI ---
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvsDmDoerDTDgV39Op65g8D_fGyCyTy82StbSzsACbpQoYnetw96E4mQ1T0suIHfhR/exec";

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
            if(loadingIndicator) loadingIndicator.style.display = 'flex';
            if(errorMessage) errorMessage.style.display = 'none';

            // Ambil data untuk satu anggota spesifik
            const response = await fetch(`${SCRIPT_URL}?id=${memberId}`, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`Gagal mengambil data: ${response.statusText}`);
            }

            const result = await response.json();
            if (result.status === "success" && result.data) {
                displayMember(result.data);
            } else {
                throw new Error(result.message || `Anggota dengan ID "${memberId}" tidak ditemukan.`);
            }

        } catch (error) {
            console.error("Error loading member details:", error);
            showError(error.message);
        }
    }

    function displayMember(member) {
        if(loadingIndicator) loadingIndicator.style.display = 'none';
        if (!detailContent) {
            console.error("Elemen 'detail-content' tidak ditemukan.");
            return;
        }
        detailContent.innerHTML = ''; // Kosongkan konten sebelumnya
        detailContent.style.display = 'block';

        // Tampilkan info jika anggota tidak punya usaha
        if (!member.usaha || member.usaha.length === 0) {
            detailContent.innerHTML = `
                <div class="detail-header">
                     <div class="detail-header-image">${(member.nama_lengkap || 'A').charAt(0)}</div>
                     <div class="detail-header-info">
                        <h1>${member.nama_lengkap}</h1>
                        <p>${member.profesi || 'Profesi tidak diisi'}</p>
                     </div>
                </div>
                <p>Anggota ini belum mendaftarkan usahanya.</p>
            `;
            return;
        }

        // Loop untuk setiap usaha dan buat tampilan produk
        member.usaha.forEach(usaha => {
            const defaultImgUrl = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/usaha/default_image_usaha.jpg';
            const usahaImgUrl = `assets/usaha/${usaha.id_usaha}.jpg`;

            // --- Logika Ikon Baru (dengan Path yang Benar) ---
            const iconBaseUrl = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/';
            const platformIcons = {
                // Marketplace icons (dalam subfolder /marketplace)
                'shopee':      { name: 'Shopee',      icon: 'marketplace/shopee.png' },
                'tokopedia':   { name: 'Tokopedia',   icon: 'marketplace/tokopedia.png' },
                'lazada':      { name: 'Lazada',      icon: 'marketplace/lazada.png' },
                'tiktok shop': { name: 'TikTok Shop', icon: 'marketplace/tiktok.png' },
                'blibli':      { name: 'Blibli',      icon: 'marketplace/blibli.png' },
                
                // Social & Other icons (langsung di dalam /assets)
                'facebook':    { name: 'Facebook',    icon: 'facebook.png' },
                'instagram':   { name: 'Instagram',   icon: 'instagram.png' },
                'tiktok':      { name: 'TikTok',      icon: 'tiktok.png' },
                'youtube':     { name: 'YouTube',     icon: 'youtube.png' },
                'google maps': { name: 'Google Maps', icon: 'gmaps.png' },
                'website':     { name: 'Website',     icon: 'website.png' }
            };

            const allLinks = [];
            usaha.toko_online.forEach(shop => allLinks.push({ key: shop.platform_olshop, url: shop.url_olshop }));
            usaha.media_sosial.forEach(social => allLinks.push({ key: social.platform_sosmed, url: social.url_sosmed }));
            if (usaha.url_gmaps_perusahaan) allLinks.push({ key: 'Google Maps', url: usaha.url_gmaps_perusahaan });
            if (usaha.website_perusahaan) allLinks.push({ key: 'Website', url: usaha.website_perusahaan });
            
            const linksHtml = allLinks.map(link => {
                if (!link.key) return ''; // Lewati jika tidak ada key
                const platformInfo = platformIcons[link.key.toLowerCase()];
                if (!platformInfo) return ''; // Jangan tampilkan jika ikon tidak ada
                
                const iconUrl = iconBaseUrl + platformInfo.icon;
                return `
                    <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="contact-link-item">
                        <img src="${iconUrl}" class="contact-link-icon" alt="${platformInfo.name}">
                        <span>${platformInfo.name}</span>
                    </a>
                `;
            }).join('');
            // --- Akhir Logika Ikon Baru ---

            const businessHtml = `
                <div class="product-view-container">
                    <div class="product-gallery-pane">
                        <img src="${usahaImgUrl}" alt="Gambar produk ${usaha.nama_usaha}" onerror="this.onerror=null;this.src='${defaultImgUrl}';">
                    </div>
                    <div class="product-details-pane">
                        <span class="product-category">${usaha.kategori_usaha || 'Kategori'}</span>
                        <h1 class="product-title">${usaha.nama_usaha}</h1>

                        <div class="seller-info-box">
                             <div class="seller-avatar">${member.nama_lengkap.charAt(0)}</div>
                             <div class="seller-details">
                                 <strong>${member.nama_lengkap}</strong>
                                 <span><i class="fas fa-map-marker-alt"></i> ${member.domisili}</span>
                             </div>
                             <div class="seller-actions">
                                 ${usaha.no_hp_perusahaan ? `<a href="https://wa.me/${String(usaha.no_hp_perusahaan).replace(/\D/g, '')}" class="btn-action primary" target="_blank">Chat</a>` : ''}
                             </div>
                        </div>

                        <div class="separator"></div>

                        <h3>Deskripsi Usaha</h3>
                        <p class="product-description">${usaha.detail_usaha || 'Tidak ada deskripsi.'}</p>

                        <h3>Prospek Kerjasama</h3>
                        <p class="product-prospects">${usaha.prospek_kerjasama_penawaran || 'Tidak ada informasi.'}</p>
                        
                        <div class="separator"></div>

                        <h3>Toko Online & Tautan</h3>
                        <div class="contact-links-grid">
                            ${linksHtml}
                        </div>
                    </div>
                </div>
            `;
            detailContent.innerHTML += businessHtml;
        });
    }

    function showError(message = "Gagal memuat data atau anggota tidak ditemukan.") {
        if(loadingIndicator) loadingIndicator.style.display = 'none';
        if(detailContent) detailContent.style.display = 'none';
        if(errorMessage) {
            errorMessage.style.display = 'flex';
            const p = errorMessage.querySelector('p');
            if (p) p.textContent = message;
        }
    }
    
    // --- Mulai proses ---
    loadMemberDetail();
}); 
