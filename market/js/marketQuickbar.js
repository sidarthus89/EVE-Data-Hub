import { appState, elements } from "./marketConfig.js";
import { selectItem } from "./itemViewer.js";

renderQuickbar(true); // Or toggle based on view state


export function addToQuickbar(item) {
    if (!item?.typeID || !item?.typeName) return;

    const exists = (appState.quickbarItems || []).some(q => q.type_id === item.typeID);
    if (exists) return;

    const newEntry = {
        type_id: item.typeID,
        name: item.typeName
    };

    appState.quickbarItems = [...(appState.quickbarItems || []), newEntry];
    localStorage.setItem("quickbarItems", JSON.stringify(appState.quickbarItems));
    renderQuickbar(true);
}


// 📋 Render the Quickbar Panel
export function renderQuickbar(show) {
    if (!Array.isArray(appState.quickbarItems)) {
        const stored = localStorage.getItem("quickbarItems");
        appState.quickbarItems = stored ? JSON.parse(stored) : [];
    }

    const container = document.getElementById("sidebar");
    let quickbarEl = document.getElementById("quickbarList");
    let headerRow = document.getElementById("quickbarHeader");

    // Inject header row if missing
    if (!headerRow) {
        headerRow = document.createElement("div");
        headerRow.id = "quickbarHeader";
        headerRow.className = "quickbar-header";
        headerRow.innerHTML = `
            <button class="qb-btn" title="Export"><img src="../assets/icons/export.png" /></button>
            <button class="qb-btn" title="Import"><img src="../assets/icons/import.png" /></button>
            <button class="qb-btn" title="Delete All"><img src="../assets/icons/trash.png" /></button>
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

    // Render list items
    quickbarEl.innerHTML = "";

    if (show) {
        const items = appState.quickbarItems || [];
        if (items.length === 0) {
            quickbarEl.innerHTML = "<li style='padding: 6px 10px; color: #999;'>Your quickbar is empty.</li>";
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
                label.textContent = item.name;
                label.addEventListener("click", () => selectItem(item.type_id));

                li.append(removeBtn, label);
                quickbarEl.appendChild(li);
            });

        }
        quickbarEl.style.display = "block";
    } else {
        quickbarEl.style.display = "none";
    }
}

// 🛠 Attach Button Handlers (Export / Import / Delete All)
function setupQuickbarActions() {
    const [exportBtn, importBtn, deleteBtn] = document.querySelectorAll(".qb-btn");

    exportBtn?.addEventListener("click", () => {
        const data = JSON.stringify(appState.quickbarItems || [], null, 2);
        navigator.clipboard.writeText(data)
            .then(() => console.log("Quickbar copied to clipboard"))
            .catch(err => console.warn("Clipboard error", err));
    });

    importBtn?.addEventListener("click", () => {
        const pasted = prompt("Paste your Quickbar JSON:");
        try {
            const data = JSON.parse(pasted);
            if (Array.isArray(data)) {
                appState.quickbarItems = data;
                localStorage.setItem("quickbarItems", JSON.stringify(data));
                renderQuickbar(true);
            }
        } catch (err) {
            console.warn("Invalid JSON");
        }
    });

    deleteBtn?.addEventListener("click", () => {
        if (confirm("Clear all Quickbar items?")) {
            appState.quickbarItems = [];
            localStorage.setItem("quickbarItems", "[]");
            renderQuickbar(true);
        }
    });
}