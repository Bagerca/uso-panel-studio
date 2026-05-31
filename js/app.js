// js/app.js
import { icons } from './icons.js';

// ==========================================
// 1. STATE MANAGER (Единый источник истины)
// ==========================================
class AppState {
    constructor() {
        this.listeners = [];
        this.data = {
            mode: 'header', // 'header' | 'list'
            width: 320,
            accentColor: '#00ff7f',
            glow: 100,
            radius: 16,
            icon: 'gamepad',
            fontTitle: "'Orbitron', sans-serif",
            title: 'ПРАЙС-ЛИСТ',
            subtitle: 'Уважай чат',
            align: 'left',
            body: '<b>Dota 2</b> - 1000 руб.\n<b>Atomic Heart</b> - 500 руб.\n\nПослушать песню - 100 руб.',
            sizeTitle: 26,
            sizeSub: 11,
            sizeBody: 14
        };
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    update(key, value) {
        if (this.data[key] !== value) {
            this.data[key] = value;
            this.notify();
        }
    }

    updateMultiple(newData) {
        this.data = { ...this.data, ...newData };
        this.notify();
    }

    notify() {
        this.listeners.forEach(cb => cb(this.data));
    }
}

// Пресеты
const PRESETS = {
    bio: { mode: 'header', accentColor: '#ff2d95', icon: 'user', title: 'ОБО МНЕ', subtitle: 'Кто я и почему здесь уютно', width: 320 },
    donate: { mode: 'header', accentColor: '#ff8c00', icon: 'money', title: 'ДОНАТЫ', subtitle: 'Поддержать канал', width: 320 },
    memes: { mode: 'header', accentColor: '#bd00ff', icon: 'ghost', title: 'МЕМЧИКИ', subtitle: 'Отправить скример', width: 320 },
    discord: { mode: 'header', accentColor: '#5865F2', icon: 'discord', title: 'DISCORD', subtitle: 'Наше логово', width: 320 },
    prices: { mode: 'list', accentColor: '#00ff7f', icon: 'gamepad', title: 'ПРАЙС-ЛИСТ', subtitle: 'Заказы и игры', body: '<b>Dota 2</b> - 1000 руб.\n<b>Atomic Heart</b> - 500 руб.\n\nПослушать песню - 100 руб.', width: 320, align: 'left' }
};

// ==========================================
// 2. UI CONTROLLER (Левая панель)
// ==========================================
class EditorUI {
    constructor(state) {
        this.state = state;
        this.bindEvents();
        this.renderPresets();
    }

    bindEvents() {
        // Табы
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn, .tab-pane').forEach(el => el.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(e.target.dataset.target).classList.add('active');
            });
        });

        // Связка всех input, select, textarea с data-state
        document.querySelectorAll('[data-state]').forEach(el => {
            const eventType = (el.tagName === 'INPUT' && el.type === 'range') || el.tagName === 'TEXTAREA' ? 'input' : 'change';
            el.addEventListener(eventType, (e) => {
                let val = e.target.value;
                if (e.target.type === 'range') val = parseInt(val);
                this.state.update(e.target.dataset.state, val);
            });
        });

        // Кастомный обработчик для Color Picker
        const picker = document.getElementById('ctrl-color-picker');
        const hex = document.getElementById('ctrl-color-hex');
        picker.addEventListener('input', e => this.state.update('accentColor', e.target.value));
        hex.addEventListener('input', e => {
            let val = e.target.value;
            // Умная валидация без блокировки стирания
            if (val.length > 0 && !val.startsWith('#')) val = '#' + val;
            if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
                this.state.update('accentColor', val);
            }
        });

        // Переключатели (Кнопки)
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const group = e.target.closest('.toggle-group');
                const key = group.id === 'ctrl-mode' ? 'mode' : 'align';
                this.state.update(key, e.target.dataset.val);
            });
        });

        // Подписка на изменение State для синхронизации интерфейса
        this.state.subscribe(data => this.syncUI(data));
    }

    renderPresets() {
        const grid = document.getElementById('preset-grid');
        grid.innerHTML = Object.entries(PRESETS).map(([id, p]) => `
            <div class="preset-btn" data-id="${id}">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${p.accentColor};"></div>
                ${p.title}
            </div>
        `).join('');

        grid.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.state.updateMultiple(PRESETS[id]);
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    syncUI(data) {
        // Обновляем значения в инпутах, если они изменились извне (пресеты)
        document.querySelectorAll('[data-state]').forEach(el => {
            if (el.value !== String(data[el.dataset.state])) {
                el.value = data[el.dataset.state];
            }
        });

        // Синхронизация Color
        document.getElementById('ctrl-color-picker').value = data.accentColor;
        document.getElementById('ctrl-color-hex').value = data.accentColor;

        // Синхронизация текста у ползунков
        document.getElementById('val-width').innerText = `${data.width}px`;
        document.getElementById('val-glow').innerText = `${data.glow}%`;
        document.getElementById('val-radius').innerText = `${data.radius}px`;

        // Синхронизация переключателей (Mode, Align)
        document.querySelectorAll('#ctrl-mode .toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.val === data.mode));
        document.querySelectorAll('#ctrl-align .toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.val === data.align));

        // Скрытие ненужных блоков
        document.getElementById('icon-group').style.display = data.mode === 'header' ? 'block' : 'none';
        document.getElementById('body-group').style.display = data.mode === 'list' ? 'block' : 'none';
    }
}

// ==========================================
// 3. CANVAS RENDERER (Правая панель)
// ==========================================
class CanvasRenderer {
    constructor(state) {
        this.target = document.getElementById('render-target');
        this.captureArea = document.getElementById('capture-area');
        this.els = {
            icon: document.getElementById('view-icon'),
            title: document.getElementById('view-title'),
            subtitle: document.getElementById('view-subtitle'),
            body: document.getElementById('view-body')
        };
        
        state.subscribe(data => this.render(data));
    }

    render(data) {
        // 1. CSS Переменные
        this.target.style.setProperty('--ac-color', data.accentColor);
        this.target.style.setProperty('--glow-int', data.glow / 100);
        this.target.style.setProperty('--p-radius', `${data.radius}px`);
        
        this.target.style.setProperty('--ff-title', data.fontTitle);
        this.target.style.setProperty('--fs-title', `${data.sizeTitle}px`);
        this.target.style.setProperty('--fs-sub', `${data.sizeSub}px`);
        this.target.style.setProperty('--fs-body', `${data.sizeBody}px`);
        this.target.style.setProperty('--t-align', data.align);

        // 2. Классы и размеры
        this.target.className = `panel-layout-${data.mode}`;
        this.target.style.width = `${data.width}px`;

        // Авто-масштабирование, если плашка не влезает в экран по ширине
        const containerWidth = this.captureArea.parentElement.clientWidth - 80;
        if (data.width > containerWidth) {
            const scale = containerWidth / data.width;
            this.captureArea.style.transform = `scale(${scale})`;
        } else {
            this.captureArea.style.transform = `scale(1)`;
        }

        // 3. Контент
        this.els.icon.innerHTML = icons[data.icon] || '';
        this.els.title.innerText = data.title || 'ЗАГОЛОВОК';
        this.els.subtitle.innerText = data.subtitle;
        
        // innerHTML позволяет использовать <b>. Переносы строк теперь работают из-за CSS pre-wrap
        this.els.body.innerHTML = data.body; 
    }
}

// ==========================================
// 4. EXPORT MANAGER & TOASTS
// ==========================================
class ExportManager {
    constructor() {
        this.btnCopy = document.getElementById('btn-copy');
        this.btnDownload = document.getElementById('btn-download');
        this.target = document.getElementById('render-target');
        this.captureArea = document.getElementById('capture-area');

        this.btnDownload.addEventListener('click', () => this.export('download'));
        this.btnCopy.addEventListener('click', () => this.export('copy'));
    }

    showToast(message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--accent)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> ${message}`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    async export(action) {
        this.btnCopy.style.pointerEvents = "none";
        this.btnDownload.style.pointerEvents = "none";
        
        // Временно снимаем scale для корректного рендера
        const originalTransform = this.captureArea.style.transform;
        this.captureArea.style.transform = 'scale(1)';

        try {
            await document.fonts.ready;
            const canvas = await html2canvas(this.target, {
                scale: 2,
                backgroundColor: null,
                logging: false,
                useCORS: true
            });

            if (action === 'download') {
                const link = document.createElement('a');
                link.download = `twitch_panel.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
                this.showToast('Файл успешно сохранен!');
            } else if (action === 'copy') {
                canvas.toBlob(blob => {
                    const item = new ClipboardItem({ 'image/png': blob });
                    navigator.clipboard.write([item]).then(() => this.showToast('Скопировано в буфер обмена!'));
                }, 'image/png');
            }
        } catch (error) {
            console.error(error);
            this.showToast('Ошибка при экспорте!');
        } finally {
            // Возвращаем scale
            this.captureArea.style.transform = originalTransform;
            this.btnCopy.style.pointerEvents = "auto";
            this.btnDownload.style.pointerEvents = "auto";
        }
    }
}

// ==========================================
// ИНИЦИАЛИЗАЦИЯ
// ==========================================
document.fonts.ready.then(() => {
    const appState = new AppState();
    new EditorUI(appState);
    new CanvasRenderer(appState);
    new ExportManager();

    // Загружаем начальный пресет
    appState.updateMultiple(PRESETS['prices']); 
});