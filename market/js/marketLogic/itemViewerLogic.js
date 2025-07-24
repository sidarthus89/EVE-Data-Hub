// 🎨 itemViewerUI.js
// Renders the item viewer interface: icon, name, breadcrumb trail

import { elements } from '../marketCore/marketConfig.js';
import { expandMarketPath } from './marketTree.js';

/**
 * Renders selected item header in viewer
 * @param {Object} viewerData
 */
export function renderItemViewer(viewerData) {
    const { itemName, iconPath, fallbackIcon, breadcrumbSegments } = viewerData;

    elements.itemName.textContent = itemName;
    elements.itemIcon.src = iconPath;
    elements.itemIcon.alt = itemName;

    elements.itemIcon.onerror = () => {
        console.warn("[ItemViewerUI] Icon failed to load. Falling back.");
        elements.itemIcon.src = fallbackIcon;
    };

    elements.itemViewerHeader?.classList.remove("hidden");
    elements.itemViewerSection?.classList.remove("hidden");

    renderBreadcrumbTrail(breadcrumbSegments);
}

/**
 * Builds and mounts breadcrumb trail to DOM
 * @param {string[]} segments
 */
function renderBreadcrumbTrail(segments) {
    const container = document.getElementById('itemBreadcrumb');
    if (!container) {
        console.warn("[ItemViewerUI] Missing breadcrumb container");
        return;
    }

    container.innerHTML = '';

    segments.forEach((segment, index) => {
        const link = document.createElement('a');
        link.textContent = segment;
        link.href = '#';
        link.className = 'breadcrumb-link';
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.appState.fromBreadcrumb = true;
            expandMarketPath(segments.slice(0, index + 1));
        });

        container.appendChild(link);

        if (index < segments.length - 1) {
            const sep = document.createElement('span');
            sep.textContent = ' / ';
            container.appendChild(sep);
        }
    });
}
