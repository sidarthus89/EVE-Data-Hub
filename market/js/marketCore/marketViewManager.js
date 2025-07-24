// 🎛️ marketViewManager.js
// Handles all toggling options on the market-search.hml (Market/Quickbar and Market Orders/Price History)

export function setMarketViewVisible() {
    document.querySelector('.market-tables')?.classList.remove("hidden");
    document.querySelector('.market-history')?.classList.add("hidden");
}

export function setHistoryViewVisible() {
    document.querySelector('.market-tables')?.classList.add("hidden");
    document.querySelector('.market-history')?.classList.remove("hidden");
}

import { renderQuickbar } from '../marketUI/marketSidebarUI.js';

export function toggleSidebarView() {
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

export function toggleMarketView() {
    const marketPanel = document.getElementById('itemPriceTables');
    const historyPanel = document.getElementById('itemHistorySection');

    if (appState.activeView === 'market') {
        marketPanel?.classList.remove("hidden");
        historyPanel?.classList.add("hidden");
    } else if (appState.activeView === 'history') {
        marketPanel?.classList.add("hidden");
        historyPanel?.classList.remove("hidden");
    }
}
