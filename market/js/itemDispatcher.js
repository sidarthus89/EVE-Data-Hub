import { selectItem } from "./itemViewer.js";
import { fetchMarketOrders } from "./marketTables.js";

export function handleItemSelection(typeID) {
    selectItem(typeID); // UI update (name, icon, breadcrumb)

    const savedRegion = localStorage.getItem("selectedRegion") || "all";
    fetchMarketOrders(typeID, savedRegion); // Fetch pricing data
}