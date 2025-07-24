
import { APP_CONFIG, appState, elements } from '../marketCore/marketConfig.js';
import { renderGroup } from '../marketUI/marketTreeUI.js';
import { fetchMarketOrders } from '../../../globals/js/esiAPI.js';
import { handleItemSelection } from '../marketLogic/itemDispatcher.js';
import { cacheElements } from '../marketCore/marketCache.js';
import { buildLocationMaps } from '../../../globals/js/locationUtils.js';
import { loadStaticData } from '../marketLogic/marketSidebarLogic.js';

/* Sidebar Imports*/
import { loadMarket, loadLocations } from '../marketLogic/marketSidebarLogic.js';
import { renderQuickbar } from '../marketUI/marketSidebarUI.js';
import { regionSelector } from '../../../globals/js/regionSelector.js';
import { initializeSearch } from '../marketLogic/marketSearchLogic.js';
import { initializeMarketMenu } from '../marketLogic/marketTreeLogic.js';
import { toggleSidebarView } from '../marketCore/marketViewManager.js';

/* Ticker Imports*/
import { loadTickerData } from '../marketLogic/marketTickerLogic.js';


/* Table/Chart Imports*/
import { fetchMarketHistory } from '../marketLogic/marketHistoryLogic.js';
import { renderHistoryView, renderScopedHistoryChart } from '../marketUI/marketHistoryUI.js';

export async function initializeMarketData() {
    try {
        console.log("🧊 Initializing static market & location data...");
        await Promise.all([
            loadLocations(),                        // e.g., appState.regionMap
            loadStaticData(APP_CONFIG.MARKET_FILE, 'market') // sets appState.market
        ]);

        if (!appState.market || typeof appState.market !== 'object') {
            throw new Error("❌ appState.market is missing or malformed");
        }

        console.log("✅ Market data loaded:", Object.keys(appState.market).length, "top-level groups");

    } catch (err) {
        console.error("🚨 Failed to initialize market data:", err);
        throw err; // bubble it to the DOMContentLoaded handler
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

        const tabs = document.querySelectorAll('.market-link');
        tabs.forEach(tab => {
            tab.addEventListener('click', e => {
                e.preventDefault();
                activateTab(tab);

                if (tab.id === 'viewMarketLink') {
                    setHistoryViewActive(false);
                } else if (tab.id === 'viewHistoryLink') {
                    renderHistoryView();
                }
            });
        });

        // Position the underline under the default active tab
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
    const underline = document.querySelector('.tab-underline');
    if (!underline || !targetLink) return;

    const parent = targetLink.parentElement;
    const linkRect = targetLink.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    const offsetLeft = linkRect.left - parentRect.left;
    const width = linkRect.width;

    underline.style.width = `${width}px`;
    underline.style.transform = `translateX(${offsetLeft}px)`;
}


function activateTab(clickedTab) {
    const tabs = document.querySelectorAll('.market-link');
    tabs.forEach(tab => tab.classList.remove('active'));

    clickedTab.classList.add('active');
    animateUnderline(clickedTab);

    const isMarketTab = clickedTab.id === 'viewMarketLink';
    document.querySelector('#itemPriceTables').style.display = isMarketTab ? 'block' : 'none';
    document.querySelector('#itemHistorySection').style.display = isMarketTab ? 'none' : 'block';

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
    regionSelector.initializeDropdown();
    initializeMarketMenu();
    renderQuickbar(false);
    toggleSidebarView();
    initializeSearch();
}

function refreshOrders() {
    const typeID = appState.selectedTypeID;
    const regionName = regionSelector.getRegionSummary().region || 'all';
    if (typeID) {
        fetchMarketOrders(typeID, regionName);
    }
}

window.animateUnderline = animateUnderline;
