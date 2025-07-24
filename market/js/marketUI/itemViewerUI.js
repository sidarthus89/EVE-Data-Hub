// 📦 itemViewer.js
// Renders item viewer: item name, icon, and breadcrumb trail above market orders and history.

/* ───── MODULE IMPORTS ───── */
import { appState, elements, APP_CONFIG } from '../marketCore/marketConfig.js';
import { getIconPath } from './marketFormatting.js';
import { expandMarketPath } from './marketTreeUI.js';

/**
 * Mounts the item viewer UI block (icon, name, breadcrumb) for the selected item.
 * @param {Object} itemData - Selected market item
 * @param {number} regionID - Region ID to provide location context
 */
export function renderItemViewer(itemData, regionID) {
    const typeID = Number(itemData?.type_id);
    if (!typeID || isNaN(typeID)) {
        console.warn("[ItemViewer] Invalid typeID:", itemData?.type_id);
        return;
    }

    // ⬇️ Update state
    appState.selectedTypeID = typeID;
    appState.selectedItemData = itemData;
    appState.selectedRegionID = regionID;
    window.appState.selectedTypeID = typeID;
    localStorage.setItem('selectedTypeID', typeID);

    // ⬇️ Update search box value
    if (elements.searchBox) {
        elements.searchBox.value = itemData.name || '';
    }

    // ⬇️ Update name and icon
    const iconPath = getIconPath(itemData.iconFile || '');
    if (elements.itemName) elements.itemName.textContent = itemData.name;

    if (elements.itemIcon) {
        elements.itemIcon.src = iconPath;
        elements.itemIcon.alt = itemData.name;
        elements.itemIcon.onerror = () => {
            console.warn("[ItemViewer] Icon failed to load. Fallback:", APP_CONFIG.FALLBACK_ICON);
            elements.itemIcon.src = APP_CONFIG.FALLBACK_ICON;
        };
    }

    // ⬇️ Show viewer sections
    elements.itemViewerHeader?.classList.remove("hidden");
    elements.itemViewerSection?.classList.remove("hidden");

    renderBreadcrumbTrail(typeID);
}

/**
 * Builds and renders the breadcrumb trail for the selected item path.
 * @param {number} typeID - Item typeID
 */
function renderBreadcrumbTrail(typeID) {
    const container = document.getElementById('itemBreadcrumb');
    if (!container) {
        console.warn("[Breadcrumb] Element not found: #itemBreadcrumb");
        return;
    }

    container.innerHTML = '';
    const segments = findItemBreadcrumb(typeID);

    segments.forEach((segment, index) => {
        const link = document.createElement('a');
        link.textContent = segment;
        link.href = '#';
        link.className = 'breadcrumb-link';
        link.addEventListener('click', (e) => {
            e.preventDefault();
            appState.fromBreadcrumb = true;

            const pathUpTo = segments.slice(0, index + 1);
            expandMarketPath(pathUpTo);
        });

        container.appendChild(link);

        if (index < segments.length - 1) {
            const separator = document.createElement('span');
            separator.textContent = ' / ';
            container.appendChild(separator);
        }
    });
}

/**
 * Traverses market tree to find the item's category path for breadcrumb display.
 * @param {number} typeID
 * @returns {string[]} Array of category segments
 */
function findItemBreadcrumb(typeID) {
    const path = [];

    function walk(node, trail = []) {
        for (const [key, value] of Object.entries(node)) {
            if (key === '_info') continue;

            if (Array.isArray(value)) {
                for (const item of value) {
                    if (Number(item.typeID) === typeID) {
                        path.push(...trail.filter(t => t !== 'items'));
                        return true;
                    }
                }
            } else if (typeof value === 'object' && value !== null) {
                if (walk(value, [...trail, key])) return true;
            }
        }
        return false;
    }

    walk(appState.market);
    return path.length ? path : ['Unknown Category'];
}
