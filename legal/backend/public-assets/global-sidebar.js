document.addEventListener('DOMContentLoaded', () => {
    console.log('Global Sidebar script initializing...');

    // Function to initialize sidebar logic after HTML is injected
    const initSidebarLogic = () => {
        const sidebar = document.getElementById('sidebar');
        const btnMenu = document.getElementById('btnMenu'); // Mobile toggle button on page
        const gsToggle = document.getElementById('gsToggle'); // Toggle button inside sidebar

        if (!sidebar) {
            console.warn('Sidebar element not found!');
            return;
        }

        // Toggle function
        const toggleSidebar = (e) => {
            if (e) e.preventDefault();
            sidebar.classList.toggle('open');
            document.body.classList.toggle('sidebar-open');
        };

        // Event Listeners
        if (btnMenu) {
            btnMenu.addEventListener('click', toggleSidebar);
            console.log('Mobile menu button attached');
        }

        if (gsToggle) {
            gsToggle.addEventListener('click', toggleSidebar);
        }
    };

    // Load sidebar.html
    // We try multiple paths to be robust
    const paths = [
        '/legal/assets/sidebar.html',
        './assets/sidebar.html',
        '../assets/sidebar.html',
        '/assets/sidebar.html'
    ];

    const loadSidebar = async () => {
        for (const path of paths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    const html = await response.text();
                    
                    // Check if sidebar already exists
                    if (document.getElementById('sidebar')) return;

                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    
                    const sidebarElement = tempDiv.querySelector('aside');
                    if (sidebarElement) {
                        document.body.insertBefore(sidebarElement, document.body.firstChild);
                        console.log(`Sidebar loaded from ${path}`);
                        initSidebarLogic();
                        return; // Success
                    }
                }
            } catch (e) {
                // Continue to next path
            }
        }
        console.error('Failed to load sidebar from any path');
    };

    loadSidebar();
});
