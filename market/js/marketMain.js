// 🧭 Market Configuration & Global Access
import { APP_CONFIG, appState, elements } from './marketConfig.js';
import { handleItemSelection } from './itemDispatcher.js';
window.APP_CONFIG = APP_CONFIG;
window.handleItemSelection = handleItemSelection;

// 🧱 DOM Caching & Initial Setup
import { cacheElements } from './marketUtilities.js';
import { loadLocations, loadStations, loadMarketMenu } from './marketDataFetcher.js';
import { loadTickerData } from './marketTicker.js';

// 📦 UI Modules & Components
import {
    initializeDropdowns,
    handleRegionChange,
    handleConstellationChange
} from './locationSelector.js';
import { initializeMarketMenu } from './marketTree.js';
import { setupEventListeners } from './marketEvents.js';
import { renderQuickbar } from './marketQuickbar.js';
import { restorePreviousSelection } from './marketPersistence.js';
import { initializeSearch } from './marketSearch.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        loadTickerData()

        cacheElements();

        await Promise.all([
            loadLocations(),
            loadStations(),
            loadMarketMenu()
        ]);

        initializeDropdowns();
        initializeMarketMenu();

        renderQuickbar(false);
        setupEventListeners();
        initializeSearch();

        await loadTickerData();
        elements.regionSelector.addEventListener('change', async e => {
            const selectedRegionID = parseInt(e.target.value, 10);
            await loadTickerData(selectedRegionID || null, true);
            handleRegionChange(); // 🛠 triggers constellation dropdown
        });

        elements.constellationSelector.addEventListener('change', handleConstellationChange);

        restorePreviousSelection();
    } catch (error) {
        console.error("Failed to initialize app:", error);
    }
});