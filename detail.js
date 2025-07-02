document.addEventListener('DOMContentLoaded', function() {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvsDmDoerDTDgV39Op65g8D_fGyCyTy82StbSzsACbpQoYnetw96E4mQ1T0suIHfhR/exec";

    const content = document.getElementById('detail-content');

    async function fetchData() {
        try {
            const response = await fetch(SCRIPT_URL, { cache: 'no-cache' });
            if (!response.ok) throw new Error(`Gagal mengambil data: ${response.statusText}`);
            const result = await response.json();
            if (result.status === "success") {
                return result.data;
            } else {
                throw new Error(result.message || 'Terjadi kesalahan dari server.');
            }
        } catch (error) {
            console.error("Gagal memuat data:", error);
            content.innerHTML = `<p class="error-message">Gagal memuat data. Silakan coba muat ulang halaman.</p>`;
            return null;
        }
    }

    function renderMemberDetails(member) {
        // Conditional data
        const detailAlamat = member.tampilkan_alamat == '1' ? member.detail_alamat : '<i>Informasi tidak ditampilkan</i>';
        const noHp = member.tampilkan_kontak == '1' ? member.whatsapp : '<i>Informasi tidak ditampilkan</i>';

        // Sanitize potentially empty fields
        const namaPanggilan = member.nama_panggilan || '-';
        const tahunMasuk = member.tahun_masuk || '-';
        const tahunKeluar = member.tahun_keluar || '-';
        const komplek = member.komplek || '-';
        const domisili = member.domisili || '-';
        const profesi = member.profesi || '-';
        const detailProfesi = member.detail_profesi || '-';
        const pengembanganProfesi = member.pengembangan_profesi || '-';
        const ide = member.ide || '-';
        const lainLain = member.lain_lain || '-';

        let html = `
            <div class="detail-container">
                <div class="detail-header">
                    <h1>${member.nama_lengkap}</h1>
                    <p class="subtitle">Alumni Pondok Pesantren Krapyak</p>
                </div>

                <div class="detail-grid">
                    <div class="detail-card">
                        <h3>Informasi Pribadi</h3>
                        <ul>
                            <li><strong>Nama Panggilan:</strong> ${namaPanggilan}</li>
                            <li><strong>Tahun Masuk:</strong> ${tahunMasuk}</li>
                            <li><strong>Tahun Keluar:</strong> ${tahunKeluar}</li>
                            <li><strong>Komplek:</strong> ${komplek}</li>
                        </ul>
                    </div>
                    <div class="detail-card">
                        <h3>Domisili & Kontak</h3>
                        <ul>
                            <li><strong>Domisili:</strong> ${domisili}</li>
                            <li><strong>Detail Alamat:</strong> ${detailAlamat}</li>
                            <li><strong>No. HP:</strong> ${noHp}</li>
                        </ul>
                    </div>
                    <div class="detail-card detail-card-full">
                        <h3>Karir & Profesi</h3>
                        <ul>
                            <li><strong>Profesi:</strong> ${profesi}</li>
                            <li><strong>Detail Profesi:</strong> ${detailProfesi}</li>
                            <li><strong>Rencana Pengembangan Profesi:</strong> ${pengembanganProfesi}</li>
                        </ul>
                    </div>
                    <div class="detail-card detail-card-full">
                        <h3>Kontribusi & Lainnya</h3>
                        <ul>
                            <li><strong>Ide/Gagasan untuk Sinergi Ekonomi:</strong> ${ide}</li>
                            <li><strong>Lain-lain:</strong> ${lainLain}</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        content.innerHTML = html;
    }

    async function initializePage() {
        const params = new URLSearchParams(window.location.search);
        const memberId = params.get('id');

        if (!memberId) {
            content.innerHTML = `<p class="error-message">ID Anggota tidak ditemukan. Kembali ke <a href="index.html">halaman utama</a>.</p>`;
            return;
        }

        const allData = await fetchData();
        if (allData) {
            const member = allData.find(m => m.id_anggota === memberId);
            if (member) {
                renderMemberDetails(member);
            } else {
                content.innerHTML = `<p class="error-message">Anggota dengan ID ${memberId} tidak ditemukan. Kembali ke <a href="index.html">halaman utama</a>.</p>`;
            }
        }
    }

    initializePage();
}); 
