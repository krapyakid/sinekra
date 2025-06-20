document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('alumni-form');
    if (!form) return; // Keluar jika ini bukan halaman formulir
    
    // Fungsi utama untuk membuat dropdown yang bisa dicari
// ... existing code ...
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });

    // Validasi Ukuran File Logo
    const logoUpload = document.getElementById('logo-upload');
    if (logoUpload) {
        logoUpload.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const maxSize = 200 * 1024; // 200KB in bytes
                if (file.size > maxSize) {
                    alert('Ukuran file logo tidak boleh melebihi 200KB.');
                    this.value = ''; // Reset the file input
                }
            }
        });
    }

    // Modal Confirmation Logic (DIPERBARUI)
    const modal = document.getElementById('confirmation-modal');
    const modalPreview = document.getElementById('modal-preview');

    function showConfirmationModal() {
        modalPreview.innerHTML = '';
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Urutan field yang diinginkan
        const fieldOrder = [
            'nama_lengkap', 'panggilan', 'angkatan', 'komplek', 'domisili', 
            'no_hp', 'profesi', 'penjelasan_usaha', 'prospek',
            'nama_usaha', 'website_url', 'logo_upload',
            'platform_1', 'platform_2', 'platform_3', 'platform_4', 'platform_5',
            'ide', 'lain_lain'
        ];

        // Fungsi untuk menambahkan baris preview
        const addPreviewRow = (label, value) => {
            const labelDiv = document.createElement('div');
            labelDiv.className = 'preview-label';
            labelDiv.textContent = label;
            
            const valueDiv = document.createElement('div');
            valueDiv.className = 'preview-value';
            valueDiv.innerHTML = value ? value.toString().replace(/\n/g, '<br>') : '<i>(tidak diisi)</i>';
            
            modalPreview.appendChild(labelDiv);
            modalPreview.appendChild(valueDiv);
        };
        
        // Buat label map
        const labelMap = {};
        form.querySelectorAll('label').forEach(label => {
            const forId = label.htmlFor;
            if (forId) {
                const input = document.getElementById(forId);
                if (input && input.name) {
                    labelMap[input.name] = label.textContent;
                }
            }
        });
        // Label manual untuk yang tidak punya 'for'
        labelMap['nama_usaha'] = 'Nama Toko/Usaha';
        labelMap['website_url'] = 'URL Website';
        labelMap['logo_upload'] = 'Logo Usaha';

        for (const name of fieldOrder) {
            if (name.startsWith('platform_')) {
                 // Skip, akan ditangani secara khusus
                 continue;
            }
             if (data.hasOwnProperty(name)) {
                let value = data[name];
                const label = labelMap[name] || name;

                if (name === 'logo_upload' && value instanceof File) {
                    value = value.name ? `${value.name} (${(value.size / 1024).toFixed(1)} KB)` : '';
                }
                
                addPreviewRow(label, value);
            }
        }

        // Tampilkan link toko online secara berkelompok
        let onlineShopContent = '';
        for (let i = 1; i <= 5; i++) {
            const platform = data[`platform_${i}`];
            const url = data[`platform_url_${i}`];
            if (url) { // Hanya tampilkan jika URL diisi
                onlineShopContent += `<li><b>${platform}:</b> ${url}</li>`;
            }
        }
        if (onlineShopContent) {
            addPreviewRow('Toko Online', `<ul style="margin:0;padding-left:20px;">${onlineShopContent}</ul>`);
        }


        modal.classList.add('visible');
    }

    // Navigasi form dengan tombol Enter (DIPERBARUI)
    const formElements = Array.from(form.querySelectorAll('input:not([type="hidden"]), textarea, select'));
    const submitButton = form.querySelector('.submit-btn');

    formElements.forEach((element, index) => {
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const nextElement = formElements[index + 1];
                if (nextElement) {
                    nextElement.focus();
                } else {
                    // Jika tidak ada elemen berikutnya, fokus ke tombol submit
                    submitButton.focus();
                }
            }
        });
    });

}); 
