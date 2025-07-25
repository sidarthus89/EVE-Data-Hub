// 📋 marketOrdersUI.js

import { appState } from '../marketCore/marketConfig.js';
import { formatISK, formatExpires } from '../marketUI/marketFormatting.js';

const RESULTS_PER_PAGE = 100;

// 🔧 Clear Tables
export function clearTables() {
    ['sellersCount', 'buyersCount'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
    ['sellersTable', 'buyersTable'].forEach(id => {
        const body = document.querySelector(`#${id} tbody`);
        if (body) body.innerHTML = '';
    });
}

// 📊 Table Renderer
export function renderOrderTables(typeID, sellOrders, buyOrders) {
    const hasData = Array.isArray(sellOrders) || Array.isArray(buyOrders);
    if (!typeID || !hasData) return;

    const updateCount = (id, count) => {
        const el = document.getElementById(id);
        if (el) el.textContent = `(${count.toLocaleString()} orders)`;
    };

    updateCount('sellersCount', sellOrders.length);
    updateCount('buyersCount', buyOrders.length);

    renderMarketTable('sellersTable', sellOrders.slice(0, RESULTS_PER_PAGE));
    renderMarketTable('buyersTable', buyOrders.slice(0, RESULTS_PER_PAGE));

    renderPagination('sellersPagination', sellOrders, 1, 'sellersTable');
    renderPagination('buyersPagination', buyOrders, 1, 'buyersTable');

    setupTableSort('sellersTable', true, 1);
    setupTableSort('buyersTable', false, 1);
}

// 🧮 Render Table Rows
export function renderMarketTable(tableId, orders) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    tbody.innerHTML = '';

    const getSecColor = (sec) => {
        if (sec >= 0.9) return '#33cc33';   // High-sec
        if (sec >= 0.5) return '#ffaa00';   // Low-sec
        return '#ff3300';                   // Null-sec
    };

    if (!orders.length) {
        const fallbackCols = tableId === 'sellersTable' ? 7 : 8;
        tbody.innerHTML = `<tr><td colspan="${fallbackCols}">No orders.</td></tr>`;
        return;
    }

    const rows = orders.map(order => {
        const loc = appState.stationMap?.[order.location_id];
        const region = loc?.regionName ?? 'Unknown';
        const system = loc?.systemName ?? '';
        const station = loc?.stationName ?? `Station ${order.location_id}`;

        // Security comes from the system data in your locations.json
        // We need to look it up from the original locations data since it's not stored in stationMap
        let secRaw = null;
        if (loc && appState.locationsData) {
            const regionData = appState.locationsData[loc.regionName];
            const systemData = regionData?.[loc.systemName];
            if (systemData && typeof systemData.security === 'number') {
                secRaw = systemData.security;
            }
        }


        const secRounded = secRaw !== null ? Math.round(secRaw * 10) / 10 : 'N/A';
        const secColor = typeof secRounded === 'number' ? getSecColor(secRounded) : '#999';

        const regionCell = `<td style="color:#999;">${region}</td>`;
        const secCell = `<td><span style="color:${secColor}; font-weight:bold;">${secRounded}</span></td>`;
        const locationCell = `<td>${system ? system + ' - ' : ''}${station}</td>`;

        return tableId === 'sellersTable'
            ? `<tr>
                <td>${order.range || 'N/A'}</td>
                <td>${order.volume_remain.toLocaleString()}</td>
                <td>${formatISK(order.price)}</td>
                ${regionCell}
                ${secCell}
                ${locationCell}
                <td>${formatExpires(order.duration)}</td>
              </tr>`
            : `<tr>
                <td>${order.min_volume}</td>
                <td>${order.volume_remain.toLocaleString()}</td>
                <td>${formatISK(order.price)}</td>
                ${regionCell}
                ${secCell}
                ${locationCell}
                <td>${order.range || 'N/A'}</td>
                <td>${formatExpires(order.duration)}</td>
              </tr>`;
    });

    tbody.innerHTML = rows.join('');
}

// 🔁 Pagination
export function renderPagination(containerId, orders, currentPage, tableId) {
    const container = document.getElementById(containerId);
    if (!container || orders.length <= RESULTS_PER_PAGE) return;

    container.innerHTML = '';
    const totalPages = Math.ceil(orders.length / RESULTS_PER_PAGE);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.onclick = () => {
            const pageOrders = orders.slice((i - 1) * RESULTS_PER_PAGE, i * RESULTS_PER_PAGE);
            renderMarketTable(tableId, pageOrders);
            const isBuyers = tableId === 'buyersTable';
            setupTableSort(tableId, !isBuyers, 1);
            renderPagination(containerId, orders, i, tableId);
        };
        container.appendChild(btn);
    }
}

// 📐 Table Sorting
export function setupTableSort(tableId, ascending = true, columnIndex = 0) {
    const table = document.getElementById(tableId);
    if (!table) return;

    appState.currentSortState[tableId] ||= { column: columnIndex, ascending };
    const state = appState.currentSortState[tableId];

    sortTableByColumn(tableId, state.column, true, state.ascending);
    makeTableHeadersResizable(table);

    const headers = table.querySelectorAll('th.resizable');
    headers.forEach((th, i) => {
        th.removeEventListener('click', th._sortHandler);
        th._sortHandler = (e) => {
            if (e.target.classList.contains('resizer')) return;
            const sameCol = state.column === i;
            state.ascending = sameCol ? !state.ascending : true;
            state.column = i;
            sortTableByColumn(tableId, i, true, state.ascending);
        };
        th.addEventListener('click', th._sortHandler);

        th.setAttribute('draggable', 'true');
        th.dataset.index = i;

        th.ondragstart = e => e.dataTransfer.setData('sourceIndex', i.toString());
        th.ondragover = e => e.preventDefault();
        th.ondrop = e => {
            e.preventDefault();
            const from = parseInt(e.dataTransfer.getData('sourceIndex'), 10);
            const to = i;
            if (from !== to) reorderTableColumns(tableId, from, to);
        };
    });
}

// 🔀 Reorder Columns
function reorderTableColumns(tableId, from, to) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const headerRow = table.querySelector('thead tr');
    const headers = Array.from(headerRow.children);
    const movedHeader = headers[from];

    headerRow.insertBefore(movedHeader, from < to ? headers[to + 1] : headers[to]);

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cells = Array.from(row.children);
        const movedCell = cells[from];
        row.insertBefore(movedCell, from < to ? cells[to + 1] : cells[to]);
    });
}

// 🔢 Sort Table
export function sortTableByColumn(tableId, colIndex, isNumeric, ascending) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr')).sort((a, b) => {
        const valA = extractValue(a, colIndex);
        const valB = extractValue(b, colIndex);
        return typeof valA === 'number'
            ? (ascending ? valA - valB : valB - valA)
            : (ascending ? valA.localeCompare(valB) : valB.localeCompare(valA));
    });

    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));

    table.querySelectorAll('th.resizable').forEach(th => {
        if (!th.querySelector('.resizer')) {
            const span = document.createElement('span');
            span.className = 'resizer';
            span.style.cssText = `
            position: absolute;
            right: 0;
            top: 0;
            width: 6px;
            height: 100%;
            cursor: col-resize;
            user-select: none;
        `;
            th.style.position = 'relative'; // Needed for span to position correctly
            th.appendChild(span);
        }
    });
}

function extractValue(row, index) {
    const text = row.children[index]?.textContent?.trim() ?? '';
    const num = parseFloat(text.replace(/[,\s]/g, ''));
    return isNaN(num) ? text.toLowerCase() : num;
}

// 🪄 Header Resizing
export function makeTableHeadersResizable(table) {
    const MIN_WIDTH = 40;

    table.querySelectorAll('th.resizable').forEach(th => {
        if (!th.querySelector('.resizer')) {
            const resizer = document.createElement('span');
            resizer.className = 'resizer';
            resizer.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        width: 6px;
        height: 100%;
        cursor: col-resize;
        user-select: none;
        z-index: 1;
      `;
            th.style.position = 'relative';
            th.appendChild(resizer);
        }

        const resizer = th.querySelector('.resizer');
        let startX = 0;
        let startWidth = 0;
        let isResizing = false;

        resizer.addEventListener('mousedown', e => {
            startX = e.pageX;
            startWidth = th.offsetWidth;
            isResizing = true;

            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', e => {
            if (!isResizing) return;
            const newWidth = Math.max(startWidth + (e.pageX - startX), MIN_WIDTH);
            th.style.width = `${newWidth}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    });
}
