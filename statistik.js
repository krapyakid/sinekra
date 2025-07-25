document.addEventListener('DOMContentLoaded', () => {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvsDmDoerDTDgV39Op65g8D_fGyCyTy82StbSzsACbpQoYnetw96E4mQ1T0suIHfhR/exec";

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

            const response = await fetch(SCRIPT_URL, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();

            if (result.status === 'success' && result.data) {
                allData = result.data;
                usahaData = allData.flatMap(member => member.usaha || []);

                populateFilters();
                addFilterListeners();
                updateTables();
            } else {
                throw new Error(result.message || 'Format data tidak sesuai.');
            }

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
        populateYearSelect(filterTahunMasuk, 1983, 2025, 'Semua Tahun');
        populateYearSelect(filterTahunKeluar, 1991, 2024, 'Semua Tahun');
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

    function populateYearSelect(selectElement, start, end, defaultOptionText) {
        selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`;
        for (let year = end; year >= start; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            selectElement.appendChild(option);
        }
    }

    function addFilterListeners() {
        [filterAlumni, filterDomisili, filterProfesi, filterKategoriUsaha, filterTahunMasuk, filterTahunKeluar].forEach(el => {
            el.addEventListener('change', updateTables);
        });
    }

    function getFilteredData() {
        const selectedAlumni = filterAlumni.value;
        const startYear = parseInt(filterTahunMasuk.value, 10);
        const endYear = parseInt(filterTahunKeluar.value, 10);
        const selectedDomisili = filterDomisili.value;
        const selectedProfesi = filterProfesi.value;
        const selectedKategoriUsaha = filterKategoriUsaha.value;

        let filtered = allData.filter(item => {
            // Handle null/undefined values
            if (!item) return false;

            const thMasuk = parseInt(item.th_masuk, 10);
            const thKeluar = parseInt(item.th_keluar, 10);
            
            // Year range validation
            const yearInRange = (
                // If no start year is selected OR the entry year is valid and >= start year
                (isNaN(startYear) || (!isNaN(thMasuk) && thMasuk >= startYear)) &&
                // If no end year is selected OR the exit year is valid and <= end year
                (isNaN(endYear) || (!isNaN(thKeluar) && thKeluar <= endYear))
            );

            // Handle empty/null values in filters
            const alumniMatch = !selectedAlumni || item.alumni === selectedAlumni;
            const domisiliMatch = !selectedDomisili || 
                (item.domisili && item.domisili.trim().toLowerCase() === selectedDomisili.trim().toLowerCase());
            const profesiMatch = !selectedProfesi || 
                (item.profesi && item.profesi.trim().toLowerCase() === selectedProfesi.trim().toLowerCase());

            return alumniMatch && yearInRange && domisiliMatch && profesiMatch;
        });

        // Handle kategori usaha filter with null checks
        if (selectedKategoriUsaha) {
            filtered = filtered.filter(anggota => 
                anggota && 
                anggota.usaha && 
                Array.isArray(anggota.usaha) && 
                anggota.usaha.some(u => 
                    u && 
                    u.kategori_usaha && 
                    u.kategori_usaha.trim().toLowerCase() === selectedKategoriUsaha.trim().toLowerCase()
                )
            );
        }

        return filtered;
    }

    function updateTables() {
        try {
            const filteredData = getFilteredData();
            
            if (!Array.isArray(filteredData)) {
                console.error('Filtered data is not an array:', filteredData);
                return;
            }

            updateDomisiliTable(filteredData);
            updateProfesiTable(filteredData);
            updateUsahaTable(filteredData);
        } catch (error) {
            console.error('Error updating tables:', error);
            // Show error message to user
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'Terjadi kesalahan saat memperbarui data. Silakan muat ulang halaman.';
            resultsGrid.prepend(errorDiv);
        }
    }
    
    function generateAndRenderTable(data, groupBy, tableBody) {
        if (!data || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="2">Tidak ada data yang cocok.</td></tr>`;
            return;
        }

        const counts = data.reduce((acc, item) => {
            const key = item[groupBy] ? item[groupBy].trim() : null;
            if (key) {
                acc[key] = (acc[key] || 0) + 1;
            }
            return acc;
        }, {});

        const sortedData = Object.entries(counts).sort((a, b) => b[1] - a[1]);

        if (sortedData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="2">Tidak ada data untuk ditampilkan.</td></tr>`;
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
       generateAndRenderTable(data, 'domisili', domisiliTableBody);
    }

    function updateProfesiTable(data) {
        generateAndRenderTable(data, 'profesi', profesiTableBody);
    }

    function updateUsahaTable(filteredAnggota) {
        let relevantUsaha = filteredAnggota.flatMap(anggota => anggota.usaha || []);
        
        const selectedKategoriUsaha = filterKategoriUsaha.value;
        if(selectedKategoriUsaha) {
            relevantUsaha = relevantUsaha.filter(u => u.kategori_usaha === selectedKategoriUsaha);
        }

        const counts = relevantUsaha.reduce((acc, usaha) => {
            const key = usaha.kategori_usaha ? usaha.kategori_usaha.trim() : null;
            if(key) acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        
        const sortedData = Object.entries(counts).sort((a, b) => b[1] - a[1]);

        if (sortedData.length === 0) {
             usahaTableBody.innerHTML = `<tr><td colspan="2">Tidak ada data usaha yang cocok.</td></tr>`;
             return;
        }
        
        usahaTableBody.innerHTML = sortedData.map(([key, value]) => `
            <tr>
                <td>${key}</td>
                <td>${value}</td>
            </tr>
        `).join('');
    }

    fetchData();
}); 
