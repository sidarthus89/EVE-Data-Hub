// 📊 marketTables.js
// Renders dynamic buy/sell market data, supports sorting, resizing, pagination, and ticker summary

import { APP_CONFIG, appState } from './marketConfig.js';
import { updateItemHeader } from './itemViewer.js';
import { formatISK, formatExpires } from './marketUtilities.js';

const RESULTS_PER_PAGE = 100;

// 🧮 Calculate Average Order Price
function computeAverage(orders) {
    if (!orders.length) return 0;
    const total = orders.reduce((sum, o) => sum + o.price, 0);
    return total / orders.length;
}

// 🏷️ Ticker Tape Display
export function updateTicker(items) {
    const container = document.getElementById('priceTicker');
    if (!container) return;

    const tape = document.createElement('span');
    const segments = items.map(item => {
        const avgBuy = computeAverage(item.buyOrders);
        const avgSell = computeAverage(item.sellOrders);
        return `${item.name}: Buy ${formatISK(avgBuy)} | Sell ${formatISK(avgSell)}`;
    });

    tape.textContent = segments.join('   •   ');
    container.innerHTML = '';
    container.appendChild(tape);
}

// 🔍 Primary Order Entry Point
export async function fetchMarketOrders(typeID, selectedRegion) {
    updateItemHeader(typeID);

    try {
        const orders =
            selectedRegion === 'all'
                ? await fetchAllRegionOrders(typeID)
                : await fetchRegionOrders(typeID, resolveRegionID(selectedRegion));

        const sellOrders = orders.filter(o => !o.is_buy_order);
        const buyOrders = orders.filter(o => o.is_buy_order);

        renderOrderTables(typeID, sellOrders, buyOrders);
    } catch (err) {
        console.error('Failed to fetch market data:', err);
    }
}

// 🧭 Region ID Resolver
function resolveRegionID(regionName) {
    return (
        appState.locations?.regions?.find(r => r.regionName === regionName)?.regionID ||
        APP_CONFIG.DEFAULT_REGION_ID
    );
}

// 📦 ESI Fetch: Region Orders (Paginated)
export async function fetchRegionOrders(typeID, regionID) {
    let allOrders = [];
    let page = 1;

    while (true) {
        const url = `${APP_CONFIG.ESI_BASE_URL}${regionID}/orders/?type_id=${typeID}&page=${page}`;
        const response = await fetch(url);
        if (!response.ok) break;

        const data = await response.json();
        allOrders.push(...data);

        const totalPages = parseInt(response.headers.get('X-Pages') || '1', 10);
        if (page >= totalPages) break;
        page++;
    }

    return allOrders;
}

// 🌍 ESI Fetch: Aggregated Across All Regions
export async function fetchAllRegionOrders(typeID) {
    const regionList = Object.values(appState.locations);
    const results = await Promise.all(
        regionList.map(region => fetchRegionOrders(typeID, region.regionID))
    );
    return results.flat();
}

// 📊 Table Rendering
export function renderMarketTable(tableId, orders) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    const fragment = document.createDocumentFragment();

    orders.forEach(order => {
        const stationName =
            appState.stations?.[order.location_id]?.stationName || `Station ${order.location_id}`;

        const row = document.createElement('tr');
        row.innerHTML =
            tableId === 'sellersTable'
                ? `<td>${order.volume_remain.toLocaleString()}</td>
           <td>${formatISK(order.price)}</td>
           <td>${stationName}</td>
           <td>${formatExpires(order.duration)}</td>`
                : `<td>${order.volume_remain.toLocaleString()}</td>
           <td>${formatISK(order.price)}</td>
           <td>${order.range}</td>
           <td>${stationName}</td>
           <td>${order.min_volume}</td>
           <td>${formatExpires(order.duration)}</td>`;

        fragment.appendChild(row);
    });

    tbody.appendChild(fragment);
}

// 📋 Wrapper: Populate All Tables
function renderOrderTables(typeID, sellOrders, buyOrders) {
    document.getElementById('sellersCount').textContent = `(${sellOrders.length.toLocaleString()} orders)`;
    document.getElementById('buyersCount').textContent = `(${buyOrders.length.toLocaleString()} orders)`;

    renderMarketTable('sellersTable', sellOrders.slice(0, RESULTS_PER_PAGE));
    renderPagination('sellersPagination', sellOrders, 1, 'sellersTable');

    renderMarketTable('buyersTable', buyOrders.slice(0, RESULTS_PER_PAGE));
    renderPagination('buyersPagination', buyOrders, 1, 'buyersTable');

    updateItemHeader(typeID);
    setupTableSort('sellersTable', true, 1);
    setupTableSort('buyersTable', false, 1);
}

// 📄 Pagination Controller
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

            const isBuyers = tableId === 'buyersTable';
            setupTableSort(tableId, !isBuyers, 1);
            renderPagination(containerId, orders, i, tableId);
        });
        container.appendChild(btn);
    }
}

// 🔁 Table Sorting
export function setupTableSort(tableId, defaultAscending = true, defaultColumnIndex = 0) {
    const table = document.getElementById(tableId);
    if (!table) return;

    // Initialize sort state
    if (!appState.currentSortState[tableId]) {
        appState.currentSortState[tableId] = {
            column: defaultColumnIndex,
            ascending: defaultAscending
        };
    }

    const { column, ascending } = appState.currentSortState[tableId];
    sortTableByColumn(tableId, column, true, ascending);
    makeTableHeadersResizable(table);

    const headers = table.querySelectorAll('th.resizable');
    headers.forEach((th, i) => {
        // 🔁 Sorting click handler
        th.removeEventListener('click', th._sortHandler);
        th._sortHandler = function (e) {
            if (e.target.classList.contains('resizer')) return;
            const state = appState.currentSortState[tableId];
            const isSameColumn = state.column === i;
            const newAscending = isSameColumn ? !state.ascending : true;
            appState.currentSortState[tableId] = {
                column: i,
                ascending: newAscending
            };
            sortTableByColumn(tableId, i, true, newAscending);
        };
        th.addEventListener('click', th._sortHandler);

        // 🪄 Drag-to-reorder support
        th.setAttribute('draggable', 'true');
        th.dataset.index = i;

        th.addEventListener('dragstart', e => {
            e.dataTransfer.setData('sourceIndex', i.toString());
        });

        th.addEventListener('dragover', e => e.preventDefault());

        th.addEventListener('drop', e => {
            e.preventDefault();
            const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'), 10);
            const targetIndex = i;
            if (sourceIndex !== targetIndex) {
                reorderTableColumns(tableId, sourceIndex, targetIndex);
            }
        });
    });
}

function reorderTableColumns(tableId, sourceIndex, targetIndex) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const headerRow = table.querySelector('thead tr');
    const headers = Array.from(headerRow.children);
    const movedHeader = headers[sourceIndex];

    if (targetIndex > sourceIndex) {
        headerRow.insertBefore(movedHeader, headers[targetIndex].nextSibling);
    } else {
        headerRow.insertBefore(movedHeader, headers[targetIndex]);
    }

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cells = Array.from(row.children);
        const movedCell = cells[sourceIndex];
        if (targetIndex > sourceIndex) {
            row.insertBefore(movedCell, cells[targetIndex + 1]);
        } else {
            row.insertBefore(movedCell, cells[targetIndex]);
        }
    });
}

// 📐 Sort Handler
export function sortTableByColumn(tableId, colIndex, isNumeric, ascending) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const rows = Array.from(table.querySelector('tbody').querySelectorAll('tr'));

    rows.sort((a, b) => {
        const aVal = extractValue(a, colIndex);
        const bVal = extractValue(b, colIndex);
        return typeof aVal === 'number'
            ? (ascending ? aVal - bVal : bVal - aVal)
            : (ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal));
    });

    const fragment = document.createDocumentFragment();
    rows.forEach(row => fragment.appendChild(row));

    const headers = table.querySelectorAll('th');
    headers.forEach((th, i) => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (i === colIndex) {
            th.classList.add(ascending ? 'sort-asc' : 'sort-desc');
        }
    });

    table.querySelector('tbody').appendChild(fragment);
}

function extractValue(row, index) {
    const text = row.children[index].textContent.trim();
    const num = parseFloat(text.replace(/[,\s]/g, ''));
    return isNaN(num) ? text.toLowerCase() : num;
}

// 📏 Header Resizing
export function makeTableHeadersResizable(table) {
    const ths = table.querySelectorAll('th.resizable');

    ths.forEach(th => {
        const resizer = th.querySelector('.resizer');
        if (!resizer) return;

        let startX, startWidth;

        const onMouseMove = e => {
            const newWidth = startWidth + (e.pageX - startX);
            th.style.width = `${Math.max(newWidth, 40)}px`; // prevent collapse
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        resizer.addEventListener('mousedown', e => {
            startX = e.pageX;
            startWidth = th.offsetWidth;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    });
}