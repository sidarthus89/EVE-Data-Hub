//marketTreeUI.js

import { appState } from '../marketCore/marketConfig.js';
import { handleItemSelection } from '../marketLogic/itemDispatcher.js';
import { addToQuickbar } from '../marketLogic/marketSidebarLogic.js';
import { buildFlatItemList } from '../marketLogic/marketTreeLogic.js';
import { getGroupIcon, getIconPath } from '../marketUI/marketFormatting.js';

function createMarketItem(item) {
    const li = document.createElement('li');
    li.className = 'market-item';
    li.dataset.typeId = item.typeID;

    const icon = document.createElement('img');
    icon.className = 'item-icon';
    icon.src = `/market/icons/${item.typeID}.png`;
    icon.alt = item.typeName;
    icon.style.width = '16px';
    icon.style.height = '16px';

    const label = document.createElement('span');
    label.textContent = item.typeName?.trim();

    const addBtn = document.createElement('button');
    addBtn.textContent = '+';
    addBtn.title = 'Add to Quickbar';
    addBtn.className = 'quickbar-btn';

    addBtn.style.position = 'relative'; // Ensure feedback anchors correctly

    addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToQuickbar(item);

        // 🟢 Visual feedback
        const indicator = document.createElement('span');
        indicator.className = 'quickbar-feedback';
        indicator.textContent = '✔ Added';
        indicator.style.position = 'absolute';
        indicator.style.top = '-18px';
        indicator.style.left = '50%';
        indicator.style.transform = 'translateX(-50%)';
        indicator.style.background = '#4CAF50';
        indicator.style.color = '#fff';
        indicator.style.padding = '2px 6px';
        indicator.style.borderRadius = '4px';
        indicator.style.fontSize = '11px';
        indicator.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        indicator.style.pointerEvents = 'none';
        indicator.style.zIndex = '100';

        addBtn.appendChild(indicator);

        setTimeout(() => indicator.remove(), 1500);
    });

    li.append(icon, label, addBtn);
    li.addEventListener('click', () => {
        handleItemSelection(item.typeID);
    });

    return li;
}

export function expandMarketPath(segmentChain = []) {
    if (!segmentChain.length) return;

    document.querySelectorAll('li.collapsible.expanded').forEach((li) => {
        li.classList.remove('expanded');
        li.setAttribute('aria-expanded', 'false');

        const arrow = li.querySelector('.group-arrow');
        if (arrow) arrow.style.transform = 'rotate(0deg)';

        const subList = li._subList || li.querySelector('.subcategories');
        if (subList) {
            subList.classList.remove('show');
            subList.style.display = '';
        }
    });

    let currentList = elements.menuList;
    for (const segment of segmentChain) {
        const match = [...currentList.querySelectorAll('.group-label-wrapper')].find(wrapper =>
            wrapper.querySelector('.group-label')?.textContent.trim() === segment
        );

        if (match) {
            const groupLi = match.closest('li.collapsible');
            groupLi.classList.add('expanded');
            groupLi.setAttribute('aria-expanded', 'true');

            const arrow = groupLi.querySelector('.group-arrow');
            if (arrow) arrow.style.transform = 'rotate(90deg)';

            if (!groupLi._subList && groupLi._groupObject) {
                groupLi._subList = createSubMenu(groupLi._groupObject);
                groupLi.appendChild(groupLi._subList);
            }

            if (groupLi._subList) {
                groupLi._subList.classList.add('show');
                groupLi._subList.style.display = 'block';
                currentList = groupLi._subList;
            }

            groupLi.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

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

    groupLi._subList = null;

    headerDiv.addEventListener('click', e => {
        e.stopPropagation();
        const expanded = groupLi.classList.toggle('expanded');
        groupLi.setAttribute('aria-expanded', expanded);
        arrowSpan.style.transform = expanded ? 'rotate(90deg)' : 'rotate(0deg)';

        if (!groupLi._subList) {
            groupLi._subList = createSubMenu(groupObject);
            groupLi.appendChild(groupLi._subList);
        }

        groupLi._subList.classList.toggle('show', expanded);
        groupLi._subList.style.display = expanded ? 'block' : '';
    });
}

export function createSubMenu(groupObject) {
    const subList = document.createElement('ul');
    subList.className = 'subcategories show';

    Object.entries(groupObject).forEach(([key, value]) => {
        if (
            key === '_info' ||
            (groupObject._info && groupObject._info.typeName === key)
        ) return;

        if (Array.isArray(value)) {
            value.forEach(item => {
                subList.appendChild(createMarketItem(item));
            });
        } else if (typeof value === 'object') {
            renderGroup(key, value, subList);
        }
    });

    return subList;
}

function collapseAllGroups() {
    const allGroups = document.querySelectorAll('#menuList li.collapsible');

    allGroups.forEach(group => {
        group.classList.remove('expanded');
        group.setAttribute('aria-expanded', 'false');

        const arrow = group.querySelector('.group-arrow');
        if (arrow) arrow.style.transform = 'rotate(0deg)';

        const subList = group._subList || group.querySelector('.subcategories');
        if (subList) {
            subList.classList.remove('show');
            subList.style.display = '';
        }
    });
}

document.getElementById('collapseAllBtn')?.addEventListener('click', collapseAllGroups);
