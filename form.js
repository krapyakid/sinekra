document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMEN DOM ---
    const form = document.getElementById('alumni-form');
    const angkatanSelect = document.getElementById('angkatan');
    const addShopBtn = document.getElementById('add-shop-btn');
    const shopsContainer = document.getElementById('online-shops-container');
    
    // Modal Konfirmasi
    const confirmationModal = document.getElementById('confirmation-modal');
    const modalPreviewGrid = document.getElementById('modal-preview-grid');
    const modalEditBtn = document.getElementById('modal-edit-btn');
    const modalSubmitBtn = document.getElementById('modal-submit-btn');

    // Modal Status
    const statusModal = document.getElementById('status-modal');
    const submissionLoading = document.getElementById('submission-loading');
    const submissionSuccess = document.getElementById('submission-success');
    const submissionError = document.getElementById('submission-error');
    const errorCloseBtn = document.getElementById('error-close-btn');

    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvH3uqGJ_cPhOi4147NpUWGVtTzwcl9rWTZns7FYBQgoOGEZEeQEb0CVOIyKubeilS/exec";

    // --- INISIALISASI ---
    populateYearDropdown();
    addInitialShopEntry();

    // --- EVENT LISTENERS ---
    form.addEventListener('submit', handleFormSubmit);
    form.addEventListener('reset', () => setTimeout(setupInitialFormState, 0));
    addShopBtn.addEventListener('click', addShopEntry);
    shopsContainer.addEventListener('click', handleShopContainerClick);
    
    // Modal listeners
    modalEditBtn.addEventListener('click', () => confirmationModal.style.display = 'none');
    modalSubmitBtn.addEventListener('click', submitForm);
    errorCloseBtn.addEventListener('click', () => statusModal.style.display = 'none');


    // --- FUNGSI-FUNGSI ---

    function populateYearDropdown() {
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= 1940; year--) {
            angkatanSelect.add(new Option(year, year));
        }
    }

    function addInitialShopEntry() {
        shopsContainer.innerHTML = '';
        addShopEntry();
    }

    function setupInitialFormState() {
        // Hapus semua kecuali satu baris toko online
        addInitialShopEntry();
    }
    
    function addShopEntry() {
        const entryCount = shopsContainer.children.length;
        if (entryCount >= 5) return;

        const div = document.createElement('div');
        div.className = 'online-shop-entry form-grid';
        div.innerHTML = `
            <div class="form-group">
                <label for="platform_${entryCount}">Platform</label>
                <select name="platform_${entryCount}" id="platform_${entryCount}">
                    <option value="" disabled selected>Pilih Platform</option>
                    <option value="shopee">Shopee</option>
                    <option value="tokopedia">Tokopedia</option>
                    <option value="tiktok_shop">TikTok Shop</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="website">Website Lain</option>
                </select>
            </div>
            <div class="form-group">
                <label for="url_${entryCount}">URL Lengkap</label>
                <input type="url" name="url_${entryCount}" id="url_${entryCount}" placeholder="https://...">
            </div>
            <div class="shop-entry-actions">
                ${entryCount > 0 ? '<button type="button" class="remove-shop-btn">&times;</button>' : ''}
            </div>
        `;
        shopsContainer.appendChild(div);
    }

    function handleShopContainerClick(e) {
        if (e.target.classList.contains('remove-shop-btn')) {
            e.target.closest('.online-shop-entry').remove();
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        modalPreviewGrid.innerHTML = ''; // Kosongkan preview
        
        for (let [key, value] of formData.entries()) {
            const fieldName = form.querySelector(`[name="${key}"]`);
            const label = fieldName ? fieldName.closest('.form-group').querySelector('label').textContent : key;
            if (value) {
                modalPreviewGrid.innerHTML += `
                    <div class="preview-item">
                        <span class="preview-label">${label}</span>
                        <span class="preview-value">${value}</span>
                    </div>
                `;
            }
        }
        confirmationModal.style.display = 'flex';
    }

    async function submitForm() {
        confirmationModal.style.display = 'none';
        statusModal.style.display = 'flex';
        submissionLoading.style.display = 'flex';
        submissionSuccess.style.display = 'none';
        submissionError.style.display = 'none';

        try {
            const formData = new FormData(form);
            // Tambah data ekstra
            formData.append('ip_by', 'N/A'); // IP tracking bisa lebih kompleks
            formData.append('device', navigator.userAgent);
            
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                submissionLoading.style.display = 'none';
                submissionSuccess.style.display = 'flex';
                form.reset();
            } else {
                throw new Error('Server response was not OK.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            submissionLoading.style.display = 'none';
            submissionError.style.display = 'flex';
        }
    }
}); 
