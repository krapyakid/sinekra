document.addEventListener('DOMContentLoaded', function() {
    const DOMISILI_URL = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/data_domisili.csv';
    const PROFESI_URL = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/profesi.csv';

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

    // === VARIABEL ===
    let domisiliChoice, profesiChoice;

    // === FUNGSI-FUNGSI ===

    function populateAngkatan() {
        if (!angkatanSelect) return;
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= 1980; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            angkatanSelect.appendChild(option);
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
    }

    function handleAiButtonClick(event) {
        const targetId = event.target.dataset.target;
        const targetTextarea = document.getElementById(targetId);
        const prompts = {
            pengembangan_profesi: "Saya ingin berkolaborasi dengan sesama alumni untuk membuat program pelatihan kewirausahaan digital bagi santri. Fokusnya pada skill praktis seperti digital marketing dan manajemen e-commerce, memanfaatkan platform yang sudah ada untuk menciptakan dampak ekonomi yang nyata dan terukur di lingkungan pesantren.",
            ide: "Saya mengusulkan sebuah platform 'Sinergi Bisnis Santri' yang terintegrasi, di mana anggota bisa memetakan keahlian, menawarkan jasa, dan mencari mitra untuk proyek bersama. Platform ini bisa menjadi inkubator ide, memfasilitasi kolaborasi dari tahap gagasan hingga eksekusi dengan semangat gotong royong."
        };
        if (targetTextarea && prompts[targetId]) {
            targetTextarea.value = prompts[targetId];
        }
    }

    function addBusinessEntry() {
        const businessClone = businessTemplate.content.cloneNode(true);
        businessListContainer.appendChild(businessClone);
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
        document.querySelectorAll('.business-block').forEach(block => {
            const businessData = {
                nama_usaha: block.querySelector('[name="nama_usaha"]').value,
                bidang_usaha: block.querySelector('[name="bidang_usaha"]').value,
                detail_usaha: block.querySelector('[name="detail_usaha"]').value,
                omset_bulanan: block.querySelector('[name="omset_bulanan"]').value,
                alamat_usaha: block.querySelector('[name="alamat_usaha"]').value,
                shopee: block.querySelector('[name="shopee"]').value,
                tokopedia: block.querySelector('[name="tokopedia"]').value,
                lainnya: block.querySelector('[name="lainnya"]').value,
                instagram: block.querySelector('[name="instagram"]').value,
                facebook: block.querySelector('[name="facebook"]').value,
                tiktok: block.querySelector('[name="tiktok"]').value,
                website: block.querySelector('[name="website"]').value
            };
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
    populateAngkatan();
    
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
