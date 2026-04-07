// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// DOM элементы
const minion = document.getElementById('minion');
const bananasSpan = document.getElementById('bananas');
const levelSpan = document.getElementById('level');
const energySpan = document.getElementById('energy');
const energyMaxSpan = document.getElementById('energyMax');
const expFill = document.getElementById('expFill');
const expText = document.getElementById('expText');
const clickPowerSpan = document.getElementById('clickPower');
const prestigeBonusSpan = document.getElementById('prestigeBonus');
const totalBananasSpan = document.getElementById('totalBananas');
const energyFill = document.getElementById('energyFill');

// Данные пользователя
let userData = {
    user_id: null,
    total_bananas: 0,
    level: 1,
    experience: 0,
    energy_current: 100,
    energy_max: 100,
    click_power: 1,
    prestige_count: 0,
    prestige_bonus: 1.0
};

let upgrades = {
    click_power: 0,
    energy_max: 0,
    energy_regen: 0,
    bonus_bananas: 0
};

let clicksCount = 0;

// Загрузка данных
async function loadUserData() {
    tg.sendData(JSON.stringify({ action: 'get_user_data' }));
}

// Обновление UI
function updateUI() {
    // Основная статистика
    bananasSpan.textContent = Math.floor(userData.total_bananas).toLocaleString();
    levelSpan.textContent = userData.level;
    energySpan.textContent = userData.energy_current;
    energyMaxSpan.textContent = userData.energy_max;
    
    // Сила клика с бонусом
    const totalClickPower = Math.floor(userData.click_power * userData.prestige_bonus);
    clickPowerSpan.textContent = `💪 x${totalClickPower}`;
    prestigeBonusSpan.textContent = `✨ +${Math.floor((userData.prestige_bonus - 1) * 100)}%`;
    
    // Опыт
    const expNeeded = userData.level * 100;
    const expPercent = (userData.experience / expNeeded) * 100;
    expFill.style.width = `${expPercent}%`;
    expText.textContent = `${Math.floor(userData.experience)}/${expNeeded}`;
    
    // Энергия
    const energyPercent = (userData.energy_current / userData.energy_max) * 100;
    if (energyFill) energyFill.style.width = `${energyPercent}%`;
    
    // Общая статистика
    if (totalBananasSpan) totalBananasSpan.textContent = Math.floor(userData.total_bananas).toLocaleString();
    
    // Обновляем стоимость улучшений
    updateUpgradeCosts();
    
    // Обновляем статистику на вкладке
    updateStatsTab();
}

function updateUpgradeCosts() {
    const clickPowerLevel = upgrades.click_power || 0;
    const energyMaxLevel = upgrades.energy_max || 0;
    const energyRegenLevel = upgrades.energy_regen || 0;
    const bonusBananasLevel = upgrades.bonus_bananas || 0;
    
    const clickPowerCost = Math.floor(100 * Math.pow(1.5, clickPowerLevel));
    const energyMaxCost = Math.floor(100 * Math.pow(1.5, energyMaxLevel));
    const energyRegenCost = Math.floor(150 * Math.pow(1.5, energyRegenLevel));
    const bonusBananasCost = Math.floor(200 * Math.pow(1.5, bonusBananasLevel));
    
    document.getElementById('cost_click_power').querySelector('.cost-value').textContent = clickPowerCost;
    document.getElementById('cost_energy_max').querySelector('.cost-value').textContent = energyMaxCost;
    document.getElementById('cost_energy_regen').querySelector('.cost-value').textContent = energyRegenCost;
    document.getElementById('cost_bonus_bananas').querySelector('.cost-value').textContent = bonusBananasCost;
    
    document.getElementById('level_click_power').textContent = `Ур. ${clickPowerLevel}`;
    document.getElementById('level_energy_max').textContent = `Ур. ${energyMaxLevel}`;
    document.getElementById('level_energy_regen').textContent = `Ур. ${energyRegenLevel}`;
    document.getElementById('level_bonus_bananas').textContent = `Ур. ${bonusBananasLevel}`;
}

function updateStatsTab() {
    const expNeeded = userData.level * 100;
    document.getElementById('playerName').textContent = tg.initDataUnsafe?.user?.first_name || 'Игрок';
    document.getElementById('statLevel').textContent = userData.level;
    document.getElementById('statExp').textContent = `${Math.floor(userData.experience)}/${expNeeded}`;
    document.getElementById('statBananas').textContent = Math.floor(userData.total_bananas).toLocaleString();
    document.getElementById('statClickPower').textContent = Math.floor(userData.click_power * userData.prestige_bonus);
    document.getElementById('statPrestige').textContent = userData.prestige_count;
    document.getElementById('statBonus').textContent = `+${Math.floor((userData.prestige_bonus - 1) * 100)}%`;
    document.getElementById('statClicks').textContent = clicksCount.toLocaleString();
}

function showFloatingNumber(text, x, y) {
    const div = document.createElement('div');
    div.textContent = text;
    div.className = 'floating-number';
    div.style.left = `${x}px`;
    div.style.top = `${y - 50}px`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 600);
}

function showRipple(x, y) {
    const ripple = document.querySelector('.click-ripple');
    if (ripple) {
        ripple.classList.remove('active');
        setTimeout(() => ripple.classList.add('active'), 10);
        setTimeout(() => ripple.classList.remove('active'), 400);
    }
}

function handleClick(event) {
    if (userData.energy_current <= 0) {
        showFloatingNumber('❌ Нет энергии!', event.clientX, event.clientY);
        return;
    }
    
    const clickValue = Math.floor(userData.click_power * userData.prestige_bonus);
    const bonusMultiplier = 1 + (upgrades.bonus_bananas || 0) * 0.05;
    const totalGain = Math.floor(clickValue * bonusMultiplier);
    
    showFloatingNumber(`+${totalGain} 🍌`, event.clientX, event.clientY);
    showRipple(event.clientX, event.clientY);
    
    minion.classList.add('minion-click');
    setTimeout(() => minion.classList.remove('minion-click'), 150);
    
    clicksCount++;
    
    tg.sendData(JSON.stringify({
        action: 'click',
        click_power: userData.click_power,
        prestige_bonus: userData.prestige_bonus
    }));
    
    userData.energy_current--;
    userData.total_bananas += totalGain;
    updateUI();
}

function startEnergyRegen() {
    setInterval(() => {
        if (userData.energy_current < userData.energy_max) {
            const regenAmount = 1 + (upgrades.energy_regen || 0);
            userData.energy_current = Math.min(userData.energy_max, userData.energy_current + regenAmount);
            updateUI();
        }
    }, 1000);
}

// Обработка покупки улучшений
document.querySelectorAll('.upgrade-card').forEach(card => {
    card.addEventListener('click', (e) => {
        e.stopPropagation();
        const upgradeType = card.dataset.upgrade;
        if (!upgradeType) return;
        
        tg.sendData(JSON.stringify({
            action: 'buy_upgrade',
            upgrade_type: upgradeType
        }));
    });
});

// Вкладки
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');
    });
});

// Обработка сообщений от бота
tg.onEvent('message', (message) => {
    try {
        const data = JSON.parse(message.data);
        
        if (data.user) {
            userData = {
                user_id: data.user.user_id,
                total_bananas: data.user.total_bananas || 0,
                level: data.user.level || 1,
                experience: data.user.experience || 0,
                energy_current: data.user.energy_current || 100,
                energy_max: data.user.energy_max || 100,
                click_power: data.user.click_power || 1,
                prestige_count: data.user.prestige_count || 0,
                prestige_bonus: data.user.prestige_bonus || 1.0
            };
        }
        
        if (data.upgrades) {
            upgrades = data.upgrades;
        }
        
        if (data.level_up) {
            showFloatingNumber(`⭐️ УРОВЕНЬ ${data.level_up}!`, window.innerWidth/2, 150);
        }
        
        if (data.success === false && data.error) {
            showFloatingNumber(data.error, window.innerWidth/2, 200);
        }
        
        updateUI();
        
    } catch (e) {
        console.error('Ошибка парсинга:', e);
    }
});

// Инициализация
loadUserData();
startEnergyRegen();

minion.addEventListener('click', handleClick);

// Показываем имя пользователя
console.log('User:', tg.initDataUnsafe?.user);
