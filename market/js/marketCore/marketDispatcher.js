// 🧩 marketDispatcher.js
// Handles user selection of a market item and manages data fetching and view rendering.

import { regionSelector } from '../../../globals/js/regionSelector.js';
import { fetchMarketOrders } from '../marketLogic/marketOrdersLogic.js';
import { fetchMarketHistory } from '../marketLogic/marketHistoryLogic.js';
import { renderScopedHistoryChart } from '../marketUI/marketHistoryUI.js';
import { renderItemViewer } from '../marketUI/itemViewerUI.js';
import { setMarketViewVisible, setHistoryViewVisible } from './marketViewManager.js';
import { APP_CONFIG, appState } from './marketConfig.js';
import { renderOrderTables } from '../marketUI/marketOrdersUI.js';

let lastRenderedTypeID = null;

export async function loadItemView(input, overrideRegion, forceRefresh = false) {
    const item = typeof input === 'object' ? input : appState.flatItemList.find(i => Number(i.type_id) === Number(input));
    const typeID = Number(item?.type_id);
    if (!typeID || !item) {
        console.warn("[ItemView] Invalid item input:", input);
        return;
    }

    const regionID = overrideRegion?.regionID ?? regionSelector.getRegionID() ?? APP_CONFIG.DEFAULT_REGION_ID;
    const regionName = overrideRegion?.regionName ?? regionSelector.getRegionSummary().region ?? 'all';

    const isSameItem = typeID === lastRenderedTypeID;
    if (isSameItem && !forceRefresh) {
        console.log('[ItemView] Skipping re-render for same item');
        return;
    }

    // Update global state
    appState.selectedTypeID = typeID;
    appState.selectedItemData = item;
    lastRenderedTypeID = typeID;

    // Make viewer visible and set header
    document.getElementById("itemViewerHeader")?.classList.remove("hidden");
    document.getElementById("itemViewerSection")?.classList.remove("hidden");
    document.getElementById("itemName").textContent = item.name ?? "Unnamed Item";

    await renderItemBundle(item, regionID);
}

async function renderItemBundle(item, regionID) {
    const typeID = Number(item?.type_id);
    renderItemViewer(item, regionID);

    if (appState.activeView === 'history') {
        setHistoryViewVisible();
        try {
            await fetchMarketHistory(typeID, regionID);
            renderScopedHistoryChart(regionID, typeID);
        } catch (err) {
            console.warn('[❌ History fetch failed]', err);
        }
    } else {
        setMarketViewVisible();
        try {
            const { buyOrders, sellOrders } = await fetchMarketOrders(typeID, regionID);
            renderOrderTables(typeID, sellOrders, buyOrders);
        } catch (err) {
            console.warn('[❌ Order fetch failed]', err);
        }

        const activeTab = document.querySelector('.market-link.active');
        if (activeTab && window.animateUnderline) {
            requestAnimationFrame(() => window.animateUnderline(activeTab));
        }
    }
}

regionSelector.onLocationChange(({ regionID }) => {
    const item = appState.selectedItemData;
    if (!item?.type_id) return;

    renderItemBundle(item, regionID);
});
