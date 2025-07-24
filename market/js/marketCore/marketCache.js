import { elements } from './marketConfig.js';


export function cacheElements() {
    const queryMap = {
        searchBox: '#searchBox',
        searchResults: '#searchResults',
        menuList: '#menuList',
        itemIcon: '#itemIcon',
        itemName: '#itemName',
        itemBreadcrumb: '#itemBreadcrumb',
        regionSelector: '#regionSelector',
        viewMarketLink: '#viewMarketLink',
        viewHistoryLink: '#viewHistoryLink',
        viewerContainer: '#itemViewerContainer',
        marketTables: '#itemPriceTables',
        historyChart: '#itemHistorySection',
        regionBreadcrumb: '#regionBreadcrumb',
        regionLabel: '#regionLabel'
    };

    Object.entries(queryMap).forEach(([key, selector]) => {
        elements[key] = document.querySelector(selector);
    });

    elements.viewerIconWrapper = document.querySelector('.viewer-icon-container');
}
