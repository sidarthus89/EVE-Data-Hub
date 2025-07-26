//marketTreeUI.js

import { appState } from '../marketCore/marketConfig.js';
import { loadItemView } from '../marketCore/marketDispatcher.js';
import { getGroupIcon } from '../marketUI/marketFormatting.js';
import { addToQuickbar } from '../marketLogic/marketSidebarLogic.js';

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
    iconImg.src = getGroupIcon(groupObject._info?.marketGroupID, groupObject);

    iconImg.onerror = () => {
        iconImg.src = '/market/assets/default.png';
    };

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

    const preloadQueue = [];

    Object.entries(groupObject).forEach(([key, value]) => {
        if (
            key === '_info' ||
            (groupObject._info && groupObject._info.typeName === key)
        ) {
            return;
        }

        if (Array.isArray(value)) {
            const info = groupObject._info;
            const isRedundant =
                value.length === 1 &&
                info &&
                info.typeID === value[0].typeID &&
                info.typeName === value[0].typeName;

            if (!isRedundant) {
                value.forEach(item => {
                    preloadQueue.push(item.typeID);
                    subList.appendChild(createMarketItem(item, key));
                });
            }

        } else if (typeof value === 'object') {
            renderGroup(key, value, subList);
        }
    });

    return subList;
}

function createMarketItem(item, groupName = '') {
    const li = document.createElement('li');
    li.className = 'market-item';
    li.dataset.typeId = item.typeID;

    const label = document.createElement('span');
    const typeName = item.typeName?.trim();
    const labelText = (groupName && typeName.startsWith(groupName + ' '))
        ? typeName.slice(groupName.length + 1)
        : typeName;
    label.textContent = labelText;


    const addBtn = document.createElement('button');
    addBtn.textContent = '+';
    addBtn.title = 'Add to Quickbar';
    addBtn.className = 'quickbar-btn';

    addBtn.style.position = 'relative';

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
        indicator.style.background = '#0e1f24';
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

    li.append(label, addBtn);
    li.addEventListener('click', () => {
        loadItemView(item.typeID);
    });

    return li;
}
