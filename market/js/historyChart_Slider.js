import { appState } from './marketConfig.js';

let chartInstance = null;
let debounceTimer = null;

// 🔢 Compute Moving Average
function computeMovingAverage(data, key, period) {
  return data.map((_, i, arr) => {
    if (i < period - 1) return null;
    return arr.slice(i - period + 1, i + 1).reduce((sum, d) => sum + d[key], 0) / period;
  });
}

// 🧠 Slice Data Based on Slider Range
function getScopedHistory(typeID) {
  const fullHistory = appState.marketHistory?.[typeID] || [];
  const { leftValue, rightValue } = window.chartSlider?.getValues?.() || { leftValue: 0, rightValue: 30 };
  const start = Math.max(365 - rightValue, 0);
  const end = Math.min(365 - leftValue, fullHistory.length);
  return fullHistory.slice(start, end);
}

// 📊 Render Price History Chart
export function renderScopedHistoryChart(typeID) {
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
          pan: { enabled: true, mode: 'x' },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'y', overScaleMode: 'y' }
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

  const ctx = document.getElementById('navigatorChart')?.getContext('2d');
  if (!ctx) return;

  const labels = fullHistory.map(h => new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  const prices = fullHistory.map(h => h.average);

  new Chart(ctx, {
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

// 🛠️ Initialize Slider & Sync Chart
export function initializeDualRangeSlider({ min, max, leftValue, rightValue }) {
  const leftHandle = document.getElementById('leftHandle');
  const rightHandle = document.getElementById('rightHandle');
  const selection = document.getElementById('selection');
  const track = document.querySelector('.dual-range-container');

  const slider = {
    min,
    max,
    leftValue,
    rightValue,
    getValues() {
      return { leftValue: this.leftValue, rightValue: this.rightValue };
    },
    setValues({ leftValue, rightValue }) {
      this.leftValue = Math.max(min, Math.min(rightValue, leftValue));
      this.rightValue = Math.min(max, Math.max(leftValue, rightValue));
      updatePositions();
    }
  };

  function updatePositions() {
    const range = max - min;
    const leftPercent = ((slider.leftValue - min) / range) * 100;
    const rightPercent = ((slider.rightValue - min) / range) * 100;
    const width = rightPercent - leftPercent;

    leftHandle.style.left = `${leftPercent}%`;
    rightHandle.style.left = `${rightPercent}%`;
    selection.style.left = `${leftPercent}%`;
    selection.style.width = `${width}%`;
  }

  function attachDrag(handle, side) {
    handle.addEventListener('mousedown', e => {
      const startX = e.clientX;
      const trackRect = track.getBoundingClientRect();
      const range = max - min;

      function onMove(e) {
        const deltaX = e.clientX - startX;
        const percent = (deltaX / trackRect.width) * 100;
        const daysDelta = Math.round((percent * range) / 100);

        if (side === 'left') {
          slider.leftValue = Math.max(min, Math.min(slider.rightValue - 1, slider.leftValue + daysDelta));
        } else {
          slider.rightValue = Math.min(max, Math.max(slider.leftValue + 1, slider.rightValue + daysDelta));
        }

        updatePositions();
        renderScopedHistoryChart(appState.selectedTypeID);
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  attachDrag(leftHandle, 'left');
  attachDrag(rightHandle, 'right');
  updatePositions();
  window.chartSlider = slider;
  return slider;
}

// 🔁 Fallback Listener
export function setupSliderChartSync(typeID) {
  renderScopedHistoryChart(typeID);
}