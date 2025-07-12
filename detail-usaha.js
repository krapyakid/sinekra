document.addEventListener('DOMContentLoaded', function() {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvsDmDoerDTDgV39Op65g8D_fGyCyTy82StbSzsACbpQoYnetw96E4mQ1T0suIHfhR/exec";
    const detailContent = document.getElementById('detail-content');
    const breadcrumbContainer = document.getElementById('breadcrumb');
    const recommendationSection = document.getElementById('recommendation-section');
    const recommendationGrid = document.getElementById('recommendation-grid');

    const urlParams = new URLSearchParams(window.location.search);
    const businessId = urlParams.get('id');

    async function fetchAllData() {
        try {
            const response = await fetch(SCRIPT_URL, { cache: 'no-cache' });
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            const result = await response.json();
            if (result.status === "success") {
                return result.data;
            } else {
                throw new Error(result.message || 'Error fetching data from script.');
            }
        } catch (error) {
            console.error("Failed to load data:", error);
            detailContent.innerHTML = `<p class="error-message">Gagal memuat data. Silakan coba lagi.</p>`;
            return null;
        }
    }

    function renderBreadcrumb(business) {
        breadcrumbContainer.innerHTML = `
            <a href="index.html">Home</a>
            <span>&nbsp;&gt;&nbsp;</span>
            <span>Detail Usaha</span>
        `;
    }

    function createBusinessCard(businessData) {
        const card = document.createElement('a');
        card.href = `detail-usaha.html?id=${businessData.id_usaha}`;
        card.className = 'member-card';

        const baseAssetUrl = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/usaha/';
        const defaultImgUrl = `assets/usaha/default_image_usaha.jpg`;
        const businessImgUrl = `${baseAssetUrl}${businessData.id_usaha}.jpg`;

        const gmapsUrl = businessData.url_gmaps_perusahaan || 
            (businessData.domisili_usaha ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessData.domisili_usaha)}` : 
            (businessData.domisili ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessData.domisili)}` : '#'));
        
        // Format: SVG [Nama Panggilan] | [Domisili]
        const domisiliText = businessData.domisili_usaha || businessData.domisili || 'Lokasi tidak diketahui';
        const nickname = businessData.nama_panggilan || '';
        const locationSvg = '<svg class="icon-location" width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
        const locationButtonText = nickname ? `${locationSvg}<span>${nickname}</span> | <span>${domisiliText}</span>` : `${locationSvg}<span>${domisiliText}</span>`;

        const contactIcons = [];
        
        // WhatsApp icon
        const waNumber = (businessData.whatsapp || '').replace(/[^0-9]/g, '');
        if (waNumber) {
            contactIcons.push(`<a href="https://wa.me/62${waNumber}" target="_blank" class="card-icon-link" onclick="event.stopPropagation()" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>`);
        }
        
        // Website icon
        if (businessData.website_usaha) {
            contactIcons.push(`<a href="${businessData.website_usaha}" target="_blank" class="card-icon-link" onclick="event.stopPropagation()" title="Website"><i class="fas fa-globe"></i></a>`);
        }
        
        // Social Media icons
        const socialMediaMap = {
            instagram: { icon: 'fa-instagram', url: businessData.instagram },
            facebook: { icon: 'fa-facebook', url: businessData.facebook },
            tiktok: { icon: 'fa-tiktok', url: businessData.tiktok },
            youtube: { icon: 'fa-youtube', url: businessData.youtube }
        };

        // Add social media icons
        for (const [platform, data] of Object.entries(socialMediaMap)) {
            if (data.url && data.url.trim() !== '') {
                const url = data.url.startsWith('http') ? data.url : `https://${data.url}`;
                contactIcons.push(`<a href="${url}" target="_blank" class="card-icon-link" onclick="event.stopPropagation()" title="${platform.charAt(0).toUpperCase() + platform.slice(1)}"><i class="fab ${data.icon}"></i></a>`);
            }
        }

        // Marketplace icons
        const olshops = {
            tokopedia: { icon: 'icon-tokopedia.svg', url: businessData.tokopedia },
            shopee: { icon: 'icon-shopee.svg', url: businessData.shopee },
            bukalapak: { icon: 'icon-bukalapak.svg', url: businessData.bukalapak },
            blibli: { icon: 'icon-blibli.svg', url: businessData.blibli },
            tiktokshop: { icon: 'icon-tiktok.svg', url: businessData.tiktok_shop }
        };

        // Add marketplace icons
        for (const [platform, data] of Object.entries(olshops)) {
            if (data.url && data.url.trim() !== '') {
                const url = data.url.startsWith('http') ? data.url : `https://${data.url}`;
                contactIcons.push(`<a href="${url}" target="_blank" class="card-icon-link marketplace-icon-link" onclick="event.stopPropagation()" title="${platform.charAt(0).toUpperCase() + platform.slice(1)}"><img src="assets/marketplace/${data.icon}" alt="${platform}" class="marketplace-icon"></a>`);
            }
        }

        // Format tanggal posting
        function formatPostingDate(timestamp) {
            if (!timestamp) return 'Tanggal tidak tersedia';
            try {
                const date = new Date(timestamp);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            } catch (error) {
                return 'Tanggal tidak valid';
            }
        }
        
        card.innerHTML = `
            <div class="card-banner">
                <img src="${businessImgUrl}" alt="Gambar ${businessData.nama_usaha}" loading="lazy" onerror="this.onerror=null; this.src='${defaultImgUrl}';">
            </div>
            <div class="card-location-info">
                <a href="${gmapsUrl}" target="_blank" class="card-location-btn" onclick="event.stopPropagation()">
                    ${locationButtonText}
                </a>
            </div>
            <div class="card-content">
                <h3 class="card-business-name">${businessData.nama_usaha}</h3>
                <p class="card-description">${businessData.jenis_usaha || ''}</p>
                <div class="card-bottom-row">
                    <div class="card-icon-container">${contactIcons.join('')}</div>
                </div>
                <div class="card-posting-date">Diposting: ${formatPostingDate(businessData.timestamp)}</div>
            </div>
        `;
        return card;
    }

    function renderDetail(allData) {
        if (!businessId) {
            detailContent.innerHTML = `<p class="error-message">ID Usaha tidak ditemukan.</p>`;
            return;
        }

        const allBusinesses = allData.flatMap(member => member.usaha ? member.usaha.map(u => ({...member, ...u})) : []);
        const business = allBusinesses.find(b => b.id_usaha === businessId);

        if (!business) {
            detailContent.innerHTML = `<p class="error-message">Detail usaha tidak ditemukan.</p>`;
            return;
        }

        document.title = `${business.nama_usaha} - Sinergi Ekonomi Krapyak`;
        renderBreadcrumb(business);

        const baseAssetUrl = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/usaha/';
        const defaultImgUrl = 'assets/usaha/default_image_usaha.jpg';
        const businessImgUrl = `${baseAssetUrl}${business.id_usaha}.jpg`;

        // --- Kontak, Social Media, and Marketplace Icons ---
        const contactIcons = [];
        
        // Website
        if (business.website_usaha) {
            const url = business.website_usaha.startsWith('http') ? business.website_usaha : `https://${business.website_usaha}`;
            contactIcons.push(`<a href="${url}" target="_blank" class="card-icon-link" title="Website"><i class="fas fa-globe"></i></a>`);
        }
        
        // WhatsApp
        const waNumber = String(business.whatsapp || business.no_hp_perusahaan || '').replace(/[^0-9]/g, '');
        if (waNumber) {
            contactIcons.push(`<a href="https://wa.me/62${waNumber}" target="_blank" class="card-icon-link" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>`);
        }
        
        // Social Media
        const socialMediaMap = {
            instagram: { icon: 'fa-instagram', url: business.instagram },
            facebook: { icon: 'fa-facebook', url: business.facebook },
            tiktok: { icon: 'fa-tiktok', url: business.tiktok },
            youtube: { icon: 'fa-youtube', url: business.youtube }
        };

        // Add social media icons
        for (const [platform, data] of Object.entries(socialMediaMap)) {
            if (data.url && data.url.trim() !== '') {
                const url = data.url.startsWith('http') ? data.url : `https://${data.url}`;
                contactIcons.push(`<a href="${url}" target="_blank" class="card-icon-link" title="${platform.charAt(0).toUpperCase() + platform.slice(1)}"><i class="fab ${data.icon}"></i></a>`);
            }
        }

        // Marketplace
        const olshops = {
            tokopedia: { icon: 'icon-tokopedia.svg', url: business.tokopedia },
            shopee: { icon: 'icon-shopee.svg', url: business.shopee },
            bukalapak: { icon: 'icon-bukalapak.svg', url: business.bukalapak },
            blibli: { icon: 'icon-blibli.svg', url: business.blibli },
            tiktokshop: { icon: 'icon-tiktok.svg', url: business.tiktok_shop }
        };

        // Add marketplace icons
        for (const [platform, data] of Object.entries(olshops)) {
            if (data.url && data.url.trim() !== '') {
                const url = data.url.startsWith('http') ? data.url : `https://${data.url}`;
                contactIcons.push(`<a href="${url}" target="_blank" class="card-icon-link marketplace-icon-link" title="${platform.charAt(0).toUpperCase() + platform.slice(1)}"><img src="assets/marketplace/${data.icon}" alt="${platform}" class="marketplace-icon"></a>`);
            }
        }

        // Log icon generation results
        console.log('Generated contact icons for business detail:', {
            businessName: business.nama_usaha,
            totalIcons: contactIcons.length,
            socialMedia: Object.entries(socialMediaMap).filter(([_, data]) => data.url && data.url.trim() !== '').map(([platform]) => platform),
            marketplaces: Object.entries(olshops).filter(([_, data]) => data.url && data.url.trim() !== '').map(([platform]) => platform)
        });

        detailContent.innerHTML = `
            <div class="detail-image-container">
                <img src="${businessImgUrl}" alt="Foto ${business.nama_usaha}" onerror="this.onerror=null; this.src='${defaultImgUrl}';">
            </div>
            <div class="detail-info">
                <h1>${business.nama_usaha}</h1>
                <div class="jenis-usaha-wrapper">
                    <h4 class="jenis-usaha-title">Jenis Usaha</h4>
                    <p class="business-category">${business.jenis_usaha || 'Kategori belum diisi'}</p>
                </div>

                <div class="info-section">
                    <h3>Deskripsi Usaha</h3>
                    <p>${business.detail_usaha || 'Tidak ada deskripsi.'}</p>
                </div>

                <div class="info-section">
                    <h3>Peluang Kerjasama</h3>
                    <p>${business.prospek_kerjasama_penawaran || 'Tidak ada informasi.'}</p>
                </div>
                
                <div class="info-section">
                    <h3>Informasi Pemilik</h3>
                    <div class="info-item"><i class="fas fa-university"></i> <span>Alumni: ${business.alumni || 'N/A'}</span></div>
                    <div class="info-item"><i class="fas fa-calendar-alt"></i> <span>Angkatan: ${business.th_masuk || '?'} - ${business.th_keluar || '?'}</span></div>
                    <div class="info-item"><i class="fas fa-user"></i> <span>${business.nama_lengkap}</span></div>
                    <div class="info-item"><i class="fas fa-map-marker-alt"></i> <span>${business.domisili}</span></div>
                </div>

                <div class="info-section">
                    <h3>Kontak Usaha</h3>
                    <div class="contact-icons-section">
                        ${contactIcons.join('')}
                    </div>
                </div>
            </div>
        `;
        
        renderRecommendations(allBusinesses, business);
    }

    function renderRecommendations(allBusinesses, currentBusiness) {
        const recommendations = allBusinesses.filter(b => {
            return b.id_usaha !== currentBusiness.id_usaha && 
                   (b.kategori_usaha === currentBusiness.kategori_usaha || b.domisili === currentBusiness.domisili);
        }).slice(0, 4); // Show max 4 recommendations

        if (recommendations.length > 0) {
            recommendationGrid.innerHTML = '';
            recommendations.forEach(rec => {
                const card = createBusinessCard(rec);
                recommendationGrid.appendChild(card);
            });
            recommendationSection.style.display = 'block';
        }
    }

    // Initialize
    fetchAllData().then(allData => {
        if (allData) {
            renderDetail(allData);
        }
    });

}); 
