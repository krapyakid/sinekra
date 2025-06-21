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

            // FIX: Hanya hapus hidden value jika teks yang diketik manual
            // tidak cocok persis dengan salah satu opsi yang tersedia.
            // Ini mencegah nilai dihapus setelah dipilih dari dropdown.
            const isCompleteMatch = allOptions.some(opt => opt.toLowerCase() === query);
            if (!isCompleteMatch) {
                hiddenInput.value = '';
            }
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
        const input = icon.parentElement.querySelector('input, textarea, select');
        if (input) {
            const showOrHideIcon = () => {
                let hasValue = false;
                if (input.tagName === 'SELECT') {
                    hasValue = input.selectedIndex > 0;
                } else {
                    hasValue = !!input.value;
                }
                icon.style.display = hasValue ? 'block' : 'none';
            };

            icon.addEventListener('click', () => {
                if (input.tagName === 'SELECT') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.focus();
                showOrHideIcon();
            });

            input.addEventListener('input', showOrHideIcon);
            input.addEventListener('change', showOrHideIcon); // Untuk select
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

            // 1. Reset border
            form.querySelectorAll('.input-wrapper, .searchable-select-wrapper').forEach(wrapper => {
                wrapper.style.borderColor = 'var(--input-border-color)';
            });

            // 2. Validasi field required bawaan
            form.querySelectorAll('input[required], textarea[required], select[required]').forEach(field => {
                if (!field.checkValidity()) {
                    allValid = false;
                    const wrapper = field.closest('.input-wrapper');
                    if (wrapper) wrapper.style.borderColor = 'var(--danger-color)';
                }
            });

            // 3. Validasi dropdown custom
            ['domisili', 'profesi'].forEach(id => {
                const wrapper = document.getElementById(`${id}-wrapper`);
                const hiddenInput = document.getElementById(`${id}-value`);
                if (wrapper && hiddenInput && !hiddenInput.value) {
                    allValid = false;
                    wrapper.style.borderColor = 'var(--danger-color)';
                }
            });

            // 4. Validasi pattern untuk URL
            form.querySelectorAll('input[pattern]').forEach(field => {
                if (field.value && !field.checkValidity()) {
                    allValid = false;
                    const wrapper = field.closest('.input-wrapper');
                    if (wrapper) wrapper.style.borderColor = 'var(--danger-color)';
                }
            });

            if (allValid) {
                showConfirmationModal();
            } else {
                alert('Harap isi semua field wajib (*) dan perbaiki isian yang ditandai merah.');
            }
        });
    }

    // Validasi Ukuran File Logo
    const logoUpload = document.getElementById('logo_upload');
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

    // === START: BLOK MODAL DAN SUBMIT YANG DI-REFACTOR TOTAL (FINAL) ===
    const modal = document.getElementById('confirmation-modal');
    const modalPreview = document.getElementById('modal-preview');
    const confirmSubmitBtn = document.getElementById('confirm-submit');
    const cancelSubmitBtn = document.getElementById('cancel-submit');

    function showConfirmationModal() {
        if (!modalPreview) return;
        modalPreview.innerHTML = '';

        const addPreviewRow = (label, value) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return;
            const row = document.createElement('div');
            row.className = 'preview-row';
            const labelDiv = document.createElement('div');
            labelDiv.className = 'preview-label';
            labelDiv.textContent = label;
            const valueDiv = document.createElement('div');
            valueDiv.className = 'preview-value';

            if (value instanceof File) {
                valueDiv.textContent = value.name ? `${value.name} (${(value.size / 1024).toFixed(1)} KB)` : 'Tidak ada logo';
            } else if (Array.isArray(value)) {
                const list = document.createElement('ul');
                list.style.margin = '0';
                list.style.paddingLeft = '20px';
                value.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.textContent = `${item.platform}: ${item.url}`;
                    list.appendChild(listItem);
                });
                valueDiv.appendChild(list);
            } else {
                valueDiv.textContent = value;
            }
            row.appendChild(labelDiv);
            row.appendChild(valueDiv);
            modalPreview.appendChild(row);
        };

        addPreviewRow("Nama Lengkap", form.elements.nama_lengkap.value);
        addPreviewRow("Panggilan", form.elements.panggilan.value);
        addPreviewRow("Angkatan", form.elements.angkatan.value);
        addPreviewRow("Komplek", form.elements.komplek.value);
        addPreviewRow("Domisili", form.elements.domisili.value);
        addPreviewRow("No. HP (+62)", form.elements.no_hp.value);
        addPreviewRow("Profesi", form.elements.profesi.value);
        addPreviewRow("Detail Profesi", form.elements.penjelasan_usaha.value);
        addPreviewRow("Prospek Kerjasama", form.elements.prospek.value);
        addPreviewRow("Nama Usaha/Toko", form.elements.nama_usaha.value);
        addPreviewRow("URL Google Maps", form.elements.url_gmaps.value);
        addPreviewRow("Website", form.elements.website_url.value);
        if (form.elements.logo_upload && form.elements.logo_upload.files.length > 0) {
            addPreviewRow("Logo Usaha/Toko", form.elements.logo_upload.files[0]);
        }
        const tokoOnlineData = [];
        document.querySelectorAll('.online-shop-row').forEach(row => {
            const platformSelect = row.querySelector('select');
            const urlInput = row.querySelector('input[type="text"]');
            if (platformSelect && urlInput && platformSelect.value && urlInput.value) {
                tokoOnlineData.push({ platform: platformSelect.value, url: urlInput.value });
            }
        });
        addPreviewRow("Toko Online", tokoOnlineData);
        addPreviewRow("Ide & Gagasan", form.elements.ide.value);
        addPreviewRow("Lain-lain", form.elements.lain_lain.value);

        if (modal) modal.style.display = 'block';
    }

    if (confirmSubmitBtn) {
        confirmSubmitBtn.addEventListener('click', async function() {
            const submitButton = this;
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner"></span> Mengirim...';
            try {
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                
                const formData = new FormData();
                 const formElements = form.elements;
                for (let i = 0; i < formElements.length; i++) {
                    const field = formElements[i];
                    if (!field.name || field.type === 'submit' || field.closest('.online-shop-row')) continue;
                    if (field.type === 'file') {
                        if (field.files.length > 0) formData.append(field.name, field.files[0]);
                    } else if (field.classList.contains('searchable-select-input')) {
                        const hiddenInput = field.parentElement.querySelector('input[type="hidden"]');
                        if (hiddenInput) formData.append(hiddenInput.name, hiddenInput.value);
                    }
                    else {
                        formData.append(field.name, field.value);
                    }
                }

                const tokoOnlineData = [];
                document.querySelectorAll('.online-shop-row').forEach(row => {
                    const platformSelect = row.querySelector('select');
                    const urlInput = row.querySelector('input[type="text"]');
                    if (platformSelect && urlInput && platformSelect.value && urlInput.value) {
                        tokoOnlineData.push({ platform: platformSelect.value, url: urlInput.value });
                    }
                });
                if (tokoOnlineData.length > 0) {
                    formData.append('toko_online', JSON.stringify(tokoOnlineData));
                }
                
                formData.append('ip_by', ipData.ip);
                formData.append('device', navigator.userAgent);

                const response = await fetch(form.action, { method: 'POST', body: formData });
                const result = await response.json();
                if (result.result !== 'success') throw new Error(result.error || 'Unknown error from server');
                
                alert('Data berhasil terkirim! Terima kasih.');
                form.reset();
                document.querySelectorAll('.clear-icon').forEach(icon => icon.style.display = 'none');
                document.querySelectorAll('.searchable-select-input').forEach(input => {
                    input.value = '';
                    const hiddenInput = input.parentElement.querySelector('input[type="hidden"]');
                    if (hiddenInput) hiddenInput.value = '';
                });
                if (modal) modal.style.display = 'none';

            } catch (error) {
                console.error('Error:', error);
                alert('Gagal mengirim data: ' + error.message);
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        });
    }

    if (cancelSubmitBtn) {
        cancelSubmitBtn.addEventListener('click', function() {
            if (modal) modal.style.display = 'none';
        });
    }

    // Navigasi keyboard - Menggunakan selector yang benar
    const formElements = Array.from(form.querySelectorAll('input:not([type="hidden"]), textarea, select'));
    const submitBtn = form.querySelector('.submit-btn'); // FIX: Menggunakan class .submit-btn yang benar
    if (submitBtn) {
        formElements.forEach((element, index) => {
            element.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    const nextElement = formElements[index + 1];
                    if (nextElement) {
                        nextElement.focus();
                    } else {
                        submitBtn.focus();
                    }
                }
            });
        });
    }
    // === END: BLOK MODAL DAN SUBMIT YANG DI-REFACTOR TOTAL (FINAL) ===
}); 
