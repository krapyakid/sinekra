document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Logic
    const menuTrigger = document.getElementById('mobile-menu-trigger');
    const mainNav = document.getElementById('main-nav');

    if (menuTrigger && mainNav) {
        menuTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            mainNav.classList.toggle('show-mobile');
        });

        // Close the menu if clicked outside
        window.addEventListener('click', function(e) {
            if (mainNav.classList.contains('show-mobile') && !mainNav.contains(e.target) && e.target !== menuTrigger) {
                mainNav.classList.remove('show-mobile');
            }
        });

        // Close menu when a link is clicked
        mainNav.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                mainNav.classList.remove('show-mobile');
            }
        });
    }
}); 
