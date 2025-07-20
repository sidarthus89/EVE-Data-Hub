import { appState } from './marketConfig.js';

let chartInstance = null;
let debounceTimer = null;
let navigatorChartInstance = null;


// 🔢 Compute Moving Average
function computeMovingAverage(data, key, period) {
  return data.map((_, i, arr) => {
    if (i < period - 1) return null;
    return arr.slice(i - period + 1, i + 1).reduce((sum, d) => sum + d[key], 0) / period;
  });
}

// 📊 Render Price History Chart
export function renderScopedHistoryChart(regionID, typeID) {
  console.log("[chart] Drawing history chart for:", { regionID, typeID });

  const fullHistory = appState.marketHistory?.[typeID];
  if (!fullHistory?.length) {
    console.warn('No history data found for:', typeID);
    return;
  }

  const { leftValue, rightValue } = window.chartSlider?.getValues?.() || { leftValue: 0, rightValue: 30 };
  const sliceStart = Math.max(365 - rightValue, 0);
  const sliceEnd = Math.min(365 - leftValue, fullHistory.length);
  const history = fullHistory.slice(sliceStart, sliceEnd);

  if (!history.length) {
    console.warn('Scoped slice returned no entries:', { sliceStart, sliceEnd });
    return;
  }

  const canvas = document.getElementById('historyChart');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) {
    console.error('Canvas context missing for #historyChart');
    return;
  }

  const labels = history.map(h =>
    new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  );
  const medians = history.map(h => h.average);
  const volumes = history.map(h => h.volume);
  const ma5 = computeMovingAverage(history, 'average', 5);
  const ma20 = computeMovingAverage(history, 'average', 20);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Average Price',
          data: medians,
          borderColor: '#ffcc33',
          fill: false, // ⛔ No fill
          pointRadius: 3,
          pointBackgroundColor: '#ffcc33',
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: '5-Day MA',
          data: ma5,
          borderColor: '#66ccff',
          fill: false,
          pointRadius: 0,
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: '20-Day MA',
          data: ma20,
          borderColor: '#ff6633',
          fill: false,
          pointRadius: 0,
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          type: 'bar',
          label: 'Volume',
          data: volumes,
          backgroundColor: 'rgba(0,255,153,0.3)',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: '#ccc' },
          grid: { color: '#222' }
        },
        y: {
          position: 'left',
          title: { display: true, text: 'ISK Price', color: '#ccc' },
          ticks: { color: '#ccc' },
          grid: { color: '#333' }
        },
        y1: {
          position: 'right',
          title: { display: true, text: 'Volume', color: '#ccc' },
          ticks: { color: '#ccc' },
          grid: { drawOnChartArea: false }
        }
      },
      plugins: {
        legend: { labels: { color: '#ccc' } },
        tooltip: { mode: 'index', intersect: false },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'y',
          scaleMode: 'y'
        }

      }
    }
  });

  const rangeDisplay = document.getElementById('rangeDisplay');
  if (rangeDisplay) {
    rangeDisplay.textContent = `${rightValue - leftValue} days`;
  }
}

// 📉 Render Compact Navigator Chart
export function renderNavigatorChart(typeID) {
  const fullHistory = appState.marketHistory?.[typeID];
  if (!fullHistory?.length) return;

  const canvas = document.getElementById('navigatorChart');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  // 🧼 Destroy previous chart instance
  if (navigatorChartInstance) {
    navigatorChartInstance.destroy();
    navigatorChartInstance = null;
  }

  const labels = fullHistory.map(h =>
    new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  );
  const prices = fullHistory.map(h => h.average);

  navigatorChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Navigator Trend',
        data: prices,
        borderColor: '#aaa',
        backgroundColor: 'rgba(180,180,180,0.3)',
        fill: true,
        pointRadius: 0,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { ticks: { display: false }, grid: { display: false } },
        y: { display: false }
      }
    }
  });
}

export function makeScopeOverlayDraggable() {
  const overlay = document.getElementById('scopeOverlay');
  const wrapper = document.getElementById('navigatorWrapper');
  if (!overlay || !wrapper) return;

  let startX = 0;
  let startLeft = 0;
  let dragging = false;

  overlay.addEventListener('mousedown', e => {
    dragging = true;
    startX = e.clientX;
    startLeft = overlay.offsetLeft;

    const wrapperRect = wrapper.getBoundingClientRect();

    function onMove(e) {
      if (!dragging) return;
      const deltaX = e.clientX - startX;
      const newLeft = Math.max(0, Math.min(startLeft + deltaX, wrapperRect.width - overlay.offsetWidth));
      overlay.style.left = `${(newLeft / wrapperRect.width) * 100}%`;
    }

    function onUp() {
      dragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}