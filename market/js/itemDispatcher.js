// 📦 itemDispatcher.js
// Handles item selection, triggers order/history/chart updates

import { appState, APP_CONFIG } from './marketConfig.js';
import { updateItemDetails } from './itemViewer.js';
import { fetchMarketOrders } from './marketTables.js';
import { fetchMarketHistory, drawHistoryChart, setHistoryViewActive } from './itemPriceHistory.js';
import { RegionSelector } from '../../globals/js/regionSelector.js';

export async function handleItemSelection(typeID) {
    console.log('[Dispatcher] View Mode:', appState.activeView);
    console.log('[Dispatcher] Selected:', typeID);

    if (!typeID || typeof typeID !== 'number') return;

    appState.selectedItemId = typeID;
    const itemData = appState.flatItemList.find(item => item.type_id === typeID);
    if (!itemData) return;

    // ⏳ Update UI fields
    updateItemDetails(itemData);

    const marketTables = document.querySelector('.market-tables');
    const historyChart = document.querySelector('.market-history');

    const regionID = RegionSelector.getRegionID() ?? APP_CONFIG.DEFAULT_REGION_ID;
    const regionName = RegionSelector.getRegionSummary().region ?? 'all';

    if (appState.activeView === 'history') {
        // ⏫ View-state and DOM update
        setHistoryViewActive(true, regionID, typeID);
        marketTables?.classList.remove('.hidden');
        historyChart?.classList.add('.hidden');

        // 📡 Fetch + Render
        try {
            await fetchMarketHistory(typeID, regionID);
            drawHistoryChart(typeID);
        } catch (err) {
            console.warn('❌ Failed to fetch/render price history:', err);
        }

    } else {
        // ⏫ Show market tables
        marketTables?.classList.add('.hidden');
        historyChart?.classList.remove('.hidden');

        try {
            await fetchMarketOrders(typeID, regionName);
        } catch (err) {
            console.warn('❌ Failed to fetch market orders:', err);
        }
    }
}