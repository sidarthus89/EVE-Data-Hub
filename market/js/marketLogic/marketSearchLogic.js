// 🔍 marketSearchLogic.js
import { appState, elements, APP_CONFIG } from '../marketCore/marketConfig.js';
import { loadItemView } from '../marketCore/marketDispatcher.js';
import { regionSelector } from '../../../globals/js/regionSelector.js';
import { renderSearchResults, hideSearchResults } from '../marketUI/marketSearchUI.js';


const MIN_LENGTH = APP_CONFIG.SEARCH_MIN_LENGTH || 3;
const MAX_RESULTS = APP_CONFIG.MAX_SEARCH_RESULTS || 25;

// 🕒 Debounce helper
function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

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

// 🚀 Initialize Search Behavior
export function initializeSearch() {
    const input = elements.searchBox;
    const results = elements.searchResults;

    input.addEventListener('input', debounce(() => {
        const query = input.value.trim().toLowerCase();
        if (query.length < MIN_LENGTH) {
            hideSearchResults();
        } else {
            renderSearchResults(query);
        }
    }, 300));

    input.addEventListener('keydown', handleKeyNavigation);

    input.addEventListener('focus', () => {
        const query = input.value.trim().toLowerCase();
        if (query.length >= MIN_LENGTH) {
            renderSearchResults(query);
        }
    });

    results.addEventListener('click', e => {
        const li = e.target.closest('li');
        if (!li?.dataset.typeid) return;
        onItemSelected(parseInt(li.dataset.typeid, 10));
    });

    document.addEventListener('click', e => {
        if (!results.contains(e.target) && e.target !== input && appState.isSearchActive) {
            hideSearchResults();
        }
    });
}

// 🎯 Handle Keyboard Navigation
function handleKeyNavigation(e) {
    const results = elements.searchResults;
    const items = Array.from(results.querySelectorAll('li'));
    const current = results.querySelector('li.active');

    if (e.key === 'Escape') {
        hideSearchResults();
        return;
    }

    if (e.key === 'Enter' && current?.dataset.typeid) {
        onItemSelected(parseInt(current.dataset.typeid, 10));
        elements.searchBox.value = current.textContent;
        hideSearchResults();
        return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const index = items.indexOf(current);
        const nextIndex = e.key === 'ArrowDown'
            ? Math.min(items.length - 1, index + 1)
            : Math.max(0, index - 1);
        items.forEach(li => li.classList.remove('active'));
        if (items[nextIndex]) {
            items[nextIndex].classList.add('active');
        }
    }
}

// 🧭 Handle Selection Logic
function onItemSelected(typeID) {
    if (!typeID || isNaN(typeID)) return;
    loadItemView(typeID);
    drillDownToItem(typeID);
}

// 🧬 Drill Down to Sidebar Tree Node
export function drillDownToItem(typeID) {
    const path = (function walk(node, trail = []) {
        if (Array.isArray(node)) {
            return node.some(item => item.typeID === typeID) ? trail : null;
        }
        if (typeof node === 'object') {
            for (const [key, value] of Object.entries(node)) {
                if (key === '_info') continue;
                const found = walk(value, [...trail, key]);
                if (found) return found;
            }
        }
        return null;
    })(appState.market);

    if (!path?.length) return;

    let parentEl = elements.menuList;
    path.forEach(groupName => {
        const header = Array.from(parentEl.querySelectorAll('.group-label'))
            .find(el => el.textContent === groupName);
        header?.click();
        parentEl = header.closest('li')?.querySelector('ul.subcategories') || parentEl;
    });

    const itemEl = parentEl.querySelector(`[data-typeid="${typeID}"]`);
    if (itemEl) {
        itemEl.classList.add('active');
        itemEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
