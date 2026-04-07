const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let user = null;
let upgrades = {};
let upgradeCosts = {};
let loading = false;

// DOM элементы
const bananasEl = document.getElementById('bananas');
const levelEl = document.getElementById('level');
const energyEl = document.getElementById('energy');
const energyMaxEl = document.getElementById('energyMax');
const expFill = document.getElementById('expFill');
const expText = document.getElementById('expText');
const clickPowerEl = document.getElementById('clickPower');
const bonusEl = document.getElementById('bonus');
const energyFill = document.getElementById('energyFill');
const regenSpeedEl = document.getElementById('regenSpeed');
const offlineLevelEl = document.getElementById('offlineLevel');
const offlineRateEl = document.getElementById('offlineRate');

// Функция отправки данных в бот
async function sendToBot(action, data = {}) {
    if (loading) return null;
    loading = true;
    
    return new Promise((resolve) => {
        const handler = (msg) => {
            try {
                const response = JSON.parse(msg.data);
                tg.offEvent('message', handler);
                loading = false;
                resolve(response);
            } catch (e) {}
        };
        
        tg.onEvent('message', handler);
        tg.sendData(JSON.stringify({ action, ...data }));
        
        setTimeout(() => {
            tg.offEvent('message', handler);
            loading = false;
            resolve(null);
        }, 5000);
    });
}

// Загрузка данных
async function loadData() {
    const data = await sendToBot('get_data');
    if (data) {
        user = data.user;
        upgrades = data.upgrades;
        upgradeCosts = data.upgrade_costs;
        updateUI();
    }
}

// Обновление интерфейса
function updateUI() {
    if (!user) return;
    
    bananasEl.textContent = Math.floor(user.bananas).toLocaleString();
    levelEl.textContent = user.level;
    energyEl.textContent = user.energy;
    energyMaxEl.textContent = user.energy_max;
    
    const power = Math.floor(user.click_power * user.prestige_bonus);
    clickPowerEl.textContent = power;
    bonusEl.textContent = Math.floor((user.prestige_bonus - 1) * 100);
    
    const expNeeded = user.level * 100;
    const expPercent = (user.exp / expNeeded) * 100;
    expFill.style.width = `${expPercent}%`;
    expText.textContent = `${Math.floor(user.exp)}/${expNeeded}`;
    
    const energyPercent = (user.energy / user.energy_max) * 100;
    energyFill.style.width = `${energyPercent}%`;
    
    const regenSpeed = 1 + (upgrades.regen || 0);
    regenSpeedEl.textContent = regenSpeed;
    
    const offlineLevel = upgrades.offline || 0;
    const offlineRate = (0.1 + (offlineLevel * 0.05)).toFixed(2);
    offlineLevelEl.textContent = offlineLevel;
    offlineRateEl.textContent = offlineRate;
    
    // Обновляем улучшения
    document.getElementById('clickLvl').textContent = upgrades.click || 0;
    document.getElementById('energyLvl').textContent = upgrades.energy || 0;
    document.getElementById('regenLvl').textContent = upgrades.regen || 0;
    document.getElementById('bonusLvl').textContent = upgrades.bonus || 0;
    document.getElementById('offlineLvl').textContent = upgrades.offline || 0;
    
    document.getElementById('clickCost').textContent = upgradeCosts.click || 100;
    document.getElementById('energyCost').textContent = upgradeCosts.energy || 100;
    document.getElementById('regenCost').textContent = upgradeCosts.regen || 150;
    document.getElementById('bonusCost').textContent = upgradeCosts.bonus || 200;
    document.getElementById('offlineCost').textContent = upgradeCosts.offline || 300;
}

// Плавающее число
function showFloating(text, x, y) {
    const div = document.createElement('div');
    div.textContent = text;
    div.className = 'floating-number';
    div.style.left = `${x}px`;
    div.style.top = `${y - 50}px`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 600);
}

// Клик по миньону
async function handleClick(e) {
    if (!user || user.energy <= 0) {
        showFloating('❌ Нет энергии!', e.clientX, e.clientY);
        return;
    }
    
    const rect = document.querySelector('.minion').getBoundingClientRect();
    showFloating('+🍌', rect.left + rect.width/2, rect.top + rect.height/2);
    
    const ripple = document.querySelector('.click-ripple');
    ripple.classList.remove('active');
    setTimeout(() => ripple.classList.add('active'), 10);
    setTimeout(() => ripple.classList.remove('active'), 400);
    
    const data = await sendToBot('click');
    if (data && data.success) {
        user.bananas = data.bananas;
        user.energy = data.energy;
        user.level = data.level;
        user.exp = data.exp;
        
        if (data.leveled_up) {
            tg.showAlert(`⭐️ УРОВЕНЬ ${data.new_level}! ⭐️`);
        }
        updateUI();
    } else if (data && data.error) {
        showFloating(data.error, e.clientX, e.clientY);
    }
}

// Покупка улучшения
async function buyUpgrade(type) {
    const data = await sendToBot('buy', { type });
    if (data && data.success) {
        user.bananas = data.bananas;
        user.click_power = data.click_power;
        user.energy_max = data.energy_max;
        upgrades = data.upgrades;
        upgradeCosts = data.upgrade_costs;
        updateUI();
        tg.showAlert(data.message);
    } else if (data && data.message) {
        tg.showAlert(data.message);
    }
}

// Загрузка таблицы лидеров
async function loadLeaderboard() {
    const container = document.getElementById('leaderboardList');
    container.innerHTML = '<div class="loading">Загрузка...</div>';
    
    const data = await sendToBot('leaderboard');
    if (data && data.leaders) {
        if (data.leaders.length === 0) {
            container.innerHTML = '<div class="loading">Пока никого нет :(</div>';
            return;
        }
        
        container.innerHTML = '';
        data.leaders.forEach((leader, index) => {
            const rank = index + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <div class="leaderboard-rank">${medal}</div>
                <div class="leaderboard-name">${leader[0]}</div>
                <div class="leaderboard-stats">🍌 ${leader[1].toLocaleString()} | 📊 ${leader[2]} ур. | 🔄 ${leader[3]}</div>
            `;
            container.appendChild(item);
        });
    }
}

// Вкладки
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');
        
        if (tabId === 'leaderboard') {
            loadLeaderboard();
        }
    });
});

// Кнопки улучшений
document.querySelectorAll('.upgrade-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.dataset.type;
        buyUpgrade(type);
    });
});

// Обновление таблицы
document.getElementById('refreshLeaderboard')?.addEventListener('click', () => {
    loadLeaderboard();
});

// Клик по миньону
document.getElementById('minion').addEventListener('click', handleClick);

// Автообновление данных
setInterval(() => {
    loadData();
}, 5000);

// Загрузка данных при старте
loadData();
