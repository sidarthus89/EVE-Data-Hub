// 🧭 Market Globals
import { APP_CONFIG, appState, elements } from './marketConfig.js';
import { handleItemSelection } from './itemDispatcher.js';
import { cacheElements } from './marketUtilities.js';

// 🧱 Initial Loaders
import { loadLocations, loadStations, loadMarketMenu } from './marketDataFetcher.js';
import { loadTickerData } from './marketTicker.js';

// 📦 UI & Interaction Modules
import { initializeDropdowns, handleRegionChange, handleConstellationChange } from './locationSelector.js';
import { initializeMarketMenu } from './marketTree.js';
import { setupEventListeners } from './marketEvents.js';
import { renderQuickbar } from './marketQuickbar.js';
import { initializeSearch } from './marketSearch.js';
import { setHistoryViewActive, fetchMarketHistory } from './itemPriceHistory.js';
import { renderScopedHistoryChart, setupSliderChartSync, renderNavigatorChart, initializeDualRangeSlider } from './historyChart_Slider.js';

// 🌐 Expose API Globals
window.appState = appState;
window.APP_CONFIG = APP_CONFIG;
window.handleItemSelection = handleItemSelection;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 🌎 Cache DOM Elements
        cacheElements();

        // 🌐 Load Region & Market Data
        await Promise.all([
            loadLocations(),
            loadStations(),
            loadMarketMenu()
        ]);

        // 🧹 Flatten Market Tree for Search Index
        appState.flatItemList = extractItemList(appState.marketMenu);
        appState.selectedTypeID = null;
        localStorage.removeItem('selectedTypeID');

        // 🎛️ Initialize UI Components
        initializeDropdowns();
        initializeMarketMenu();
        renderQuickbar(false);
        setupEventListeners();
        initializeSearch();

        // 🔧 Initialize Dual Range Slider
        const chartSlider = initializeDualRangeSlider({
            min: 0,
            max: 365,
            leftValue: 0,
            rightValue: 30,
            onChange: (values) => {
                console.log('Slider changed:', values);
                window.chartSlider = chartSlider;
                if (appState.selectedTypeID) renderScopedHistoryChart(appState.selectedTypeID);
            }
        });
        window.chartSlider = chartSlider;

        // 📈 Initial Ticker Load
        await loadTickerData();

        // 🌐 Region & Constellation Dropdown Hooks
        elements.regionSelector.addEventListener('change', async e => {
            const selectedRegionID = parseInt(e.target.value, 10);
            await loadTickerData(selectedRegionID || null, true);
            handleRegionChange();
        });

        elements.constellationSelector.addEventListener('change', handleConstellationChange);

        // 🖱️ History/Market Tab Switching
        elements.viewMarketBtn?.addEventListener('click', () => {
            setHistoryViewActive(false);
        });

        elements.viewHistoryBtn?.addEventListener('click', async () => {
            setHistoryViewActive(true);
            const typeID = appState.selectedTypeID;
            const regionID = appState.selectedRegionID || 'all';
            if (typeID) {
                await fetchMarketHistory(typeID, regionID);
                renderNavigatorChart(typeID);
                renderScopedHistoryChart(typeID);
                setupSliderChartSync(typeID);
            }
        });

    } catch (err) {
        console.error('Initialization failed:', err);
    }
});

// 🧠 Utility: Flatten Market Tree
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
        type_id: i.typeID,
        name: i.typeName
    }));
}