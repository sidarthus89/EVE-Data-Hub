//marketSidebarUI.js

import { setupQuickbarActions } from '../marketLogic/marketSidebarLogic.js';
import { selectItem } from '../marketCore/marketViewManager.js';



// 📋 Render the Quickbar Panel
export function renderQuickbar(show) {

    if (!Array.isArray(appState.quickbarItems)) {
        const stored = localStorage.getItem("quickbarItems");
        appState.quickbarItems = stored ? JSON.parse(stored) : [];
    }

    const items = appState.quickbarItems || [];

    const container = document.getElementById("sidebar");
    let quickbarEl = document.getElementById("quickbarList");
    let headerRow = document.getElementById("quickbarHeader");

    // Inject header row if missing
    if (!headerRow) {
        headerRow = document.createElement("div");
        headerRow.id = "quickbarHeader";
        headerRow.className = "quickbar-header";
        headerRow.innerHTML = `
            <div class="qb-action">
                <button class="qb-btn" title="Export">
                    <img src="./market/assets/export.png" alt="Export" />
                </button>
                <span class="qb-label">Export</span>
            </div>

            <div class="qb-action">
                <button class="qb-btn" title="Import">
                    <img src="./market/assets/import.png" alt="Import" />
                </button>
                <span class="qb-label">Import</span>
            </div>

            <div class="qb-action">
                <button class="qb-btn" title="Delete All">
                    <img src="./market/assets/delete-all.png" alt="Delete All" />
                </button>
                <span class="qb-label">Delete All</span>
            </div>
        `;
        if (container) container.insertBefore(headerRow, quickbarEl);
        setupQuickbarActions();
    }

    // Inject quickbar list if missing
    if (!quickbarEl) {
        quickbarEl = document.createElement("ul");
        quickbarEl.id = "quickbarList";
        quickbarEl.className = "menuList";
        quickbarEl.style.marginTop = "10px";
        container?.appendChild(quickbarEl);
    }

    quickbarEl.innerHTML = "";

    if (show) {
        if (items.length === 0) {
            quickbarEl.innerHTML = `<li style='padding: 6px 10px; color: #999;'>Your quickbar is empty.</li>`;
        } else {
            items.forEach(item => {
                const li = document.createElement("li");
                li.className = "market-item";
                li.dataset.typeId = item.type_id;

                const removeBtn = document.createElement("button");
                removeBtn.textContent = "×";
                removeBtn.className = "quickbar-remove";
                removeBtn.title = "Remove from Quickbar";
                removeBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    appState.quickbarItems = appState.quickbarItems.filter(q => q.type_id !== item.type_id);
                    localStorage.setItem("quickbarItems", JSON.stringify(appState.quickbarItems));
                    renderQuickbar(true);
                });

                const label = document.createElement("span");
                label.textContent = item.typeName ?? "Unnamed Item";
                label.className = "qb-label";
                label.addEventListener("click", () => selectItem(item));


                li.append(removeBtn, label);
                quickbarEl.appendChild(li);
            });
        }
        quickbarEl.style.display = "block";
    } else {
        quickbarEl.style.display = "none";
    }

    const searchBox = document.getElementById('searchBox');
    const clearBtn = document.getElementById('searchClear');

    searchBox.addEventListener('input', () => {
        clearBtn.style.display = searchBox.value ? 'block' : 'none';
    });

    clearBtn.addEventListener('click', () => {
        searchBox.value = '';
        clearBtn.style.display = 'none';

        // Optional: trigger re-render or reset results
        // renderQuickbar(true); or clear search results
    });
}
