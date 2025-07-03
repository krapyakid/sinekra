document.addEventListener('DOMContentLoaded', () => {
    // Correct Google Apps Script URL
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

            const response = await fetch(`${SCRIPT_URL}?action=getAllData`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();

            if (result.status === 'success' && result.data) {
                // Correctly assign data based on main.js structure
                allData = result.data.anggota || [];
                usahaData = result.data.usaha || [];

                // Combine business data into member data
                allData.forEach(anggota => {
                    anggota.usaha = usahaData.filter(u => u.id_anggota === anggota.id_anggota);
                });

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
            
            // Handle non-numeric or missing years gracefully
            const yearInRange = 
                (!startYear || !thMasuk || thMasuk >= startYear) &&
                (!endYear || !thKeluar || thKeluar <= endYear);
            
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
        const startYear = parseInt(filterTahunMasuk.value, 10) || 0;
        const endYear = parseInt(filterTahunKeluar.value, 10) || Infinity;

        // First, filter the members by the year range
        const anggotaInYearRange = filteredAnggota.filter(item => {
            const thMasuk = parseInt(item.th_masuk, 10);
            const thKeluar = parseInt(item.th_keluar, 10);
            return (!startYear || !thMasuk || thMasuk >= startYear) &&
                   (!endYear || !thKeluar || thKeluar <= endYear);
        });
        
        // Then, collect all businesses from these filtered members
        let relevantUsaha = anggotaInYearRange.flatMap(anggota => anggota.usaha || []);

        const counts = relevantUsaha.reduce((acc, usaha) => {
            const key = usaha.kategori_usaha ? usaha.kategori_usaha.trim() : 'Lain-lain';
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
