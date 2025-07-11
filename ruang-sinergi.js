// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC1PVKYzkw0kBBXZA3EqxJxSB3vQXcUkXE",
    authDomain: "sinergi-krapyak.firebaseapp.com",
    projectId: "sinergi-krapyak",
    storageBucket: "sinergi-krapyak.appspot.com",
    messagingSenderId: "85713341397",
    appId: "1:85713341397:web:c2c8e8a54f740e6d2c5e5a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mobile Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    const burgerMenuTrigger = document.getElementById('burger-menu-trigger');
    const mainNav = document.getElementById('main-nav');
    const menuOverlay = document.getElementById('menu-overlay');
    const navCloseBtn = document.getElementById('nav-close-btn');

    function toggleMenu() {
        mainNav.classList.toggle('active');
        menuOverlay.classList.toggle('active');
    }

    burgerMenuTrigger.addEventListener('click', toggleMenu);
    menuOverlay.addEventListener('click', toggleMenu);
    navCloseBtn.addEventListener('click', toggleMenu);

    // Handle tab switching
    const switchButtons = document.querySelectorAll('.switch-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    let peluangLoaded = false;

    switchButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update button states
            switchButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update tab visibility
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === tabId) {
                    pane.classList.add('active');
                    // Load peluang data if peluang tab is selected and not loaded yet
                    if (tabId === 'peluang' && !peluangLoaded) {
                        loadPeluangList();
                        peluangLoaded = true;
                    }
                }
            });
        });
    });

    // Load peluang data if it's the active tab on page load
    const activeTab = document.querySelector('.switch-button.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'peluang') {
        loadPeluangList();
        peluangLoaded = true;
    }
});

// Function to load peluang list
async function loadPeluangList() {
    try {
        const peluangList = document.getElementById('peluangList');
        peluangList.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

        const querySnapshot = await getDocs(collection(db, "usaha_anggota"));
        const peluangItems = new Set(); // Using Set to store unique values

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.prospek_kerjasama_penawaran) {
                // Split by commas and trim whitespace
                const prospects = data.prospek_kerjasama_penawaran.split(',').map(item => item.trim());
                prospects.forEach(prospect => {
                    if (prospect) { // Only add non-empty prospects
                        peluangItems.add(prospect);
                    }
                });
            }
        });

        // Clear loading spinner
        peluangList.innerHTML = '';

        // Convert Set to Array, sort alphabetically, and create list items
        Array.from(peluangItems)
            .sort((a, b) => a.localeCompare(b, 'id'))
            .forEach(item => {
                const listItem = document.createElement('a');
                listItem.href = '#';
                listItem.className = 'list-group-item list-group-item-action';
                listItem.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-1">${item}</h5>
                        <span class="badge bg-primary rounded-pill">Peluang</span>
                    </div>
                `;
                peluangList.appendChild(listItem);
            });

        // Show message if no items found
        if (peluangItems.size === 0) {
            peluangList.innerHTML = '<div class="alert alert-info">Tidak ada peluang kerjasama yang tersedia saat ini.</div>';
        }

    } catch (error) {
        console.error("Error loading peluang list:", error);
        document.getElementById('peluangList').innerHTML = '<div class="alert alert-danger">Terjadi kesalahan saat memuat data. Silakan coba lagi nanti.</div>';
    }
} 
