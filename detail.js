document.addEventListener('DOMContentLoaded', function() {
    // --- KONFIGURASI ---
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvsDmDoerDTDgV39Op65g8D_fGyCyTy82StbSzsACbpQoYnetw96E4mQ1T0suIHfhR/exec";
    let allDataCache = []; // Cache untuk semua data, digunakan untuk sugesti

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

            // Ambil SEMUA data untuk sugesti, dan data spesifik untuk detail
            // Ini akan fetch semua data sekali dan menyimpannya di cache
            await fetchAllData();
            const member = allDataCache.find(m => m.id_anggota === memberId);
            
            if (member) {
                displayMember(member);
            } else {
                throw new Error(`Anggota dengan ID "${memberId}" tidak ditemukan.`);
            }

        } catch (error) {
            console.error("Error loading member details:", error);
            showError(error.message);
        }
    }

    // Fungsi baru untuk mengambil semua data (mirip main.js)
    async function fetchAllData() {
        if (allDataCache.length > 0) {
            return allDataCache;
        }
        const response = await fetch(SCRIPT_URL, { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`Gagal mengambil data: ${response.statusText}`);
        }
        const result = await response.json();
        if (result.status === "success") {
            allDataCache = result.data;
            return allDataCache;
        } else {
            throw new Error(result.message || 'Terjadi kesalahan dari server.');
        }
    }

    function displayMember(member) {
        if(loadingIndicator) loadingIndicator.style.display = 'none';
        if (!detailContent) {
            console.error("Elemen 'detail-content' tidak ditemukan.");
            return;
        }

        // --- Update Breadcrumb and Page Title ---
        document.title = `${member.nama_lengkap} - Detail Anggota`;
        const breadcrumbNama = document.getElementById('breadcrumb-nama');
        if (breadcrumbNama) {
            breadcrumbNama.textContent = member.nama_lengkap;
        }
        
        detailContent.innerHTML = '';

        if (!member.usaha || member.usaha.length === 0) {
            // Tampilan jika tidak punya usaha (opsional, bisa disesuaikan)
            detailContent.innerHTML = `<p>Anggota ini belum mendaftarkan usahanya.</p>`;
            return;
        }

        // --- [PEMBARUAN] Render setiap usaha ---
        member.usaha.forEach(usaha => {
            const businessHtml = createBusinessViewHtml(usaha, member);
            detailContent.innerHTML += businessHtml;
        });
        
        // --- [BARU] Render Sugesti Usaha ---
        // Ambil usaha pertama sebagai referensi kategori
        const mainBusiness = member.usaha[0];
        const suggestions = getSuggestions(mainBusiness.kategori_usaha, mainBusiness.id_usaha);
        
        if (suggestions.length > 0) {
            const suggestionHtml = createSuggestionSectionHtml(suggestions);
            detailContent.innerHTML += suggestionHtml;
        }
    }

    function createBusinessViewHtml(usaha, member) {
        // --- [FIX] Path Ikon ---
        const iconBaseUrl = 'assets/'; // Menggunakan path relatif
        const platformIcons = {
            'shopee':      { name: 'Shopee',      icon: 'marketplace/shopee.png' },
            'tokopedia':   { name: 'Tokopedia',   icon: 'marketplace/tokopedia.png' },
            'lazada':      { name: 'Lazada',      icon: 'marketplace/lazada.png' },
            'tiktok shop': { name: 'TikTok Shop', icon: 'marketplace/tiktok.png' },
            'blibli':      { name: 'Blibli',      icon: 'marketplace/blibli.png' },
            'facebook':    { name: 'Facebook',    icon: 'facebook.png' },
            'instagram':   { name: 'Instagram',   icon: 'instagram.png' },
            'tiktok':      { name: 'TikTok',      icon: 'tiktok.png' },
            'youtube':     { name: 'YouTube',     icon: 'youtube.png' },
            'google maps': { name: 'Google Maps', icon: 'gmaps.png' },
            'website':     { name: 'Website',     icon: 'website.png' }
        };

        const allLinks = [];
        (usaha.toko_online || []).forEach(shop => allLinks.push({ key: shop.platform_olshop, url: shop.url_olshop }));
        (usaha.media_sosial || []).forEach(social => allLinks.push({ key: social.platform_sosmed, url: social.url_sosmed }));
        if (usaha.url_gmaps_perusahaan) allLinks.push({ key: 'Google Maps', url: usaha.url_gmaps_perusahaan });
        if (usaha.website_perusahaan) allLinks.push({ key: 'Website', url: usaha.website_perusahaan });
        
        const linksHtml = allLinks.map(link => {
            if (!link.key) return '';
            const platformInfo = platformIcons[link.key.toLowerCase()];
            if (!platformInfo) return '';
            const iconUrl = iconBaseUrl + platformInfo.icon;
            return `
                <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="contact-link-item">
                    <img src="${iconUrl}" class="contact-link-icon" alt="${platformInfo.name}">
                    <span>${platformInfo.name}</span>
                </a>`;
        }).join('');
        
        // --- [BARU] Other businesses by this member ---
        const otherBusinesses = member.usaha.filter(u => u.id_usaha !== usaha.id_usaha);
        const otherBusinessesHtml = otherBusinesses.map(ob => 
            `<a href="detail.html?id=${member.id_anggota}#${ob.id_usaha}" class="other-business-link">${ob.nama_usaha}</a>`
        ).join(', ');

        // --- [BARU] Share and Print functionality ---
        const shareData = {
            title: `Sinergi Ekonomi Krapyak: ${usaha.nama_usaha}`,
            text: `Lihat usaha "${usaha.nama_usaha}" milik ${member.nama_lengkap} di Sinergi Ekonomi Krapyak.`,
            url: window.location.href
        };
        const shareButtonHtml = navigator.share ? `<button class="action-btn share" onclick="navigator.share(${JSON.stringify(shareData)})"><i class="fas fa-share-alt"></i> Bagikan</button>` : '';

        // --- HTML Structure Generation ---
        const baseRepoUrl = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/usaha/';
        const defaultImgUrl = `${baseRepoUrl}default_image_usaha.jpg`;
        
        const imageHtml = `
            <img src="${baseRepoUrl}${usaha.id_usaha}.jpg" 
                 alt="Gambar produk ${usaha.nama_usaha}" 
                 onerror="this.onerror=null; this.src='${baseRepoUrl}${member.id_anggota}.jpg'; this.onerror=function(){this.onerror=null; this.src='${defaultImgUrl}';};">
        `;

        // Fallback Google Maps: gunakan url_gmaps_perusahaan, jika kosong gunakan domisili usaha, jika tidak ada pakai domisili member
        const domisili = usaha.domisili || member.domisili || '';
        const mapsUrl = usaha.url_gmaps_perusahaan 
            || (domisili ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(domisili)}` : '#');
        const hasMapsUrl = mapsUrl !== '#' ? 'clickable' : '';

        return `
        <div class="product-view-container" id="${usaha.id_usaha}">
            <div class="product-gallery-pane">
                ${imageHtml}
                
                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="location-bar ${hasMapsUrl}">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${member.nama_panggilan || member.nama_lengkap.split(' ')[0]} - ${domisili}</span>
                </a>
            </div>

            <div class="product-details-pane">
                <div class="title-section">
                    <h1 class="product-title">${usaha.nama_usaha}</h1>
                    <span class="product-category">${usaha.kategori_usaha || 'Kategori'}</span>
                    <div class="actions-group">
                        ${shareButtonHtml}
                        <button class="action-btn print" onclick="window.print()"><i class="fas fa-print"></i> Cetak</button>
                    </div>
                </div>

                <div class="separator"></div>

                <h3>Deskripsi Usaha</h3>
                <p class="product-description">${usaha.detail_usaha || 'Tidak ada deskripsi.'}</p>

                <h3>Prospek Kerjasama</h3>
                <p class="product-prospects">${usaha.prospek_kerjasama_penawaran || 'Tidak ada informasi.'}</p>
                
                <div class="seller-info-box-wrapper">
                    <div class="separator"></div>
                    <div class="seller-info-box">
                         <div class="seller-avatar">${member.nama_lengkap.charAt(0)}</div>
                         <div class="seller-details">
                             <strong>${member.nama_lengkap}</strong>
                             <span>Pemilik Usaha</span>
                         </div>
                         <div class="seller-actions">
                             ${usaha.no_hp_perusahaan ? `<a href="https://wa.me/${String(usaha.no_hp_perusahaan).replace(/\D/g, '')}" class="btn-action primary" target="_blank">Chat</a>` : ''}
                         </div>
                    </div>
                </div>

                ${otherBusinesses.length > 0 ? `
                <div class="other-businesses-section">
                    <h4>Usaha Lainnya dari ${member.nama_lengkap}:</h4>
                    <p>${otherBusinessesHtml}</p>
                </div>
                ` : ''}

                ${linksHtml ? `
                <div class="links-section">
                    <h3>Toko Online & Tautan</h3>
                    <div class="contact-links-grid">${linksHtml}</div>
                </div>
                ` : ''}
            </div>
        </div>`;
    }

    function getSuggestions(category, currentBusinessId) {
        if (!category) return [];
        // Flatten all businesses from the cache
        const allBusinesses = allDataCache.flatMap(member => 
            (member.usaha || []).map(u => ({ ...member, ...u }))
        );
        // Filter for same category, different business, and limit results
        return allBusinesses.filter(b => b.kategori_usaha === category && b.id_usaha !== currentBusinessId).slice(0, 4); // Suggest up to 4
    }

    function createSuggestionSectionHtml(suggestions) {
        const baseRepoUrl = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/usaha/';
        const defaultImgUrl = `${baseRepoUrl}default_image_usaha.jpg`;

        const suggestionCardsHtml = suggestions.map(s => {
            const imageHtml = `
                <img src="${baseRepoUrl}${s.id_usaha}.jpg" 
                     alt="${s.nama_usaha}" 
                     class="suggestion-img" 
                     onerror="this.onerror=null; this.src='${baseRepoUrl}${s.id_anggota}.jpg'; this.onerror=function(){this.onerror=null; this.src='${defaultImgUrl}';};">
            `;

            return `
            <a href="detail.html?id=${s.id_anggota}" class="suggestion-card">
                ${imageHtml}
                <div class="suggestion-info">
                    <h5 class="suggestion-title">${s.nama_usaha}</h5>
                    <p class="suggestion-location">${s.domisili}</p>
                </div>
            </a>`;
        }).join('');

        return `
        <section class="suggestion-section">
            <h2>Usaha Lainnya yang Sejenis</h2>
            <div class="suggestion-grid">${suggestionCardsHtml}</div>
        </section>`;
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
