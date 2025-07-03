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
            contactIcons.push(`<a href="${business.website_usaha}" target="_blank" title="Website"><i class="fas fa-globe"></i></a>`);
        }
        // WhatsApp
        if (business.whatsapp || business.no_hp_perusahaan) {
            contactIcons.push(`<a href="#" onclick="alert('Untuk informasi lebih lanjut, silakan hubungi Admin Sinergi Krapyak.'); return false;" title="WhatsApp"><img src="assets/sosmed/whatsapp.png" alt="WhatsApp"></a>`);
        }
        // Social Media
        const socialMediaMap = { instagram: 'instagram.png', facebook: 'facebook.png', tiktok: 'tiktok.png', youtube: 'youtube.png' };
        Object.entries(socialMediaMap).forEach(([key, icon]) => {
            if (business[key]) {
                contactIcons.push(`<a href="${business[key]}" target="_blank" title="${key.charAt(0).toUpperCase() + key.slice(1)}"><img src="assets/sosmed/${icon}" alt="${key}"></a>`);
            }
        });
        // Marketplace
        const marketplaceMap = { tokopedia: 'tokopedia.png', shopee: 'shopee.png', bukalapak: 'bukalapak.png', blibli: 'blibli.png', lazada: 'lazada.png', tiktokshop: 'tiktokshop.png' };
        Object.entries(marketplaceMap).forEach(([key, icon]) => {
            if (business[key]) {
                contactIcons.push(`<a href="${business[key]}" target="_blank" title="${key.charAt(0).toUpperCase() + key.slice(1)}"><img src="assets/marketplace/${icon}" alt="${key}"></a>`);
            }
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
