document.addEventListener('DOMContentLoaded', function() {
    // Hilangkan semua logika URL parsing, tidak dibutuhkan lagi.

    const form = document.getElementById('alumni-form');
    if (!form) return;

    // =================================================================================
    // BAGIAN 1 & 2: KODE TIDAK BERUBAH
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
                const url = new URL(config.url);
                url.searchParams.append('t', new Date().getTime());
                const response = await fetch(url.toString(), { cache: 'no-cache' });
                if (!response.ok) throw new Error(`Gagal mengambil data: Status ${response.status}`);
                const csvText = await response.text();
                if (!csvText || csvText.trim() === '') throw new Error("File CSV yang diambil kosong.");
                const rows = csvText.trim().split(/\r?\n/).slice(1);
                allOptions = rows.map(row => {
                    const cleanRow = row.trim();
                    const parts = cleanRow.split(/,(.+)/); 
                    let value = (parts[1] || parts[0]).trim();
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.substring(1, value.length - 1).replace(/""/g, '"');
                    }
                    return value;
                }).filter(Boolean);
                if (allOptions.length === 0) throw new Error("Data berhasil diambil, tapi hasil parsing kosong.");
                renderOptions(allOptions);
            } catch (error) {
                console.error(`Error fatal di fetchData untuk ${config.wrapperId}:`, error);
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
            if (!allOptions.some(opt => opt.toLowerCase() === query)) hiddenInput.value = '';
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
    
    populateYearDropdown();
    setupSearchableDropdown({
        wrapperId: 'domisili-wrapper',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMiSYxBNhT7Z5BkUqTbYs2o60cuMIG-tGChp8QpC1bvcgWM25SRDOVSeqC5u-DZsbcE4V7Hk6YvU1c/pub?gid=923893261&single=true&output=csv'
    });
    setupSearchableDropdown({
        wrapperId: 'profesi-wrapper',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQG6LnmWxsk4IEJLkv2bAhxxgCoV9wNTemWVnN0mcHaDthpC_Vo69ySPCNQMBdP-n1A46tX6f1FYQT/pub?gid=2117269894&single=true&output=csv'
    });
    
    function setupClearIcons() {
        document.querySelectorAll('.input-wrapper .clear-icon').forEach(icon => {
            const wrapper = icon.closest('.input-wrapper');
            if (!wrapper) return;
            const input = wrapper.querySelector('input, textarea, select');
            if (!input) return;
            const showOrHideIcon = () => {
                let hasValue = (input.tagName === 'SELECT') ? (input.selectedIndex > 0 && input.value !== '') : !!input.value;
                icon.style.display = hasValue ? 'block' : 'none';
            };
            icon.addEventListener('click', () => {
                const isSearchableSelect = input.closest('.searchable-select-wrapper');
                if (isSearchableSelect) {
                    const hiddenInput = isSearchableSelect.querySelector('input[type="hidden"]');
                    input.value = '';
                    if (hiddenInput) hiddenInput.value = '';
                } else if (input.tagName === 'SELECT') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.focus();
                showOrHideIcon();
            });
            input.addEventListener('input', showOrHideIcon);
            if (input.tagName === 'SELECT') input.addEventListener('change', showOrHideIcon);
            showOrHideIcon();
        });
    }
    setupClearIcons();

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
    const fileInfo = document.getElementById('file-info');
    const fileNameDisplay = document.getElementById('file-name');
    const fileResetBtn = document.getElementById('file-reset');
    const uploadButton = document.querySelector('label[for="logo-upload"]');
    if (logoUpload) {
        logoUpload.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                if (file.size > 200 * 1024) {
                    alert('Ukuran file logo tidak boleh melebihi 200KB.');
                    this.value = '';
                    return;
                }
                fileNameDisplay.textContent = file.name;
                fileInfo.style.display = 'flex';
                uploadButton.style.display = 'none';
            }
        });
        fileResetBtn.addEventListener('click', () => {
            logoUpload.value = '';
            fileInfo.style.display = 'none';
            fileNameDisplay.textContent = '';
            uploadButton.style.display = 'inline-block';
        });
    }

    const shopsContainer = document.getElementById('online-shops-container');
    const addShopBtn = document.getElementById('add-shop-btn');
    const MAX_SHOPS = 5;
    const createShopEntry = (index) => {
        const entryId = `shop-entry-${index}`;
        const entry = document.createElement('div');
        entry.className = 'online-shop-entry';
        entry.id = entryId;
        const platformOptions = `<option value="" selected disabled>Pilih Platform</option><option value="Tokopedia">Tokopedia</option><option value="Shopee">Shopee</option><option value="TikTok Shop">TikTok Shop</option><option value="Blibli">Blibli</option><option value="Lazada">Lazada</option><option value="Lainnya">Lainnya</option>`;
        entry.innerHTML = `<div class="online-shop-main"><div class="online-shop-row"><select name="platform_${index}" aria-label="Platform Toko Online ${index}">${platformOptions}</select><div class="input-wrapper url-input-wrapper"><input type="text" name="platform_url_${index}" placeholder="URL/Link Toko Olshop" pattern="https?://.+"><span class="clear-icon" title="Hapus"></span></div></div></div>${index > 1 ? `<button type="button" class="remove-shop-btn" aria-label="Hapus Toko" data-target="${entryId}">&times;</button>` : '<div style="width: 32px; height: 32px; flex-shrink: 0;"></div>'}`;
        const platformSelect = entry.querySelector('select');
        const urlWrapper = entry.querySelector('.url-input-wrapper');
        platformSelect.addEventListener('change', () => {
            if (platformSelect.value) {
                urlWrapper.classList.add('visible');
                urlWrapper.style.display = 'block';
            } else {
                urlWrapper.classList.remove('visible');
                urlWrapper.style.display = 'none';
            }
        });
        setupClearIcons();
        if (index > 1) {
            entry.querySelector('.remove-shop-btn').addEventListener('click', function() {
                document.getElementById(this.dataset.target).remove();
                updateAddButtonState();
            });
        }
        return entry;
    };
    const updateAddButtonState = () => {
        const currentShops = shopsContainer.children.length;
        addShopBtn.disabled = currentShops >= MAX_SHOPS;
    };
    const addShop = () => {
        const currentShopCount = shopsContainer.children.length;
        if (currentShopCount < MAX_SHOPS) {
            const newIndex = currentShopCount + 1;
            const newEntry = createShopEntry(newIndex);
            shopsContainer.appendChild(newEntry);
            updateAddButtonState();
        }
    };
    if (addShopBtn) {
        addShopBtn.addEventListener('click', addShop);
        addShop();
    }
    
    // =================================================================================
    // BAGIAN 3: LOGIKA UTAMA FINAL MENGGUNAKAN FETCH
    // =================================================================================
    const modal = document.getElementById('confirmation-modal');
    const confirmSubmitBtn = document.getElementById('confirm-submit');
    const cancelSubmitBtn = document.getElementById('cancel-submit');

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        let allValid = true;
        form.querySelectorAll('.input-wrapper, .searchable-select-wrapper').forEach(w => w.style.borderColor = '');
        form.querySelectorAll('input[required], textarea[required], select[required]').forEach(field => {
            let isValid = field.checkValidity();
            if (field.id === 'domisili-value' || field.id === 'profesi-value') {
                isValid = !!field.value;
            }
            if (!isValid) {
                allValid = false;
                field.closest('.input-wrapper, .searchable-select-wrapper').style.borderColor = 'var(--danger-color)';
            }
        });
        if (!allValid) {
            alert('Harap isi semua field wajib (*) dan perbaiki isian yang ditandai merah.');
            return;
        }

        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> Memuat Info...`;
        
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json', { cache: 'no-cache' });
            if (ipResponse.ok) {
                const ipData = await ipResponse.json();
                document.getElementById('ip-address').value = ipData.ip;
            }
        } catch (error) {
            console.warn("Gagal mengambil info IP:", error);
            document.getElementById('ip-address').value = 'Gagal dimuat';
        } finally {
            document.getElementById('device-info').value = navigator.userAgent;
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Lanjutkan';
            showConfirmationModal();
        }
    });

    function showConfirmationModal() {
        const modalPreviewGrid = modal.querySelector('.modal-preview-grid');
        modalPreviewGrid.innerHTML = '';
        const addRow = (label, value) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return;
            const rowHTML = `<div class="preview-label">${label}</div><div class="preview-value">${value}</div>`;
            modalPreviewGrid.insertAdjacentHTML('beforeend', rowHTML);
        };
        const getDisplayValue = (name) => {
            const el = form.elements[name];
            if (!el) return '';
            if (el.type === 'file') return el.files.length > 0 ? `${el.files[0].name} (${(el.files[0].size/1024).toFixed(1)} KB)` : 'Tidak ada';
            return el.value || 'Tidak diisi';
        }
        addRow("Nama Lengkap", getDisplayValue('nama_lengkap'));
        addRow("Panggilan", getDisplayValue('panggilan'));
        addRow("Angkatan", getDisplayValue('angkatan'));
        addRow("Komplek", getDisplayValue('komplek'));
        addRow("Domisili", getDisplayValue('domisili'));
        addRow("No. HP/WA", getDisplayValue('no_hp'));
        addRow("Profesi", getDisplayValue('profesi'));
        addRow("Detail Profesi", getDisplayValue('penjelasan_usaha'));
        addRow("Prospek Kerjasama", getDisplayValue('prospek'));
        addRow("Nama Usaha/Toko", getDisplayValue('nama_usaha'));
        addRow("Tautan Lokasi (Maps)", getDisplayValue('url_gmaps'));
        addRow("Website Usaha", getDisplayValue('website_url'));
        addRow("Logo Usaha", getDisplayValue('logo_upload'));
        const onlineShops = [];
        document.querySelectorAll('.online-shop-entry').forEach((entry, i) => {
            const platform = entry.querySelector(`select[name="platform_${i+1}"]`).value;
            const url = entry.querySelector(`input[name="platform_url_${i+1}"]`).value;
            if (platform && url) onlineShops.push(`<b>${platform}:</b> ${url}`);
        });
        if (onlineShops.length > 0) addRow("Toko Online", onlineShops.join('<br>'));
        addRow("Usulan untuk Sinergi", getDisplayValue('ide'));
        addRow("Lain-Lain", getDisplayValue('lain_lain'));
        
        modal.classList.add('visible');
        modal.querySelector('.modal-content').scrollTop = 0;
    }

    async function handleSubmit() {
        const submitButton = document.getElementById('confirm-submit');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `<span class="spinner"></span> Mengirim...`;

        const formData = new FormData(form);

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            
            if (result.result === 'success') {
                alert('Terima kasih! Data Anda telah berhasil dikirim.');
                modal.classList.remove('visible');
                form.reset();
                document.querySelectorAll('.clear-icon').forEach(icon => icon.style.display = 'none');
                if (fileResetBtn) fileResetBtn.click();
                if (shopsContainer) {
                    shopsContainer.innerHTML = '';
                    addShop();
                }
            } else {
                throw new Error(result.error || 'Terjadi kesalahan tidak diketahui di server.');
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert(`Terjadi masalah saat mengirim data: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    }
    
    cancelSubmitBtn.addEventListener('click', () => modal.classList.remove('visible'));
    confirmSubmitBtn.addEventListener('click', handleSubmit);
});
