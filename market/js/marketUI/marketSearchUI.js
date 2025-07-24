//marketSearchUI.js

// 🔎 Render Search Results
function renderSearchResults(query) {
    const results = elements.searchResults;
    results.innerHTML = '';

    const matches = appState.flatItemList
        .filter(item => item.name?.toLowerCase().includes(query))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, MAX_RESULTS);

    if (
        matches.length === 1 &&
        matches[0].name.toLowerCase() === query
    ) {
        onItemSelected(matches[0].type_id);
        elements.searchBox.value = matches[0].name;
        hideSearchResults();
        return;
    }

    if (matches.length === 0) {
        results.innerHTML = `<li class="disabled">No matches found</li>`;
    } else {
        matches.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.name;
            li.dataset.typeid = item.type_id;
            results.appendChild(li);
        });
        results.firstChild.classList.add('active');
    }

    results.classList.remove('hidden');
    appState.isSearchActive = true;
}

// 🧹 Hide Suggestion List
function hideSearchResults() {
    const results = elements.searchResults;
    results.innerHTML = '';
    results.classList.add('hidden');
    appState.isSearchActive = false;
}