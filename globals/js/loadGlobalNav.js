// loadGlobalNav.js

(function () {
    const LAYOUT_PATH = 'globals/globalNav.html';
    const LAYOUT_CONTAINER_ID = 'layoutContainer'; // this holds both nav + footer

    const layoutTarget = document.getElementById(LAYOUT_CONTAINER_ID);
    if (!layoutTarget) return;

    fetch(LAYOUT_PATH)
        .then(res => res.ok ? res.text() : Promise.reject('Layout fragment not found'))
        .then(html => {
            layoutTarget.innerHTML = html;

            // Optional: highlight active nav item
            const currentPage = (window.location.pathname.split('/').pop().split('.')[0] || 'index').toLowerCase();
            const navLinks = layoutTarget.querySelectorAll('a[data-page]');
            navLinks.forEach(link => {
                const pageId = link.dataset.page?.toLowerCase();
                if (pageId === currentPage) {
                    link.classList.add('active-nav');
                }
            });
        })
        .catch(err => {
            console.error('Failed to load global layout:', err);
        });
})();