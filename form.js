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
                    kbliData = results.data;
                    // Jika sudah ada kartu usaha saat data dimuat, populasikan
                    document.querySelectorAll('.business-entry-card select[name="kategori_usaha"]').forEach(populateKbliDropdown);
                }
            });
        } catch (error) {
            console.error('Error loading KBLI data:', error);
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
        if (!targetTextarea) return;

        let prompt = "";
        const formGroup = button.closest('.form-group, .form-group-full');

        switch (targetId) {
            case 'detail_usaha':
                const kategori = formGroup.querySelector('select[name="kategori_usaha"]')?.value || 'umum';
                prompt = `Buatkan contoh deskripsi usaha yang menarik dan singkat (maksimal 2-3 kalimat) untuk sebuah usaha dalam kategori "${kategori}".`;
                break;
            case 'prospek_kerjasama_penawaran':
                prompt = `Buatkan contoh teks singkat (maksimal 2-3 kalimat) untuk kolom "Prospek Kerjasama/Penawaran" pada formulir data anggota, yang menjelaskan jenis kerjasama yang dicari atau ditawarkan.`;
                break;
            case 'pengembangan_profesi':
                prompt = `Buatkan contoh rencana pengembangan profesi atau keahlian (maksimal 2-3 kalimat) yang relevan untuk seorang anggota komunitas ekonomi.`;
                break;
            case 'ide':
                prompt = `Buatkan contoh ide atau gagasan singkat (maksimal 2-3 kalimat) untuk program atau kegiatan Sinergi Ekonomi Santri.`;
                break;
            case 'lain_lain':
                prompt = `Buatkan contoh isian untuk kolom "Lain-lain" (maksimal 2-3 kalimat) yang berisi informasi tambahan yang relevan tentang keahlian atau kontribusi yang bisa diberikan untuk komunitas.`;
                break;
            default:
                prompt = "Buatkan contoh teks singkat yang relevan.";
        }

        button.classList.add('loading');
        button.disabled = true;

        try {
            // Alihkan permintaan ke serverless function kita yang aman
            const response = await fetch('/.netlify/functions/generate-ai-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.completion) {
                targetTextarea.value = data.completion.trim();
                targetTextarea.dispatchEvent(new Event('input', { bubbles: true })); // Update char counter
            }

        } catch (error) {
            console.error('Error fetching AI completion:', error);
            alert(`Gagal menghasilkan teks dengan AI. Silakan coba lagi. Error: ${error.message}`);
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

    function handleFormSubmit(e) {
        e.preventDefault();
        
        if (!form.checkValidity()) {
            form.reportValidity();
            alert('Harap isi semua field yang wajib diisi (bertanda *).');
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Handle checkboxes (switches)
        data.alamat_active = document.getElementById('alamat_active').checked;
        data.no_hp_active = document.getElementById('no_hp_active').checked;
        
        // Gabungkan nomor HP
        if (data.no_hp_anggota) {
            data.no_hp_anggota = `+62${data.no_hp_anggota}`;
        }

        // Kumpulkan data usaha
        data.usaha = [];
        document.querySelectorAll('.business-entry-card').forEach(card => {
            const gmapsPrefix = card.querySelector('input[name="url_gmaps_perusahaan"]').previousElementSibling.textContent;
            const gmapsInput = card.querySelector('input[name="url_gmaps_perusahaan"]');
            const websitePrefix = card.querySelector('input[name="website_perusahaan"]').previousElementSibling.textContent;
            const websiteInput = card.querySelector('input[name="website_perusahaan"]');
            const noHpPerusahaanInput = card.querySelector('input[name="no_hp_perusahaan"]');

            const businessData = {
                nama_usaha: card.querySelector('[name="nama_usaha"]').value,
                kategori_usaha: card.querySelector('[name="kategori_usaha"]').value,
                jenis_usaha: card.querySelector('[name="jenis_usaha"]').value,
                detail_usaha: card.querySelector('[name="detail_usaha"]').value,
                no_hp_perusahaan: noHpPerusahaanInput && noHpPerusahaanInput.value ? `+62${noHpPerusahaanInput.value}` : '',
                prospek_kerjasama_penawaran: card.querySelector('[name="prospek_kerjasama_penawaran"]').value,
                website_perusahaan: websiteInput && websiteInput.value ? websitePrefix + websiteInput.value : '',
                url_gmaps_perusahaan: gmapsInput && gmapsInput.value ? gmapsPrefix + gmapsInput.value : '',
                toko_online: [],
                media_sosial: []
            };

             // Kumpulkan Toko Online
            card.querySelectorAll('.shop-list-container .link-entry').forEach(linkEntry => {
                const platform = linkEntry.querySelector('select[name="platform"]').value;
                const urlInput = linkEntry.querySelector('input[name="url"]');
                const prefix = linkEntry.querySelector('.url-prefix').textContent;
                const fullUrl = urlInput && urlInput.value ? prefix + urlInput.value : '';

                if (platform && fullUrl) {
                    businessData.toko_online.push({
                        platform: platform,
                        url: fullUrl
                    });
                }
            });

            // Kumpulkan Media Sosial
            card.querySelectorAll('.social-list-container .link-entry').forEach(linkEntry => {
                const platform = linkEntry.querySelector('select[name="platform"]').value;
                const urlInput = linkEntry.querySelector('input[name="url"]');
                const prefix = linkEntry.querySelector('.url-prefix').textContent;
                const fullUrl = urlInput && urlInput.value ? prefix + urlInput.value : '';

                if (platform && fullUrl) {
                    businessData.media_sosial.push({
                        platform: platform,
                        url: fullUrl
                    });
                }
            });


            data.usaha.push(businessData);
        });

        console.log("Data siap dikirim:", JSON.stringify(data, null, 2));
        alert('Data berhasil divalidasi dan siap untuk dikirim! Cek console log untuk melihat struktur data JSON.');
    }

    function handleFormReset(e) {
        e.preventDefault();
        const confirmed = window.confirm("Anda yakin ingin mengosongkan semua isian pada formulir?");
        if (confirmed) {
            form.reset();
            // Reset semua counter karakter dan clear icons
            form.querySelectorAll('input, textarea').forEach(input => {
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
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
