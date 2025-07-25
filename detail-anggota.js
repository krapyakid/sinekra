document.addEventListener('DOMContentLoaded', function() {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvsDmDoerDTDgV39Op65g8D_fGyCyTy82StbSzsACbpQoYnetw96E4mQ1T0suIHfhR/exec";
    const detailContent = document.getElementById('detail-content');
    const breadcrumbContainer = document.getElementById('breadcrumb');
    const baseAssetUrl = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/usaha/';

    async function fetchAllData() {
        try {
            const response = await fetch(SCRIPT_URL, { cache: 'no-cache' });
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            const result = await response.json();
            if (result.status === "success") {
                return result.data;
            } else {
                throw new Error(result.message || 'Error fetching data from script.');
            }
        } catch (error) {
            console.error("Failed to load data:", error);
            detailContent.innerHTML = `<p class="error-message">Gagal memuat data. Silakan coba lagi.</p>`;
            return null;
        }
    }

    function renderBreadcrumb(member) {
        breadcrumbContainer.innerHTML = `
            <a href="index.html">Home</a>
            <span>&nbsp;&gt;&nbsp;</span>
            <span>Detail Anggota</span>
        `;
    }

    function createMemberCard(memberData) {
        const card = document.createElement('a');
        card.href = `detail-anggota.html?id=${memberData.id_anggota}`;
        card.className = 'compact-member-card';

        // Generate initial letter for avatar
        const initialLetter = memberData.nama_lengkap ? memberData.nama_lengkap.charAt(0).toUpperCase() : 'A';
        
        // Format angkatan using th_masuk and th_keluar
        const angkatanText = (memberData.th_masuk && memberData.th_keluar) ? 
            `${memberData.th_masuk} – ${memberData.th_keluar}` : 
            (memberData.th_masuk ? `${memberData.th_masuk} –` : 'Tidak diketahui');

        // Format domisili
        const domisiliText = memberData.domisili || 'Lokasi tidak diketahui';

        card.innerHTML = `
            <div class="compact-member-thumbnail">
                <div class="compact-member-avatar">${initialLetter}</div>
            </div>
            <div class="compact-member-info">
                <h4 class="compact-member-name">${memberData.nama_lengkap}</h4>
                <p class="compact-member-angkatan">Angkatan ${angkatanText}</p>
                <p class="compact-member-domisili">${domisiliText}</p>
            </div>
        `;
        return card;
    }

    function createCompactBusinessCard(business) {
        const businessImgUrl = `${baseAssetUrl}${business.id_usaha}.jpg`;
        const defaultImgUrl = 'assets/usaha/default_image_usaha.jpg';
        
        const card = document.createElement('a');
        card.href = `detail-usaha.html?id=${business.id_usaha}`;
        card.className = 'compact-business-card';

        card.innerHTML = `
            <div class="compact-business-thumbnail">
                <img src="${businessImgUrl}" alt="Foto ${business.nama_usaha}" onerror="this.onerror=null; this.src='${defaultImgUrl}';">
            </div>
            <div class="compact-business-info">
                <h4 class="compact-business-name">${business.nama_usaha}</h4>
                <p class="compact-business-type">${business.jenis_usaha || 'Tidak ada kategori'}</p>
            </div>
        `;
        return card;
    }

    function renderMemberRecommendations(allMembers, currentMember) {
        console.log('Starting recommendation logic for:', currentMember.nama_lengkap);
        
        const recommendations = allMembers.filter(m => {
            if (m.id_anggota === currentMember.id_anggota) return false;
            
            // Priority scoring system
            let score = 0;
            let reasons = [];
            
            // 1. Same alumni status (highest priority)
            if (m.alumni === currentMember.alumni && currentMember.alumni) {
                score += 15;
                reasons.push('sama alumni');
            }
            
            // 2. Same or adjacent graduation years (th_keluar)
            if (m.th_keluar && currentMember.th_keluar) {
                const yearDiff = Math.abs(parseInt(m.th_keluar) - parseInt(currentMember.th_keluar));
                if (yearDiff === 0) {
                    score += 12;
                    reasons.push('tahun keluar sama');
                } else if (yearDiff <= 2) {
                    score += 10;
                    reasons.push('tahun keluar berdekatan');
                } else if (yearDiff <= 5) {
                    score += 6;
                    reasons.push('tahun keluar cukup dekat');
                }
            }
            
            // 3. Same or adjacent entry years (th_masuk)
            if (m.th_masuk && currentMember.th_masuk) {
                const yearDiff = Math.abs(parseInt(m.th_masuk) - parseInt(currentMember.th_masuk));
                if (yearDiff === 0) {
                    score += 12;
                    reasons.push('tahun masuk sama');
                } else if (yearDiff <= 2) {
                    score += 10;
                    reasons.push('tahun masuk berdekatan');
                } else if (yearDiff <= 5) {
                    score += 6;
                    reasons.push('tahun masuk cukup dekat');
                }
            }
            
            // 4. Same domisili (prioritas tinggi)
            if (m.domisili === currentMember.domisili && currentMember.domisili) {
                score += 20; // Boost tinggi untuk domisili sama
                reasons.push('domisili sama');
            }
            
            // 5. Same komplek
            if (m.komplek === currentMember.komplek && currentMember.komplek) {
                score += 5;
                reasons.push('komplek sama');
            }
            
            console.log(`${m.nama_lengkap}: score=${score}, reasons=[${reasons.join(', ')}]`);
            
            return score > 0 ? { ...m, score, reasons } : null;
        }).filter(Boolean);

        // Sort by domisili sama dulu, kemudian score descending, lalu abjad
        const sortedRecommendations = recommendations
            .sort((a, b) => {
                // Prioritas 1: Domisili sama dengan current member
                const aSameDomisili = a.domisili === currentMember.domisili;
                const bSameDomisili = b.domisili === currentMember.domisili;
                
                if (aSameDomisili && !bSameDomisili) return -1;
                if (!aSameDomisili && bSameDomisili) return 1;
                
                // Prioritas 2: Score tertinggi
                if (b.score !== a.score) return b.score - a.score;
                
                // Prioritas 3: Abjad nama
                return a.nama_lengkap.localeCompare(b.nama_lengkap);
            })
            .slice(0, 10);

        console.log('Final recommendations:', sortedRecommendations.map(r => ({
            name: r.nama_lengkap,
            score: r.score,
            reasons: r.reasons
        })));

        return sortedRecommendations;
    }

    function renderDetail(allData) {
        const urlParams = new URLSearchParams(window.location.search);
        const memberId = urlParams.get('id');

        if (!memberId) {
            detailContent.innerHTML = `<p class="error-message">ID Anggota tidak ditemukan.</p>`;
            return;
        }

        const member = allData.find(m => m.id_anggota === memberId);

        if (!member) {
            detailContent.innerHTML = `<p class="error-message">Detail anggota tidak ditemukan.</p>`;
            return;
        }

        document.title = `${member.nama_lengkap} - Sinergi Ekonomi Krapyak`;
        renderBreadcrumb(member);

        // Get member's businesses
        const allBusinesses = allData.flatMap(m => (m.usaha || []).map(u => ({ ...m, ...u })));
        const memberBusinesses = allBusinesses.filter(b => b.id_anggota === member.id_anggota);

        // Dynamic logic for displaying contact and address info
        const showAlamat = member.alamat_active == '1';
        const showKontak = member.no_hp_active == '1';

        // Generate WhatsApp contact
        let contactButtons = [];
        const phoneField = String(member.no_hp_anggota || '');
        if (showKontak && phoneField && phoneField.trim() !== '') {
            let waNumber = phoneField.replace(/[^0-9]/g, '');
            // Hapus awalan 62 jika ada
            if (waNumber.startsWith('62')) {
                waNumber = waNumber.substring(2);
            }
            if (waNumber) {
                contactButtons.push(`<a href="https://wa.me/62${waNumber}" target="_blank" class="contact-wa-btn" title="WhatsApp"><i class="fab fa-whatsapp"></i> WhatsApp</a>`);
            }
        }

        // Generate initial letter for avatar
        const initialLetter = member.nama_lengkap ? member.nama_lengkap.charAt(0).toUpperCase() : 'A';

        // Format angkatan using correct fields th_masuk and th_keluar
        const angkatanText = (member.th_masuk && member.th_keluar) ? 
            `${member.th_masuk} – ${member.th_keluar}` : 
            (member.th_masuk ? `${member.th_masuk} –` : 'Tidak diketahui');

        // Create avatar image container (using same structure as detail-usaha)
        const avatarContainer = `
            <div class="detail-image-container">
                <div class="alumni-avatar">
                    ${initialLetter}
                </div>
            </div>
        `;

        // Format tanggal posting
        const postDate = member.timestamp ? new Date(member.timestamp) : new Date();
        const formattedDate = postDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Create main info content
        let mainContent = `
            <div class="detail-info">
                <p class="text-xs text-gray-400 mb-2">Diposting ${formattedDate}</p>
                <h1>${member.nama_lengkap}</h1>
                <div class="alumni-status-wrapper">
                    <p class="alumni-status">Alumni Pondok Pesantren Krapyak</p>
                    <p class="alumni-angkatan">Angkatan ${angkatanText}</p>
                </div>

                <div class="info-section">
                    <h3>Informasi Pribadi</h3>
                    <div class="info-item"><i class="fas fa-id-card"></i> <span>Nama Panggilan: ${member.nama_panggilan || '-'}</span></div>
                    <div class="info-item"><i class="fas fa-building"></i> <span>Komplek: ${member.komplek || '-'}</span></div>
                </div>

                <div class="info-section">
                    <h3>Domisili</h3>
                    <div class="info-item">
                        <i class="fas fa-map-marker-alt"></i> 
                        <span>Lokasi: `;
        
        // Handle Google Maps link for domisili using google_maps_url field
        if (member.google_maps_url && String(member.google_maps_url).trim() !== '') {
            mainContent += `<a href="${member.google_maps_url}" target="_blank" class="location-link">
                <i class="fas fa-map-marker-alt"></i>${member.domisili || 'Lokasi'}
            </a>`;
        } else if (member.google_map && String(member.google_map).trim() !== '') {
            // Fallback to google_map field
            mainContent += `<a href="${member.google_map}" target="_blank" class="location-link">
                <i class="fas fa-map-marker-alt"></i>${member.domisili || 'Lokasi'}
            </a>`;
        } else {
            mainContent += member.domisili || '-';
        }
        
        mainContent += `</span></div>`;
        
        // Show detailed address only if alamat_active is 1
        if (showAlamat && member.detail_alamat && String(member.detail_alamat).trim() !== '') {
            mainContent += `<div class="info-item"><i class="fas fa-home"></i> <span>Detail Alamat: ${String(member.detail_alamat)}</span></div>`;
        }
        
        mainContent += `</div>`;

        // Karir & Kontribusi section
        const hasCareerInfo = member.profesi || member.detail_profesi || member.pengembangan_profesi || member.ide || member.lain_lain;
        if (hasCareerInfo) {
            mainContent += `
                <div class="info-section">
                    <h3>Karir & Kontribusi</h3>`;
            
            if (member.profesi) {
                mainContent += `<div class="info-item"><i class="fas fa-user-tie"></i> <span>Profesi: ${member.profesi}</span></div>`;
            }
            if (member.detail_profesi && String(member.detail_profesi).trim() !== '' && member.detail_profesi !== '-') {
                mainContent += `<div class="info-item"><i class="fas fa-info-circle"></i> <span>Detail Profesi: ${String(member.detail_profesi)}</span></div>`;
            }
            if (member.pengembangan_profesi && String(member.pengembangan_profesi).trim() !== '' && member.pengembangan_profesi !== '-') {
                mainContent += `<div class="info-item"><i class="fas fa-chart-line"></i> <span>Pengembangan: ${String(member.pengembangan_profesi)}</span></div>`;
            }
            if (member.ide && String(member.ide).trim() !== '' && member.ide !== '-') {
                mainContent += `<div class="info-item"><i class="fas fa-lightbulb"></i> <span>Ide/Gagasan: ${String(member.ide)}</span></div>`;
            }
            if (member.lain_lain && String(member.lain_lain).trim() !== '' && member.lain_lain !== '-') {
                mainContent += `<div class="info-item"><i class="fas fa-plus-circle"></i> <span>Lain-lain: ${String(member.lain_lain)}</span></div>`;
            }
            
            mainContent += `</div>`;
        }

        // Contact section - only show if there are contact buttons
        if (contactButtons.length > 0) {
            mainContent += `
                <div class="info-section">
                    <h3>Kontak</h3>
                    <div class="contact-buttons-section">
                        ${contactButtons.join('')}
                    </div>
                </div>
            `;
        }

        // Business section with compact cards
        if (memberBusinesses.length > 0) {
            mainContent += `
                <div class="info-section">
                    <h3>Daftar Usaha</h3>
                    <div class="compact-business-grid">
                        ${memberBusinesses.map(business => createCompactBusinessCard(business).outerHTML).join('')}
                    </div>
                </div>
            `;
        }

        mainContent += `</div>`;

        // Combine main content without recommendations
        detailContent.innerHTML = avatarContainer + mainContent;

        // Member recommendations section - separate from main container
        const memberRecommendations = renderMemberRecommendations(allData, member);
        
        if (memberRecommendations.length > 0) {
            const recommendationHTML = `
                <section class="recommendation-section-full-width">
                    <div class="recommendation-section-container">
                        <h2><i class="fas fa-users"></i> Rekomendasi Anggota</h2>
                        <div class="member-recommendations-grid">
                            ${memberRecommendations.map(rec => createMemberCard(rec).outerHTML).join('')}
                        </div>
                    </div>
                </section>
            `;
            
            // Insert after the detail container
            const detailContainer = document.querySelector('.detail-container');
            detailContainer.insertAdjacentHTML('afterend', recommendationHTML);
        }
    }

    // Initialize
    fetchAllData().then(allData => {
        if (allData) {
            renderDetail(allData);
        }
    });
}); 
