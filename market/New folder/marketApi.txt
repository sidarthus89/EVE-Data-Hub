const BASE_URL = "https://esi.evetech.net/latest/markets";

export async function fetchRegionOrders(typeID, regionID) {
    const url = `${BASE_URL}/${regionID}/orders/?type_id=${typeID}`;
    const response = await fetch(url);
    return response.ok ? await response.json() : [];
}

export async function fetchMarketGroups() {
    const url = `${BASE_URL}/groups`;
    const response = await fetch(url);
    return response.ok ? await response.json() : [];
}

export async function fetchItemMarketHistory(typeID, regionID) {
    const url = `${BASE_URL}/${regionID}/history/?type_id=${typeID}`;
    const response = await fetch(url);
    return response.ok ? await response.json() : [];
}