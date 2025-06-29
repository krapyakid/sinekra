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

            const olshopLinks = usaha.toko_online.map(shop => 
                `<a href="${shop.url_olshop}" target="_blank" class="contact-link-item"><i class="fas fa-shopping-cart"></i> ${shop.platform_olshop}</a>`
            ).join('');
            
            const sosmedLinks = usaha.media_sosial.map(social => {
                let iconClass = 'fa-share-alt'; // default icon
                const platform = social.platform_sosmed.toLowerCase();
                if (platform.includes('facebook')) iconClass = 'fa-facebook-f';
                else if (platform.includes('instagram')) iconClass = 'fa-instagram';
                else if (platform.includes('tiktok')) iconClass = 'fa-tiktok';
                else if (platform.includes('youtube')) iconClass = 'fa-youtube';
                return `<a href="${social.url_sosmed}" target="_blank" class="contact-link-item"><i class="fab ${iconClass}"></i> ${social.platform_sosmed}</a>`;
            }).join('');

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
                            ${olshopLinks}
                            ${sosmedLinks}
                            ${usaha.url_gmaps_perusahaan ? `<a href="${usaha.url_gmaps_perusahaan}" target="_blank" class="contact-link-item"><i class="fas fa-map-marked-alt"></i> Google Maps</a>` : ''}
                            ${usaha.website_perusahaan ? `<a href="${usaha.website_perusahaan}" target="_blank" class="contact-link-item"><i class="fas fa-globe"></i> Website</a>` : ''}
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
