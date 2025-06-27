document.addEventListener('DOMContentLoaded', function() {
    // === ELEMEN UTAMA ===
    const form = document.getElementById('data-form');
    const businessListContainer = document.getElementById('business-list-container');
    const addBusinessBtn = document.getElementById('add-business-btn');
    
    // === TEMPLATE ===
    const businessTemplate = document.getElementById('business-entry-template');
    const linkTemplate = document.getElementById('link-entry-template');

    // === EVENT LISTENERS ===
    addBusinessBtn.addEventListener('click', addBusinessEntry);
    form.addEventListener('submit', handleFormSubmit);
    // Listener untuk tombol hapus dinamis
    businessListContainer.addEventListener('click', handleDynamicClicks);

    // --- INISIALISASI ---
    addBusinessEntry(); // Tambahkan satu blok usaha saat halaman dimuat

    // === FUNGSI-FUNGSI ===

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
        
        // Validasi form dasar
        if (!form.checkValidity()) {
            form.reportValidity();
            alert('Harap isi semua kolom yang wajib diisi (ditandai dengan required).');
            return;
        }

        // Membangun objek data dari form
        const data = {
            anggota: {},
            usaha: []
        };

        // 1. Kumpulkan data anggota
        data.anggota = {
            id_anggota: 'ANG-' + Date.now() + Math.random().toString(36).substr(2, 5), // Generate Unique ID
            nama_lengkap: form.querySelector('#nama_lengkap').value,
            nama_panggilan: form.querySelector('#nama_panggilan').value,
            no_hp_anggota: form.querySelector('#no_hp_anggota').value,
            domisili: form.querySelector('#domisili').value,
            detail_alamat: form.querySelector('#detail_alamat').value,
            // Tambahkan field lain dari sheet anggota jika ada di form
        };

        // 2. Kumpulkan data dari setiap blok usaha
        const businessEntries = businessListContainer.querySelectorAll('.business-entry-card');
        businessEntries.forEach(card => {
            const businessId = 'USH-' + Date.now() + Math.random().toString(36).substr(2, 5); // Generate Unique ID
            const businessData = {
                id_usaha: businessId,
                id_anggota: data.anggota.id_anggota, // Tautkan ke ID Anggota
                nama_usaha: card.querySelector('[name="nama_usaha"]').value,
                kategori_usaha: card.querySelector('[name="kategori_usaha"]').value,
                jenis_usaha: card.querySelector('[name="jenis_usaha"]').value,
                detail_usaha: card.querySelector('[name="detail_usaha"]').value,
                url_gmaps_perusahaan: card.querySelector('[name="url_gmaps_perusahaan"]').value,
                is_active: 1, // Default ke 1 (Aktif)
                olshop: [],
                sosmed: []
            };

            // 2a. Kumpulkan data toko online untuk usaha ini
            card.querySelector('.shop-list-container').querySelectorAll('.link-entry').forEach(link => {
                const platform = link.querySelector('[name="platform"]').value;
                const url = link.querySelector('[name="url"]').value;
                if (platform && url) {
                    businessData.olshop.push({
                        id_olshop: 'OLS-' + Date.now() + Math.random().toString(36).substr(2, 5),
                        id_usaha: businessId,
                        id_anggota: data.anggota.id_anggota,
                        platform_olshop: platform,
                        url_olshop: url
                    });
                }
            });

            // 2b. Kumpulkan data media sosial untuk usaha ini
            card.querySelector('.social-list-container').querySelectorAll('.link-entry').forEach(link => {
                const platform = link.querySelector('[name="platform"]').value;
                const url = link.querySelector('[name="url"]').value;
                if (platform && url) {
                    businessData.sosmed.push({
                        id_sosmed: 'SOS-' + Date.now() + Math.random().toString(36).substr(2, 5),
                        id_usaha: businessId,
                        id_anggota: data.anggota.id_anggota,
                        platform_sosmed: platform,
                        url_sosmed: url
                    });
                }
            });

            data.usaha.push(businessData);
        });

        console.log("Data yang akan dikirim:", JSON.stringify(data, null, 2));
        alert("Data telah disiapkan! Cek console log (F12) untuk melihat struktur JSON. Langkah selanjutnya adalah mengirim data ini.");

        // Di sinilah kita akan memanggil fungsi untuk mengirim data ke Google Apps Script
        // sendDataToGoogleScript(data);
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
}); 
