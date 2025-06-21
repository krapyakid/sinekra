document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('alumni-form');
    if (!form) return;

    // =================================================================================
    // BAGIAN 1: FUNGSI-FUNGSI UNTUK MENGISI DATA AWAL (DROPDOWN)
    // =================================================================================

    function populateYearDropdown() {
        const select = document.getElementById('angkatan');
        if (!select) return;
        const endYear = new Date().getFullYear() - 1;
        const startYear = 1950;
        for (let year = endYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        }
    }

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
                
                // PERBAIKAN FINAL & PENYEDERHANAAN LOGIKA PARSING
                const rows = csvText.trim().split(/\\r?\\n/).slice(1); // Mulai dari baris kedua (setelah header)
                allOptions = rows.map(row => {
                    // Ambil saja konten hingga koma pertama, atau seluruh baris jika tidak ada koma.
                    // Ini cara paling aman untuk memastikan data utama terambil.
                    const parts = row.split(',');
                    return parts[0].trim().replace(/^"|"$/g, ''); // Ambil bagian pertama, bersihkan, dan hapus kutip
                }).filter(Boolean); // Hapus baris kosong

                if (allOptions.length === 0) {
                    throw new Error("Data berhasil di-fetch, namun hasil parsing kosong.");
                }

                renderOptions(allOptions);
            } catch (error) {
                console.error(`Gagal mengambil atau memproses data untuk ${config.wrapperId}:`, error);
                if (statusEl) statusEl.textContent = 'Gagal memuat data.';
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
                optionEl.addEventListener('mousedown', () => selectOption(optionText));
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
            if (!allOptions.some(opt => opt.toLowerCase() === query)) {
                hiddenInput.value = '';
            }
        });

        input.addEventListener('focus', () => {
            wrapper.classList.add('open');
            renderOptions(allOptions);
        });
        
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
        });
        
        fetchData();
    }
    
    // Panggil fungsi-fungsi untuk mengisi data
    populateYearDropdown();
    setupSearchableDropdown({
        wrapperId: 'domisili-wrapper',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMiSYxBNhT7Z5BkUqTbYs2o60cuMIG-tGChp8QpC1bvcgWM25SRDOVSeqC5u-DZsbcE4V7Hk6YvU1c/pub?gid=923893261&single=true&output=csv'
    });
    setupSearchableDropdown({
        wrapperId: 'profesi-wrapper',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQG6LnmWxsk4IEJLkv2bAhxxgCoV9wNTemWVnN0mcHaDthpC_Vo69ySPCNQMBdP-n1A46tX6f1FYQT/pub?gid=2117269894&single=true&output=csv'
    });


    // =================================================================================
    // BAGIAN 2: FUNGSI-FUNGSI UNTUK INTERAKSI FORM (IKON HAPUS, VALIDASI, DLL)
    // =================================================================================

    document.querySelectorAll('.input-wrapper .clear-icon').forEach(icon => {
        const input = icon.parentElement.querySelector('input, textarea, select');
        if (!input) return;
        const showOrHideIcon = () => {
            let hasValue = input.tagName === 'SELECT' ? input.selectedIndex > 0 : !!input.value;
            icon.style.display = hasValue ? 'block' : 'none';
        };
        icon.addEventListener('click', () => {
            if (input.tagName === 'SELECT') input.selectedIndex = 0;
            else input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
        });
        input.addEventListener('input', showOrHideIcon);
        if (input.tagName === 'SELECT') input.addEventListener('change', showOrHideIcon);
        showOrHideIcon();
    });

    document.querySelectorAll('.clear-row-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const row = this.parentElement;
            row.querySelector('select').selectedIndex = 0;
            row.querySelector('input').value = '';
        });
    });

    const phoneInput = document.getElementById('no-hp');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9+]/g, '');
            if (value.startsWith('0')) value = '+62' + value.substring(1);
            else if (value.length > 1 && !value.startsWith('+')) value = '+' + value;
            e.target.value = value;
        });
    }

    const logoUpload = document.getElementById('logo-upload');
    if (logoUpload) {
        logoUpload.addEventListener('change', function() {
            if (this.files[0] && this.files[0].size > 200 * 1024) {
                alert('Ukuran file logo tidak boleh melebihi 200KB.');
                this.value = '';
            }
        });
    }


    // =================================================================================
    // BAGIAN 3: LOGIKA UTAMA UNTUK VALIDASI DAN SUBMIT
    // =================================================================================

    const submitBtn = form.querySelector('.submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            let allValid = true;
            form.querySelectorAll('.input-wrapper, .searchable-select-wrapper').forEach(w => w.style.borderColor = '');

            form.querySelectorAll('input[required], textarea[required], select[required]').forEach(field => {
                if (!field.checkValidity()) {
                    allValid = false;
                    field.closest('.input-wrapper, .searchable-select-wrapper').style.borderColor = 'var(--danger-color)';
                }
            });
            ['domisili-value', 'profesi-value'].forEach(id => {
                const hiddenInput = document.getElementById(id);
                if (!hiddenInput.value) {
                    allValid = false;
                    hiddenInput.closest('.searchable-select-wrapper').style.borderColor = 'var(--danger-color)';
                }
            });
            form.querySelectorAll('input[pattern]').forEach(field => {
                if (field.value && !field.checkValidity()) {
                    allValid = false;
                    field.closest('.input-wrapper').style.borderColor = 'var(--danger-color)';
                }
            });

            if (allValid) showConfirmationModal();
            else alert('Harap isi semua field wajib (*) dan perbaiki isian yang ditandai merah.');
        });
    }

    const modal = document.getElementById('confirmation-modal');
    const confirmSubmitBtn = document.getElementById('confirm-submit');
    const cancelSubmitBtn = document.getElementById('cancel-submit');

    function showConfirmationModal() {
        const modalPreview = document.getElementById('modal-preview');
        modalPreview.innerHTML = '';
        
        const addRow = (label, value) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return;
            const row = `
                <div class="preview-row">
                    <div class="preview-label">${label}</div>
                    <div class="preview-value">${value}</div>
                </div>`;
            modalPreview.innerHTML += row;
        };

        const getDisplayValue = (name) => {
            const el = form.elements[name];
            if (!el) return '';
            if (el.type === 'file') return el.files.length > 0 ? `${el.files[0].name} (${(el.files[0].size/1024).toFixed(1)} KB)` : '';
            return el.value;
        }

        addRow("Nama Lengkap", getDisplayValue('nama_lengkap'));
        addRow("Panggilan", getDisplayValue('panggilan'));
        addRow("Angkatan", getDisplayValue('angkatan'));
        addRow("Komplek", getDisplayValue('komplek'));
        addRow("Domisili", getDisplayValue('domisili'));
        addRow("No. HP (+62)", getDisplayValue('no_hp'));
        addRow("Profesi", getDisplayValue('profesi'));
        addRow("Detail Profesi", getDisplayValue('penjelasan_usaha'));
        addRow("Prospek Kerjasama", getDisplayValue('prospek'));
        addRow("Nama Usaha/Toko", getDisplayValue('nama_usaha'));
        addRow("URL Google Maps", getDisplayValue('url_gmaps'));
        addRow("Website", getDisplayValue('website_url'));
        addRow("Logo Usaha/Toko", getDisplayValue('logo_upload'));

        const tokoOnline = Array.from(document.querySelectorAll('.online-shop-row'))
            .map(row => ({
                platform: row.querySelector('select').value,
                url: row.querySelector('input').value
            }))
            .filter(item => item.platform && item.url)
            .map(item => `<li>${item.platform}: ${item.url}</li>`).join('');
        if (tokoOnline) addRow("Toko Online", `<ul style="margin:0;padding-left:20px;">${tokoOnline}</ul>`);

        addRow("Ide & Gagasan", getDisplayValue('ide'));
        addRow("Lain-lain", getDisplayValue('lain_lain'));

        if (modal) modal.style.display = 'block';
    }

    if (confirmSubmitBtn) {
        confirmSubmitBtn.addEventListener('click', async function() {
            this.disabled = true;
            this.innerHTML = '<span class="spinner"></span> Mengirim...';
            
            try {
                const formData = new FormData(form);
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                formData.append('ip_by', ipData.ip);
                formData.append('device', navigator.userAgent);
                
                const tokoOnlineData = Array.from(document.querySelectorAll('.online-shop-row'))
                    .map(row => ({
                        platform: row.querySelector('select').value,
                        url: row.querySelector('input').value
                    }))
                    .filter(item => item.platform && item.url);

                if (tokoOnlineData.length > 0) {
                    formData.append('toko_online', JSON.stringify(tokoOnlineData));
                }
                
                // Hapus field individual agar tidak terkirim ganda
                for (let i = 1; i <= 5; i++) {
                    formData.delete(`platform_${i}`);
                    formData.delete(`platform_url_${i}`);
                }

                const response = await fetch(form.action, { method: 'POST', body: formData });
                const result = await response.json();
                
                if (result.result !== 'success') throw new Error(result.error || 'Unknown server error');
                
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
                alert('Gagal mengirim data: ' + error.message);
            } finally {
                this.disabled = false;
                this.innerHTML = 'Kirim Data Final';
            }
        });
    }

    if (cancelSubmitBtn) {
        cancelSubmitBtn.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }
}); 
