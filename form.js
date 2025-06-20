document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('alumni-form');
    if (!form) return; // Keluar jika ini bukan halaman formulir
    
    // Fungsi utama untuk membuat dropdown yang bisa dicari
// ... existing code ...
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });

    // Navigasi form dengan tombol Enter
    const formElements = Array.from(form.querySelectorAll('input:not([type="hidden"]), textarea'));
    const submitButton = form.querySelector('.submit-btn');

    formElements.forEach((element, index) => {
// ... existing code ...
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
