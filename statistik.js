document.addEventListener('DOMContentLoaded', function() {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvsDmDoerDTDgV39Op65g8D_fGyCyTy82StbSzsACbpQoYnetw96E4mQ1T0suIHfhR/exec";
    let allData = [];
    let domisiliChartInstance, profesiChartInstance;

    const domisiliCanvas = document.getElementById('domisiliChart');
    const profesiCanvas = document.getElementById('profesiChart');
    const filterTahunDomisili = document.getElementById('filter-tahun-domisili');
    const filterDomisili = document.getElementById('filter-domisili');
    const filterProfesi = document.getElementById('filter-profesi');

    // --- UTILITY & HELPER FUNCTIONS ---
    function getRandomColor() {
        const r = Math.floor(Math.random() * 200);
        const g = Math.floor(Math.random() * 200);
        const b = Math.floor(Math.random() * 200);
        return `rgba(${r}, ${g}, ${b}, 0.7)`;
    }
    
    // --- DATA FETCHING & INITIALIZATION ---
    async function fetchDataAndInitialize() {
        try {
            const response = await fetch(SCRIPT_URL, { cache: 'no-cache' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.status === "success") {
                allData = result.data.filter(d => d.nama_lengkap);
                initializePage();
            } else {
                throw new Error(result.message || 'Server returned an error.');
            }
        } catch (error) {
            console.error("Failed to load data:", error);
            domisiliCanvas.parentElement.innerHTML = `<div class="error-message">Gagal memuat data.</div>`;
            profesiCanvas.parentElement.innerHTML = `<div class="error-message">Gagal memuat data.</div>`;
        }
    }

    function initializePage() {
        populateFilters();
        updateDomisiliChart();
        updateProfesiChart();

        filterTahunDomisili.addEventListener('change', updateDomisiliChart);
        filterDomisili.addEventListener('change', updateDomisiliChart);
        filterProfesi.addEventListener('change', updateProfesiChart);
    }

    function populateFilters() {
        const tahunKeluarOptions = [...new Set(allData.map(d => d.tahun_keluar).filter(Boolean))].sort((a,b) => b-a);
        const domisiliOptions = [...new Set(allData.map(d => d.domisili).filter(Boolean))].sort();
        const profesiOptions = [...new Set(allData.map(d => d.profesi).filter(Boolean))].sort();

        tahunKeluarOptions.forEach(val => filterTahunDomisili.add(new Option(val, val)));
        domisiliOptions.forEach(val => filterDomisili.add(new Option(val, val)));
        profesiOptions.forEach(val => filterProfesi.add(new Option(val, val)));
    }

    // --- CHART LOGIC ---
    function updateDomisiliChart() {
        const selectedTahun = filterTahunDomisili.value;
        const selectedDomisili = filterDomisili.value;

        let filteredData = allData;
        if (selectedTahun) filteredData = filteredData.filter(d => d.tahun_keluar == selectedTahun);
        if (selectedDomisili) filteredData = filteredData.filter(d => d.domisili === selectedDomisili);

        const counts = filteredData.reduce((acc, item) => {
            const key = item.domisili || "Tidak Diketahui";
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        renderChart(domisiliChartInstance, domisiliCanvas, 'domisiliChart', counts, 'Jumlah Alumni per Domisili');
    }

    function updateProfesiChart() {
        const selectedProfesi = filterProfesi.value;

        let filteredData = allData;
        if (selectedProfesi) filteredData = filteredData.filter(d => d.profesi === selectedProfesi);

        const counts = filteredData.reduce((acc, item) => {
            const key = item.profesi || "Tidak Diketahui";
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        
        renderChart(profesiChartInstance, profesiCanvas, 'profesiChart', counts, 'Jumlah Alumni per Profesi');
    }
    
    function renderChart(instance, canvas, chartId, data, label) {
        if (instance) instance.destroy();
        
        const sortedData = Object.entries(data).sort(([,a],[,b]) => b-a);
        const labels = sortedData.map(item => item[0]);
        const values = sortedData.map(item => item[1]);
        const backgroundColors = labels.map(() => getRandomColor());

        if (chartId === 'domisiliChart') {
            domisiliChartInstance = new Chart(canvas, {
                type: 'bar',
                data: { labels, datasets: [{ label, data: values, backgroundColor: backgroundColors }] },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
            });
        } else {
            profesiChartInstance = new Chart(canvas, {
                type: 'bar',
                data: { labels, datasets: [{ label, data: values, backgroundColor: backgroundColors }] },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
            });
        }
    }

    fetchDataAndInitialize();
}); 