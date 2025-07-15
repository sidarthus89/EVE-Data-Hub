import { renderQuickbar } from "./quickbar.js";

export function setupEventListeners() {
    const marketTab = document.getElementById("marketTab");
    const quickbarTab = document.getElementById("quickbarTab");
    const menuList = document.getElementById("menuList");
    const quickbarList = document.getElementById("quickbarList");

    // Ensure both menuList and quickbarList exist before wiring
    if (marketTab && quickbarTab && menuList && quickbarList) {
        marketTab.addEventListener("click", () => {
            marketTab.classList.add("active");
            quickbarTab.classList.remove("active");

            menuList.style.display = "block";
            quickbarList.style.display = "none";
        });

        quickbarTab.addEventListener("click", () => {
            quickbarTab.classList.add("active");
            marketTab.classList.remove("active");

            menuList.style.display = "none";
            quickbarList.style.display = "block";

            renderQuickbar(true); // Ensure it re-renders favorites
        });
    }

}