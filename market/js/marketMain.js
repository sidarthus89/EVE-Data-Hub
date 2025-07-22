import { APP_CONFIG, appState, elements } from './marketConfig.js';
import { handleItemSelection } from './itemDispatcher.js';
import { cacheElements } from './marketUtilities.js';
import { loadLocations, loadMarket } from './marketLoader.js';
import { loadTickerData } from './marketTicker.js';
import { fetchMarketOrders } from './marketRenderer.js';
import { initializeMarketMenu } from './marketTree.js';
import { setupEventListeners } from './sidebarToggle.js';
import { renderQuickbar } from './marketQuickbar.js';
import { initializeSearch } from './marketSearch.js';
import { setHistoryViewActive, fetchMarketHistory, renderHistoryView } from './itemPriceHistory.js';
import { renderScopedHistoryChart } from './historyChart_Slider.js';
import { RegionSelector } from '../../globals/js/regionSelector.js';
import { buildLocationMaps } from './marketUtilities.js';

async function initializeMarketData() {
    try {
        await Promise.all([
            loadLocations(),
            loadMarket()
        ]);
    } catch (err) {
        console.error("❌ Failed to initialize market data:", err);
        throw err;
    }
}

window.appState = appState;
window.APP_CONFIG = APP_CONFIG;
window.handleItemSelection = handleItemSelection;

document.addEventListener('DOMContentLoaded', async () => {
    appState.activeView = 'market';

    try {
        cacheElements();
        window.elements = elements;

        await initializeMarketData();

        if (!appState.market || typeof appState.market !== 'object') {
            throw new Error("❌ appState.market is undefined or malformed");
        }


        appState.flatItemList = extractItemList(appState.market);
        appState.selectedTypeID = null;
        localStorage.removeItem('selectedTypeID');

        initializeAppUI();

        await loadTickerData();

        const marketLink = document.getElementById('viewMarketLink');
        const historyLink = document.getElementById('viewHistoryLink');
        const underline = document.querySelector('.tab-underline');

        marketLink.addEventListener('click', e => {
            e.preventDefault();
            activateTab(marketLink);
            setHistoryViewActive(false);
        });

        historyLink.addEventListener('click', e => {
            e.preventDefault();
            activateTab(historyLink);
            renderHistoryView();
        });

        requestAnimationFrame(() => {
            const activeTab = document.querySelector('.market-link.active');
            if (activeTab) {
                animateUnderline(activeTab);
            } else {
                console.warn('[Tab Init] No active tab found for underline.');
            }
        });

    } catch (err) {
        console.error('Initialization failed:', err);
    }
});

function animateUnderline(targetLink) {
    const parent = targetLink.parentElement;
    const linkRect = targetLink.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    const offsetLeft = linkRect.left - parentRect.left;
    const width = linkRect.width;

    underline.style.width = `${width}px`;
    underline.style.transform = `translateX(${offsetLeft}px)`;
}

function activateTab(tab) {
    marketLink.classList.remove('active');
    historyLink.classList.remove('active');
    tab.classList.add('active');
    animateUnderline(tab);
}

function extractItemList(menu) {
    const items = [];
    function walk(node) {
        for (const [key, value] of Object.entries(node)) {
            if (key === '_info') continue;
            if (Array.isArray(value)) {
                items.push(...value);
            } else if (typeof value === 'object' && value !== null) {
                walk(value);
            }
        }
    }
    walk(menu);
    return items.map(i => ({
        type_id: Number(i.typeID),
        name: i.typeName
    }));
}

function initializeAppUI() {
    RegionSelector.initializeDropdown();
    initializeMarketMenu();
    renderQuickbar(false);
    setupEventListeners();
    initializeSearch();
}

function refreshOrders() {
    const typeID = appState.selectedTypeID;
    const regionName = RegionSelector.getRegionSummary().region || 'all';
    if (typeID) {
        fetchMarketOrders(typeID, regionName);
    }
}
