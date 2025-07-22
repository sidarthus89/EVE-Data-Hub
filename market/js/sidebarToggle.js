// ⚙️ marketEvents.js
// Handles tab toggle behavior between Market view and Quickbar view

import { renderQuickbar } from './marketQuickbar.js';

export function setupEventListeners() {
    const marketTab = document.getElementById('marketTab');
    const quickbarTab = document.getElementById('quickbarTab');
    const menuList = document.getElementById('menuList');
    const quickbarList = document.getElementById('quickbarList');

    if (!marketTab || !quickbarTab || !menuList || !quickbarList) return;

    marketTab.addEventListener('click', () => {
        marketTab.classList.add('active');
        quickbarTab.classList.remove('active');

        menuList.style.display = 'block';
        quickbarList.style.display = 'none';
    });

    quickbarTab.addEventListener('click', () => {
        quickbarTab.classList.add('active');
        marketTab.classList.remove('active');

        menuList.style.display = 'none';
        quickbarList.style.display = 'block';

        renderQuickbar(true); // Re-render on tab switch
    });
}