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

    function createBusinessCard(business) {
        return `
        <a href="detail-usaha.html?id=${business.id_usaha}" class="member-card">
            <div class="card-banner">
                <img src="${baseAssetUrl}${business.id_usaha}.jpg" alt="Gambar ${business.nama_usaha}" onerror="this.onerror=null; this.src='${baseAssetUrl}default_image_usaha.jpg';">
                <div class="card-location-overlay"><i class="fas fa-map-marker-alt"></i><span>${business.domisili || 'Lokasi'}</span></div>
            </div>
            <div class="card-content">
                <h3 class="card-business-name">${business.nama_usaha}</h3>
                <p class="card-description">${business.jenis_usaha || ''}</p>
            </div>
        </a>`;
    }

    function renderMemberDetails(member, allBusinesses) {
        const detailAlamat = member.tampilkan_alamat == '1' ? member.detail_alamat : '<i>Informasi tidak ditampilkan</i>';
        const noHp = member.tampilkan_kontak == '1' ? member.whatsapp : '<i>Informasi tidak ditampilkan</i>';
        const memberBusinesses = allBusinesses.filter(b => b.id_anggota === member.id_anggota);

        content.innerHTML = `
            <div class="detail-container">
                <div class="detail-header">
                    <h1>${member.nama_lengkap}</h1>
                    <p class="subtitle">Alumni Pondok Pesantren Krapyak</p>
                </div>
                <div class="detail-grid">
                    <div class="detail-card">
                        <h3>Informasi Pribadi</h3>
                        <ul>
                            <li><strong>Nama Panggilan:</strong> ${member.nama_panggilan || '-'}</li>
                            <li><strong>Tahun Masuk:</strong> ${member.tahun_masuk || '-'}</li>
                            <li><strong>Tahun Keluar:</strong> ${member.tahun_keluar || '-'}</li>
                            <li><strong>Komplek:</strong> ${member.komplek || '-'}</li>
                        </ul>
                    </div>
                    <div class="detail-card">
                        <h3>Domisili & Kontak</h3>
                        <ul>
                            <li><strong>Domisili:</strong> ${member.domisili || '-'}</li>
                            <li><strong>Detail Alamat:</strong> ${detailAlamat}</li>
                            <li><strong>No. HP:</strong> ${noHp}</li>
                        </ul>
                    </div>
                    <div class="detail-card detail-card-full">
                        <h3>Karir & Kontribusi</h3>
                        <ul>
                            <li><strong>Profesi:</strong> ${member.profesi || '-'}</li>
                            <li><strong>Detail Profesi:</strong> ${member.detail_profesi || '-'}</li>
                            <li><strong>Pengembangan Profesi:</strong> ${member.pengembangan_profesi || '-'}</li>
                            <li><strong>Ide/Gagasan:</strong> ${member.ide || '-'}</li>
                            <li><strong>Lain-lain:</strong> ${member.lain_lain || '-'}</li>
                        </ul>
                    </div>
                    ${memberBusinesses.length > 0 ? `
                    <div class="detail-card detail-card-full">
                        <h3>Daftar Usaha Milik ${member.nama_lengkap.split(' ')[0]}</h3>
                        <div class="directory-grid">${memberBusinesses.map(b => createBusinessCard(b)).join('')}</div>
                    </div>` : ''}
                </div>
            </div>`;
    }

    async function initializePage() {
        const params = new URLSearchParams(window.location.search);
        const memberId = params.get('id');

        if (!memberId || !memberId.startsWith('MMBR-')) {
            content.innerHTML = `<div class="error-message">ID Anggota tidak valid. Kembali ke <a href="index.html">halaman utama</a>.</div>`;
            return;
        }

        const allData = await fetchData();
        if (allData) {
            const member = allData.find(m => m.id_anggota === memberId);
            if (member) {
                const allBusinessData = allData.flatMap(m => (m.usaha || []).map(u => ({ ...m, ...u, usaha: null })));
                renderMemberDetails(member, allBusinessData);
            } else {
                content.innerHTML = `<div class="error-message">Anggota tidak ditemukan.</div>`;
            }
        }
    }

    initializePage();
}); 