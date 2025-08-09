    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvsDmDoerDTDgV39Op65g8D_fGyCyTy82StbSzsACbpQoYnetw96E4mQ1T0suIHfhR/exec";
    
    let detailContent;
    let businessId;

    // Helper function to fetch table data
    async function fetchTableData(table = '', params = {}) {
        try {
            const queryParams = new URLSearchParams(params);
            if (table) queryParams.set('table', table);
            
            const url = `${SCRIPT_URL}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            console.log('Fetching from URL:', url);
            
            const response = await fetch(url, { cache: 'no-cache' });
            if (!response.ok) throw new Error(`Gagal mengambil data: ${response.statusText}`);
            
            const result = await response.json();
            
            if (result.status === "success" || result.ok) {
                return result.rows || result.data || [];
            } else {
                throw new Error(result.message || `Server returned error: ${result.status || 'Unknown'}`);
            }
        } catch (error) {
            console.error(`Failed to load ${table || 'base'} data:`, error);
            // Return empty array instead of throwing error for helper function
            return [];
        }
    }

    // Helper function for deduplication
    function uniqBy(arr, keyOrFn) {
        const seen = new Set();
        return arr.filter(item => {
            const val = typeof keyOrFn === 'function' ? keyOrFn(item) : item[keyOrFn];
            if (seen.has(val)) return false;
            seen.add(val);
            return true;
        });
    }

    // Helper to trim IDs
    function trimIds(obj) {
        if (!obj) return obj;
        const copy = {...obj};
        if (copy.id_usaha) copy.id_usaha = copy.id_usaha.trim();
        if (copy.id_anggota) copy.id_anggota = copy.id_anggota.trim();
        return copy;
    }

    // Helper to normalize rows
    function normalizeRows(arr) {
        if (!Array.isArray(arr)) return [];
        return arr.map(row => {
            const copy = {...row};
            ['id_usaha', 'id_anggota', 'platform_sosmed', 'url_sosmed', 'platform_olshop', 'url_olshop'].forEach(field => {
                if (copy[field]) copy[field] = copy[field].trim();
            });
            return copy;
        });
    }

    // Normalize all data structure
    function normalizeAllData(raw, qid) {
        // Check if data is already in expected format
        if (raw?.business && Array.isArray(raw.sosmed_perusahaan) && Array.isArray(raw.olshop_perusahaan)) {
            return {
                business: trimIds(raw.business),
                sosmed_perusahaan: normalizeRows(raw.sosmed_perusahaan),
                olshop_perusahaan: normalizeRows(raw.olshop_perusahaan)
            };
        }

        // Handle other formats
        if (raw?.usaha_anggota || raw?.businesses) {
            const business = (raw.usaha_anggota || raw.businesses).find(b => (b.id_usaha || '').trim() === qid);
            if (!business) throw new Error(`Business not found: ${qid}`);
            return { 
                business: trimIds(business), 
                sosmed_perusahaan: [], 
                olshop_perusahaan: [] 
            };
        }

        // Handle array format (members data)
        if (Array.isArray(raw)) {
            const business = raw.flatMap(m => m.usaha || []).find(b => (b.id_usaha || '').trim() === qid);
            if (!business) throw new Error(`Business not found: ${qid}`);
            return { 
                business: trimIds(business), 
                sosmed_perusahaan: [], 
                olshop_perusahaan: [] 
            };
        }

        throw new Error('Unknown data structure');
    }

    // Main function to fetch all required data
    async function fetchAllData(qid) {
        try {
            console.log('Fetching specific data for business ID:', qid);
            
            // Get all data first (same approach as main.js)
            console.log('Attempting to fetch all data...');
            const response = await fetch(SCRIPT_URL, { cache: 'no-cache' });
            if (!response.ok) throw new Error(`Gagal mengambil data: ${response.statusText}`);
            const allData = await response.json();
            console.log('=== BUSINESS SEARCH DEBUG ===');
            console.log('All data response status:', allData.status);
            console.log('Data structure keys:', Object.keys(allData.data || allData || {}));
            console.log('Searching for business ID:', qid);
            
            // Find the specific business from all data
            let business = null;
            let totalBusinesses = 0;
            let sampleBusinessIds = [];
            
            if (allData.status === "success" && allData.data) {
                console.log('Total members:', allData.data.length);
                
                // Debug: collect sample IDs and count total businesses
                for (const member of allData.data) {
                    if (member.usaha && Array.isArray(member.usaha)) {
                        totalBusinesses += member.usaha.length;
                        for (const usaha of member.usaha) {
                            // Collect first 5 business IDs as sample
                            if (sampleBusinessIds.length < 5) {
                                sampleBusinessIds.push(usaha.id_usaha);
                            }
                            
                            if ((usaha.id_usaha || '').trim() === qid) {
                                business = { ...member, ...usaha }; // Merge member and business data
                                console.log('✅ Business found! Name:', usaha.nama_usaha);
                                break;
                            }
                        }
                    }
                    if (business) break;
                }
                
                console.log('Total businesses in database:', totalBusinesses);
                console.log('Sample business IDs:', sampleBusinessIds);
            }
            
            console.log('Found business:', !!business);
            
            if (!business) {
                console.error('❌ Business not found!');
                console.error('Searched ID:', qid);
                console.error('Available sample IDs:', sampleBusinessIds);
                throw new Error(`Business not found for id "${qid}". Total businesses in database: ${totalBusinesses}`);
            }
            
            // Get member ID for related data
            const idAnggota = (business.id_anggota || '').trim();
            console.log('Member ID:', idAnggota);
            
            // Get social media and marketplace data from the same main data source
            console.log('Processing related social media and marketplace data...');
            
            let sosmed = [];
            let olshop = [];
            
            // Check if social media and marketplace data exists in the main response
            if (allData.data && allData.data.sosmed_perusahaan) {
                sosmed = allData.data.sosmed_perusahaan.filter(item => 
                    (item.id_usaha || '').trim() === qid || 
                    (item.id_anggota || '').trim() === idAnggota
                );
            }
            
            if (allData.data && allData.data.olshop_perusahaan) {
                olshop = allData.data.olshop_perusahaan.filter(item => 
                    (item.id_usaha || '').trim() === qid || 
                    (item.id_anggota || '').trim() === idAnggota
                );
            }
            
            // If not found in main data, try separate requests or check individual business fields
            if (sosmed.length === 0 || olshop.length === 0) {
                console.log('No separate tables found, checking business object for social media and marketplace data...');
                
                // Fallback: Check business object for individual social media fields
                if (sosmed.length === 0 && business) {
                    const socialFields = [
                        { platform: 'instagram', url: business.instagram || business.url_instagram },
                        { platform: 'facebook', url: business.facebook || business.url_facebook },
                        { platform: 'tiktok', url: business.tiktok || business.url_tiktok },
                        { platform: 'youtube', url: business.youtube || business.url_youtube }
                    ];
                    
                    socialFields.forEach(field => {
                        if (field.url && field.url.trim() && field.url !== '-') {
                            sosmed.push({
                                id_usaha: qid,
                                id_anggota: idAnggota,
                                platform_sosmed: field.platform,
                                url_sosmed: field.url.trim()
                            });
                        }
                    });
                }
                
                // Fallback: Check business object for individual marketplace fields
                if (olshop.length === 0 && business) {
                    const marketplaceFields = [
                        { platform: 'tokopedia', url: business.tokopedia || business.url_tokopedia },
                        { platform: 'shopee', url: business.shopee || business.url_shopee },
                        { platform: 'bukalapak', url: business.bukalapak || business.url_bukalapak },
                        { platform: 'lazada', url: business.lazada || business.url_lazada },
                        { platform: 'blibli', url: business.blibli || business.url_blibli },
                        { platform: 'tiktokshop', url: business.tiktok_shop || business.tiktokshop }
                    ];
                    
                    marketplaceFields.forEach(field => {
                        if (field.url && field.url.trim() && field.url !== '-') {
                            olshop.push({
                                id_usaha: qid,
                                id_anggota: idAnggota,
                                platform_olshop: field.platform,
                                url_olshop: field.url.trim()
                            });
                        }
                    });
                }
            }
            
            // Deduplicate by URL
            sosmed = uniqBy(sosmed, r => (r.url_sosmed || '').trim());
            olshop = uniqBy(olshop, r => (r.url_olshop || '').trim());
            
            console.log('Found social media entries:', sosmed.length, sosmed);
            console.log('Found marketplace entries:', olshop.length, olshop);
            
            // Debug specific entries for USH-30
            if (qid === 'USH-30') {
                console.log('=== USH-30 SPECIFIC DEBUG ===');
                console.log('Business data:', {
                    id_usaha: business.id_usaha,
                    id_anggota: business.id_anggota,
                    nama_usaha: business.nama_usaha
                });
                console.log('Social media entries for USH-30:', sosmed);
                console.log('Marketplace entries for USH-30:', olshop);
            }
            
            console.log('=== FETCHALLDATA SUCCESS ===');
            console.log('Found business:', !!business);
            console.log('Business ID:', business?.id_usaha);
            console.log('Business name:', business?.nama_usaha);
            
            // Return normalized structure
            return normalizeAllData({
                business,
                sosmed_perusahaan: sosmed,
                olshop_perusahaan: olshop
            }, qid);
            
            } catch (error) {
            console.error("=== FETCHALLDATA ERROR ===");
            console.error("Error details:", error);
            console.error("Business ID being searched:", qid);
            
            // More specific error messages
            let errorMessage = 'Gagal memuat data. Silakan coba lagi.';
            if (error.message.includes('HTTP error! status: 500')) {
                errorMessage = 'Server sedang mengalami masalah. Silakan coba lagi dalam beberapa saat.';
            } else if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
                errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
            } else if (error.message.includes('Business not found')) {
                errorMessage = `Detail usaha dengan ID ${qid} tidak ditemukan di database.`;
            }
            
            // Create a proper error object with the message
            const detailedError = new Error(errorMessage);
            detailedError.originalError = error;
            throw detailedError;
        }
    }

    // Function to render business recommendations
    function renderRecommendations(allData, currentBusiness) {
        console.log('Starting recommendation logic for:', currentBusiness.nama_usaha);
        
        // Define asset URLs
        const baseAssetUrl = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/usaha/';
        const defaultImgUrl = 'assets/usaha/default_image_usaha.jpg';
        
        // Get all businesses
        const allBusinesses = allData.flatMap(m => (m.usaha || []).map(u => ({ ...m, ...u })));
        
        // Filter and score recommendations
        const recommendations = allBusinesses.filter(b => {
            if (b.id_usaha === currentBusiness.id_usaha) return false;
            
            let score = 0;
            let reasons = [];
            
            // 1. Same business category (highest priority)
            if (b.kategori_usaha === currentBusiness.kategori_usaha && currentBusiness.kategori_usaha) {
                score += 15;
                reasons.push('kategori sama');
            }
            
            // 2. Same business type
            if (b.jenis_usaha === currentBusiness.jenis_usaha && currentBusiness.jenis_usaha) {
                score += 12;
                reasons.push('jenis usaha sama');
            }
            
            // 3. Same domisili
            if (b.domisili === currentBusiness.domisili && currentBusiness.domisili) {
                score += 10;
                reasons.push('domisili sama');
            }
            
            // 4. Has similar offerings
            if (b.prospek_kerjasama_penawaran && currentBusiness.prospek_kerjasama_penawaran) {
                score += 8;
                reasons.push('memiliki penawaran');
            }
            
            console.log(`${b.nama_usaha}: score=${score}, reasons=[${reasons.join(', ')}]`);
            
            return score > 0 ? { ...b, score, reasons } : null;
        }).filter(Boolean);
        
        // Sort by score descending, then by name
        const sortedRecommendations = recommendations
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return a.nama_usaha.localeCompare(b.nama_usaha);
            })
            .slice(0, 10);
        
        console.log('Final recommendations:', sortedRecommendations.map(r => ({
            name: r.nama_usaha,
            score: r.score,
            reasons: r.reasons
        })));
        
        // Create recommendation section if we have recommendations
        if (sortedRecommendations.length > 0) {
            // Remove any existing recommendation section first
            const existingRecommendation = document.querySelector('.recommendation-section-full-width');
            if (existingRecommendation) {
                existingRecommendation.remove();
            }
            
            // Create recommendation section following detail-anggota pattern
            const recommendationHTML = `
                <section class="recommendation-section-full-width">
                    <div class="recommendation-section-container">
                        <h2><i class="fas fa-store"></i> Rekomendasi Usaha Serupa</h2>
                        <div class="compact-business-grid">
                            ${sortedRecommendations.map(business => {
                                const businessImgUrl = `${baseAssetUrl}${business.id_usaha}.jpg`;
                                const localImgUrl = `assets/usaha/${business.id_usaha}.jpg`;
                                console.log(`Recommendation image for ${business.id_usaha}: ${businessImgUrl}`);
                                return `
                                    <a href="detail-usaha.html?id=${business.id_usaha}" class="compact-business-card">
                                        <div class="compact-business-thumbnail">
                                            <img src="${businessImgUrl}" alt="Foto ${business.nama_usaha}" 
                                                 onerror="console.log('GitHub image failed for ${business.id_usaha}, trying local...'); this.onerror=function(){console.log('Local image also failed for ${business.id_usaha}'); this.onerror=null; this.src='${defaultImgUrl}';}; this.src='${localImgUrl}';"
                                                 onload="console.log('Image loaded successfully for ${business.id_usaha}:', this.src);">
                                        </div>
                                        <div class="compact-business-info">
                                            <h4 class="compact-business-name">${business.nama_usaha}</h4>
                                            <p class="compact-business-type">${business.jenis_usaha || 'Tidak ada kategori'}</p>
                                        </div>
                                    </a>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </section>
            `;
            
            // Insert after the detail container following detail-anggota pattern
            const detailContainer = document.querySelector('.detail-container');
            if (detailContainer) {
                detailContainer.insertAdjacentHTML('afterend', recommendationHTML);
            }
        }
    }

    // Main render function
    function renderDetail(allData) {
        console.log('=== RENDER DETAIL START ===');
        console.log('allData keys:', Object.keys(allData));
        
        if (!allData || !allData.business) {
            console.error('Invalid data structure:', allData);
            detailContent.innerHTML = `<p class="error-message">Data tidak ditemukan.</p>`;
            return;
        }

        const business = allData.business;
        console.log('Business:', {
            id_usaha: business.id_usaha,
            nama_usaha: business.nama_usaha,
            id_anggota: business.id_anggota
        });
        
        console.log('sosmed_perusahaan entries:', allData.sosmed_perusahaan.length);
        console.log('olshop_perusahaan entries:', allData.olshop_perusahaan.length);

        if (!business) {
            detailContent.innerHTML = `<p class="error-message">Detail usaha tidak ditemukan.</p>`;
            return;
        }

        document.title = `${business.nama_usaha} - Sinergi Ekonomi Krapyak`;
        renderBreadcrumb(business);

        const baseAssetUrl = 'https://raw.githubusercontent.com/krapyakid/sinekra/main/assets/usaha/';
        const defaultImgUrl = 'assets/usaha/default_image_usaha.jpg';
        const businessImgUrl = `${baseAssetUrl}${business.id_usaha}.jpg`;
        const localBusinessImgUrl = `assets/usaha/${business.id_usaha}.jpg`;

        // WhatsApp processing
        let waNumber = String(business.whatsapp || business.no_hp_perusahaan || '').replace(/[^0-9]/g, '');
        if (waNumber.startsWith('62')) {
            waNumber = waNumber.substring(2);
        }

        // Create header with image and title side by side
        let mainContent = `
            <div class="detail-header">
                <div class="detail-image-container">
                    <img src="${businessImgUrl}" alt="Foto ${business.nama_usaha}" 
                         onerror="console.log('GitHub image failed for ${business.id_usaha}, trying local...'); this.onerror=function(){console.log('Local image also failed for ${business.id_usaha}'); this.onerror=null; this.src='${defaultImgUrl}';}; this.src='${localBusinessImgUrl}';"
                         onload="console.log('Main image loaded successfully for ${business.id_usaha}:', this.src);">
                </div>
                <div class="detail-header-content">
                    <h1 class="detail-title">${business.nama_usaha}</h1>
                    <div class="business-meta">
                        <span class="business-category-label">Kategori:</span>
                        <span class="business-category-value">${business.kategori_usaha || 'Kategori belum diisi'}</span>
                        <span class="separator">•</span>
                        <span class="business-type-label">Jenis:</span>
                        <span class="business-type-value">${business.jenis_usaha || 'Jenis usaha belum diisi'}</span>
                    </div>
                </div>
            </div>
            <div class="detail-info">

        `;
        
        // Add sections following detail-anggota pattern
        if (business.detail_usaha && business.detail_usaha.trim() !== '') {
            mainContent += `
                <div class="info-section">
                    <h3><i class="fas fa-file-alt"></i> Deskripsi Usaha</h3>
                    <p>${business.detail_usaha}</p>
                </div>`;
        }

        if (business.prospek_kerjasama_penawaran && business.prospek_kerjasama_penawaran.trim() !== '') {
            mainContent += `
                <div class="info-section">
                    <h3><i class="fas fa-handshake"></i> Peluang Kerjasama</h3>
                    <p>${business.prospek_kerjasama_penawaran}</p>
                </div>`;
        }
        
        // Informasi Pemilik section
        mainContent += `
            <div class="info-section">
                <h3><i class="fas fa-user"></i> Informasi Pemilik</h3>
                <div class="info-item"><i class="fas fa-university"></i> <span>Alumni: ${business.alumni || 'N/A'}</span></div>
                <div class="info-item"><i class="fas fa-calendar-alt"></i> <span>Angkatan: ${business.th_masuk || '?'} - ${business.th_keluar || '?'}</span></div>
                <div class="info-item owner-card-item">
                    <a href="detail-anggota.html?id=${business.id_anggota}" class="owner-card">
                        <div class="owner-card-content">
                            <div class="owner-name"><i class="fas fa-user"></i> ${business.nama_lengkap}</div>
                            <div class="owner-subtitle">Lihat Profil Anggota</div>
                        </div>
                        <i class="fas fa-chevron-right owner-arrow"></i>
                    </a>
                </div>
                <div class="info-item">
                    <i class="fas fa-map-marker-alt"></i> 
                    <span>${business.domisili}</span>
                </div>
            </div>`;
        
        // Lokasi Usaha section (conditional)
        if (business.url_gmaps_perusahaan && business.url_gmaps_perusahaan.trim() !== '') {
            mainContent += `
                <div class="info-section">
                    <h3><i class="fas fa-map-marker-alt"></i> Lokasi Usaha</h3>
                    <div class="location-button-wrapper">
                        <a href="${business.url_gmaps_perusahaan}" target="_blank" class="location-btn">
                            <i class="fas fa-map-marker-alt"></i>
                            Lihat Lokasi
                        </a>
                    </div>
                </div>`;
        }

        // Kontak section - only show if there are contact options
        let contactButtons = [];
        if (waNumber) {
            contactButtons.push(`
                <a href="https://wa.me/62${waNumber}" target="_blank" class="whatsapp-btn">
                    <img src="assets/icon-whatsapp.svg" alt="WhatsApp" class="whatsapp-icon"> Chat WhatsApp
                </a>`);
        }
        if (business.website_perusahaan || business.website_usaha) {
            const websiteUrl = (business.website_perusahaan || business.website_usaha);
            const fullUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
            contactButtons.push(`
                <a href="${fullUrl}" target="_blank" class="website-btn">
                    <i class="fas fa-globe"></i> Kunjungi Website
                </a>`);
        }
        
        if (contactButtons.length > 0) {
            mainContent += `
                <div class="info-section">
                    <h3><i class="fas fa-phone"></i> Kontak Usaha</h3>
                    <div class="contact-buttons-section">
                        ${contactButtons.join('')}
                    </div>
                </div>`;
        }

        // Social media section
        mainContent += `
            <div class="info-section">
                <h3><i class="fas fa-share-alt"></i> Sosial Media</h3>
                <div class="contact-icons-section" id="social-media-icons">
                    <p>Memuat sosial media...</p>
                </div>
            </div>`;

        // Marketplace section  
        mainContent += `
            <div class="info-section">
                <h3><i class="fas fa-shopping-cart"></i> Marketplace</h3>
                <div class="contact-icons-section" id="marketplace-icons">
                    <p>Memuat marketplace...</p>
                </div>
            </div>`;

        // Share section
        mainContent += `
            <div class="info-section">
                <h3><i class="fas fa-share"></i> Bagikan</h3>
                <div class="share-buttons">
                    <a href="#" class="share-btn" onclick="shareUsaha(event)">
                        <i class="fas fa-share-alt"></i>
                        <span>Bagikan</span>
                    </a>
                    <a href="#" class="share-btn download-btn" onclick="downloadPDF(event)">
                        <i class="fas fa-download"></i>
                        <span>Download PDF</span>
                    </a>
                </div>
            </div>`;
        
        // Timestamp at bottom following detail-anggota pattern
        const postDate = business.timestamp ? new Date(business.timestamp) : new Date();
        const formattedDate = postDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long', 
            year: 'numeric'
        });
        
        mainContent += `
                <div class="info-section posting-timestamp">
                    <p class="text-xs text-gray-400">Diposting ${formattedDate}</p>
                </div>
            </div>
        `;

        // Set main content with new header layout
        detailContent.innerHTML = mainContent;
        
        // Render social media and marketplace icons
        console.log('About to render icons with timeout...');
        setTimeout(() => {
            try {
                console.log('=== STARTING ICON RENDERING ===');
                
                // Check if containers exist before rendering
                const socialContainer = document.getElementById('social-media-icons');
                const marketplaceContainer = document.getElementById('marketplace-icons');
                
                if (socialContainer) {
                    renderSocialMediaIcons(allData.sosmed_perusahaan);
                } else {
                    console.error('Social media container not found!');
                }
                
                if (marketplaceContainer) {
                    renderMarketplaceIcons(allData.olshop_perusahaan);
                } else {
                    console.error('Marketplace container not found!');
                }
            } catch (error) {
                console.error('Error rendering icons:', error);
            }
        }, 1000);

        // Business recommendations section - separate from main container, following detail-anggota pattern
        setTimeout(async () => {
            console.log('=== RECOMMENDATION RENDERING DEBUG ===');
            console.log('allData structure:', Object.keys(allData));
            console.log('allData.business exists:', !!allData.business);
            
            // Try to get all businesses data for recommendations
            if (allData && allData.business) {
                try {
                    console.log('Fetching fresh data for recommendations...');
                    // Fetch all data from script without specific business ID
                    const response = await fetch(SCRIPT_URL, { cache: 'no-cache' });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const freshData = await response.json();
                    
                    if (freshData.status === "success" && freshData.data && Array.isArray(freshData.data)) {
                        console.log('Fresh data for recommendations:', freshData.data.length, 'members');
                        renderRecommendations(freshData.data, allData.business);
                    } else {
                        console.warn('No valid data available for recommendations:', freshData);
                    }
                } catch (error) {
                    console.error('Error fetching fresh data for recommendations:', error);
                    // Don't show recommendations if fetch fails, but don't break the page
                }
            }
        }, 1500);
    }

    // Function to render social media icons
    function renderSocialMediaIcons(sosmed) {
        console.log('=== RENDER SOCIAL MEDIA ICONS START ===');
        const container = document.getElementById('social-media-icons');
        console.log('Social container found:', !!container);
        if (!container) {
            console.error('Social media container not found! Waiting for DOM...');
            // Try again after a short delay
            setTimeout(() => {
                const retryContainer = document.getElementById('social-media-icons');
                if (retryContainer) {
                    renderSocialMediaIcons(sosmed);
                } else {
                    console.error('Social media container still not found after retry!');
                }
            }, 500);
            return;
        }
        
        const socialIcons = [];
        
        if (!sosmed || !sosmed.length) {
            console.log('No social media data found');
            container.innerHTML = '<p>Tidak ada sosial media yang tersedia.</p>';
            return;
        }
        
        // Function to normalize social media platform name
        function normalizeSocialPlatform(platform) {
            if (!platform) return '';
            const normalized = platform.toLowerCase().trim()
                .replace(/\s+/g, '')  // Remove all spaces
                .replace(/_/g, '');    // Remove underscores
            
            // Known platform mappings
            const platformMap = {
                'ig': 'instagram',
                'insta': 'instagram',
                'instagram': 'instagram',
                'fb': 'facebook',
                'face': 'facebook',
                'facebook': 'facebook',
                'tt': 'tiktok',
                'tiktok': 'tiktok',
                'yt': 'youtube',
                'youtube': 'youtube'
            };
            
            // Try exact match first
            if (platformMap[normalized]) return platformMap[normalized];
            
            // Try partial match
            for (const [key, value] of Object.entries(platformMap)) {
                if (normalized.includes(key)) return value;
            }
            
            return normalized;
        }
        
        // Validate and normalize URL
        function normalizeUrl(url) {
            if (!url) return '';
            const trimmed = url.trim();
            if (!trimmed) return '';
            
            // Add https:// if no protocol specified
            if (!/^https?:\/\//i.test(trimmed)) {
                return `https://${trimmed}`;
            }
            return trimmed;
        }
        
        // Process each social media entry
        sosmed.forEach(entry => {
            const platform = normalizeSocialPlatform(entry.platform_sosmed || entry.platform || '');
            const url = normalizeUrl(entry.url_sosmed || entry.url || '');
            
            if (!platform || !url) {
                console.log('Skipping invalid social media entry:', entry);
                return;
            }
            
            // Map platform to icon file
            const iconFile = `${platform}.png`;
            const iconPath = `assets/sosmed/${iconFile}`;
            
            socialIcons.push(`
                <a href="${url}" target="_blank" rel="noopener" class="card-icon-link" title="${platform.charAt(0).toUpperCase() + platform.slice(1)}">
                    <img src="${iconPath}" alt="${platform}" class="social-icon" style="width: 32px; height: 32px;" onerror="console.log('Error loading ${platform} icon')">
                </a>
            `);
            console.log(`Added social icon for ${platform}: ${url}`);
        });

        const finalHTML = socialIcons.length > 0 ? socialIcons.join('') : '<p>Tidak ada sosial media yang tersedia.</p>';
        console.log(`=== SOCIAL MEDIA RENDER RESULT ===`);
        console.log(`Social media result: ${socialIcons.length} icons found`);
        
        container.innerHTML = finalHTML;
        console.log('Social media container after setting innerHTML:', container.innerHTML);
        console.log('=== SOCIAL MEDIA RENDER COMPLETE ===');
    }

    // Function to render marketplace icons
    function renderMarketplaceIcons(olshop) {
        console.log('=== RENDER MARKETPLACE ICONS START ===');
        const container = document.getElementById('marketplace-icons');
        console.log('Marketplace container found:', !!container);
        if (!container) {
            console.error('Marketplace container not found! Waiting for DOM...');
            // Try again after a short delay
            setTimeout(() => {
                const retryContainer = document.getElementById('marketplace-icons');
                if (retryContainer) {
                    renderMarketplaceIcons(olshop);
                } else {
                    console.error('Marketplace container still not found after retry!');
                }
            }, 500);
            return;
        }
        
        const marketplaceIcons = [];
        
        if (!olshop || !olshop.length) {
            console.log('No marketplace data found');
            container.innerHTML = '<p>Tidak ada marketplace yang tersedia.</p>';
            return;
        }
        
        // Function to normalize platform name
        function normalizePlatformName(platform) {
            if (!platform) return '';
            const normalized = platform.toLowerCase().trim()
                .replace(/\s+/g, '')  // Remove all spaces
                .replace(/_/g, '');    // Remove underscores
            
            // Known platform mappings
            const platformMap = {
                'tokped': 'tokopedia',
                'tokopedia': 'tokopedia',
                'sp': 'shopee',
                'shopee': 'shopee',
                'bl': 'bukalapak',
                'bukalapak': 'bukalapak',
                'lzd': 'lazada',
                'lazada': 'lazada',
                'blibli': 'blibli',
                'tiktokshop': 'tiktokshop',
                'tiktok': 'tiktokshop',
                'tiktokstore': 'tiktokshop',
                'instagram': 'instagram'  // Instagram as marketplace
            };
            
            // Try exact match first
            if (platformMap[normalized]) return platformMap[normalized];
            
            // Try partial match
            for (const [key, value] of Object.entries(platformMap)) {
                if (normalized.includes(key)) return value;
            }
            
            return normalized;
        }
        
        // Validate and normalize URL
        function normalizeUrl(url) {
            if (!url) return '';
            const trimmed = url.trim();
            if (!trimmed) return '';
            
            // Add https:// if no protocol specified
            if (!/^https?:\/\//i.test(trimmed)) {
                return `https://${trimmed}`;
            }
            return trimmed;
        }
        
        // Process each marketplace entry
        olshop.forEach(entry => {
            const platform = normalizePlatformName(entry.platform_olshop || entry.platform || '');
            const url = normalizeUrl(entry.url_olshop || entry.url || '');
            
            if (!platform || !url) {
                console.log('Skipping invalid marketplace entry:', entry);
                return;
            }
            
            // Map platform to icon file
            const iconFile = `${platform}.png`;
            const iconPath = `assets/marketplace/${iconFile}`;
            
            marketplaceIcons.push(`
                <a href="${url}" target="_blank" rel="noopener" class="card-icon-link marketplace-icon-link" title="${platform.charAt(0).toUpperCase() + platform.slice(1)}">
                    <img src="${iconPath}" alt="${platform}" class="marketplace-icon" style="width: 32px; height: 32px;" onerror="console.log('Error loading ${platform} icon')">
                </a>
            `);
            console.log(`Added marketplace icon for ${platform}: ${url}`);
        });

        const finalHTML = marketplaceIcons.length > 0 ? marketplaceIcons.join('') : '<p>Tidak ada marketplace yang tersedia.</p>';
        console.log(`=== MARKETPLACE RENDER RESULT ===`);
        console.log(`Marketplace result: ${marketplaceIcons.length} icons found`);
        
        container.innerHTML = finalHTML;
        console.log('Marketplace container after setting innerHTML:', container.innerHTML);
        console.log('=== MARKETPLACE RENDER COMPLETE ===');
    }

    // Helper functions (breadcrumb, share, download PDF)
    function renderBreadcrumb(business) {
        const breadcrumbContainer = document.getElementById('breadcrumb');
        if (breadcrumbContainer) {
            breadcrumbContainer.innerHTML = `
                <a href="index.html">Beranda</a> > 
                <a href="index.html#daftar-usaha">Daftar Usaha</a> > 
                <span>${business.nama_usaha || 'Detail Usaha'}</span>
            `;
        }
    }

    function shareUsaha(event) {
        event.preventDefault();
        const business = JSON.parse(sessionStorage.getItem('currentBusiness') || '{}');
        const shareData = {
            title: business.nama_usaha || 'Detail Usaha',
            text: `${business.nama_usaha || 'Detail Usaha'} - ${business.detail_usaha || 'Lihat detail usaha ini'}`,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData).catch(err => console.log('Error sharing:', err));
        } else {
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Link berhasil disalin ke clipboard!');
            }).catch(err => {
                console.error('Failed to copy: ', err);
                alert('Gagal menyalin link. Silakan salin manual: ' + window.location.href);
            });
        }
    }

    function downloadPDF(event) {
        event.preventDefault();
        window.print();
    }

    // Error handler
    function handleError(error) {
        console.error('Error in detail-usaha:', error);
        let message = error.message || 'Terjadi kesalahan. Silakan coba lagi.';
        
        if (message.includes('Business not found')) {
            message = `Detail usaha dengan ID ${businessId} tidak ditemukan. Mohon periksa kembali ID usaha yang dimasukkan.`;
        } else if (message.includes('Failed to fetch')) {
            message = 'Gagal terhubung ke server. Mohon periksa koneksi internet Anda dan coba lagi.';
        }
        
        detailContent.innerHTML = `
            <div class="error-container">
                <p class="error-message">
                    ${message}
                </p>
                <p class="error-help">
                    <a href="index.html">Kembali ke halaman utama</a>
                </p>
            </div>
        `;
    }

        // Main initialization
    document.addEventListener('DOMContentLoaded', async () => {
        detailContent = document.getElementById('detail-content');
        
        const qid = new URLSearchParams(location.search).get('id');
        businessId = qid;
        
        console.log('=== INITIALIZATION DEBUG ===');
        console.log('URL:', location.search);
        console.log('Business ID (qid):', qid);
        
        if (!qid) {
            handleError(new Error('ID Usaha tidak ditemukan di URL. Contoh URL yang benar: detail-usaha.html?id=USH-30'));
            return;
        }

        try {
            console.log('Starting data fetch for business ID:', qid);
            
            // Get specific business data
            const businessData = await fetchAllData(qid);
            console.log('Business data received:', !!businessData);
            
            if (!businessData || !businessData.business) {
                throw new Error(`Detail usaha dengan ID ${qid} tidak ditemukan.`);
            }
            
            // Render detail with specific business data
            console.log('Rendering business detail...');
            renderDetail(businessData);
            
        } catch (error) {
            console.error('Error in main initialization:', error);
            handleError(error);
        }
    }); 
