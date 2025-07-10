document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('investment-form');
    const confirmationModal = document.getElementById('confirmation-modal');
    const statusModal = document.getElementById('status-modal');
    // URL Google Apps Script untuk menerima data formulir
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvsDmDoerDTDgV39Op65g8D_fGyCyTy82StbSzsACbpQoYnetw96E4mQ1T0suIHfhR/exec"; 

    let finalData = {};

    // Logika untuk mengambil id_anggota dari URL sudah tidak diperlukan dan dihapus.

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nominalInput = document.getElementById('nominal');
        const nominalError = document.getElementById('nominal-error');
        const nominalValue = parseInt(nominalInput.value, 10);

        // Validasi
        if (isNaN(nominalValue) || nominalValue < 100000) {
            nominalError.style.display = 'block';
            nominalInput.focus();
            return;
        } else {
            nominalError.style.display = 'none';
        }

        const formData = new FormData(form);
        
        // Objek data disederhanakan, tidak lagi mengirim id_anggota
        finalData = {
            nama_lengkap: formData.get('nama_lengkap'),
            alumni_tahun: formData.get('alumni_tahun'),
            nominal: nominalValue,
            timestamp: new Date().toISOString()
        };

        // Tampilkan data di modal konfirmasi
        const reviewDataContainer = document.getElementById('review-data');
        reviewDataContainer.innerHTML = `
            <p><strong>Nama Lengkap:</strong> ${finalData.nama_lengkap}</p>
            <p><strong>Alumni Tahun:</strong> ${finalData.alumni_tahun}</p>
            <p><strong>Nominal Kesanggupan:</strong> Rp ${finalData.nominal.toLocaleString('id-ID')}</p>
        `;
        
        confirmationModal.style.display = 'flex';
    });

    // --- Event Listeners untuk Modal ---

    // Tombol Edit di Modal Konfirmasi
    document.getElementById('modal-edit-btn').addEventListener('click', function() {
        confirmationModal.style.display = 'none';
    });

    // Tombol Konfirmasi & Kirim
    document.getElementById('modal-confirm-btn').addEventListener('click', function() {
        confirmationModal.style.display = 'none';
        statusModal.style.display = 'flex';
        
        const loadingDiv = document.getElementById('submission-loading');
        const successDiv = document.getElementById('submission-success');
        const errorDiv = document.getElementById('submission-error');

        loadingDiv.style.display = 'block';
        successDiv.style.display = 'none';
        errorDiv.style.display = 'none';
        
        if (SCRIPT_URL === "PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE") {
             console.error("URL Google Script belum diatur! Harap deploy script di Google Sheet dan tempel URL-nya di sini.");
             alert("Konfigurasi pengiriman belum lengkap. Harap hubungi admin.");
             loadingDiv.style.display = 'none';
             errorDiv.style.display = 'block';
             return;
        }

        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(finalData)
        })
        .then(res => res.json())
        .then(data => {
            loadingDiv.style.display = 'none';
            if (data.status === "success") {
                successDiv.style.display = 'block';
                form.reset();
            } else {
                throw new Error(data.message || 'Terjadi kesalahan dari server.');
            }
        })
        .catch(error => {
            console.error('Error submitting data:', error);
            loadingDiv.style.display = 'none';
            errorDiv.style.display = 'block';
        });
    });

    // Tombol tutup di modal success dan error
    document.getElementById('success-close-btn').addEventListener('click', () => statusModal.style.display = 'none');
    document.getElementById('error-close-btn').addEventListener('click', () => statusModal.style.display = 'none');
}); 
