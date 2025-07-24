// cookieConsent.js

document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit or use MutationObserver to ensure injection is done
    const checkBannerInterval = setInterval(() => {
        const banner = document.getElementById('cookieConsent');
        const acceptBtn = document.getElementById('acceptCookies');
        const rejectBtn = document.getElementById('rejectCookies'); // if you're using one

        if (banner && acceptBtn) {
            clearInterval(checkBannerInterval); // Stop checking

            if (!localStorage.getItem('cookiesDecision')) {
                banner.classList.add('visible-banner');
            }

            acceptBtn.addEventListener('click', () => {
                localStorage.setItem('cookiesDecision', 'accepted');
                banner.classList.remove('visible-banner');
            });

            rejectBtn?.addEventListener('click', () => {
                localStorage.setItem('cookiesDecision', 'rejected');
                banner.classList.remove('visible-banner');
            });
        }
    }, 50); // Adjust timing if needed
});
