document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('investment-form');
    const confirmationModal = document.getElementById('confirmation-modal');
    const statusModal = document.getElementById('status-modal');
    // URL Google Apps Script untuk menerima data formulir
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvsDmDoerDTDgV39Op65g8D_fGyCyTy82StbSzsACbpQoYnetw96E4mQ1T0suIHfhR/exec"; 

    let finalData = {};
    let captchaQuestion = {};

    // Generate CAPTCHA Question
    function generateCaptcha() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operators = ['+', '-'];
        const operator = operators[Math.floor(Math.random() * operators.length)];
        
        let answer;
        if (operator === '+') {
            answer = num1 + num2;
        } else {
            answer = Math.max(num1, num2) - Math.min(num1, num2); // Pastikan tidak negatif
        }
        
        captchaQuestion = {
            question: `${num1} ${operator} ${num2} = ?`,
            answer: answer
        };
        
        document.getElementById('captcha-question').textContent = captchaQuestion.question;
        document.getElementById('captcha-answer').value = '';
        document.getElementById('captcha-error').style.display = 'none';
    }

    // Validasi nama lengkap
    const namaLengkapInput = document.getElementById('nama_lengkap');
    const namaError = document.getElementById('nama-error');
    
    if (namaLengkapInput) {
        namaLengkapInput.addEventListener('input', function(e) {
            const value = e.target.value;
            const namePattern = /^[a-zA-Z\s]+$/;
            
            if (value && !namePattern.test(value)) {
                namaError.style.display = 'block';
                e.target.setCustomValidity('Nama hanya boleh mengandung huruf dan spasi');
            } else {
                namaError.style.display = 'none';
                e.target.setCustomValidity('');
            }
        });
    }

    // Perbaiki handling nomor telepon
    const alumniTahunInput = document.getElementById('alumni-tahun');
    const nominalInput = document.getElementById('nominal');
    const nominalError = document.getElementById('nominal-error');

    if (alumniTahunInput) {
        alumniTahunInput.addEventListener('input', (e) => {
            let value = e.target.value;
            // Hapus semua selain angka
            value = value.replace(/[^0-9]/g, '');
            // Batasi maksimal 12 digit (untuk nomor Indonesia)
            if (value.length > 12) {
                value = value.substring(0, 12);
            }
            e.target.value = value;
        });
        
        // Validasi minimum 9 digit, maksimal 12 digit
        alumniTahunInput.addEventListener('blur', (e) => {
            const value = e.target.value;
            if (value.length < 9 || value.length > 12) {
                e.target.setCustomValidity('Nomor telepon harus 9-12 digit');
            } else {
                e.target.setCustomValidity('');
            }
        });
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validasi nama lengkap
        const namaValue = namaLengkapInput.value.trim();
        const namePattern = /^[a-zA-Z\s]+$/;
        if (!namePattern.test(namaValue)) {
            namaError.style.display = 'block';
            namaLengkapInput.focus();
            return;
        }
        
        // Validasi nomor telepon
        const phoneValue = alumniTahunInput.value.trim();
        if (phoneValue.length < 9 || phoneValue.length > 12) {
            alumniTahunInput.setCustomValidity('Nomor telepon harus 9-12 digit');
            alumniTahunInput.reportValidity();
            alumniTahunInput.focus();
            return;
        }
        
        const nominalValue = parseInt(nominalInput.value, 10);

        // Validasi nominal
        if (isNaN(nominalValue) || nominalValue < 100000) {
            nominalError.style.display = 'block';
            nominalInput.focus();
            return;
        } else {
            nominalError.style.display = 'none';
        }

        const formData = new FormData(form);
        
        // Gabungkan 62 dengan nomor telepon yang diinput user
        const phoneNumber = '62' + formData.get('alumni_tahun');
        
        // Objek data disederhanakan
        finalData = {
            nama_lengkap: formData.get('nama_lengkap'),
            alumni_tahun: phoneNumber,
            nominal: nominalValue,
            timestamp: new Date().toISOString()
        };

        // Generate CAPTCHA dan tampilkan modal
        generateCaptcha();

        // Tampilkan data di modal konfirmasi
        const reviewDataContainer = document.getElementById('review-data');
        reviewDataContainer.innerHTML = `
            <p><strong>Nama Lengkap:</strong> ${finalData.nama_lengkap}</p>
            <p><strong>Nomor Telpon/WA:</strong> +${finalData.alumni_tahun}</p>
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
        // Validasi CAPTCHA
        const userAnswer = parseInt(document.getElementById('captcha-answer').value);
        const captchaError = document.getElementById('captcha-error');
        
        if (isNaN(userAnswer) || userAnswer !== captchaQuestion.answer) {
            captchaError.style.display = 'block';
            generateCaptcha(); // Generate pertanyaan baru
            return;
        }
        
        captchaError.style.display = 'none';
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
