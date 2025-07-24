//marketHistoryUI.js

import { appState } from '../marketCore/marketConfig.js';
import { setHistoryViewActive, fetchMarketHistory } from '../marketLogic/marketHistoryLogic.js'; // adjust path if needed
import { renderNavigatorChart } from '../marketUI/historyNavigatorUI.js';

let chartInstance = null;
let sliderStart = 335;
let sliderEnd = 365;
let renderChart = () => { }; // 👈 initialize as empty function

function computeMovingAverage(data, key, period) {
  return data.map((_, i, arr) => {
    if (i < period - 1) return null;
    const slice = arr.slice(i - period + 1, i + 1);
    return slice.reduce((sum, d) => sum + d[key], 0) / period;
  });
}

export function renderScopedHistoryChart(regionID, typeID) {
  const section = document.getElementById('itemHistorySection');
  const canvas = document.getElementById('historyChart');

  if (!canvas || !section) {
    console.error('❌ Missing canvas or section container');
    return;
  }

  const container = canvas.parentElement;

  function checkAndRender(attempts = 0) {
    const sectionHeight = section.offsetHeight;
    const containerHeight = container?.offsetHeight || 0;
    const isDisplayed = getComputedStyle(section).display !== 'none';

    if (isDisplayed && sectionHeight > 0 && containerHeight > 0) {
      setupSliderInteractivity();
      renderChart();
    } else if (attempts < 50) {
      setTimeout(() => checkAndRender(attempts + 1), 50);
    } else {
      container.style.height = '400px';
      setupSliderInteractivity();
      renderChart();
    }
  }

  renderChart = function () {
    const fullHistory = appState.marketHistory?.[typeID];
    if (!fullHistory?.length) {
      console.warn('⚠️ No history data available for:', typeID);
      return;
    }

    const history = fullHistory.slice(sliderStart, sliderEnd);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ Canvas context missing');
      return;
    }

    canvas.removeAttribute('style');
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const labels = history.map(h =>
      new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    );
    const medians = history.map(h => h.average);
    const lows = history.map(h => h.low);
    const highs = history.map(h => h.high);
    const volumes = history.map(h => h.volume);
    const ma5 = computeMovingAverage(history, 'average', 5);
    const ma20 = computeMovingAverage(history, 'average', 20);

    if (chartInstance) chartInstance.destroy();

    try {
      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            // Donchian Channel - highs (fill to lows)
            {
              type: 'line',
              label: 'Highs for Channel',
              data: highs,
              borderColor: 'rgba(0,0,0,0)',
              backgroundColor: 'rgba(128,128,128,0.15)',
              pointRadius: 0,
              fill: '-1',
              yAxisID: 'y'
            },
            {
              type: 'line',
              label: 'Lows for Channel',
              data: lows,
              borderColor: 'rgba(0,0,0,0)',
              pointRadius: 0,
              fill: false,
              yAxisID: 'y'
            },

            // Price and Moving Averages
            {
              type: 'line',
              label: 'Median Daily Price',
              data: medians,
              borderColor: '#ffcc33',
              backgroundColor: '#ffcc33',
              pointRadius: 2,
              pointHoverRadius: 3,
              fill: false,
              tension: 0.3,
              yAxisID: 'y'
            },
            {
              type: 'line',
              label: '5-Day MA',
              data: ma5,
              borderColor: '#66ccff',
              borderWidth: 1.5,
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
              borderWidth: 1.5,
              fill: false,
              pointRadius: 0,
              tension: 0.3,
              yAxisID: 'y'
            },

            // Volume
            {
              type: 'bar',
              label: 'Volume',
              data: volumes,
              backgroundColor: 'rgba(0, 180, 150, 0.4)',
              borderColor: 'rgba(0, 180, 150, 0.8)',
              borderWidth: 1,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: false,
          interaction: {
            mode: 'nearest',
            intersect: false
          },
          scales: {
            x: {
              ticks: {
                color: '#bbb',
                font: { size: 10 }
              },
              grid: {
                color: '#333'
              }
            },
            y: {
              position: 'left',
              title: {
                display: true,
                text: 'ISK Price',
                color: '#bbb'
              },
              ticks: { color: '#bbb' },
              grid: { color: '#333' }
            },
            y1: {
              position: 'right',
              title: {
                display: true,
                text: 'Volume',
                color: '#bbb'
              },
              ticks: { color: '#bbb' },
              grid: { drawOnChartArea: false }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: '#bbb',
                usePointStyle: true,
                boxWidth: 8
              }
            },
            tooltip: {
              mode: 'nearest',
              intersect: false,
              backgroundColor: '#222',
              titleColor: '#fff',
              bodyColor: '#ccc',
              borderColor: '#555',
              borderWidth: 1
            }
          }
        }
      });
    } catch (error) {
      console.error('❌ Chart.js error:', error);
    }
  }


  checkAndRender();
  renderNavigatorChart(typeID);
}



export function updateSliderScope(leftPx, widthPx) {
  const overlay = document.getElementById('chartSliderOverlay');
  const totalDays = 365; // always show 365 days in full chart
  const overlayWidth = overlay.offsetWidth;
  const pxPerDay = overlayWidth / totalDays;

  sliderStart = Math.max(0, Math.floor(leftPx / pxPerDay));
  sliderEnd = Math.min(totalDays, Math.floor((leftPx + widthPx) / pxPerDay));

  const counter = document.querySelector('.slider-counter');
  if (counter) counter.textContent = `${sliderEnd - sliderStart}d`;

  renderChart();
}

function setupSliderInteractivity() {
  const slider = document.getElementById('chartSlider');
  const overlay = document.getElementById('chartSliderOverlay');
  const leftHandle = slider.querySelector('.slider-handle.left');
  const rightHandle = slider.querySelector('.slider-handle.right');
  const counter = slider.querySelector('.slider-counter');

  if (!slider || !overlay) return;

  let isDragging = false;
  let resizing = null;
  let dragStartX = 0;
  let initialLeft = 0;
  let initialWidth = 0;

  slider.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('slider-handle')) return;
    isDragging = true;
    dragStartX = e.clientX;
    initialLeft = slider.offsetLeft;
    slider.style.cursor = 'grabbing';
  });

  leftHandle.addEventListener('mousedown', (e) => {
    resizing = 'left';
    dragStartX = e.clientX;
    initialLeft = slider.offsetLeft;
    initialWidth = slider.offsetWidth;
    e.stopPropagation();
  });

  rightHandle.addEventListener('mousedown', (e) => {
    resizing = 'right';
    dragStartX = e.clientX;
    initialLeft = slider.offsetLeft;
    initialWidth = slider.offsetWidth;
    e.stopPropagation();
  });

  document.addEventListener('mousemove', (e) => {
    const deltaX = e.clientX - dragStartX;

    if (isDragging) {
      const newLeft = Math.max(0, Math.min(initialLeft + deltaX, overlay.offsetWidth - slider.offsetWidth));
      slider.style.left = `${newLeft}px`;
      updateSliderScope(newLeft, slider.offsetWidth);
    }

    if (resizing === 'left') {
      const newLeft = Math.max(0, initialLeft + deltaX);
      const newWidth = Math.max(20, initialWidth - deltaX);
      slider.style.left = `${newLeft}px`;
      slider.style.width = `${newWidth}px`;
      updateSliderScope(newLeft, newWidth);
    }

    if (resizing === 'right') {
      const newWidth = Math.max(20, initialWidth + deltaX);
      slider.style.width = `${newWidth}px`;
      updateSliderScope(initialLeft, newWidth);
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    resizing = null;
    slider.style.cursor = 'grab';
  });

  // Initialize counter if needed
  if (!counter) {
    const label = document.createElement('div');
    label.className = 'slider-counter';
    label.textContent = `${sliderEnd - sliderStart}d`;
    slider.appendChild(label);
  }
}

export function renderHistoryView() {
  const typeID = appState.selectedTypeID;
  const regionID = appState.selectedRegionID;

  if (!typeID || !regionID) {
    console.warn('⚠️ No item selected — skipping history view render.');
    return;
  }

  setHistoryViewActive(true);

  fetchMarketHistory(typeID, regionID).then(() => {
    requestAnimationFrame(() => {
      renderScopedHistoryChart(regionID, typeID);
    });
  });
}

export function getChartCanvas() {
  return document.getElementById('historyChart');
}
