// 🎛️ marketViewManager.js
// Handles all toggling options on the market-search.hml (Market/Quickbar and Market Orders/Price History)

import { fetchMarketOrders } from '/globals/js/esiAPi.js';
import { renderOrderTables, clearTables } from '../marketUI/marketOrdersUI.js';

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

        renderQuickbar(true);
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

export async function selectItem(item) {
    if (!item?.type_id) return;

    appState.selectedItem = item;
    appState.activeView = 'market';

    clearTables();
    setMarketViewVisible();

    try {
        const { sellOrders, buyOrders } = await fetchMarketOrders(item.type_id);
        renderOrderTables(item.type_id, sellOrders, buyOrders);
    } catch (err) {
        console.error(`Failed to fetch market orders for ${item.type_id}:`, err);

        const sellersTable = document.querySelector('#sellersTable tbody');
        const buyersTable = document.querySelector('#buyersTable tbody');

        if (sellersTable) sellersTable.innerHTML = `<tr><td colspan="7">Error loading seller data.</td></tr>`;
        if (buyersTable) buyersTable.innerHTML = `<tr><td colspan="8">Error loading buyer data.</td></tr>`;
    }
}