document.addEventListener('DOMContentLoaded', () => {
    console.log('Global Sidebar script loaded');
    // Attempt to load sidebar.html if it exists
    fetch('./assets/sidebar.html')
        .then(response => {
            if (!response.ok) throw new Error('Sidebar HTML not found');
            return response.text();
        })
        .then(html => {
            // Inject sidebar into the page
            // Assuming the sidebar should be at the start of body or specific container
            // For now, let's append it or try to find a container
            const sidebarContainer = document.createElement('div');
            sidebarContainer.innerHTML = html;
            document.body.insertBefore(sidebarContainer, document.body.firstChild);
            
            // Re-initialize any sidebar logic (e.g., toggles)
            const btnMenu = document.getElementById('btnMenu');
            if (btnMenu) {
                btnMenu.addEventListener('click', () => {
                    // Toggle logic here if needed
                    console.log('Menu clicked');
                });
            }
        })
        .catch(err => console.warn('Sidebar failed to load:', err));
});
