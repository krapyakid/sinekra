document.addEventListener('DOMContentLoaded', function() {
    // Data investasi crowdfunding (data real dari Google Sheets)
    const investmentData = [
        { nama_lengkap: "Muhammad Idham Kholid", nominal: 100000 },
        { nama_lengkap: "Faishol Adib", nominal: 1000000 },
        { nama_lengkap: "Pekik Nur Sasongko", nominal: 200000 },
        { nama_lengkap: "Muhammad Mustofa", nominal: 500000 },
        { nama_lengkap: "Syaifuddin Jufri", nominal: 1000000 },
        { nama_lengkap: "Nafakhatin Nur", nominal: 500000 },
        { nama_lengkap: "Istiqomah", nominal: 200000 },
        { nama_lengkap: "Evi Nurbaeti", nominal: 100000 },
        { nama_lengkap: "Akhmad Fanani", nominal: 2000000 },
        { nama_lengkap: "Muhammad 'Ainun Na'iim", nominal: 100000 },
        { nama_lengkap: "FAIZ ROKHMAN", nominal: 100000 },
        { nama_lengkap: "Angga Aulia Akbar", nominal: 1000000 },
        { nama_lengkap: "Roby Yulian", nominal: 100000 },
        { nama_lengkap: "Rofiq burhannudin", nominal: 300000 },
        { nama_lengkap: "Very Rosadi", nominal: 200000 },
        { nama_lengkap: "M Jamroni", nominal: 100000 },
        { nama_lengkap: "Farah Dina", nominal: 500000 },
        { nama_lengkap: "Syafiah Aziz ( Fifie )", nominal: 100000 },
        { nama_lengkap: "Mukhlis", nominal: 100000 },
        { nama_lengkap: "Mochamad Yusuf", nominal: 100000 },
        { nama_lengkap: "Muhammad Obrin", nominal: 100000 },
        { nama_lengkap: "Ani Suwarni", nominal: 200000 },
        { nama_lengkap: "Ismangil akhmad saifi", nominal: 100000 },
        { nama_lengkap: "Muhammad Hanif Hakim", nominal: 1000000 },
        { nama_lengkap: "Syahir Bahar A", nominal: 100000 },
        { nama_lengkap: "Hamzah Fasal", nominal: 100000 },
        { nama_lengkap: "Fitroh ahmad sugianto", nominal: 100000 },
        { nama_lengkap: "Mahin Muqoddam Assarwani", nominal: 100000 },
        { nama_lengkap: "Abdullah Fahri", nominal: 100000 },
        { nama_lengkap: "Okta Rijaya M", nominal: 5000000 },
        { nama_lengkap: "Ahmad Rotsiq A'la", nominal: 100000 },
        { nama_lengkap: "Arham Chairuddin Sam", nominal: 100000 },
        { nama_lengkap: "Siti Roudhotul Jannah", nominal: 100000 },
        { nama_lengkap: "Ufiya Ajdar", nominal: 100000 },
        { nama_lengkap: "Irfan Taufiq", nominal: 100000 },
        { nama_lengkap: "Moh.imanudin setiawan", nominal: 500000 },
        { nama_lengkap: "Qowangit", nominal: 100000 },
        { nama_lengkap: "Lukman Hakim", nominal: 300000 },
        { nama_lengkap: "Ianatullah Ishomuddin", nominal: 100000 },
        { nama_lengkap: "Sugiarto", nominal: 5000000 },
        { nama_lengkap: "Kuswanto", nominal: 100000 },
        { nama_lengkap: "R. Sjafmaryzal", nominal: 1000000 },
        { nama_lengkap: "Eka Prasetiawati", nominal: 100000 },
        { nama_lengkap: "Dr. Nur Hidayat, M. Ag", nominal: 200000 },
        { nama_lengkap: "Lutfan Muntaqo", nominal: 2500000 },
        { nama_lengkap: "Munadhirin", nominal: 100000 },
        { nama_lengkap: "Alfa ifana", nominal: 500000 },
        { nama_lengkap: "Dr. Nur Hidayat, M. Ag", nominal: 100000 },
        { nama_lengkap: "FATHUR ROHMAN", nominal: 300000 },
        { nama_lengkap: "Mukhsin", nominal: 200000 },
        { nama_lengkap: "Mahmud dimyati", nominal: 100000 },
        { nama_lengkap: "Moch Syafiudin", nominal: 1000000 },
        { nama_lengkap: "Muchlis Kamil", nominal: 200000 },
        { nama_lengkap: "Fuad Nawawi", nominal: 500000 },
        { nama_lengkap: "Nasrul Hakim", nominal: 100000 },
        { nama_lengkap: "Haerul Maulana", nominal: 100000 },
        { nama_lengkap: "Isfaudhi Arifian", nominal: 2500000 },
        { nama_lengkap: "Iwan RS", nominal: 100000 },
        { nama_lengkap: "Sodikun", nominal: 200000 },
        { nama_lengkap: "Ni matul maula", nominal: 300000 },
        { nama_lengkap: "Achmad Muzayyin Qudsi", nominal: 100000 },
        { nama_lengkap: "Muklisin Purnomo", nominal: 500000 },
        { nama_lengkap: "Farah Dina", nominal: 500000 },
        { nama_lengkap: "Nandar", nominal: 10000000 }
    ];

    // Hitung total dana (total sebenarnya adalah 43.000.000)
    const totalDana = 43000000;

    // Fungsi animasi angka berjalan
    function animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const range = end - start;

        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function untuk animasi yang lebih smooth
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (range * easeOutQuart));
            
            element.textContent = `Rp ${current.toLocaleString('id-ID')}`;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = `Rp ${end.toLocaleString('id-ID')}`;
            }
        }
        
        requestAnimationFrame(updateNumber);
    }

    // Mulai animasi total dana setelah halaman dimuat
    setTimeout(() => {
        const totalDanaElement = document.getElementById('total-dana');
        animateNumber(totalDanaElement, 0, totalDana, 8000); // Animasi 8 detik (sangat lambat)
    }, 500);

    // Fungsi untuk menampilkan popup daftar investor
    window.showInvestorList = function() {
        const popup = document.getElementById('investor-popup');
        const investorList = document.getElementById('investor-list');
        
        // Bersihkan daftar sebelumnya
        investorList.innerHTML = '';
        
        // Tambahkan setiap investor ke daftar
        investmentData.forEach((investor, index) => {
            const investorItem = document.createElement('div');
            investorItem.className = 'investor-item';
            
            investorItem.innerHTML = `
                <div class="investor-number">${index + 1}</div>
                <div class="investor-name">${investor.nama_lengkap}</div>
            `;
            
            investorList.appendChild(investorItem);
        });
        
        // Tampilkan popup
        popup.style.display = 'flex';
        
        // Prevent body scroll saat popup terbuka
        document.body.style.overflow = 'hidden';
    };

    // Fungsi untuk menutup popup daftar investor
    window.closeInvestorList = function() {
        const popup = document.getElementById('investor-popup');
        popup.style.display = 'none';
        
        // Restore body scroll
        document.body.style.overflow = 'auto';
    };

    // Tutup popup jika klik di luar area popup
    document.getElementById('investor-popup').addEventListener('click', function(e) {
        if (e.target === this) {
            closeInvestorList();
        }
    });

    // Tutup popup dengan tombol ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const popup = document.getElementById('investor-popup');
            if (popup.style.display === 'flex') {
                closeInvestorList();
            }
        }
    });
}); 
