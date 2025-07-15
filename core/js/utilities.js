import { appState, elements, APP_CONFIG } from "./marketConfig.js"
import { handleItemSelection } from "./itemDispatcher.js";

export function getIconPath(typeID, size = 32, ext = "png") {
    return `${APP_CONFIG.ICON_BASE_URL}${typeID}_${size}.${ext}`;
}

export function getGroupIcon(groupObject) {
    return APP_CONFIG.FALLBACK_ICON;
}

export function formatExpires(duration) {
    return `${duration} days`;
}

export function formatISK(value) {
    return value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + " ISK";
}

export function buildFlatItemList(menuData) {
    appState.flatItemList = [];

    function scan(node) {
        if (!node) return;

        if (Array.isArray(node)) {
            node.forEach(scan);
            return;
        }

        if (isValidItem(node)) {
            appState.flatItemList.push({
                name: node.typeName.trim(),
                type_id: node.typeID
            });
            return;
        }

        if (typeof node === "object") {
            Object.entries(node).forEach(([key, value]) => {
                if (key !== "_info") scan(value);
            });
        }
    }

    function isValidItem(obj) {
        return (
            typeof obj?.typeName === "string" &&
            obj?.published === true &&
            (typeof obj.typeID === "number" || /^\d+$/.test(obj.typeID))
        );
    }

    scan(menuData);
}

export function initializeMarketMenu() {
    const menuData = appState.marketMenu;
    elements.menuList.innerHTML = "";
    buildFlatItemList(menuData);

    Object.entries(menuData).forEach(([groupName, groupContent]) => {
        if (groupName === "_info" || typeof groupContent !== "object") return;
        renderGroup(groupName, groupContent, elements.menuList);
    });
}

export function renderGroup(groupName, groupObject, parentElement) {
    const groupLi = document.createElement("li");
    groupLi.className = "collapsible";
    groupLi.setAttribute("aria-expanded", "false");

    const headerDiv = document.createElement("div");
    headerDiv.className = "group-label-wrapper";

    const arrowSpan = document.createElement("span");
    arrowSpan.className = "group-arrow";
    arrowSpan.textContent = "▶";
    arrowSpan.style.marginRight = "6px";
    arrowSpan.style.transition = "transform 0.2s ease-in-out";

    const iconImg = document.createElement("img");
    iconImg.className = "group-icon";
    iconImg.src = getGroupIcon(groupObject);

    const labelSpan = document.createElement("span");
    labelSpan.className = "group-label";
    labelSpan.textContent = groupName;

    headerDiv.append(arrowSpan, iconImg, labelSpan);
    groupLi.appendChild(headerDiv);
    parentElement.appendChild(groupLi);

    let subList = null;

    headerDiv.addEventListener("click", e => {
        e.stopPropagation();
        const expanded = groupLi.classList.toggle("expanded");
        groupLi.setAttribute("aria-expanded", expanded);
        arrowSpan.style.transform = expanded ? "rotate(90deg)" : "rotate(0deg)";

        if (!subList) {
            subList = createSubMenu(groupObject);
            groupLi.appendChild(subList);
        } else {
            subList.classList.toggle("show");
        }
    });
}

export function createSubMenu(groupObject) {
    const subList = document.createElement("ul");
    subList.className = "subcategories show";

    Object.entries(groupObject).forEach(([key, value]) => {
        if (key === "_info") return;

        if (Array.isArray(value)) {
            value.forEach(item => {
                const itemLi = document.createElement("li");
                itemLi.className = "market-item";
                itemLi.dataset.typeId = item.typeID;
                icon.alt = item.typeName;
                icon.className = "submenu-icon";

                const label = document.createElement("span");
                label.textContent = item.typeName;

                itemLi.append(icon, label);

                itemLi.addEventListener("click", () => {
                    if (item.typeID) handleItemSelection(item.typeID);
                });

                subList.appendChild(itemLi);
            });
        } else if (typeof value === "object") {
            renderGroup(key, value, subList);
        }
    });

    return subList;
}

// 🧱 DOM Element Caching for Early Access
export function cacheElements() {
    elements.searchBox = document.getElementById("searchBox");
    elements.searchResults = document.getElementById("searchResults");
    elements.menuList = document.getElementById("menuList");
    elements.itemIcon = document.getElementById("itemIcon");
    elements.itemName = document.getElementById("itemName");
    elements.itemBreadcrumb = document.getElementById("itemBreadcrumb");
    elements.regionSelector = document.getElementById("regionSelector");
    elements.constellationSelector = document.getElementById("constellationSelector");
    elements.systemSelector = document.getElementById("systemSelector");
}