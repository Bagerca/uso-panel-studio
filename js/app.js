// js/app.js
import { icons } from './icons.js';

class AppState {
    constructor() {
        this.listeners = [];
        this.data = {
            mode: 'header',
            width: 320,
            padding: 24,
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
    subscribe(callback) { this.listeners.push(callback); }
    update(key, value) { if (this.data[key] !== value) { this.data[key] = value; this.notify(); } }
    updateMultiple(newData) { this.data = { ...this.data, ...newData }; this.notify(); }
    notify() { this.listeners.forEach(cb => cb(this.data)); }
}

const PRESETS = {
    bio: { mode: 'header', accentColor: '#ff2d95', icon: 'user', title: 'ОБО МНЕ', subtitle: 'Кто я и почему здесь уютно', width: 320, padding: 24 },
    donate: { mode: 'header', accentColor: '#ff8c00', icon: 'money', title: 'ДОНАТЫ', subtitle: 'Поддержать канал', width: 320, padding: 24 },
    memes: { mode: 'header', accentColor: '#bd00ff', icon: 'ghost', title: 'МЕМЧИКИ', subtitle: 'Отправить скример', width: 320, padding: 24 },
    discord: { mode: 'header', accentColor: '#5865F2', icon: 'discord', title: 'DISCORD', subtitle: 'Наше логово', width: 320, padding: 24 },
    prices: { mode: 'list', accentColor: '#00ff7f', icon: 'gamepad', title: 'ПРАЙС-ЛИСТ', subtitle: 'Заказы и игры', body: '<b>Dota 2</b> - 1000 руб.\n<b>Atomic Heart</b> - 500 руб.\n\nПослушать песню - 100 руб.', width: 320, padding: 24, align: 'left' }
};

class EditorUI {
    constructor(state) {
        this.state = state;
        this.bindEvents();
        this.renderPresets();
    }

    bindEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn, .tab-pane').forEach(el => el.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(e.target.dataset.target).classList.add('active');
            });
        });

        document.querySelectorAll('[data-state]').forEach(el => {
            const eventType = (el.tagName === 'INPUT' && el.type === 'range') || el.tagName === 'TEXTAREA' ? 'input' : 'change';
            el.addEventListener(eventType, (e) => {
                let val = e.target.value;
                if (e.target.type === 'range') val = parseInt(val);
                this.state.update(e.target.dataset.state, val);
            });
        });

        const picker = document.getElementById('ctrl-color-picker');
        const hex = document.getElementById('ctrl-color-hex');
        picker.addEventListener('input', e => this.state.update('accentColor', e.target.value));
        hex.addEventListener('input', e => {
            let val = e.target.value;
            if (val.length > 0 && !val.startsWith('#')) val = '#' + val;
            if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) this.state.update('accentColor', val);
        });

        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const group = e.target.closest('.toggle-group');
                const key = group.id === 'ctrl-mode' ? 'mode' : 'align';
                this.state.update(key, e.target.dataset.val);
            });
        });

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
        document.querySelectorAll('[data-state]').forEach(el => {
            if (el.value !== String(data[el.dataset.state])) el.value = data[el.dataset.state];
        });
        document.getElementById('ctrl-color-picker').value = data.accentColor;
        document.getElementById('ctrl-color-hex').value = data.accentColor;
        document.getElementById('val-width').innerText = `${data.width}px`;
        document.getElementById('val-padding').innerText = `${data.padding}px`;
        document.getElementById('val-glow').innerText = `${data.glow}%`;
        document.getElementById('val-radius').innerText = `${data.radius}px`;

        document.querySelectorAll('#ctrl-mode .toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.val === data.mode));
        document.querySelectorAll('#ctrl-align .toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.val === data.align));
        document.getElementById('icon-group').style.display = data.mode === 'header' ? 'block' : 'none';
        document.getElementById('body-group').style.display = data.mode === 'list' ? 'block' : 'none';
    }
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 255, 127';
}

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
        const ratio = data.glow / 100;

        this.target.style.setProperty('--ac-color', data.accentColor);
        this.target.style.setProperty('--ac-rgb', hexToRgb(data.accentColor));
        this.target.style.setProperty('--p-radius', `${data.radius}px`);
        this.target.style.setProperty('--p-pad', `${data.padding}px`);
        this.target.style.setProperty('--p-width', `${data.width}px`);
        
        // Математика свечения для html2canvas (заменяем calc на чистые пиксели)
        this.target.style.setProperty('--g-box', `${20 * ratio}px`);
        this.target.style.setProperty('--g-title', `${15 * ratio}px`);
        this.target.style.setProperty('--g-text', `${10 * ratio}px`);
        this.target.style.setProperty('--g-icon-b', `${30 * ratio}px`);
        this.target.style.setProperty('--g-icon-s', `${12 * ratio}px`);
        this.target.style.setProperty('--g-div', `${5 * ratio}px`);
        this.target.style.setProperty('--g-bg', `${ratio}`);
        
        this.target.style.setProperty('--ff-title', data.fontTitle);
        this.target.style.setProperty('--fs-title', `${data.sizeTitle}px`);
        this.target.style.setProperty('--fs-sub', `${data.sizeSub}px`);
        this.target.style.setProperty('--fs-body', `${data.sizeBody}px`);
        this.target.style.setProperty('--t-align', data.align);

        this.target.className = `panel-layout-${data.mode}`;

        const containerWidth = this.captureArea.parentElement.clientWidth - 80;
        if (data.width > containerWidth) {
            this.captureArea.style.transform = `scale(${containerWidth / data.width})`;
        } else {
            this.captureArea.style.transform = `scale(1)`;
        }

        this.els.icon.innerHTML = icons[data.icon] || '';
        this.els.title.innerText = data.title || 'ЗАГОЛОВОК';
        this.els.subtitle.innerText = data.subtitle;
        this.els.body.innerHTML = data.body; 
    }
}

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
        setTimeout(() => { toast.classList.add('hide'); setTimeout(() => toast.remove(), 300); }, 3000);
    }

    async export(action) {
        this.btnCopy.style.pointerEvents = "none";
        this.btnDownload.style.pointerEvents = "none";
        
        const originalTransform = this.captureArea.style.transform;
        this.captureArea.style.transform = 'scale(1)';

        try {
            await document.fonts.ready;
            const canvas = await html2canvas(this.target, { 
                scale: 2, 
                backgroundColor: null, 
                logging: false 
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
            this.captureArea.style.transform = originalTransform;
            this.btnCopy.style.pointerEvents = "auto";
            this.btnDownload.style.pointerEvents = "auto";
        }
    }
}

document.fonts.ready.then(() => {
    const appState = new AppState();
    new EditorUI(appState);
    new CanvasRenderer(appState);
    new ExportManager();
    appState.updateMultiple(PRESETS['prices']); 
});