import { RegionSelector } from '../../globals/js/regionSelector.js';
import { fetchMarketOrders } from './marketRenderer.js';
import { renderItemViewer } from './itemViewer.js';
import { fetchMarketHistory, setHistoryViewActive } from './itemPriceHistory.js';
import { renderScopedHistoryChart } from './historyChart_Slider.js';
import { renderHistoryView } from './itemPriceHistory.js'

export async function handleItemSelection(typeID) {
    typeID = Number(typeID);
    if (!typeID || typeof typeID !== 'number') return;

    const itemData = appState.flatItemList.find(item => Number(item.type_id) === typeID);

    if (!itemData) return;

    const regionID = RegionSelector.getRegionID() ?? APP_CONFIG.DEFAULT_REGION_ID;
    const regionName = RegionSelector.getRegionSummary().region ?? 'all';

    appState.selectedTypeID = typeID;
    appState.selectedItemData = itemData;

    document.getElementById("itemViewerHeader")?.classList.remove("hidden");
    document.getElementById("itemViewerSection")?.classList.remove("hidden");

    renderItemViewer(itemData, regionID);

    const marketTables = document.querySelector('.market-tables');
    const historyChart = document.querySelector('.market-history');


    if (appState.activeView === 'history') {
        marketTables?.classList.add("hidden");
        document.querySelector('.market-history')?.classList.add("hidden");
        historyChart?.classList.remove("hidden"); //optional

        setHistoryViewActive(true, regionID, typeID);

        try {
            await fetchMarketHistory(typeID, regionID);
            renderScopedHistoryChart(regionID, typeID);

        } catch (err) {
            console.warn('❌ Failed to fetch/render price history:', err);
        }

    } else {
        marketTables?.classList.remove("hidden");
        historyChart?.classList.add("hidden");

        try {
            await fetchMarketOrders(typeID, regionName);
        } catch (err) {
            console.warn('❌ Failed to fetch market orders:', err);
        }
    }
}
