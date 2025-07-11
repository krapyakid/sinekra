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
                const card = createBusinessCard(rec); // Re-use from main.js
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
