// 🌍 locationSelector.js
// Populates region, constellation, and system dropdowns based on appState

import { APP_CONFIG, appState, elements } from './marketConfig.js';

// 🌎 Initialize Region Dropdown
export function initializeDropdowns() {
    const regionNames = Object.keys(appState.locations).sort();

    elements.regionSelector.innerHTML = '<option value="all">All Regions</option>';
    regionNames.forEach(regionName => {
        const option = document.createElement('option');
        option.value = regionName;
        option.textContent = regionName;
        elements.regionSelector.appendChild(option);
    });

    disableAndReset(elements.constellationSelector, 'Select a constellation');
    disableAndReset(elements.systemSelector, 'Select a system');
}

// 🌌 Populate Constellation Dropdown on Region Change
export function handleRegionChange() {
    const selectedRegion = elements.regionSelector.value;

    disableAndReset(elements.constellationSelector, 'Select a constellation');
    disableAndReset(elements.systemSelector, 'Select a system');
    if (selectedRegion === 'all') return;

    const regionData = appState.locations[selectedRegion];
    if (!regionData) return;

    const constellationNames = Object.keys(regionData)
        .filter(key => key !== 'regionID')
        .sort();

    constellationNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        elements.constellationSelector.appendChild(option);
    });

    elements.constellationSelector.disabled = false;
}

// 🌠 Populate System Dropdown on Constellation Change
export function handleConstellationChange() {
    const selectedRegion = elements.regionSelector.value;
    const selectedConstellation = elements.constellationSelector.value;

    disableAndReset(elements.systemSelector, 'Select a system');
    if (!selectedRegion || !selectedConstellation) return;

    const regionData = appState.locations[selectedRegion];
    const constellationData = regionData?.[selectedConstellation];
    if (!constellationData) return;

    const systemNames = Object.keys(constellationData)
        .filter(key => key !== 'constellationID')
        .sort();

    systemNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        elements.systemSelector.appendChild(option);
    });

    elements.systemSelector.disabled = false;
}

// 🔧 Utility: Reset a dropdown with placeholder
function disableAndReset(selectElement, placeholder) {
    selectElement.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
    selectElement.disabled = true;
}

// 🔍 Region ID Lookup by Name
export function getRegionIDByName(name) {
    return appState.locations?.[name]?.regionID || APP_CONFIG.DEFAULT_REGION_ID;
}