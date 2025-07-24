// 📦 historyNavigatorLogic.js
import { appState } from '../marketCore/marketConfig.js';

export function getNavigatorData(typeID) {
    const fullHistory = appState.marketHistory?.[typeID];
    if (!fullHistory || fullHistory.length === 0) return [];

    // Always get the latest 365 days
    return fullHistory.slice(-365);
}

export function getNavigatorLabels(history) {
    return history.map(h =>
        new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    );
}

export function getNavigatorPrices(history) {
    return history.map(h => h.average);
}
