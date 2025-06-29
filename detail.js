document.addEventListener('DOMContentLoaded', function() {
    // --- KONFIGURASI ---
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-GZ7xYJvzT_G7uYv_N5KiRByre-XQFzJbIXkAyWM8bxSxiszIKDUxvPxTupqzyawq/exec";

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
        detailContent.style.display = 'block'; // Menggunakan block, bukan grid

        // --- Data Utama Anggota ---
        const memberInfoHtml = `
            <div class="detail-header">
                <div class="detail-header-image">
                    ${(member.nama_lengkap || 'A').charAt(0)}
                </div>
                <div class="detail-header-info">
                    <h1>${member.nama_lengkap}</h1>
                    <p>${member.profesi || 'Profesi tidak diisi'}</p>
                    <div class="info-tags">
                        <span><i class="fas fa-calendar-alt"></i> Angkatan: ${member.th_masuk || 'N/A'}</span>
                        <span><i class="fas fa-map-marker-alt"></i> Domisili: ${member.domisili || 'N/A'}</span>
                        <span><i class="fas fa-building"></i> Komplek: ${member.komplek || 'N/A'}</span>
                    </div>
                </div>
            </div>
            <div class="detail-section">
                <h3>Informasi Kontak</h3>
                <p><strong>No. HP:</strong> ${member.no_hp_anggota && member.no_hp_active == 1 ? `<a href="https://wa.me/${String(member.no_hp_anggota).replace(/\D/g, '')}">${member.no_hp_anggota}</a>` : 'Tidak ditampilkan'}</p>
                <p><strong>Alamat:</strong> ${member.detail_alamat && member.alamat_active == 1 ? member.detail_alamat : 'Tidak ditampilkan'}</p>
            </div>
            <div class="detail-section">
                <h3>Gagasan & Pengembangan Diri</h3>
                <p><strong>Rencana Pengembangan:</strong> ${member.pengembangan_profesi || 'Tidak ada'}</p>
                <p><strong>Ide untuk Komunitas:</strong> ${member.ide || 'Tidak ada'}</p>
            </div>
        `;
        
        detailContent.innerHTML = memberInfoHtml;

        // --- Tampilkan Daftar Usaha ---
        if (member.usaha && member.usaha.length > 0) {
            let usahaHtml = '<div class="detail-section"><h2>Daftar Usaha</h2>';
            member.usaha.forEach(u => {
                
                // Toko Online & Sosmed untuk usaha ini
                const olshopLinks = u.toko_online.map(shop => 
                    `<a href="${shop.url_olshop}" target="_blank" class="social-link"><i class="fas fa-shopping-cart"></i> ${shop.platform_olshop}</a>`
                ).join('');
                const sosmedLinks = u.media_sosial.map(social => 
                    `<a href="${social.url_sosmed}" target="_blank" class="social-link"><i class="fas fa-share-alt"></i> ${social.platform_sosmed}</a>`
                ).join('');

                usahaHtml += `
                    <div class="business-card">
                        <h3>${u.nama_usaha}</h3>
                        <p class="category-tag">${u.kategori_usaha || ''}</p>
                        <p>${u.detail_usaha || 'Tidak ada deskripsi usaha.'}</p>
                        <div class="business-contact">
                            ${u.no_hp_perusahaan ? `<span><i class="fas fa-phone"></i> ${u.no_hp_perusahaan}</span>` : ''}
                            ${u.website_perusahaan ? `<span><i class="fas fa-globe"></i> <a href="${u.website_perusahaan}" target="_blank">Website</a></span>` : ''}
                            ${u.url_gmaps_perusahaan ? `<span><i class="fas fa-map-marked-alt"></i> <a href="${u.url_gmaps_perusahaan}" target="_blank">Google Maps</a></span>` : ''}
                        </div>
                        <div class="business-socials">
                            ${olshopLinks}
                            ${sosmedLinks}
                        </div>
                         <div class="prospect-section">
                            <strong>Prospek Kerjasama:</strong>
                            <p>${u.prospek_kerjasama_penawaran || 'Tidak ada informasi.'}</p>
                        </div>
                    </div>
                `;
            });
            usahaHtml += '</div>';
            detailContent.innerHTML += usahaHtml;
        }
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
