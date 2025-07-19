// 🌳 marketTree.js
// Builds and renders the collapsible market category tree from menu data

import { appState, elements } from './marketConfig.js';
import { getGroupIcon } from './marketUtilities.js';
import { handleItemSelection } from './itemDispatcher.js';
import { addToQuickbar } from './marketQuickbar.js';

// 🧠 Flatten all valid market items for global search
export function buildFlatItemList(menuData) {
    appState.flatItemList = [];

    function scan(node) {
        if (!node) return;

        if (Array.isArray(node)) {
            node.forEach(scan);
        } else if (isValidItem(node)) {
            appState.flatItemList.push({
                name: node.typeName.trim(),
                type_id: node.typeID
            });
        } else if (typeof node === 'object') {
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

// 🧱 Initialize tree and attach to DOM
export function initializeMarketMenu() {
    const menuData = appState.marketMenu;
    elements.menuList.innerHTML = '';
    buildFlatItemList(menuData);

    Object.entries(menuData).forEach(([groupName, groupContent]) => {
        if (groupName === '_info' || typeof groupContent !== 'object') return;
        renderGroup(groupName, groupContent, elements.menuList);
    });
}

// 🌲 Render a top-level group wrapper
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

// 🍃 Render subgroup or item entries inside collapsible menu
export function createSubMenu(groupObject) {
    const subList = document.createElement('ul');
    subList.className = 'subcategories show';

    Object.entries(groupObject).forEach(([key, value]) => {
        if (key === '_info') return;

        if (Array.isArray(value)) {
            value.forEach(item => {
                const itemLi = document.createElement('li');
                itemLi.className = 'market-item';
                itemLi.dataset.typeId = item.typeID;

                const label = document.createElement('span');
                label.textContent = item.typeName?.trim();

                const addBtn = document.createElement('button');
                addBtn.textContent = '+';
                addBtn.title = 'Add to Quickbar';
                addBtn.className = 'quickbar-btn';
                addBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    addToQuickbar(item); // You can pass typeID or full item object
                });

                itemLi.append(label, addBtn);

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