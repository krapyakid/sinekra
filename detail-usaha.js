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

        // --- CONTACTS ---
        const waLink = business.whatsapp ? `<a href="https://wa.me/62${(business.whatsapp || '').replace(/[^0-9]/g, '')}" class="btn-contact whatsapp" target="_blank"><i class="fab fa-whatsapp"></i> WhatsApp</a>` : '';
        const webLink = business.website_usaha ? `<a href="${business.website_usaha}" class="btn-contact website" target="_blank"><i class="fas fa-globe"></i> Website</a>` : '';
        const gmapsLink = business.url_gmaps_perusahaan ? `<a href="${business.url_gmaps_perusahaan}" class="btn-contact gmaps" target="_blank"><i class="fas fa-map-marked-alt"></i> Lihat Peta</a>` : '';

        // --- SOCIAL MEDIA ---
        const socialMediaMap = { instagram: 'fa-instagram', facebook: 'fa-facebook', tiktok: 'fa-tiktok', youtube: 'fa-youtube' };
        const socialLinks = Object.entries(socialMediaMap)
            .map(([key, icon]) => business[key] ? `<a href="${business[key]}" target="_blank" title="${key}"><i class="fab ${icon}"></i></a>` : '')
            .join('');

        // --- MARKETPLACE ---
        const marketplaceMap = { tokopedia: 'tokopedia.svg', shopee: 'shopee.svg', bukalapak: 'bukalapak.svg', blibli: 'blibli.svg', tiktokshop: 'tiktokshop.svg' };
        const marketplaceLinks = Object.entries(marketplaceMap)
            .map(([key, icon]) => business[key] ? `<a href="${business[key]}" target="_blank" title="${key}"><img src="assets/marketplace/${icon}" alt="${key}"></a>` : '')
            .join('');

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
                    <h3>Informasi Pemilik & Kontak Usaha</h3>
                    <div class="info-item"><i class="fas fa-user"></i> <span>${business.nama_lengkap} (Angkatan ${business.tahun_keluar || 'N/A'})</span></div>
                    <div class="info-item"><i class="fas fa-phone-alt"></i> <span>${business.no_hp_perusahaan || 'Tidak ada nomor HP usaha'}</span></div>
                    <div class="info-item"><i class="fas fa-map-marker-alt"></i> <span>${business.domisili_usaha || business.domisili || 'Lokasi tidak diketahui'}</span></div>
                </div>

                <div class="info-section">
                    <h3>Tautan</h3>
                    <div class="contact-icons-section">
                        ${waLink} ${webLink} ${gmapsLink}
                    </div>
                     <div class="info-section-divider"></div>
                    <div class="contact-icons-section">
                        <div class="social-media-icons">${socialLinks}</div>
                        <div class="marketplace-icons">${marketplaceLinks}</div>
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
