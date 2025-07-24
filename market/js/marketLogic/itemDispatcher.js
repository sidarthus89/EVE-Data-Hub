// 🧩 itemDispatcher.js
// Handles user selection of a market item and manages data fetching and view rendering.

import { regionSelector } from '../../../globals/js/regionSelector.js';
import { fetchMarketOrders } from './marketOrdersLogic.js';
import { fetchMarketHistory } from '../marketLogic/marketHistoryLogic.js';
import { renderScopedHistoryChart } from '../marketUI/marketHistoryUI.js';
import { renderItemViewer } from '../marketUI/itemViewerUI.js';
import { setMarketViewVisible, setHistoryViewVisible } from '../marketCore/marketViewManager.js';
import { APP_CONFIG, appState } from '../marketCore/marketConfig.js';
import { renderOrderTables } from '../marketUI/marketOrdersUI.js'; // adjust path if needed



/**
 * Handles selection of an item in the market menu.
 * Loads market data, history, and toggles appropriate UI views.
 * @param {number|string} typeID - The typeID of the selected item
 */
export async function handleItemSelection(typeID) {
    typeID = Number(typeID);
    if (!typeID || isNaN(typeID)) {
        console.warn("[ItemSelection] Invalid or missing typeID:", typeID);
        return;
    }

    const itemData = appState.flatItemList.find(item => Number(item.type_id) === typeID);
    if (!itemData) {
        console.warn("[ItemSelection] Item not found in flatItemList:", typeID);
        return;
    }
    const regionID = regionSelector.getRegionID() ?? APP_CONFIG.DEFAULT_REGION_ID;
    const regionName = regionSelector.getRegionSummary().region ?? 'all';

    appState.selectedTypeID = typeID;
    appState.selectedItemData = itemData;

    document.getElementById("itemViewerHeader")?.classList.remove("hidden");
    document.getElementById("itemViewerSection")?.classList.remove("hidden");

    renderItemViewer(itemData, regionID);

    if (appState.activeView === 'history') {
        setHistoryViewVisible();

        try {
            await fetchMarketHistory(typeID, regionID);
            renderScopedHistoryChart(regionID, typeID);
        } catch (err) {
            console.warn('❌ Failed to fetch/render price history:', err);
        }

    } else {
        setMarketViewVisible();

        try {
            const { buyOrders, sellOrders } = await fetchMarketOrders(typeID, regionID);
            renderOrderTables(typeID, sellOrders, buyOrders);
        } catch (err) {
            console.warn('❌ Failed to fetch market orders:', err);
        }


        const activeTab = document.querySelector('.market-link.active');
        if (activeTab && window.animateUnderline) {
            requestAnimationFrame(() => window.animateUnderline(activeTab));
        }
    }

}

regionSelector.onLocationChange(({ regionID }) => {
    const itemData = appState.selectedItemData;
    const typeID = appState.selectedTypeID;

    if (!typeID || !itemData) return;

    if (appState.activeView === 'history') {
        setHistoryViewVisible();
        fetchMarketHistory(typeID, regionID)
            .then(() => renderScopedHistoryChart(regionID, typeID))
            .catch(err => console.warn('[❌ History fetch failed]', err));
    } else {
        setMarketViewVisible();
        fetchMarketOrders(typeID, regionID)
            .then(({ buyOrders, sellOrders }) => {
                renderItemViewer(itemData, regionID);
                renderOrderTables(typeID, sellOrders, buyOrders);
            })
            .catch(err => console.warn('[❌ Order fetch failed on region change]', err));
    }
});
