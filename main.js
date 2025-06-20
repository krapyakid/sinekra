 document.addEventListener('DOMContentLoaded', function() {
    // Kebab Menu Logic
    const menuToggle = document.getElementById('menu-toggle');
    const kebabMenu = document.getElementById('kebab-menu');

    if (menuToggle && kebabMenu) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent click from bubbling up to the window
            kebabMenu.classList.toggle('show');
        });

        // Close the menu if clicked outside
        window.addEventListener('click', function(e) {
            if (kebabMenu.classList.contains('show') && !kebabMenu.contains(e.target) && e.target !== menuToggle) {
                kebabMenu.classList.remove('show');
            }
        });
    }
}); 
