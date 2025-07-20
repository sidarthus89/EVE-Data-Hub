import { appState, elements } from './marketConfig.js';
import { handleItemSelection } from './itemDispatcher.js';
import { addToQuickbar } from './marketQuickbar.js';

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

export function initializeMarketMenu() {
    const menuData = appState.marketMenu;
    elements.menuList.innerHTML = '';
    buildFlatItemList(menuData);

    Object.entries(menuData).forEach(([groupName, groupContent]) => {
        if (groupName === '_info' || typeof groupContent !== 'object') return;
        renderGroup(groupName, groupContent, elements.menuList);
    });
}

export function getGroupIcon(groupID, groupNode) {
    let iconFile = groupNode?._info?.iconFile;
    if (!iconFile) {
        function findIn(node) {
            for (const [key, val] of Object.entries(node)) {
                if (key === '_info' && val.marketGroupID == groupID) {
                    return val.iconFile;
                }
                if (typeof val === 'object') {
                    const nested = findIn(val);
                    if (nested) return nested;
                }
            }
        }
        iconFile = findIn(appState.marketMenu);
    }

    return iconFile
        ? `/market/icons/items/${iconFile}`
        : '/market/icons/default.png';
}

export function renderGroup(groupName, groupObject, parentElement) {
    const groupID = groupObject._info?.marketGroupID;
    const iconSrc = getGroupIcon(groupID, groupObject);

    const groupLi = document.createElement('li');
    groupLi.className = 'collapsible';
    groupLi.setAttribute('aria-expanded', 'false');
    groupLi.dataset.groupId = groupID;

    const headerDiv = document.createElement('div');
    headerDiv.className = 'group-label-wrapper';

    const arrow = document.createElement('span');
    arrow.className = 'group-arrow';
    arrow.textContent = '▶';
    arrow.style.marginRight = '6px';

    const icon = document.createElement('img');
    icon.className = 'group-icon';
    icon.src = iconSrc;
    // ← Set fixed size for group icons
    icon.style.width = '16px';
    icon.style.height = '16px';
    icon.onerror = () => (icon.src = '/market/icons/default.png');

    const label = document.createElement('span');
    label.className = 'group-label';
    label.textContent = groupName;

    headerDiv.append(arrow, icon, label);
    groupLi.appendChild(headerDiv);
    parentElement.appendChild(groupLi);

    let subList = null;
    headerDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        const expanded = groupLi.classList.toggle('expanded');
        groupLi.setAttribute('aria-expanded', expanded);
        arrow.style.transform = expanded ? 'rotate(90deg)' : 'rotate(0deg)';

        if (!subList) {
            subList = createSubMenu(groupObject);
            groupLi.appendChild(subList);
        } else {
            subList.classList.toggle('show');
        }
    });
}

export function createSubMenu(groupObject) {
    const subList = document.createElement('ul');
    subList.className = 'subcategories show';

    Object.entries(groupObject).forEach(([key, value]) => {
        if (key === '_info') return;

        if (Array.isArray(value)) {
            value.forEach((item) => {
                const itemEl = createMarketItem(item);
                subList.appendChild(itemEl);
            });
        } else if (typeof value === 'object') {
            renderGroup(key, value, subList);
        }
    });

    return subList;
}

function createMarketItem(item) {
    const li = document.createElement('li');
    li.className = 'market-item';
    li.dataset.typeId = item.typeID;

    const icon = document.createElement('img');
    icon.className = 'item-icon';
    icon.src = `/market/icons/types/${item.typeID}.png`;
    icon.alt = item.typeName;
    // ← Set fixed size for item icons
    icon.style.width = '16px';
    icon.style.height = '16px';

    const label = document.createElement('span');
    label.textContent = item.typeName?.trim();

    const addBtn = document.createElement('button');
    addBtn.textContent = '+';
    addBtn.title = 'Add to Quickbar';
    addBtn.className = 'quickbar-btn';
    addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToQuickbar(item);
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
        const subList = li.querySelector('.subcategories');
        if (subList) subList.classList.remove('show');
    });

    let currentList = elements.menuList;
    for (const segment of segmentChain) {
        const match = [...currentList.querySelectorAll('.group-label-wrapper')].find(
            (wrapper) =>
                wrapper.querySelector('.group-label')?.textContent.trim() === segment
        );
        if (match) {
            const groupLi = match.closest('li.collapsible');
            groupLi.classList.add('expanded');
            groupLi.setAttribute('aria-expanded', 'true');
            const arrow = groupLi.querySelector('.group-arrow');
            if (arrow) arrow.style.transform = 'rotate(90deg)';
            let subList = groupLi.querySelector('.subcategories');
            subList.classList.add('show');
            subList.style.display = 'block';
            groupLi.scrollIntoView({ behavior: 'smooth', block: 'center' });
            currentList = subList;
        }
    }
}
