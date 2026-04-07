const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

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
let pendingRequest = false;

const elements = {
    bananas: document.getElementById('bananas'),
    level: document.getElementById('level'),
    energy: document.getElementById('energy'),
    energyMax: document.getElementById('energyMax'),
    expFill: document.getElementById('expFill'),
    expText: document.getElementById('expText'),
    clickPower: document.getElementById('clickPower'),
    prestigeBonus: document.getElementById('prestigeBonus'),
    totalBananas: document.getElementById('totalBananas'),
    energyFill: document.getElementById('energyFill')
};

function updateUI() {
    if (elements.bananas) elements.bananas.textContent = Math.floor(userData.total_bananas).toLocaleString();
    if (elements.level) elements.level.textContent = userData.level;
    if (elements.energy) elements.energy.textContent = userData.energy_current;
    if (elements.energyMax) elements.energyMax.textContent = userData.energy_max;
    
    const totalClickPower = Math.floor(userData.click_power * userData.prestige_bonus);
    if (elements.clickPower) elements.clickPower.textContent = `💪 x${totalClickPower}`;
    if (elements.prestigeBonus) elements.prestigeBonus.textContent = `✨ +${Math.floor((userData.prestige_bonus - 1) * 100)}%`;
    
    const expNeeded = userData.level * 100;
    const expPercent = (userData.experience / expNeeded) * 100;
    if (elements.expFill) elements.expFill.style.width = `${expPercent}%`;
    if (elements.expText) elements.expText.textContent = `${Math.floor(userData.experience)}/${expNeeded}`;
    
    const energyPercent = (userData.energy_current / userData.energy_max) * 100;
    if (elements.energyFill) elements.energyFill.style.width = `${energyPercent}%`;
    
    if (elements.totalBananas) elements.totalBananas.textContent = Math.floor(userData.total_bananas).toLocaleString();
    
    updateUpgradeCosts();
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
    
    const costClick = document.getElementById('cost_click_power');
    const costEnergy = document.getElementById('cost_energy_max');
    const costRegen = document.getElementById('cost_energy_regen');
    const costBonus = document.getElementById('cost_bonus_bananas');
    
    if (costClick) costClick.querySelector('.cost-value').textContent = clickPowerCost;
    if (costEnergy) costEnergy.querySelector('.cost-value').textContent = energyMaxCost;
    if (costRegen) costRegen.querySelector('.cost-value').textContent = energyRegenCost;
    if (costBonus) costBonus.querySelector('.cost-value').textContent = bonusBananasCost;
    
    const levelClick = document.getElementById('level_click_power');
    const levelEnergy = document.getElementById('level_energy_max');
    const levelRegen = document.getElementById('level_energy_regen');
    const levelBonus = document.getElementById('level_bonus_bananas');
    
    if (levelClick) levelClick.textContent = `Ур. ${clickPowerLevel}`;
    if (levelEnergy) levelEnergy.textContent = `Ур. ${energyMaxLevel}`;
    if (levelRegen) levelRegen.textContent = `Ур. ${energyRegenLevel}`;
    if (levelBonus) levelBonus.textContent = `Ур. ${bonusBananasLevel}`;
}

function updateStatsTab() {
    const expNeeded = userData.level * 100;
    const playerNameSpan = document.getElementById('playerName');
    const statLevelSpan = document.getElementById('statLevel');
    const statExpSpan = document.getElementById('statExp');
    const statBananasSpan = document.getElementById('statBananas');
    const statClickPowerSpan = document.getElementById('statClickPower');
    const statPrestigeSpan = document.getElementById('statPrestige');
    const statBonusSpan = document.getElementById('statBonus');
    const statClicksSpan = document.getElementById('statClicks');
    
    if (playerNameSpan) playerNameSpan.textContent = tg.initDataUnsafe?.user?.first_name || 'Игрок';
    if (statLevelSpan) statLevelSpan.textContent = userData.level;
    if (statExpSpan) statExpSpan.textContent = `${Math.floor(userData.experience)}/${expNeeded}`;
    if (statBananasSpan) statBananasSpan.textContent = Math.floor(userData.total_bananas).toLocaleString();
    if (statClickPowerSpan) statClickPowerSpan.textContent = Math.floor(userData.click_power * userData.prestige_bonus);
    if (statPrestigeSpan) statPrestigeSpan.textContent = userData.prestige_count;
    if (statBonusSpan) statBonusSpan.textContent = `+${Math.floor((userData.prestige_bonus - 1) * 100)}%`;
    if (statClicksSpan) statClicksSpan.textContent = clicksCount.toLocaleString();
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

function showRipple() {
    const ripple = document.querySelector('.click-ripple');
    if (ripple) {
        ripple.classList.remove('active');
        setTimeout(() => ripple.classList.add('active'), 10);
        setTimeout(() => ripple.classList.remove('active'), 400);
    }
}

function handleClick(event) {
    if (pendingRequest) return;
    
    if (userData.energy_current <= 0) {
        showFloatingNumber('❌ Нет энергии!', event.clientX, event.clientY);
        return;
    }
    
    const clickValue = Math.floor(userData.click_power * userData.prestige_bonus);
    const bonusMultiplier = 1 + (upgrades.bonus_bananas || 0) * 0.05;
    const totalGain = Math.floor(clickValue * bonusMultiplier);
    
    showFloatingNumber(`+${totalGain} 🍌`, event.clientX, event.clientY);
    showRipple();
    
    const minion = document.getElementById('minion');
    if (minion) {
        minion.classList.add('minion-click');
        setTimeout(() => minion.classList.remove('minion-click'), 150);
    }
    
    clicksCount++;
    
    pendingRequest = true;
    tg.sendData(JSON.stringify({
        action: 'click',
        click_power: userData.click_power,
        prestige_bonus: userData.prestige_bonus
    }));
    
    userData.energy_current--;
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

function loadUserData() {
    tg.sendData(JSON.stringify({ action: 'get_user_data' }));
}

document.querySelectorAll('.upgrade-card').forEach(card => {
    card.addEventListener('click', (e) => {
        e.stopPropagation();
        if (pendingRequest) return;
        
        const upgradeType = card.dataset.upgrade;
        if (!upgradeType) return;
        
        pendingRequest = true;
        tg.sendData(JSON.stringify({
            action: 'buy_upgrade',
            upgrade_type: upgradeType
        }));
    });
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        
        btn.classList.add('active');
        const tabContent = document.getElementById(`tab-${tabId}`);
        if (tabContent) tabContent.classList.add('active');
    });
});

tg.onEvent('message', (message) => {
    try {
        const data = JSON.parse(message.data);
        console.log('Получены данные:', data);
        
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
        
        if (data.new_energy !== undefined) {
            userData.energy_current = data.new_energy;
        }
        
        if (data.total_bananas !== undefined) {
            userData.total_bananas = data.total_bananas;
        }
        
        if (data.click_power !== undefined) {
            userData.click_power = data.click_power;
        }
        
        if (data.energy_max !== undefined) {
            userData.energy_max = data.energy_max;
        }
        
        if (data.upgrades) {
            upgrades = data.upgrades;
        }
        
        updateUI();
        pendingRequest = false;
        
    } catch (e) {
        console.error('Ошибка парсинга:', e);
        pendingRequest = false;
    }
});

const minionElement = document.getElementById('minion');
if (minionElement) {
    minionElement.addEventListener('click', handleClick);
}

loadUserData();
startEnergyRegen();

console.log('Mini App загружен!');
