// marketSidebarLogic.js
// logic for region selector drop down, search box logic, market tree logic/behavior
import { renderQuickbar } from '../marketUI/marketSidebarUI.js';

// 🛒 Load market categories and items
export const loadMarket = () =>
    loadStaticData(APP_CONFIG.MARKET_FILE, 'market');


// 🛠 Attach Button Handlers (Export / Import / Delete All)
export function setupQuickbarActions() {
    const [exportBtn, importBtn, deleteBtn] = document.querySelectorAll(".qb-btn");

    exportBtn?.addEventListener("click", () => {
        const data = JSON.stringify(appState.quickbarItems || [], null, 2);
        navigator.clipboard.writeText(data)
            .catch(err => console.warn("Clipboard error", err));
    });

    importBtn?.addEventListener("click", () => {
        const pasted = prompt("Paste your Quickbar JSON:");
        try {
            const data = JSON.parse(pasted);
            if (Array.isArray(data)) {
                appState.quickbarItems = data;
                localStorage.setItem("quickbarItems", JSON.stringify(data));
                renderQuickbar(true);
            }
        } catch (err) {
            console.warn("Invalid JSON");
        }
    });

    deleteBtn?.addEventListener("click", () => {
        if (confirm("Clear all Quickbar items?")) {
            appState.quickbarItems = [];
            localStorage.setItem("quickbarItems", "[]");
            renderQuickbar(true);
        }
    });
}


export function addToQuickbar(item) {
    if (!item?.typeID || !item?.typeName) return;

    const exists = (appState.quickbarItems || []).some(q => q.type_id === item.typeID);
    if (exists) return;

    const newEntry = {
        type_id: item.typeID,
        name: item.typeName
    };

    appState.quickbarItems = [...(appState.quickbarItems || []), newEntry];
    localStorage.setItem("quickbarItems", JSON.stringify(appState.quickbarItems));
    renderQuickbar(true);
}

// ✅ Static JSON loader with optional hydrator
export async function loadStaticData(filename, targetKey, hydrateFn = null) {
    const response = await fetch(`${APP_CONFIG.DATA_PATH}${filename}`);
    if (!response.ok) throw new Error(`❌ Failed to fetch ${filename}: ${response.statusText}`);

    const data = await response.json(); // ✅ Declare 'data' before using it

    appState[targetKey] = data;
    if (hydrateFn) hydrateFn(data);
}

// 📍 Load unified location tree + flatten maps
export const loadLocations = () =>
    loadStaticData(APP_CONFIG.LOCATIONS_FILE, 'locations', buildLocationMaps);

// 🧠 Build flat lookup maps from nested location structure
export function buildLocationMaps(locationsData) {
    appState.stationMap = {};
    appState.regionMap = {};

    for (const [regionName, regionObj] of Object.entries(locationsData)) {
        const regionID = regionObj.regionID;
        appState.regionMap[regionName] = { regionID, regionName };

        for (const [constellationName, constellationObj] of Object.entries(regionObj)) {
            if (constellationName === 'regionID') continue;

            for (const [systemName, systemObj] of Object.entries(constellationObj)) {
                if (systemName === 'constellationID') continue;

                for (const [stationID, stationObj] of Object.entries(systemObj.stations || {})) {
                    appState.stationMap[stationID] = stationObj;
                }
            }
        }
    }
} 