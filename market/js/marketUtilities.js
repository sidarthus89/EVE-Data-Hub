// 🛠 marketUtilities.js
// Provides formatting helpers, UI builders, menu generators, and DOM caching for market module

import { appState, elements, APP_CONFIG } from './marketConfig.js';
import { handleItemSelection } from './itemDispatcher.js';

// 🎨 Icon Path Generators
export function getIconPath(iconFile) {
    return iconFile
        ? `/${APP_CONFIG.ICON_BASE_URL}${iconFile}`
        : APP_CONFIG.FALLBACK_ICON;
}


export function getGroupIcon(groupObject) {
    const iconFile = groupObject?._info?.iconFile;
    return iconFile
        ? `/${APP_CONFIG.GROUP_ICON_PATH}${iconFile}`
        : APP_CONFIG.FALLBACK_ICON;
}


// 💱 Formatters
export function formatExpires(days) {
    return `${days} ${days === 1 ? 'day' : 'days'}`;
}

export function formatISK(value) {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' ISK';
}

// 🧩 Build Flat List of Items for Search Indexing
export function buildFlatItemList(menuData) {
    appState.flatItemList = [];

    function scan(node) {
        if (!node) return;

        if (Array.isArray(node)) {
            node.forEach(scan);
            return;
        }

        if (isValidItem(node)) {
            appState.flatItemList.push({
                name: node.typeName.trim(),
                type_id: node.typeID
            });
            return;
        }

        if (typeof node === 'object') {
            Object.entries(node).forEach(([key, value]) => {
                if (key !== '_info') scan(value);
            });
        }
    }

    function isValidItem(obj) {
        return (
            typeof obj?.typeName === 'string' &&
            obj?.published === true &&
            (typeof obj.typeID === 'number' || /^\d+$/.test(obj.typeID))
        );
    }

    scan(menuData);
}

// 🌲 Initialize Menu from Market Data
export function initializeMarketMenu() {
    const menuData = appState.marke;
    elements.menuList.innerHTML = '';
    buildFlatItemList(menuData);

    Object.entries(menuData).forEach(([groupName, groupContent]) => {
        if (groupName === '_info' || typeof groupContent !== 'object') return;
        renderGroup(groupName, groupContent, elements.menuList);
    });
}

// 🔁 Render a Collapsible Market Group
export function renderGroup(groupName, groupObject, parentElement) {
    const groupLi = document.createElement('li');
    groupLi.className = 'collapsible';
    groupLi.setAttribute('aria-expanded', 'false');

    const headerDiv = document.createElement('div');
    headerDiv.className = 'group-label-wrapper';

    const arrowSpan = document.createElement('span');
    arrowSpan.className = 'group-arrow';
    arrowSpan.textContent = '▶';
    arrowSpan.style.marginRight = '6px';
    arrowSpan.style.transition = 'transform 0.2s ease-in-out';

    const iconImg = document.createElement('img');
    iconImg.className = 'group-icon';
    iconImg.src = getGroupIcon(groupObject);

    const labelSpan = document.createElement('span');
    labelSpan.className = 'group-label';
    labelSpan.textContent = groupName;

    headerDiv.append(arrowSpan, iconImg, labelSpan);
    groupLi.appendChild(headerDiv);
    parentElement.appendChild(groupLi);

    let subList = null;

    headerDiv.addEventListener('click', e => {
        e.stopPropagation();
        const expanded = groupLi.classList.toggle('expanded');
        groupLi.setAttribute('aria-expanded', expanded);
        arrowSpan.style.transform = expanded ? 'rotate(90deg)' : 'rotate(0deg)';

        if (!subList) {
            subList = createSubMenu(groupObject);
            groupLi.appendChild(subList);
        } else {
            subList.classList.toggle('show');
        }
    });
}

// 📂 Create Nested Submenu for Market Items
export function createSubMenu(groupObject) {
    icon.src = getIconPath(item.iconFile);
    const subList = document.createElement('ul');
    subList.className = 'subcategories show';

    Object.entries(groupObject).forEach(([key, value]) => {
        if (key === '_info') return;

        if (Array.isArray(value)) {
            value.forEach(item => {
                const itemLi = document.createElement('li');
                itemLi.className = 'market-item';
                itemLi.dataset.typeId = item.typeID;

                const icon = document.createElement('img');
                icon.alt = item.typeName;
                icon.className = 'submenu-icon';
                icon.src = getIconPath(item.typeID);

                const label = document.createElement('span');
                label.textContent = item.typeName;

                itemLi.append(icon, label);

                itemLi.addEventListener('click', () => {
                    if (item.typeID) handleItemSelection(item.typeID);
                });

                subList.appendChild(itemLi);
            });
        } else if (typeof value === 'object') {
            renderGroup(key, value, subList);
        }
    });

    return subList;
}

export function syncViewDisplay() {
    if (appState.activeView === 'market') {
        elements.marketTables?.classList.remove("hidden");
        elements.historyChart?.classList.add("hidden");
    } else if (appState.activeView === 'history') {
        elements.marketTables?.classList.add("hidden");
        elements.historyChart?.classList.remove("hidden");
    }
}

export function buildLocationMaps(locationsData) {
    appState.stationMap = {};
    appState.regionMap = {};

    Object.entries(locationsData).forEach(([regionName, regionObj]) => {
        const regionID = regionObj.regionID;
        appState.regionMap[regionID] = { regionName, ...regionObj };

        Object.entries(regionObj).forEach(([constellationName, constellationObj]) => {
            if (constellationName === 'regionID') return;

            Object.entries(constellationObj).forEach(([systemName, systemObj]) => {
                if (systemName === 'constellationID') return;

                Object.entries(systemObj.stations || {}).forEach(([stationID, stationObj]) => {
                    appState.stationMap[stationID] = stationObj;
                });
            });
        });
    });
}

export function getStationName(stationID) {
    return appState.stationMap[stationID]?.stationName || "Unknown Station";
}

// 🧱 DOM Element Caching for Early Access
export function cacheElements() {
    elements.searchBox = document.getElementById('searchBox');
    elements.searchResults = document.getElementById('searchResults');
    elements.menuList = document.getElementById('menuList');
    elements.itemIcon = document.getElementById('itemIcon');
    elements.itemName = document.getElementById('itemName');
    elements.itemBreadcrumb = document.getElementById('itemBreadcrumb');
    elements.regionSelector = document.getElementById('regionSelector');
    elements.viewMarketLink = document.getElementById('viewMarketLink');
    elements.viewHistoryLink = document.getElementById('viewHistoryLink');
    elements.viewerContainer = document.getElementById('itemViewerContainer'); // for right-side header
    elements.viewerIconWrapper = document.querySelector('.viewer-icon-container'); // for icon display
    elements.marketTables = document.getElementById('itemPriceTables'); // main tables section
    elements.historyChart = document.getElementById('itemHistorySection');
    elements.regionSelector = document.getElementById('regionSelector');         // 🌍 Dropdown for selecting region
    elements.regionBreadcrumb = document.getElementById('regionBreadcrumb');     // 📍 Shows current region in path
    elements.regionLabel = document.getElementById('regionLabel');
}