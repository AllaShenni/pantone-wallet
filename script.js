// Pantone Wallet - Dynamic Color Logic
const wallet = document.getElementById('wallet');
const haveAmount = document.getElementById('have-amount');
const wantAmount = document.getElementById('want-amount');
const haveRateInfo = document.getElementById('have-rate-info');
const wantRateInfo = document.getElementById('want-rate-info');
const haveTabs = document.querySelectorAll('#have-tabs .tab');
const wantTabs = document.querySelectorAll('#want-tabs .tab');
const haveMoreSelect = document.getElementById('have-more-select');
const wantMoreSelect = document.getElementById('want-more-select');

// База Pantone — все 27 цветов года с 2000 по 2026 (локальный fallback на случай если pantone.json не загрузится)
let pantoneDatabase = {
    "2000": { "name": "Cerulean Blue", "hex": "#9BB7D4" },
    "2001": { "name": "Fuchsia Rose", "hex": "#C74375" },
    "2002": { "name": "True Red", "hex": "#BF1932" },
    "2003": { "name": "Aqua Sky", "hex": "#7BC4C4" },
    "2004": { "name": "Tigerlily", "hex": "#E2583E" },
    "2005": { "name": "Blue Turquoise", "hex": "#53B0AE" },
    "2006": { "name": "Sand Dollar", "hex": "#DECDBE" },
    "2007": { "name": "Chili Pepper", "hex": "#9B1B30" },
    "2008": { "name": "Blue Iris", "hex": "#5A5B9F" },
    "2009": { "name": "Mimosa", "hex": "#F0C05A" },
    "2010": { "name": "Turquoise", "hex": "#45B5AA" },
    "2011": { "name": "Honeysuckle", "hex": "#D94F70" },
    "2012": { "name": "Tangerine Tango", "hex": "#DD4124" },
    "2013": { "name": "Emerald", "hex": "#009B77" },
    "2014": { "name": "Radiant Orchid", "hex": "#B163A3" },
    "2015": { "name": "Marsala", "hex": "#955251" },
    "2016": { "name": "Rose Quartz & Serenity", "hex": "#F7CAC9" },
    "2017": { "name": "Greenery", "hex": "#88B04B" },
    "2018": { "name": "Ultra Violet", "hex": "#5F4B8B" },
    "2019": { "name": "Living Coral", "hex": "#FF6F61" },
    "2020": { "name": "Classic Blue", "hex": "#0F4C81" },
    "2021": { "name": "Ultimate Gray & Illuminating", "hex": "#939597" },
    "2022": { "name": "Very Peri", "hex": "#6667AB" },
    "2023": { "name": "Viva Magenta", "hex": "#BB2649" },
    "2024": { "name": "Peach Fuzz", "hex": "#FFBE98" },
    "2025": { "name": "Mocha Mousse", "hex": "#A47864" },
    "2026": { "name": "Cloud Dancer", "hex": "#F0F0F0" }
};

// Функция синхронизации цветов из внешнего источника (GitHub/JSON)
async function syncPantoneDatabase() {
    try {
        const response = await fetch('./pantone.json');
        if (response.ok) {
            const remoteData = await response.json();
            pantoneDatabase = { ...pantoneDatabase, ...remoteData };
        }
    } catch (e) {
        // Fallback to local database
    }
}

let exchangeRates = {};
let currentHaveCurrency = 'RUB';
let currentWantCurrency = 'USD';

function getBrightness(hexcolor) {
    if (!hexcolor) return 0;
    hexcolor = hexcolor.replace("#", "");
    const r = parseInt(hexcolor.substring(0, 2), 16);
    const g = parseInt(hexcolor.substring(2, 4), 16);
    const b = parseInt(hexcolor.substring(4, 6), 16);
    return ((r * 299) + (g * 587) + (b * 114)) / 1000;
}

function getContrastYIQ(hexcolor) {
    const brightness = getBrightness(hexcolor);
    return (brightness >= 128) ? '#333' : '#fff';
}

// Минимальная разница яркости между обложкой и внутренней частью
const MIN_BRIGHTNESS_CONTRAST = 40;

// Выбор пары цветов: квази-случайный, без частых повторов, body всегда светлее cover
function pickColorPair(years, monthIndex) {
    const len = years.length;
    // Взаимно простые с 27 коэффициенты обеспечивают полный обход цветов
    const i1 = (monthIndex * 31 + 5) % len;
    let i2 = (monthIndex * 17 + 11) % len;
    if (i2 === i1) i2 = (i2 + 1) % len;

    let c1 = pantoneDatabase[years[i1]].hex;
    let c2 = pantoneDatabase[years[i2]].hex;

    // Если контраст слабый — ищем следующий цвет с достаточной разницей яркости
    let attempts = 0;
    while (Math.abs(getBrightness(c1) - getBrightness(c2)) < MIN_BRIGHTNESS_CONTRAST && attempts < len) {
        i2 = (i2 + 1) % len;
        if (i2 === i1) i2 = (i2 + 1) % len;
        c2 = pantoneDatabase[years[i2]].hex;
        attempts++;
    }

    // Светлый — внутрь кошелька, тёмный — на обложку
    if (getBrightness(c1) > getBrightness(c2)) {
        return { body: c1, cover: c2 };
    }
    return { body: c2, cover: c1 };
}

// Применение цветов Pantone согласно правилам
async function applyPantoneColors() {
    await syncPantoneDatabase();

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    let coverColor, bodyColor;

    // До мая 2026 — официальная пара Pantone 2025/2026
    if (year < 2026 || (year === 2026 && month < 4)) {
        coverColor = pantoneDatabase["2025"].hex;
        bodyColor = pantoneDatabase["2026"].hex;
    } else {
        // С мая 2026 — каждый месяц новая пара из 27 цветов Pantone (2000-2026)
        const years = Object.keys(pantoneDatabase).sort();
        const monthIndex = (year - 2026) * 12 + (month - 4);
        const pair = pickColorPair(years, monthIndex);
        coverColor = pair.cover;
        bodyColor = pair.body;
    }

    document.documentElement.style.setProperty('--pantone-current-cover', coverColor);
    document.documentElement.style.setProperty('--pantone-current-body', bodyColor);

    const textColorBody = getContrastYIQ(bodyColor);
    const textColorCover = getContrastYIQ(coverColor);
    document.documentElement.style.setProperty('--pantone-text-color', textColorBody);
    document.documentElement.style.setProperty('--pantone-text-color-cover', textColorCover);

    document.querySelectorAll('.tab.active').forEach(tab => {
        tab.style.backgroundColor = bodyColor;
        tab.style.color = textColorBody;
    });
}

wallet.addEventListener('click', (e) => {
    if (e.target.closest('.wallet-body')) return;
    wallet.classList.toggle('open');
    wallet.classList.toggle('closed');
});

async function fetchRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        exchangeRates = data.rates;
        calculate('have');
    } catch (error) {
        haveRateInfo.innerText = 'Нет связи с курсами';
        wantRateInfo.innerText = 'Проверьте интернет';
    }
}

function calculate(source) {
    if (!exchangeRates.RUB) return;
    const amount = source === 'have' ? parseFloat(haveAmount.value) : parseFloat(wantAmount.value);
    if (isNaN(amount)) return;
    const haveRateToUSD = exchangeRates[currentHaveCurrency];
    const wantRateToUSD = exchangeRates[currentWantCurrency];

    if (source === 'have') {
        const result = (amount / haveRateToUSD) * wantRateToUSD;
        wantAmount.value = result.toFixed(2);
    } else {
        const result = (amount / wantRateToUSD) * haveRateToUSD;
        haveAmount.value = result.toFixed(2);
    }
    updateRateInfos();
}

function updateRateInfos() {
    const haveRateToUSD = exchangeRates[currentHaveCurrency];
    const wantRateToUSD = exchangeRates[currentWantCurrency];
    const oneHaveInWant = (1 / haveRateToUSD) * wantRateToUSD;
    const oneWantInHave = (1 / wantRateToUSD) * haveRateToUSD;
    haveRateInfo.innerText = `1 ${currentHaveCurrency} = ${oneHaveInWant.toFixed(4)} ${currentWantCurrency}`;
    wantRateInfo.innerText = `1 ${currentWantCurrency} = ${oneWantInHave.toFixed(4)} ${currentHaveCurrency}`;
}

function setupTabs(tabs, select, type) {
    const dynamicContainer = document.getElementById(`${type}-dynamic-container`);
    const dynamicLabel = document.getElementById(`${type}-dynamic-label`);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('active');
                t.style.backgroundColor = '';
                t.style.color = '';
            });

            tab.classList.add('active');

            const bodyColor = getComputedStyle(document.documentElement).getPropertyValue('--pantone-current-body');
            const textColor = getContrastYIQ(bodyColor);
            tab.style.backgroundColor = bodyColor;
            tab.style.color = textColor;

            const selectedCurrency = tab.dataset.currency;
            if (type === 'have') currentHaveCurrency = selectedCurrency;
            else currentWantCurrency = selectedCurrency;

            calculate('have');
        });
    });

    select.addEventListener('change', () => {
        const selectedCurrency = select.value;
        dynamicLabel.innerText = selectedCurrency;
        dynamicContainer.dataset.currency = selectedCurrency;
        dynamicContainer.click();
    });
}

setupTabs(haveTabs, haveMoreSelect, 'have');
setupTabs(wantTabs, wantMoreSelect, 'want');

haveAmount.addEventListener('input', () => calculate('have'));
wantAmount.addEventListener('input', () => calculate('want'));

// Initial Load
applyPantoneColors();
fetchRates();

let deferredPrompt;
const installBanner = document.getElementById('install-banner');
const installButton = document.getElementById('install-button');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBanner.style.display = 'block';
});

installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installBanner.style.display = 'none';
        }
        deferredPrompt = null;
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch(err => {}); // Silent fail
    });
}

if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
}

// Плавное масштабирование под размер окна (для Telegram Mini App и узких окон)
function fitToViewport() {
    const targetWidth = 510;
    const targetHeight = 560;
    const scaleX = window.innerWidth / targetWidth;
    const scaleY = window.innerHeight / targetHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    document.documentElement.style.setProperty('--fit-scale', scale.toFixed(3));
    const container = document.querySelector('.container');
    if (container) {
        container.style.transform = `scale(${scale.toFixed(3)})`;
        container.style.transformOrigin = 'center top';
    }
}

window.addEventListener('load', fitToViewport);
window.addEventListener('resize', fitToViewport);
if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.onEvent) {
    window.Telegram.WebApp.onEvent('viewportChanged', fitToViewport);
}