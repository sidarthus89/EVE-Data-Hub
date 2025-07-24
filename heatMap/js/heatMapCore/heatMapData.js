// heatMapData.js
import { ESI_BASE, SYSTEM_COORDS } from './heatMapConfig.js';

export async function fetchJumpData() {
    const url = `${ESI_BASE}/universe/system_jumps/`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ESI jump data fetch failed: ${res.status}`);
    const jumpData = await res.json(); // [{ system_id, ship_jumps }, ...]

    // Convert to map for easy lookup
    const jumpMap = new Map();
    jumpData.forEach(({ system_id, ship_jumps }) => {
        jumpMap.set(system_id, ship_jumps);
    });

    return jumpMap;
}

export function normalizeHeatValues(jumpMap) {
    const values = Array.from(jumpMap.values());
    const max = Math.max(...values);
    const min = Math.min(...values);

    const heatData = [];

    for (const [systemId, jumps] of jumpMap.entries()) {
        const coords = SYSTEM_COORDS[systemId];
        if (!coords) continue;

        // Normalize jump count from 0 → 1
        const intensity = (jumps - min) / (max - min || 1);

        heatData.push({
            systemId,
            intensity,
            x: coords.x,
            y: coords.y,
        });
    }

    return heatData;
}
