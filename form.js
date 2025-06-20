document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('alumni-form');
    if (!form) return; // Keluar jika ini bukan halaman formulir
    
    // Fungsi untuk mengisi dropdown tahun
    function populateYearDropdown() {
        const select = document.getElementById('angkatan');
        if (!select) return;

        const endYear = new Date().getFullYear() - 1; // Tahun maksimal adalah tahun lalu
        const startYear = 1950;

        for (let year = endYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        }
    }
    populateYearDropdown();

    // --- (FIX) KODE DROPDOWN YANG HILANG DIKEMBALIKAN ---
    function setupSearchableDropdown(config) {
        const wrapper = document.getElementById(config.wrapperId);
        if (!wrapper) return;

        const input = wrapper.querySelector('.searchable-select-input');
        const dropdown = wrapper.querySelector('.searchable-select-dropdown');
        const hiddenInput = wrapper.querySelector('input[type="hidden"]');
        const statusEl = wrapper.querySelector('.searchable-select-status');
        
        let allOptions = [];

        async function fetchData() {
            try {
                const response = await fetch(config.url);
                if (!response.ok) throw new Error('Network response was not ok');
                const csvText = await response.text();
                
                const rows = csvText.trim().split('\n');
                rows.shift();
                
                allOptions = rows.map(row => {
                    const cleanRow = row.trim();
                    if (!cleanRow) return null;
                    const parts = cleanRow.split(/,(.+)/);
                    const value = parts.length > 1 ? parts[1] : parts[0];
                    return value.replace(/^"|"$/g, '').trim();
                }).filter(Boolean);

                renderOptions(allOptions);
            } catch (error) {
                console.error(`Gagal mengambil data untuk ${config.wrapperId}:`, error);
                if(statusEl) statusEl.textContent = 'Gagal memuat data';
            }
        }

        function renderOptions(options) {
            dropdown.innerHTML = '';
            if (options.length === 0 && statusEl) {
                statusEl.textContent = 'Tidak ada hasil';
                dropdown.appendChild(statusEl);
                return;
            }
            options.forEach(optionText => {
                const optionEl = document.createElement('div');
                optionEl.className = 'searchable-select-option';
                optionEl.textContent = optionText;
                optionEl.addEventListener('mousedown', () => {
                    selectOption(optionText);
                });
                dropdown.appendChild(optionEl);
            });
        }

        function selectOption(value) {
            input.value = value;
            hiddenInput.value = value;
            wrapper.classList.remove('open');
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        input.addEventListener('input', () => {
            const query = input.value.toLowerCase();
            const filtered = allOptions.filter(opt => opt.toLowerCase().includes(query));
            renderOptions(filtered);
            hiddenInput.value = '';
        });

        input.addEventListener('focus', () => {
            wrapper.classList.add('open');
            renderOptions(allOptions);
        });
        
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                wrapper.classList.remove('open');
            }
        });
        
        fetchData();
    }

    setupSearchableDropdown({
        wrapperId: 'domisili-wrapper',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMiSYxBNhT7Z5BkUqTbYs2o60cuMIG-tGChp8QpC1bvcgWM25SRDOVSeqC5u-DZsbcE4V7Hk6YvU1c/pub?gid=923893261&single=true&output=csv'
    });

    setupSearchableDropdown({
        wrapperId: 'profesi-wrapper',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQG6LnmWxsk4IEJLkv2bAhxxgCoV9wNTemWVnN0mcHaDthpC_Vo69ySPCNQMBdP-n1A46tX6f1FYQT/pub?gid=2117269894&single=true&output=csv'
    });
    // --- AKHIR DARI FIX ---

    // --- (FIX #1 & #3) Fungsionalitas Ikon Hapus & Validasi Dikembalikan ---
    // Fungsionalitas Ikon Hapus pada setiap input
    document.querySelectorAll('.input-wrapper .clear-icon').forEach(icon => {
        const input = icon.parentElement.querySelector('input, textarea');
        if (input) {
            const showOrHideIcon = () => {
                icon.style.display = input.value ? 'block' : 'none';
            };
            icon.addEventListener('click', () => {
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.focus();
                showOrHideIcon();
            });
            input.addEventListener('input', showOrHideIcon);
            showOrHideIcon();
        }
    });
    
    // Fungsionalitas Hapus Baris Toko Online
    document.querySelectorAll('.clear-row-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const row = this.parentElement;
            const select = row.querySelector('select');
            const input = row.querySelector('input');
            
            if (select) select.selectedIndex = 0; // Reset ke "Pilih Platform"
            if (input) input.value = '';
        });
    });

    // (FIX) Validasi & Auto-format Nomor Telepon - HANYA BLOK INI YANG TERSISA
    const phoneInput = document.getElementById('no-hp');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value;

            // 1. Sanitize: Hapus semua karakter ilegal (non-angka, kecuali + di awal)
            let sanitized = value.startsWith('+') 
                ? '+' + value.substring(1).replace(/[^0-9]/g, '')
                : value.replace(/[^0-9]/g, '');

            // 2. Terapkan aturan format otomatis
            if (sanitized.startsWith('0')) {
                sanitized = '+62' + sanitized.substring(1);
            } else if (sanitized === '+') {
                sanitized = '+62';
            }

            e.target.value = sanitized;
        });
    }

    // Validasi Form dan Modal (FINAL FIX)
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            let allValid = true;

            // 1. Reset border pada semua wrapper
            form.querySelectorAll('.input-wrapper, .searchable-select-wrapper').forEach(wrapper => {
                wrapper.style.borderColor = 'var(--input-border-color)';
            });

            // 2. Lakukan validasi ulang pada setiap field yang required
            form.querySelectorAll('input[required], textarea[required], select[required]').forEach(field => {
                let isFieldValid = true;
                const wrapper = field.closest('.input-wrapper, .searchable-select-wrapper');

                if (field.classList.contains('searchable-select-input')) {
                    const hiddenField = wrapper.querySelector('input[type="hidden"]');
                    if (!hiddenField || !hiddenField.value) {
                        isFieldValid = false;
                    }
                } else {
                    if (!field.checkValidity()) {
                        isFieldValid = false;
                    }
                }

                if (!isFieldValid) {
                    allValid = false;
                    if (wrapper) {
                        wrapper.style.borderColor = 'var(--danger-color)';
                    }
                }
            });

            if (allValid) {
                showConfirmationModal();
            } else {
                alert('Harap isi semua field yang wajib diisi dengan format yang benar.');
            }
        });
    }

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
