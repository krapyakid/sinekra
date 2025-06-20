 document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('alumni-form');
    const domisiliSelect = document.getElementById('domisili');
    const profesiSelect = document.getElementById('profesi');
    
    // Konfigurasi untuk dropdown yang datanya diambil dari luar
    const fetchConfigs = [
        {
            element: domisiliSelect,
            // URL diperbarui ke link Google Sheets "Publish to the web"
            url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMiSYxBNhT7Z5BkUqTbYs2o60cuMIG-tGChp8QpC1bvcgWM25SRDOVSeqC5u-DZsbcE4V7Hk6YvU1c/pub?gid=923893261&single=true&output=csv',
            defaultText: 'Pilih Domisili'
        },
        {
            element: profesiSelect,
            url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQG6LnmWxsk4IEJLkv2bAhxxgCoV9wNTemWVnN0mcHaDthpC_Vo69ySPCNQMBdP-n1A46tX6f1FYQT/pub?gid=2117269894&single=true&output=csv',
            defaultText: 'Pilih Profesi/Aktifitas'
        }
    ];

    // Fungsi generik untuk mengambil data CSV dan mengisi elemen <select>
    async function populateSelectFromCsv(config) {
        if (!config.element) return;
        
        // Gunakan proxy untuk menghindari masalah CORS
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(config.url)}`;
        
        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`Network response was not ok for ${config.element.id}`);
            const csvText = await response.text();

            config.element.innerHTML = ''; // Hapus opsi "Memuat data..."

            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = config.defaultText;
            defaultOption.disabled = true;
            defaultOption.selected = true;
            config.element.appendChild(defaultOption);
            
            // Logika disesuaikan untuk format CSV baru
            const rows = csvText.trim().split('\n');
            const header = rows.shift(); // Ambil dan buang baris header

            rows.forEach(row => {
                // Split berdasarkan koma pertama untuk memisahkan ID dan nama
                const parts = row.split(/,(.+)/); 
                if (parts.length > 1) {
                    // Ambil bagian kedua, lalu bersihkan dari kutip dan spasi
                    const value = parts[1].replace(/^"|"$/g, '').trim();
                    if (value) {
                        const option = document.createElement('option');
                        option.value = value;
                        option.textContent = value;
                        config.element.appendChild(option);
                    }
                }
            });
        } catch (error) {
            console.error(`Gagal mengambil data untuk ${config.element.id}:`, error);
            config.element.innerHTML = `<option value="" disabled selected>Gagal memuat data</option>`;
            config.element.style.color = 'var(--danger-color)';
        }
    }
    
    // Panggil fungsi untuk setiap dropdown
    fetchConfigs.forEach(populateSelectFromCsv);

    const modal = document.getElementById('confirmation-modal');
    const modalPreview = document.getElementById('modal-preview');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const confirmBtn = document.getElementById('modal-confirm-btn');

    document.querySelectorAll('.input-wrapper').forEach(wrapper => {
        const input = wrapper.querySelector('input, textarea');
        const clearIcon = wrapper.querySelector('.clear-icon');
        if (!input || !clearIcon) return;
        input.addEventListener('input', () => {
            clearIcon.style.display = input.value ? 'block' : 'none';
        });
        clearIcon.addEventListener('click', () => {
            input.value = '';
            input.dispatchEvent(new Event('input'));
            input.focus();
        });
    });

    if (form) {
        form.addEventListener('reset', () => {
            document.querySelectorAll('.clear-icon').forEach(icon => { icon.style.display = 'none'; });
        });
    }

    const phoneInput = document.getElementById('no-hp');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            const input = e.target;
            let value = input.value;
            const cursorPosition = input.selectionStart;
            const originalLength = value.length;
            if (value.startsWith('08')) value = '+62' + value.substring(1);
            let sanitized = '';
            if (value.length > 0) {
                sanitized = value[0] === '+' ? '+' : '';
                sanitized += value.substring(sanitized.length).replace(/[^0-9]/g, '');
            }
            if (input.value !== sanitized) {
                input.value = sanitized;
                const newLength = sanitized.length;
                const newCursorPosition = cursorPosition + (newLength - originalLength);
                input.setSelectionRange(newCursorPosition, newCursorPosition);
            }
        });
    }

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault(); 
            let allValid = true;

            this.querySelectorAll('[required]').forEach(field => {
                field.style.borderColor = 'var(--input-border-color)';
            });
            
            this.querySelectorAll('[required]').forEach(field => {
                let isValid = field.checkValidity();
                if (field.id === 'no-hp' && field.value) {
                    isValid = new RegExp(field.pattern).test(field.value);
                } else if (!field.value.trim() && field.tagName !== 'SELECT') {
                    isValid = false;
                } else if (field.tagName === 'SELECT' && !field.value) {
                    isValid = false;
                }

                if (!isValid) {
                    allValid = false;
                    field.style.borderColor = 'var(--danger-color)';
                }
            });

            if (allValid) {
                showConfirmationModal();
            } else {
                alert('Harap isi semua field yang wajib diisi dengan format yang benar.');
            }
        });
    }

    function showConfirmationModal() {
        modalPreview.innerHTML = '';
        const formData = new FormData(form);
        for (const [key, value] of formData.entries()) {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                const labelElement = field.closest('.form-group').querySelector('label');
                if (labelElement) {
                    const labelDiv = document.createElement('div');
                    labelDiv.className = 'preview-label';
                    labelDiv.textContent = labelElement.textContent;
                    
                    const valueDiv = document.createElement('div');
                    valueDiv.className = 'preview-value';
                    valueDiv.innerHTML = value ? value.replace(/\n/g, '<br>') : '<i>(tidak diisi)</i>';
                    
                    modalPreview.appendChild(labelDiv);
                    modalPreview.appendChild(valueDiv);
                }
            }
        }
        modal.classList.add('visible');
    }

    function hideModal() {
        modal.classList.remove('visible');
    }

    if (cancelBtn) cancelBtn.addEventListener('click', hideModal);

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            hideModal();
            alert("Data (disimulasikan) berhasil dikirim!");
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal();
        });
    }
}); 
