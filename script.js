document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('alumni-form');
    
    // Fungsi utama untuk membuat dropdown yang bisa dicari
    function setupSearchableDropdown(config) {
        const wrapper = document.getElementById(config.wrapperId);
        if (!wrapper) return;

        const input = wrapper.querySelector('.searchable-select-input');
        const dropdown = wrapper.querySelector('.searchable-select-dropdown');
        const hiddenInput = wrapper.querySelector('input[type="hidden"]');
        const statusEl = wrapper.querySelector('.searchable-select-status');
        
        let allOptions = []; // Untuk menyimpan semua data dari CSV

        // Ambil data dari CSV
        async function fetchData() {
            try {
                const response = await fetch(config.url);
                if (!response.ok) throw new Error('Network response was not ok');
                const csvText = await response.text();
                
                const rows = csvText.trim().split('\n');
                const header = rows.shift();
                
                allOptions = rows.map(row => {
                    const parts = row.split(/,(.+)/);
                    return parts.length > 1 ? parts[1].replace(/^"|"$/g, '').trim() : null;
                }).filter(Boolean); // Filter null/kosong

                renderOptions(allOptions);
            } catch (error) {
                console.error(`Gagal mengambil data untuk ${config.wrapperId}:`, error);
                statusEl.textContent = 'Gagal memuat data';
            }
        }

        // Render opsi ke dalam dropdown
        function renderOptions(options) {
            dropdown.innerHTML = '';
            if (options.length === 0) {
                statusEl.textContent = 'Tidak ada hasil';
                dropdown.appendChild(statusEl);
                return;
            }
            options.forEach(optionText => {
                const optionEl = document.createElement('div');
                optionEl.className = 'searchable-select-option';
                optionEl.textContent = optionText;
                optionEl.addEventListener('mousedown', () => { // mousedown agar terjadi sebelum blur
                    selectOption(optionText);
                });
                dropdown.appendChild(optionEl);
            });
        }

        // Pilih sebuah opsi
        function selectOption(value) {
            input.value = value;
            hiddenInput.value = value;
            wrapper.classList.remove('open');
            // Trigger event input agar divalidasi dan ikon hapus muncul (jika ada)
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Event listener untuk input
        input.addEventListener('input', () => {
            const query = input.value.toLowerCase();
            const filtered = allOptions.filter(opt => opt.toLowerCase().includes(query));
            renderOptions(filtered);
            hiddenInput.value = ''; // Kosongkan value jika user mengetik manual
        });

        input.addEventListener('focus', () => {
            wrapper.classList.add('open');
            renderOptions(allOptions); // Tampilkan semua opsi saat pertama kali fokus
        });

        // Sembunyikan dropdown jika klik di luar
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                wrapper.classList.remove('open');
            }
        });
        
        fetchData();
    }

    // Konfigurasi dan inisialisasi dropdown
    setupSearchableDropdown({
        wrapperId: 'domisili-wrapper',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQMiSYxBNhT7Z5BkUqTbYs2o60cuMIG-tGChp8QpC1bvcgWM25SRDOVSeqC5u-DZsbcE4V7Hk6YvU1c/pub?gid=923893261&single=true&output=csv'
    });

    setupSearchableDropdown({
        wrapperId: 'profesi-wrapper',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTQG6LnmWxsk4IEJLkv2bAhxxgCoV9wNTemWVnN0mcHaDthpC_Vo69ySPCNQMBdP-n1A46tX6f1FYQT/pub?gid=2117269894&single=true&output=csv'
    });

    // --- Sisa Fungsionalitas (Ikon Hapus, Validasi, Modal) ---
    // (Kode ini sebagian besar tetap, hanya validasi yang disesuaikan sedikit)

    // Fungsionalitas Ikon Hapus
    document.querySelectorAll('.input-wrapper .clear-icon').forEach(icon => {
        const input = icon.previousElementSibling;
        if (input) {
            icon.addEventListener('click', () => {
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.focus();
            });
            input.addEventListener('input', () => {
                icon.style.display = input.value ? 'block' : 'none';
            });
        }
    });

    if (form) {
        form.addEventListener('reset', () => {
            document.querySelectorAll('.clear-icon').forEach(icon => { icon.style.display = 'none'; });
        });
    }

    const phoneInput = document.getElementById('no-hp');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value;
            e.target.value = value[0] === '+' ? '+' + value.slice(1).replace(/[^0-9]/g, '') : value.replace(/[^0-9]/g, '');
        });
    }

    // Validasi Form dan Modal
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            let allValid = true;

            form.querySelectorAll('[required]').forEach(field => {
                // Untuk dropdown custom, periksa hidden input
                if (field.classList.contains('searchable-select-input')) {
                    const hiddenField = field.parentElement.querySelector('input[type="hidden"]');
                    if (!hiddenField || !hiddenField.value) {
                        allValid = false;
                        field.style.borderColor = 'var(--danger-color)';
                    } else {
                        field.style.borderColor = 'var(--input-border-color)';
                    }
                } else { // Validasi untuk field biasa
                    if (!field.value.trim()) {
                        allValid = false;
                        field.style.borderColor = 'var(--danger-color)';
                    } else {
                        field.style.borderColor = 'var(--input-border-color)';
                    }
                }
            });

            if (allValid) {
                showConfirmationModal();
            } else {
                alert('Harap isi semua field yang wajib diisi.');
            }
        });
    }
    
    // ... (Fungsi showConfirmationModal dan sisanya tetap sama persis)
    const modal = document.getElementById('confirmation-modal');
    const modalPreview = document.getElementById('modal-preview');

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

    document.getElementById('modal-confirm-btn')?.addEventListener('click', () => {
        hideModal();
        alert("Data (disimulasikan) berhasil dikirim!");
        // Untuk pengiriman data nyata, Anda bisa gunakan:
        // form.submit();
    });

    modal?.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });
}); 
