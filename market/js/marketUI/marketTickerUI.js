// 🎨 marketTickerUI.js
import { getPLEXTickerStats } from '../marketLogic/marketTickerLogic.js';
import { formatISK } from '../marketUI/marketFormatting.js';


export async function renderTicker() {
    const container = document.querySelector('#plexTicker .marquee__content');
    const marquee = document.querySelector('#plexTicker');
    if (!container || !marquee) return;

    const stats = await getPLEXTickerStats();

    const baseContent = [
        { label: 'Highest Buy', value: stats.highestBuy, className: 'highest' },
        { label: 'Lowest Sell', value: stats.lowestSell, className: 'lowest' },
        { label: 'Average Sell', value: stats.averageSell, className: 'average' }
    ];

    container.innerHTML = '';

    const singleItem = document.createElement('div');
    singleItem.className = 'marquee__item';

    baseContent.forEach(({ label, value, className }) => {
        const span = document.createElement('span');
        span.className = `marquee__text ${className}`;
        span.textContent = `PLEX — ${label}: ${formatISK(value)} • `;
        singleItem.appendChild(span);
    });

    container.appendChild(singleItem);
    container.offsetWidth;

    const itemWidth = singleItem.offsetWidth;
    const containerWidth = marquee.offsetWidth;
    const numberOfCopies = Math.ceil((containerWidth / itemWidth) * 2) + 2;

    for (let i = 1; i < numberOfCopies; i++) {
        container.appendChild(singleItem.cloneNode(true));
    }

    const speedFactor = 60;
    const duration = `${itemWidth / speedFactor}s`;
    const animationName = `marquee-scroll-${Date.now()}`;
    const keyframes = `
        @keyframes ${animationName} {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${itemWidth}px); }
        }
    `;

    const existing = document.querySelector('#marquee-keyframes');
    if (existing) existing.remove();

    const styleTag = document.createElement('style');
    styleTag.id = 'marquee-keyframes';
    styleTag.textContent = keyframes;
    document.head.appendChild(styleTag);

    container.style.animation = `${animationName} ${duration} linear infinite`;
}
