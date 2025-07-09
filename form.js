document.addEventListener('DOMContentLoaded', function() {
    const DOMISILI_URL = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/data_domisili.csv';
    const PROFESI_URL = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/profesi.csv';
    const KBLI_URL = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/kategori_usaha_kbli_lengkap.csv';

    // === ELEMEN UTAMA ===
    const form = document.getElementById('data-form');
    const businessListContainer = document.getElementById('business-list-container');
    const addBusinessBtn = document.getElementById('add-business-btn');
    const angkatanSelect = document.getElementById('angkatan');
    const domisiliSelect = document.getElementById('domisili');
    const profesiSelect = document.getElementById('profesi');
    const aiButtons = document.querySelectorAll('.ai-btn');
    
    // === TEMPLATE ===
    const businessTemplate = document.getElementById('business-entry-template');
    const linkTemplate = document.getElementById('link-entry-template');

    // === EVENT LISTENERS ===
    addBusinessBtn.addEventListener('click', addBusinessEntry);
    form.addEventListener('submit', handleFormSubmit);
    form.addEventListener('reset', handleFormReset);
    // Listener untuk tombol hapus dinamis
    businessListContainer.addEventListener('click', handleDynamicClicks);
    aiButtons.forEach(button => {
        button.addEventListener('click', handleAiButtonClick);
    });
    // Listener untuk perubahan Kategori Usaha
    businessListContainer.addEventListener('change', handleCategoryChange);

    // === VARIABEL ===
    let domisiliChoice, profesiChoice;
    let kbliData = [];

    // === FUNGSI-FUNGSI ===

    async function loadKbliData() {
        try {
            const response = await fetch(KBLI_URL);
            if (!response.ok) throw new Error('Gagal memuat data KBLI');
            const csvText = await response.text();
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    if (!results.data || !Array.isArray(results.data)) {
                        throw new Error('Format data KBLI tidak valid');
                    }
                    kbliData = results.data;
                    // Jika sudah ada kartu usaha saat data dimuat, populasikan
                    document.querySelectorAll('.business-entry-card select[name="kategori_usaha"]').forEach(populateKbliDropdown);
                },
                error: function(error) {
                    console.error('Error parsing KBLI CSV:', error);
                    alert('Gagal memproses data KBLI. Silakan muat ulang halaman.');
                }
            });
        } catch (error) {
            console.error('Error loading KBLI data:', error);
            alert('Gagal memuat data KBLI. Silakan periksa koneksi internet Anda dan coba lagi.');
        }
    }

    function populateKbliDropdown(selectElement) {
        if (!selectElement || kbliData.length === 0) return;
        
        // Simpan opsi pertama (placeholder)
        const placeholder = selectElement.options[0];
        selectElement.innerHTML = '';
        selectElement.appendChild(placeholder);

        kbliData.forEach(item => {
            if (item.kategori_usaha) {
                const option = new Option(item.kategori_usaha, item.kategori_usaha);
                selectElement.add(option);
            }
        });
    }

    function populateYearDropdowns() {
        const thMasukSelect = document.getElementById('th_masuk');
        const thKeluarSelect = document.getElementById('th_keluar');
        const endYear = new Date().getFullYear() - 1;
        const startYear = 1951;

        if (!thMasukSelect || !thKeluarSelect) return;

        // Clear existing options except the first placeholder
        thMasukSelect.innerHTML = '<option value="" disabled selected>Pilih Tahun</option>';
        thKeluarSelect.innerHTML = '<option value="" disabled selected>Pilih Tahun</option>';

        for (let year = endYear; year >= startYear; year--) {
            thMasukSelect.add(new Option(year, year));
            thKeluarSelect.add(new Option(year, year));
        }
    }

    async function populateDropdownFromCSV(selectElement, url, placeholder) {
        if (!selectElement) return;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Gagal memuat data: ${response.statusText}`);
            }
            const data = await response.text();
            const items = data.split('\n').filter(Boolean).map(item => item.trim());

            // Menggunakan API dari Choices.js untuk set pilihan
            if (selectElement.choices) {
                 selectElement.choices.clearStore();
                 selectElement.choices.setChoices(
                    items.map(item => ({ value: item, label: item })),
                    'value',
                    'label',
                    true
                );
            }

        } catch (error) {
            console.error(`Error populating dropdown for ${selectElement.id}:`, error);
            if (selectElement.choices) {
                 selectElement.choices.clearStore();
                 selectElement.choices.setChoices([{ value: '', label: 'Gagal memuat data', disabled: true }]);
            }
        }
    }

    function initFormInteractions() {
        form.addEventListener('input', function(e) {
            const target = e.target;

            // Memaksa input hanya angka untuk nomor HP
            if (target.id === 'no_hp_anggota') {
                target.value = target.value.replace(/\D/g, '');
            }

            // Character Counter
            if (target.matches('input[maxlength], textarea[maxlength]')) {
                const maxLength = target.getAttribute('maxlength');
                const currentLength = target.value.length;
                const counter = target.closest('.form-group, .form-group-full')?.querySelector('.char-counter');
                if (counter) {
                    counter.textContent = `${currentLength} / ${maxLength}`;
                }
            }
             // Toggle clear icon visibility
            if (target.matches('input[type="text"], input[type="tel"], textarea')) {
                const wrapper = target.closest('.input-wrapper');
                const clearIcon = wrapper?.querySelector('.clear-icon');
                if (clearIcon) {
                    clearIcon.style.display = target.value.length > 0 ? 'block' : 'none';
                }
            }
        });

        form.addEventListener('click', function(e) {
            // Clear Icon
            if (e.target.matches('.clear-icon')) {
                const inputWrapper = e.target.closest('.input-wrapper');
                if (inputWrapper) {
                   const input = inputWrapper.querySelector('input, textarea');
                   if (input) {
                       input.value = '';
                       input.dispatchEvent(new Event('input', { bubbles: true })); // Trigger update untuk counter & clear icon
                       input.focus();
                   }
                }
            }
        });

        // Listener untuk perubahan platform di Toko Online/Sosmed (Event Delegation)
        form.addEventListener('change', function(e) {
            if (e.target.matches('select[name="platform"]')) {
                const platform = e.target.value;
                const linkEntry = e.target.closest('.link-entry');
                const urlInput = linkEntry.querySelector('input[name="url"]');
                const urlPrefixSpan = linkEntry.querySelector('.url-prefix');

                const platformData = {
                    'Shopee': { prefix: 'https://shopee.co.id/', placeholder: 'username' },
                    'Tokopedia': { prefix: 'https://www.tokopedia.com/', placeholder: 'namatoko' },
                    'Lazada': { prefix: 'https://www.lazada.co.id/shop/', placeholder: 'namatoko' },
                    'TikTok Shop': { prefix: 'https://www.tiktok.com/@', placeholder: 'username' },
                    'Blibli': { prefix: 'https://www.blibli.com/merchant/', placeholder: 'nama-toko/TOS-XXXXX' },
                    'Instagram': { prefix: 'https://www.instagram.com/', placeholder: 'username' },
                    'Facebook': { prefix: 'https://www.facebook.com/', placeholder: 'username' },
                    'TikTok': { prefix: 'https://www.tiktok.com/@', placeholder: 'username' },
                    'Website': { prefix: 'https://www.', placeholder: 'namadomain.com' },
                    'YouTube': { prefix: 'https://www.youtube.com/', placeholder: 'c/channelname' },
                    'Lainnya': { prefix: '', placeholder: 'https://...'}
                };

                const data = platformData[platform] || { prefix: 'https://', placeholder: '...' };

                if (urlInput && urlPrefixSpan) {
                    urlPrefixSpan.textContent = data.prefix;
                    urlInput.placeholder = data.placeholder;
                    // Hide prefix wrapper if prefix is empty (e.g., for "Lainnya")
                    urlPrefixSpan.parentElement.style.display = data.prefix ? 'flex' : 'none';
                    // Show a single input for "Lainnya"
                    if (!data.prefix) {
                        const plainInput = linkEntry.querySelector('.plain-url-input');
                        if (plainInput) {
                            plainInput.style.display = 'block';
                            plainInput.value = urlInput.value; // sync values
                            urlInput.value = '';
                        }
                    } else {
                         const plainInput = linkEntry.querySelector('.plain-url-input');
                        if (plainInput) plainInput.style.display = 'none';
                    }
                }
            }
        });
    }

    async function handleAiButtonClick(event) {
        const button = event.target;
        const targetId = button.dataset.target;
        const targetTextarea = document.getElementById(targetId);
        
        if (!targetTextarea) {
            console.error('Target textarea not found');
            return;
        }

        button.classList.add('loading');
        button.disabled = true;

        // Get the context from the textarea's label
        const label = targetTextarea.closest('.form-group').querySelector('label').textContent;
        const prompt = `Buatkan deskripsi untuk ${label.replace('*', '')} dengan gaya profesional dan menarik.`;

        try {
            // Check if we're in development or production
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const endpoint = isLocalhost ? 'http://localhost:8888/.netlify/functions/generate-ai-text' : '/.netlify/functions/generate-ai-text';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.completion) {
                targetTextarea.value = data.completion.trim();
                targetTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                throw new Error('Tidak ada teks yang dihasilkan');
            }

        } catch (error) {
            console.error('Error fetching AI completion:', error);
            alert('Maaf, fitur AI sedang tidak tersedia. Silakan isi secara manual atau coba lagi nanti.');
        } finally {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    function updateBusinessTitles() {
        const businessEntries = businessListContainer.querySelectorAll('.business-entry-card');
        businessEntries.forEach((card, index) => {
            let titleElement = card.querySelector('.business-entry-title');
            if (!titleElement) {
                titleElement = document.createElement('h4');
                titleElement.className = 'business-entry-title';
                // Insert after the remove button
                card.insertBefore(titleElement, card.children[1]);
            }
            titleElement.textContent = `Usaha ke-${index + 1}`;
        });
    }

    function addBusinessEntry() {
        const businessClone = businessTemplate.content.cloneNode(true);
        const kbliSelect = businessClone.querySelector('select[name="kategori_usaha"]');
        
        // Populasikan dropdown KBLI jika data sudah tersedia
        if (kbliData.length > 0) {
            populateKbliDropdown(kbliSelect);
        }

        businessListContainer.appendChild(businessClone);
        updateBusinessTitles();
    }

    function addLinkEntry(container, type) {
        const linkClone = linkTemplate.content.cloneNode(true);
        // Di sini kita bisa menyesuaikan 'platform' jika perlu, tapi untuk sekarang kita gabung
        container.appendChild(linkClone);
    }
    
    function handleDynamicClicks(e) {
        // Hapus blok usaha
        if (e.target.classList.contains('remove-business-btn')) {
            e.target.closest('.business-entry-card').remove();
            updateBusinessTitles();
        }
        // Tambah entri toko
        if (e.target.classList.contains('add-shop-btn')) {
            const shopContainer = e.target.previousElementSibling;
            addLinkEntry(shopContainer, 'shop');
        }
        // Tambah entri sosmed
        if (e.target.classList.contains('add-social-btn')) {
            const socialContainer = e.target.previousElementSibling;
            addLinkEntry(socialContainer, 'social');
        }
        // Hapus entri link (toko atau sosmed)
        if (e.target.classList.contains('remove-link-btn')) {
            e.target.closest('.link-entry').remove();
        }
    }

    function handleCategoryChange(e) {
        if (e.target.matches('select[name="kategori_usaha"]')) {
            const select = e.target;
            const selectedValue = select.value;
            const descriptionDiv = select.nextElementSibling;

            if (!descriptionDiv || !descriptionDiv.classList.contains('category-description')) {
                return;
            }

            if (selectedValue) {
                const selectedData = kbliData.find(item => item.kategori_usaha === selectedValue);
                if (selectedData) {
                    descriptionDiv.innerHTML = `<strong>Deskripsi:</strong> ${selectedData.penjelasan || 'Tidak tersedia.'}<br><strong>Contoh:</strong> ${selectedData.contoh_usaha || 'Tidak tersedia.'}`;
                    descriptionDiv.style.display = 'block';
                }
            } else {
                descriptionDiv.style.display = 'none';
                descriptionDiv.innerHTML = '';
            }
        }
    }

    // --- FUNGSI BARU UNTUK VALIDASI, POPUP, DAN SUBMISI ---

    async function getIpAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            if (!response.ok) throw new Error('Gagal mendapatkan alamat IP');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Error fetching IP address:', error);
            return 'Error'; // Fallback value
        }
    }
    
    function validateForm() {
        let firstInvalidField = null;
        const requiredFields = form.querySelectorAll('[required]');

        for (const field of requiredFields) {
            if (!field.value.trim()) {
                const label = field.closest('.form-group, .form-group-full').querySelector('label').innerText;
                alert(`Kolom wajib diisi: "${label.replace('*', '').trim()}"`);
                field.focus();
                firstInvalidField = field;
                // Tambahkan class error untuk styling
                field.classList.add('input-error');
                // Hapus class error setelah beberapa detik
                setTimeout(() => field.classList.remove('input-error'), 3000);
                return false;
            }
             field.classList.remove('input-error');
        }
        return true;
    }
    
    function populateReviewModal(data) {
        const previewContainer = document.getElementById('modal-preview-grid');
        previewContainer.innerHTML = ''; // Kosongkan preview sebelumnya

        // --- Tampilkan Data Anggota ---
        let anggotaHtml = '<h3>Biodata Diri</h3>';
        const biodataMap = {
            nama_lengkap: 'Nama Lengkap', th_masuk: 'Tahun Masuk', th_keluar: 'Tahun Keluar',
            komplek: 'Komplek', domisili: 'Domisili', detail_alamat: 'Alamat Lengkap', 
            no_hp_anggota: 'No. HP', profesi: 'Profesi'
        };
        
        for (const key in biodataMap) {
            if (data.anggota_data[key]) {
                anggotaHtml += `<div class="preview-item"><span class="preview-label">${biodataMap[key]}</span><span class="preview-value">${data.anggota_data[key]}</span></div>`;
            }
        }
        
        // Tambahkan status alumni secara spesifik
        if (data.anggota_data.alumni !== undefined) {
             const statusAlumni = data.anggota_data.alumni === 1 ? 'Alumni Pondok Pesantren Krapyak Yogyakarta' : 'Bukan Alumni';
             anggotaHtml += `<div class="preview-item"><span class="preview-label">Status Alumni</span><span class="preview-value">${statusAlumni}</span></div>`;
        }

        previewContainer.innerHTML += `<div class="preview-section">${anggotaHtml}</div>`;

        // --- Tampilkan Data Usaha ---
        if (data.usaha_list && data.usaha_list.length > 0) {
            data.usaha_list.forEach((usaha, index) => {
                let usahaHtml = `<h3>Usaha ke-${index + 1}</h3>`;
                const usahaMap = {
                    nama_usaha: 'Nama Usaha', kategori_usaha: 'Kategori', jenis_usaha: 'Jenis Usaha',
                    no_hp_perusahaan: 'No. HP Usaha', website_perusahaan: 'Website', url_gmaps_perusahaan: 'Google Maps'
                };
                 for (const key in usahaMap) {
                    if (usaha[key]) {
                        usahaHtml += `<div class="preview-item"><span class="preview-label">${usahaMap[key]}</span><span class="preview-value">${usaha[key]}</span></div>`;
                    }
                }
                // Tambahkan toko online dan sosmed - dengan perbaikan
                if (usaha.toko_online && usaha.toko_online.length > 0) {
                    const platforms = usaha.toko_online.map(t => t.platform_olshop).filter(Boolean).join(', ');
                    if (platforms) {
                        usahaHtml += `<div class="preview-item"><span class="preview-label">Toko Online</span><span class="preview-value">${platforms}</span></div>`;
                    }
                }
                if (usaha.media_sosial && usaha.media_sosial.length > 0) {
                    const platforms = usaha.media_sosial.map(s => s.platform_sosmed).filter(Boolean).join(', ');
                    if (platforms) {
                        usahaHtml += `<div class="preview-item"><span class="preview-label">Media Sosial</span><span class="preview-value">${platforms}</span></div>`;
                    }
                }
                previewContainer.innerHTML += `<div class="preview-section">${usahaHtml}</div>`;
            });
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return; // Hentikan jika validasi gagal
        }

        // --- KUMPULKAN SEMUA DATA ---
        const formData = new FormData(form);
        const allData = {};
        
        // Dapatkan IP Address di awal
        const ipAddress = await getIpAddress();

        // Data Anggota (ID akan dibuat oleh Google Script)
        allData.anggota_data = {
            nama_lengkap: formData.get('nama_lengkap'),
            nama_panggilan: formData.get('nama_panggilan'),
            alumni: formData.get('alumni'), // Mengambil dari field alumni
            th_masuk: formData.get('th_masuk'),
            th_keluar: formData.get('th_keluar'),
            komplek: formData.get('komplek'),
            domisili: formData.get('domisili'),
            detail_alamat: formData.get('detail_alamat'),
            alamat_active: document.getElementById('alamat_active').checked ? 1 : 0, // Konversi boolean ke 1/0
            no_hp_anggota: `+62${formData.get('no_hp_anggota')}`,
            no_hp_active: document.getElementById('no_hp_active').checked ? 1 : 0, // Konversi boolean ke 1/0
            profesi: formData.get('profesi'),
            detail_profesi: formData.get('detail_profesi'),
            pengembangan_profesi: formData.get('pengembangan_profesi'),
            ide: formData.get('ide'),
            lain_lain: formData.get('lain_lain'),
            timestamp: new Date().toISOString(),
            ip_by: ipAddress, // Menggunakan IP yang sudah didapat
            device: navigator.userAgent // Mengambil info device dari user agent
        };

        // Data Usaha (ID akan dibuat oleh Google Script)
        allData.usaha_list = [];
        document.querySelectorAll('.business-entry-card').forEach(card => {
            const gmapsPrefix = card.querySelector('input[name="url_gmaps_perusahaan"]').previousElementSibling.textContent;
            const websitePrefix = card.querySelector('input[name="website_perusahaan"]').previousElementSibling.textContent;

            const businessData = {
                nama_usaha: card.querySelector('[name="nama_usaha"]').value,
                kategori_usaha: card.querySelector('[name="kategori_usaha"]').value,
                jenis_usaha: card.querySelector('[name="jenis_usaha"]').value,
                detail_usaha: card.querySelector('[name="detail_usaha"]').value,
                no_hp_perusahaan: card.querySelector('[name="no_hp_perusahaan"]').value ? `+62${card.querySelector('[name="no_hp_perusahaan"]').value}`: '',
                prospek_kerjasama_penawaran: card.querySelector('[name="prospek_kerjasama_penawaran"]').value,
                website_perusahaan: card.querySelector('[name="website_perusahaan"]').value ? websitePrefix + card.querySelector('[name="website_perusahaan"]').value : '',
                url_gmaps_perusahaan: card.querySelector('[name="url_gmaps_perusahaan"]').value ? gmapsPrefix + card.querySelector('[name="url_gmaps_perusahaan"]').value : '',
                aktif: 1, 
                toko_online: [],
                media_sosial: []
            };

            // Kumpulkan Toko Online (ID akan dibuat oleh Google Script)
            card.querySelectorAll('.shop-list-container .link-entry').forEach(linkEntry => {
                const platform = linkEntry.querySelector('select[name="platform"]').value;
                const urlInput = linkEntry.querySelector('input[name="url"]');
                const prefix = linkEntry.querySelector('.url-prefix').textContent;
                const fullUrl = urlInput && urlInput.value ? prefix + urlInput.value : '';

                if (platform && fullUrl) {
                    businessData.toko_online.push({
                        platform_olshop: platform,
                        url_olshop: fullUrl
                    });
                }
            });

            // Kumpulkan Media Sosial (ID akan dibuat oleh Google Script)
            card.querySelectorAll('.social-list-container .link-entry').forEach(linkEntry => {
                const platform = linkEntry.querySelector('select[name="platform"]').value;
                const urlInput = linkEntry.querySelector('input[name="url"]');
                const prefix = linkEntry.querySelector('.url-prefix').textContent;
                const fullUrl = urlInput && urlInput.value ? prefix + urlInput.value : '';

                if (platform && fullUrl) {
                     businessData.media_sosial.push({
                        platform_sosmed: platform,
                        url_sosmed: fullUrl
                    });
                }
            });

            allData.usaha_list.push(businessData);
        });
        
        // --- TAMPILKAN MODAL REVIEW ---
        populateReviewModal(allData);
        document.getElementById('confirmation-modal').style.display = 'flex';

        // Simpan data di window object untuk digunakan nanti oleh CAPTCHA
        window.finalData = allData;
    }

    function handleFormReset(e) {
        e.preventDefault();
        const confirmed = window.confirm("Anda yakin ingin mengosongkan semua isian pada formulir?");
        if (confirmed) {
            // Reset the main form
            form.reset();
            
            // Clear all business entries except the first one
            const businessEntries = businessListContainer.querySelectorAll('.business-entry-card');
            businessEntries.forEach((entry, index) => {
                if (index > 0) {
                    entry.remove();
                }
            });
            
            // Reset the first business entry if it exists
            const firstEntry = businessListContainer.querySelector('.business-entry-card');
            if (firstEntry) {
                firstEntry.querySelectorAll('input, textarea, select').forEach(input => {
                    input.value = '';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                });
            }
            
            // Reset all character counters
            form.querySelectorAll('input, textarea').forEach(input => {
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            
            // Update business titles
            updateBusinessTitles();
        }
    }

    /*
    async function sendDataToGoogleScript(data) {
        const SCRIPT_URL = "URL_GOOGLE_SCRIPT_ANDA"; // Ganti dengan URL Anda nanti

        // Tampilkan loading spinner
        console.log("Mengirim data...");
        
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', // Apps Script seringkali lebih mudah dengan text/plain
                },
                body: JSON.stringify(data) // Kirim data sebagai string JSON
            });

            const result = await response.json();

            if (result.status === "success") {
                console.log("Pengiriman berhasil!", result.message);
                alert("Data berhasil dikirim!");
                form.reset();
            } else {
                throw new Error(result.message || "Terjadi kesalahan yang tidak diketahui.");
            }
        } catch (error) {
            console.error('Gagal mengirim data:', error);
            alert(`Gagal mengirim data: ${error.message}`);
        } finally {
            // Sembunyikan loading spinner
        }
    }
    */

    // --- Panggil Fungsi Inisialisasi ---
    populateYearDropdowns();
    loadKbliData();
    
    // Inisialisasi Choices.js pada elemen select
    domisiliChoice = new Choices(domisiliSelect, {
        searchEnabled: true,
        placeholder: true,
        placeholderValue: 'Pilih Domisili',
        searchPlaceholderValue: 'Ketik untuk mencari...',
        itemSelectText: 'Tekan untuk memilih',
    });
    profesiChoice = new Choices(profesiSelect, {
        searchEnabled: true,
        placeholder: true,
        placeholderValue: 'Pilih Profesi',
        searchPlaceholderValue: 'Ketik untuk mencari...',
        itemSelectText: 'Tekan untuk memilih',
    });

    // Kaitkan elemen select dengan instance Choices agar bisa diakses di fungsi lain
    domisiliSelect.choices = domisiliChoice;
    profesiSelect.choices = profesiChoice;

    populateDropdownFromCSV(domisiliSelect, DOMISILI_URL);
    populateDropdownFromCSV(profesiSelect, PROFESI_URL);
    
    initFormInteractions();
}); 
