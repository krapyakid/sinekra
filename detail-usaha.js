document.addEventListener('DOMContentLoaded', function() {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvsDmDoerDTDgV39Op65g8D_fGyCyTy82StbSzsACbpQoYnetw96E4mQ1T0suIHfhR/exec";
    const content = document.getElementById('detail-content');
    const baseAssetUrl = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/usaha/';

    async function fetchData() {
        try {
            const response = await fetch(SCRIPT_URL, { cache: 'no-cache' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.status === "success") return result.data;
            throw new Error(result.message || 'Server returned an error.');
        } catch (error) {
            console.error("Failed to load data:", error);
            content.innerHTML = `<div class="error-message">Gagal memuat data. Silakan coba lagi nanti.</div>`;
            return null;
        }
    }

    function createSuggestionCard(business) {
        return `
        <a href="detail-usaha.html?id=${business.id_usaha}" class="member-card">
            <div class="card-banner">
                <img src="${baseAssetUrl}${business.id_usaha}.jpg" alt="Gambar ${business.nama_usaha}" onerror="this.onerror=null; this.src='${baseAssetUrl}default_image_usaha.jpg';">
                <div class="card-location-overlay"><i class="fas fa-map-marker-alt"></i><span>${business.domisili || 'Lokasi'}</span></div>
            </div>
            <div class="card-content">
                <h3 class="card-business-name">${business.nama_usaha}</h3>
                <p class="card-description">${business.jenis_usaha || ''}</p>
                <div class="card-owner"><i class="fas fa-user"></i> ${business.nama_lengkap}</div>
            </div>
        </a>`;
    }

    function renderBusinessDetails(business, allBusinesses) {
        document.title = `${business.nama_usaha} - Sinergi Ekonomi Krapyak`;
        
        const defaultImgUrl = `${baseAssetUrl}default_image_usaha.jpg`;
        const businessImgUrl = `${baseAssetUrl}${business.id_usaha}.jpg`;
        const memberImgUrl = `https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/anggota/${business.id_anggota}.jpg`;
        const mapsUrl = business.url_gmaps_perusahaan || (business.domisili ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.domisili)}` : '#');

        const contactIcons = [];
        if (business.whatsapp) contactIcons.push({ href: `https://wa.me/${business.whatsapp.replace(/\D/g, '')}`, icon: 'fab fa-whatsapp', text: 'WhatsApp' });
        if (business.website_usaha) contactIcons.push({ href: business.website_usaha, icon: 'fas fa-globe', text: 'Website' });
        if (business.sosmed_usaha) contactIcons.push({ href: business.sosmed_usaha, icon: 'fab fa-facebook', text: 'Facebook' });
        const olshops = {'tokopedia':'Tokopedia','shopee':'Shopee','bukalapak':'Bukalapak','blibli':'Blibli','tiktok':'TikTok Shop'};
        for (const key in olshops) {
            if (business[key]) contactIcons.push({ href: business[key], img: `assets/marketplace/icon-${key}.svg`, text: olshops[key] });
        }

        const suggestions = allBusinesses.filter(b => b.kategori_usaha === business.kategori_usaha && b.id_usaha !== business.id_usaha).slice(0, 4);

        content.innerHTML = `
            <div class="breadcrumb">
                <a href="index.html">Home</a> <i class="fas fa-chevron-right"></i> <span>Detail Usaha</span>
            </div>
            <div class="product-view-container">
                <div class="product-gallery-pane">
                    <img src="${businessImgUrl}" alt="Gambar ${business.nama_usaha}" onerror="this.onerror=null; this.src='${memberImgUrl}'; this.onerror=function(){this.onerror=null; this.src='${defaultImgUrl}';};">
                </div>
                <div class="product-details-pane">
                    <span class="product-category">${business.kategori_usaha || 'Kategori'}</span>
                    <h1 class="product-title">${business.nama_usaha}</h1>
                    <div class="seller-info-box">
                        <a href="detail-anggota.html?id=${business.id_anggota}" class="seller-avatar">${business.nama_lengkap.charAt(0)}</a>
                        <div class="seller-details">
                            <strong><a href="detail-anggota.html?id=${business.id_anggota}">${business.nama_lengkap}</a></strong>
                            <span>Pemilik Usaha &nbsp;&bull;&nbsp; <a href="${mapsUrl}" target="_blank"> ${business.domisili}</a></span>
                        </div>
                    </div>
                    
                    <div class="separator"></div>
                    
                    <h3>Deskripsi Usaha</h3>
                    <p class="product-description">${business.detail_usaha || 'Tidak ada deskripsi.'}</p>
                    
                    ${contactIcons.length > 0 ? `
                        <h3 class="contact-title">Kontak & Tautan</h3>
                        <div class="contact-links-grid">${contactIcons.map(link => `
                            <a href="${link.href}" target="_blank" rel="noopener noreferrer" class="contact-link-item">
                                ${link.img ? `<img src="${link.img}" class="contact-link-icon">` : `<i class="${link.icon}"></i>`}
                                <span>${link.text}</span>
                            </a>`).join('')}
                        </div>` : ''}
                </div>
            </div>
            ${suggestions.length > 0 ? `
            <div class="suggestion-section">
                <h2>Rekomendasi Usaha Sejenis</h2>
                <div class="directory-grid">${suggestions.map(s => createSuggestionCard(s)).join('')}</div>
            </div>` : ''}
        `;
    }

    async function initializePage() {
        const params = new URLSearchParams(window.location.search);
        const businessId = params.get('id');

        if (!businessId || !businessId.startsWith('USH-')) {
            content.innerHTML = `<div class="error-message">ID Usaha tidak valid. Kembali ke <a href="index.html">halaman utama</a>.</div>`;
            return;
        }

        const allData = await fetchData();
        if (allData) {
            const allBusinessData = allData.flatMap(m => (m.usaha || []).map(u => ({ ...m, ...u, usaha: null })));
            const business = allBusinessData.find(b => b.id_usaha === businessId);
            
            if (business) {
                renderBusinessDetails(business, allBusinessData);
            } else {
                content.innerHTML = `<div class="error-message">Usaha tidak ditemukan.</div>`;
            }
        }
    }

    initializePage();
}); 
