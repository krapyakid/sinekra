 document.addEventListener('DOMContentLoaded', function() {
    const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGe6AOx8Dsnq--KPToMl0Q4lF20650_IQ6VoLQxyy3heEFW43LSTIqB0UAUeTV0QOvr8O_YnaeU-om/pubhtml?gid=0&single=true";
    
    const gridContainer = document.getElementById('directory-grid');
    const loadingIndicator = document.getElementById('directory-loading');

    // Fungsi untuk mengubah baris CSV menjadi objek JavaScript
    function parseCsv(csvText) {
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) return [];

        const headers = lines[0].split(',');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(','); // Parser sederhana, asumsi tidak ada koma dalam data
            const entry = {};
            for (let j = 0; j < headers.length; j++) {
                entry[headers[j].trim()] = values[j] ? values[j].trim() : '';
            }
            data.push(entry);
        }
        return data;
    }
    
    // Fungsi untuk membuat satu kartu anggota
    function createMemberCard(member) {
        // Logika untuk menampilkan nama: prioritaskan nama usaha, jika tidak ada, tampilkan nama lengkap
        const displayName = member.nama_usaha || member.nama_lengkap;
        const displaySubText = member.nama_usaha ? member.nama_lengkap : member.profesi;
        
        // Mengambil inisial untuk gambar placeholder
        const initials = displayName.charAt(0).toUpperCase();

        return `
            <div class="member-card">
                <div class="card-header">
                    ${
                        member.logo && member.logo !== 'Tidak ada logo'
                        ? `<img src="${member.logo}" alt="Logo ${displayName}" class="card-logo">`
                        : `<div class="card-initials">${initials}</div>`
                    }
                </div>
                <div class="card-body">
                    <h3 class="card-title">${displayName}</h3>
                    <p class="card-subtitle">${displaySubText}</p>
                    <div class="card-info">
                        <p><strong>Domisili:</strong> ${member.domisili || 'N/A'}</p>
                        <p><strong>Profesi:</strong> ${member.profesi || 'N/A'}</p>
                    </div>
                </div>
                <div class="card-footer">
                    ${
                        member.website_url
                        ? `<a href="${member.website_url}" target="_blank" rel="noopener noreferrer" class="card-link">Kunjungi Website</a>`
                        : `<span class="card-link disabled">Website Tidak Ada</span>`
                    }
                </div>
            </div>
        `;
    }

    // Fungsi utama untuk mengambil dan menampilkan data
    async function loadDirectory() {
        if (sheetUrl === "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGe6AOx8Dsnq--KPToMl0Q4lF20650_IQ6VoLQxyy3heEFW43LSTIqB0UAUeTV0QOvr8O_YnaeU-om/pubhtml?gid=0&single=true") {
            loadingIndicator.innerHTML = '<p>Error: URL Google Sheet belum diatur di direktori.js.</p>';
            return;
        }

        try {
            const response = await fetch(sheetUrl, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`Gagal mengambil data. Status: ${response.status}`);
            }

            const csvText = await response.text();
            const members = parseCsv(csvText);

            // Sembunyikan loading indicator
            loadingIndicator.style.display = 'none';

            if (members.length === 0) {
                gridContainer.innerHTML = '<p class="directory-status">Tidak ada data anggota untuk ditampilkan.</p>';
                return;
            }

            // Tampilkan setiap anggota sebagai kartu
            members.forEach(member => {
                const cardHtml = createMemberCard(member);
                gridContainer.insertAdjacentHTML('beforeend', cardHtml);
            });

        } catch (error) {
            console.error("Gagal memuat direktori:", error);
            loadingIndicator.innerHTML = `<p class="directory-status">Gagal memuat data direktori. Silakan coba lagi nanti.</p>`;
        }
    }

    // Panggil fungsi utama
    loadDirectory();
}); 
