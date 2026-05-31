// js/app.js
import { icons } from './icons.js';

// --- НАСТРОЙКИ И ПРЕСЕТЫ ---
const presets = [
    { id: 'bio', name: 'Обо мне', mode: 'header', color: '#ff2d95', icon: 'user', title: 'ОБО МНЕ', sub: 'Кто я и почему здесь уютно' },
    { id: 'donate', name: 'Донаты', mode: 'header', color: '#ff8c00', icon: 'money', title: 'ДОНАТЫ', sub: 'Поддержать канал' },
    { id: 'memes', name: 'Мемы', mode: 'header', color: '#bd00ff', icon: 'ghost', title: 'МЕМЧИКИ', sub: 'Отправить скример' },
    { id: 'discord', name: 'Discord', mode: 'header', color: '#5865F2', icon: 'discord', title: 'DISCORD', sub: 'Наше логово' },
    { id: 'rules', name: 'Правила', mode: 'header', color: '#00ff7f', icon: 'rules', title: 'ПРАВИЛА', sub: 'Уважай чат' },
    { id: 'specs', name: 'Железо', mode: 'header', color: '#00ffff', icon: 'pc', title: 'МОЙ ПК', sub: 'Характеристики компа' },
    { id: 'prices', name: 'Прайс', mode: 'list', color: '#00ff7f', icon: 'gamepad', title: 'ПРАЙС-ЛИСТ', sub: 'Заказы и игры', body: 'Dota 2 - 1000 руб.\nAtomic Heart - 500 руб.\n\nПослушать песню - 100 руб.' }
];

// --- DOM ЭЛЕМЕНТЫ ---
const els = {
    presetGrid: document.getElementById('preset-grid'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    
    colorPicker: document.getElementById('ctrl-color-picker'),
    colorHex: document.getElementById('ctrl-color-hex'),
    icon: document.getElementById('ctrl-icon'),
    title: document.getElementById('ctrl-title'),
    subtitle: document.getElementById('ctrl-subtitle'),
    body: document.getElementById('ctrl-body'),
    
    iconGroup: document.getElementById('icon-group'),
    bodyGroup: document.getElementById('body-group'),
    
    target: document.getElementById('render-target'),
    vIconWrap: document.getElementById('view-icon-wrap'),
    vIcon: document.getElementById('view-icon'),
    vTitle: document.getElementById('view-title'),
    vSubtitle: document.getElementById('view-subtitle'),
    vBody: document.getElementById('view-body'),
    
    downloadBtn: document.getElementById('btn-download'),
    btnText: document.getElementById('btn-text')
};

// --- ИНИЦИАЛИЗАЦИЯ ---
function init() {
    renderPresets();
    setupEventListeners();
    applyPreset('bio'); // Дефолтный
}

// Рендер кнопок пресетов
function renderPresets() {
    els.presetGrid.innerHTML = presets.map(p => `
        <div class="preset-btn" data-id="${p.id}">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${p.color}; box-shadow: 0 0 5px ${p.color}"></div>
            ${p.name}
        </div>
    `).join('');

    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => applyPreset(btn.dataset.id));
    });
}

// Применение пресета
function applyPreset(id) {
    const data = presets.find(p => p.id === id);
    if (!data) return;

    // Подсветка кнопки
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.preset-btn[data-id="${id}"]`).classList.add('active');

    // Обновление значений в UI редактора
    setMode(data.mode);
    els.colorPicker.value = data.color;
    els.colorHex.value = data.color;
    els.icon.value = data.icon;
    els.title.value = data.title;
    els.subtitle.value = data.sub;
    if (data.body) els.body.value = data.body;

    updateView();
}

// Переключение режима (Header / List)
function setMode(mode) {
    els.modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    els.target.className = `panel-layout-${mode}`;
    
    if (mode === 'list') {
        els.iconGroup.style.display = 'none';
        els.bodyGroup.style.display = 'flex';
    } else {
        els.iconGroup.style.display = 'flex';
        els.bodyGroup.style.display = 'none';
    }
}

// Синхронизация инпутов с превью
function updateView() {
    const color = els.colorHex.value;
    
    // Обновляем CSS-переменную для всего баннера
    els.target.style.setProperty('--accent-color', color);
    
    // Тексты
    els.vTitle.innerText = els.title.value || "ЗАГОЛОВОК";
    els.vSubtitle.innerText = els.subtitle.value;
    els.vBody.innerText = els.body.value;
    
    // Иконка
    els.vIcon.innerHTML = icons[els.icon.value] || '';
}

// Привязка событий
function setupEventListeners() {
    // Кнопки режимов
    els.modeBtns.forEach(btn => btn.addEventListener('click', (e) => {
        setMode(e.target.dataset.mode);
        updateView();
    }));

    // Синхронизация Color Picker и HEX Input
    els.colorPicker.addEventListener('input', e => {
        els.colorHex.value = e.target.value;
        updateView();
    });

    els.colorHex.addEventListener('input', e => {
        let val = e.target.value;
        if (!val.startsWith('#')) val = '#' + val;
        // Проверяем валидность HEX
        if (/^#[0-9A-F]{6}$/i.test(val)) {
            els.colorPicker.value = val;
            updateView();
        }
    });

    // Остальные поля
    els.icon.addEventListener('change', updateView);
    els.title.addEventListener('input', updateView);
    els.subtitle.addEventListener('input', updateView);
    els.body.addEventListener('input', updateView);

    // СКАЧИВАНИЕ
    els.downloadBtn.addEventListener('click', handleDownload);
}

// Логика рендера и скачивания (Исправлено)
function handleDownload() {
    const originalText = els.btnText.innerText;
    els.btnText.innerText = "РЕНДЕР...";
    els.downloadBtn.style.pointerEvents = "none";

    // Убираем скроллы и лишние бордеры для чистого рендера
    const panel = els.target;
    
    // Используем scale 2 для антиалиасинга (четкий текст)
    html2canvas(panel, {
        scale: 2,
        backgroundColor: null, // Прозрачный фон вокруг скругленных углов!
        logging: false
    }).then(canvas => {
        const link = document.createElement('a');
        const isList = panel.classList.contains('panel-layout-list');
        link.download = isList ? 'twitch_panel_list.png' : 'twitch_panel_header.png';
        link.href = canvas.toDataURL("image/png");
        link.click();
        
        els.btnText.innerText = "УСПЕШНО СОХРАНЕНО!";
        setTimeout(() => {
            els.btnText.innerText = originalText;
            els.downloadBtn.style.pointerEvents = "auto";
        }, 2000);
    });
}

// Запуск
document.fonts.ready.then(init);