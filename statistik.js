document.addEventListener('DOMContentLoaded', () => {
    const sheetId = '1e5e5b85f1c4296459392817282a51b37915a728';
    const sheetUrl = `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?gid=0&single=true&output=csv`;
    const usahaSheetUrl = `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?gid=1622339393&single=true&output=csv`;

    // Elements
    const filterAlumni = document.getElementById('filter-alumni');
    const filterTahunMasuk = document.getElementById('filter-tahun-masuk');
    const filterTahunKeluar = document.getElementById('filter-tahun-keluar');
    const filterDomisili = document.getElementById('filter-domisili');
    const filterProfesi = document.getElementById('filter-profesi');
    const filterKategoriUsaha = document.getElementById('filter-kategori-usaha');

    const domisiliTableBody = document.querySelector('#domisili-table tbody');
    const profesiTableBody = document.querySelector('#profesi-table tbody');
    const usahaTableBody = document.querySelector('#usaha-table tbody');

    const loadingOverall = document.getElementById('loading-overall');
    const resultsGrid = document.getElementById('statistik-results-grid');

    let allData = [];
    let usahaData = [];

    async function fetchData() {
        try {
            loadingOverall.style.display = 'flex';
            resultsGrid.style.display = 'none';

            const [anggotaRes, usahaRes] = await Promise.all([
                fetch(sheetUrl),
                fetch(usahaSheetUrl)
            ]);

            const anggotaText = await anggotaRes.text();
            const usahaText = await usahaRes.text();

            allData = Papa.parse(anggotaText, { header: true, skipEmptyLines: true }).data;
            usahaData = Papa.parse(usahaText, { header: true, skipEmptyLines: true }).data;
            
            // Gabungkan data usaha ke data anggota
            allData.forEach(anggota => {
                anggota.usaha = usahaData.filter(u => u.id_anggota === anggota.id_anggota);
            });

            populateFilters();
            addFilterListeners();
            updateTables();

        } catch (error) {
            console.error('Error fetching or parsing data:', error);
            loadingOverall.innerHTML = '<p>Gagal memuat data. Silakan coba lagi nanti.</p>';
        } finally {
            loadingOverall.style.display = 'none';
            resultsGrid.style.display = 'grid';
        }
    }

    function populateFilters() {
        const alumni = new Set();
        const domisili = new Set();
        const profesi = new Set();
        const kategoriUsaha = new Set();

        allData.forEach(item => {
            if (item.alumni) alumni.add(item.alumni.trim());
            if (item.domisili) domisili.add(item.domisili.trim());
            if (item.profesi) profesi.add(item.profesi.trim());
        });

        usahaData.forEach(item => {
            if (item.kategori_usaha) kategoriUsaha.add(item.kategori_usaha.trim());
        });

        populateSelect(filterAlumni, alumni, 'Semua Alumni');
        populateSelect(filterDomisili, domisili, 'Semua Domisili');
        populateSelect(filterProfesi, profesi, 'Semua Profesi');
        populateSelect(filterKategoriUsaha, kategoriUsaha, 'Semua Kategori Usaha');
    }
    
    function populateSelect(selectElement, items, defaultOptionText) {
        selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`;
        [...items].sort().forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            selectElement.appendChild(option);
        });
    }

    function addFilterListeners() {
        [filterAlumni, filterDomisili, filterProfesi, filterKategoriUsaha, filterTahunMasuk, filterTahunKeluar].forEach(el => {
            el.addEventListener('change', updateTables);
        });
    }

    function getFilteredData() {
        const selectedAlumni = filterAlumni.value;
        const startYear = parseInt(filterTahunMasuk.value, 10) || 0;
        const endYear = parseInt(filterTahunKeluar.value, 10) || Infinity;
        const selectedDomisili = filterDomisili.value;
        const selectedProfesi = filterProfesi.value;
        const selectedKategoriUsaha = filterKategoriUsaha.value;

        let filtered = allData.filter(item => {
            const thMasuk = parseInt(item.th_masuk, 10);
            const thKeluar = parseInt(item.th_keluar, 10);
            const yearInRange = (thMasuk >= startYear && thKeluar <= endYear);
            
            return (!selectedAlumni || item.alumni === selectedAlumni) &&
                   yearInRange &&
                   (!selectedDomisili || item.domisili === selectedDomisili) &&
                   (!selectedProfesi || item.profesi === selectedProfesi);
        });

        if (selectedKategoriUsaha) {
            filtered = filtered.filter(anggota => 
                anggota.usaha && anggota.usaha.some(u => u.kategori_usaha === selectedKategoriUsaha)
            );
        }

        return filtered;
    }

    function updateTables() {
        const filteredData = getFilteredData();
        
        // Update each table
        updateDomisiliTable(filteredData);
        updateProfesiTable(filteredData);
        updateUsahaTable(filteredData);
    }
    
    function generateAndRenderTable(data, groupBy, tableBody, col1Name, col2Name) {
        if (!data || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="2">Tidak ada data yang cocok.</td></tr>`;
            return;
        }

        const counts = data.reduce((acc, item) => {
            const key = item[groupBy] ? item[groupBy].trim() : 'Lain-lain';
            if (key) {
                acc[key] = (acc[key] || 0) + 1;
            }
            return acc;
        }, {});

        const sortedData = Object.entries(counts).sort((a, b) => b[1] - a[1]);

        if (sortedData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="2">Tidak ada data.</td></tr>`;
            return;
        }

        tableBody.innerHTML = sortedData.map(([key, value]) => `
            <tr>
                <td>${key}</td>
                <td>${value}</td>
            </tr>
        `).join('');
    }

    function updateDomisiliTable(data) {
       generateAndRenderTable(data, 'domisili', domisiliTableBody, 'Domisili', 'Jumlah Alumni');
    }

    function updateProfesiTable(data) {
        generateAndRenderTable(data, 'profesi', profesiTableBody, 'Profesi', 'Jumlah Alumni');
    }

    function updateUsahaTable(filteredAnggota) {
        const selectedKategoriUsaha = filterKategoriUsaha.value;

        let relevantUsaha = filteredAnggota.flatMap(anggota => anggota.usaha);

        if (!selectedKategoriUsaha) {
            // Count all businesses from filtered members, grouped by category
            const counts = relevantUsaha.reduce((acc, usaha) => {
                const key = usaha.kategori_usaha ? usaha.kategori_usaha.trim() : 'Lain-lain';
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});
            
            const sortedData = Object.entries(counts).sort((a, b) => b[1] - a[1]);

            if (sortedData.length === 0) {
                 usahaTableBody.innerHTML = `<tr><td colspan="2">Tidak ada data usaha.</td></tr>`;
                 return;
            }
            
            usahaTableBody.innerHTML = sortedData.map(([key, value]) => `
                <tr>
                    <td>${key}</td>
                    <td>${value}</td>
                </tr>
            `).join('');

        } else {
            // If a category is selected, just count how many businesses fall into it
            const count = relevantUsaha.filter(u => u.kategori_usaha === selectedKategoriUsaha).length;

            if (count === 0) {
                usahaTableBody.innerHTML = `<tr><td colspan="2">Tidak ada data untuk kategori ini.</td></tr>`;
                return;
            }
            
            usahaTableBody.innerHTML = `
                <tr>
                    <td>${selectedKategoriUsaha}</td>
                    <td>${count}</td>
                </tr>
            `;
        }
    }


    // Load PapaParse script then fetch data
    const papaParseScript = document.createElement('script');
    papaParseScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js';
    papaParseScript.onload = fetchData;
    document.body.appendChild(papaParseScript);
}); 
