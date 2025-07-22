// 📋 marketRenderer.js
// Renders market buy/sell tables, sorting, and pagination

import { appState } from './marketConfig.js';
import { formatISK, formatExpires } from './marketUtilities.js';
import { getMarketOrders } from './marketLoader.js';

const RESULTS_PER_PAGE = 100;

// 📄 Entry Point
export async function fetchMarketOrders(typeID, regionName = 'all') {
    if (!typeID) return clearTables();

    try {
        const { buy: buyOrders, sell: sellOrders } = await getMarketOrders(typeID, regionName);
        renderOrderTables(typeID, sellOrders, buyOrders);
    } catch (err) {
        console.error('❌ Failed to fetch market data:', err);
        clearTables();
    }
}

// 🔧 Clear UI
function clearTables() {
    const sellersCount = document.getElementById('sellersCount');
    const buyersCount = document.getElementById('buyersCount');
    const sellersBody = document.querySelector('#sellersTable tbody');
    const buyersBody = document.querySelector('#buyersTable tbody');

    if (sellersCount) sellersCount.textContent = '';
    if (buyersCount) buyersCount.textContent = '';
    if (sellersBody) sellersBody.innerHTML = '';
    if (buyersBody) buyersBody.innerHTML = '';
}

// 📊 Table Render Wrapper
function renderOrderTables(typeID, sellOrders, buyOrders) {
    const sellersCountEl = document.getElementById('sellersCount');
    const buyersCountEl = document.getElementById('buyersCount');

    const hasSells = Array.isArray(sellOrders) && sellOrders.length > 0;
    const hasBuys = Array.isArray(buyOrders) && buyOrders.length > 0;

    if (!typeID || (!hasSells && !hasBuys)) {
        sellersCountEl.textContent = '(0 orders)';
        buyersCountEl.textContent = '(0 orders)';
        renderMarketTable('sellersTable', []);
        renderMarketTable('buyersTable', []);
        return;
    }

    sellersCountEl.textContent = `(${sellOrders.length.toLocaleString()} orders)`;
    buyersCountEl.textContent = `(${buyOrders.length.toLocaleString()} orders)`;

    renderMarketTable('sellersTable', sellOrders.slice(0, RESULTS_PER_PAGE));
    renderMarketTable('buyersTable', buyOrders.slice(0, RESULTS_PER_PAGE));

    renderPagination('sellersPagination', sellOrders, 1, 'sellersTable');
    renderPagination('buyersPagination', buyOrders, 1, 'buyersTable');

    setupTableSort('sellersTable', true, 1);
    setupTableSort('buyersTable', false, 1);
}

export function renderMarketTable(tableId, orders) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    const fragment = document.createDocumentFragment();

    if (!orders.length) {
        const row = document.createElement('tr');
        const colspan = tableId === 'sellersTable' ? 4 : 6;
        row.innerHTML = `<td colspan="${colspan}">No orders.</td>`;
        fragment.appendChild(row);
    } else {
        orders.forEach(order => {
            const stationName = appState.stationMap?.[order.location_id]?.stationName || `Station ${order.location_id}`;
            const row = document.createElement('tr');

            row.innerHTML = tableId === 'sellersTable'
                ? `<td>${order.volume_remain.toLocaleString()}</td><td>${formatISK(order.price)}</td><td>${stationName}</td><td>${formatExpires(order.duration)}</td>`
                : `<td>${order.volume_remain.toLocaleString()}</td><td>${formatISK(order.price)}</td><td>${order.range}</td><td>${stationName}</td><td>${order.min_volume}</td><td>${formatExpires(order.duration)}</td>`;

            fragment.appendChild(row);
        });
    }

    tbody.appendChild(fragment);
}

// 🔁 Pagination Controls
export function renderPagination(containerId, orders, currentPage, tableId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const totalPages = Math.ceil(orders.length / RESULTS_PER_PAGE);
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.addEventListener('click', () => {
            const pageData = orders.slice((i - 1) * RESULTS_PER_PAGE, i * RESULTS_PER_PAGE);
            renderMarketTable(tableId, pageData);
            setupTableSort(tableId, tableId === 'sellersTable', 1);
            renderPagination(containerId, orders, i, tableId);
        });
        container.appendChild(btn);
    }
}

// 🔄 Sort Setup
export function setupTableSort(tableId, defaultAscending = true, defaultColumnIndex = 0) {
    const table = document.getElementById(tableId);
    if (!table) return;

    if (!appState.currentSortState[tableId]) {
        appState.currentSortState[tableId] = { column: defaultColumnIndex, ascending: defaultAscending };
    }

    const { column, ascending } = appState.currentSortState[tableId];
    sortTableByColumn(tableId, column, true, ascending);
    makeTableHeadersResizable(table);

    const headers = table.querySelectorAll('th.resizable');
    headers.forEach((th, i) => {
        th.removeEventListener('click', th._sortHandler);
        th._sortHandler = function (e) {
            if (e.target.classList.contains('resizer')) return;
            const isSameColumn = appState.currentSortState[tableId].column === i;
            const newAscending = isSameColumn ? !appState.currentSortState[tableId].ascending : true;
            appState.currentSortState[tableId] = { column: i, ascending: newAscending };
            sortTableByColumn(tableId, i, true, newAscending);
        };
        th.addEventListener('click', th._sortHandler);
    });
}

// 🧮 Table Sorting
function extractValue(row, index) {
    const text = row.children[index]?.textContent?.trim() ?? '';
    const num = parseFloat(text.replace(/[,\s]/g, ''));
    return isNaN(num) ? text.toLowerCase() : num;
}

export function sortTableByColumn(tableId, colIndex, isNumeric, ascending) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.sort((a, b) => {
        const aVal = extractValue(a, colIndex);
        const bVal = extractValue(b, colIndex);
        return typeof aVal === 'number'
            ? (ascending ? aVal - bVal : bVal - aVal)
            : (ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal));
    });

    const fragment = document.createDocumentFragment();
    rows.forEach(row => fragment.appendChild(row));
    tbody.appendChild(fragment);

    const headers = table.querySelectorAll('th');
    headers.forEach((th, i) => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (i === colIndex) {
            th.classList.add(ascending ? 'sort-asc' : 'sort-desc');
        }
    });
}

// 📏 Resizable Headers
export function makeTableHeadersResizable(table) {
    const ths = table.querySelectorAll('th.resizable');

    ths.forEach(th => {
        const resizer = th.querySelector('.resizer');
        if (!resizer) return;

        let startX, startWidth;

        const onMouseMove = e => {
            const newWidth = startWidth + (e.pageX - startX);
            th.style.width = `${Math.max(newWidth, 40)}px`;
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        resizer.addEventListener('mousedown', e => {
            e.preventDefault();
            startX = e.pageX;
            startWidth = th.offsetWidth;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    });
}
