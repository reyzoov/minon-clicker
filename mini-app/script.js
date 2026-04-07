const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let userData = {
    total_bananas: 0,
    level: 1,
    experience: 0,
    energy_current: 100,
    energy_max: 100,
    click_power: 1,
    prestige_count: 0,
    prestige_bonus: 1.0,
    offline_level: 0
};

let upgrades = {
    click_power: 0,
    energy_max: 0,
    energy_regen: 0,
    luck: 0,
    crit: 0,
    offline: 0
};

const elements = {
    totalBananas: document.getElementById('totalBananas'),
    level: document.getElementById('level'),
    energy: document.getElementById('energy'),
    energyMax: document.getElementById('energyMax'),
    expFill: document.getElementById('expFill'),
    expText: document.getElementById('expText'),
    clickPower: document.getElementById('clickPower'),
    prestigeCount: document.getElementById('prestigeCount'),
    prestigeBonus: document.getElementById('prestigeBonus'),
    offlineLevel: document.getElementById('offlineLevel')
};

function updateUI() {
    if (elements.totalBananas) elements.totalBananas.textContent = Math.floor(userData.total_bananas).toLocaleString();
    if (elements.level) elements.level.textContent = userData.level;
    if (elements.energy) elements.energy.textContent = userData.energy_current;
    if (elements.energyMax) elements.energyMax.textContent = userData.energy_max;
    if (elements.clickPower) elements.clickPower.textContent = `💪 x${Math.floor(userData.click_power * userData.prestige_bonus)}`;
    if (elements.prestigeCount) elements.prestigeCount.textContent = userData.prestige_count;
    if (elements.prestigeBonus) elements.prestigeBonus.textContent = Math.floor((userData.prestige_bonus - 1) * 100);
    if (elements.offlineLevel) elements.offlineLevel.textContent = userData.offline_level;
    
    const expNeeded = userData.level * 100;
    const expPercent = (userData.experience / expNeeded) * 100;
    if (elements.expFill) elements.expFill.style.width = `${expPercent}%`;
    if (elements.expText) elements.expText.textContent = `${Math.floor(userData.experience)}/${expNeeded}`;
    
    updateUpgradeCosts();
}

function updateUpgradeCosts() {
    const clickPowerCost = Math.floor(100 * Math.pow(1.5, upgrades.click_power || 0));
    const energyMaxCost = Math.floor(100 * Math.pow(1.5, upgrades.energy_max || 0));
    
    const costClick = document.getElementById('cost_click_power');
    const costEnergy = document.getElementById('cost_energy_max');
    const levelClick = document.getElementById('level_click_power');
    const levelEnergy = document.getElementById('level_energy_max');
    
    if (costClick) costClick.textContent = clickPowerCost;
    if (costEnergy) costEnergy.textContent = energyMaxCost;
    if (levelClick) levelClick.textContent = `Ур.${upgrades.click_power || 0}`;
    if (levelEnergy) levelEnergy.textContent = `Ур.${upgrades.energy_max || 0}`;
}

function showFloatingNumber(text, x, y, color = '#ffd966') {
    const div = document.createElement('div');
    div.textContent = text;
    div.className = 'floating-number';
    div.style.left = `${x}px`;
    div.style.top = `${y - 50}px`;
    div.style.color = color;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 500);
}

function showRippleEffect(x, y) {
    const minion = document.getElementById('minion');
    if (minion) {
        minion.style.transform = 'scale(0.95)';
        setTimeout(() => { if(minion) minion.style.transform = 'scale(1)'; }, 100);
    }
}

function handleClick(event) {
    if (userData.energy_current <= 0) {
        showFloatingNumber('❌ Нет энергии!', event.clientX, event.clientY, '#ff6b6b');
        return;
    }
    
    const clickValue = Math.floor(userData.click_power * userData.prestige_bonus);
    showFloatingNumber(`+${clickValue} 🍌`, event.clientX, event.clientY);
    showRippleEffect(event.clientX, event.clientY);
    
    tg.sendData(JSON.stringify({
        action: 'click',
        click_power: userData.click_power,
        prestige_bonus: userData.prestige_bonus
    }));
    
    userData.energy_current--;
    userData.total_bananas += clickValue;
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

document.querySelectorAll('.upgrade-item').forEach(item => {
    item.addEventListener('click', (e) => {
        const upgradeType = item.dataset.upgrade;
        if (!upgradeType) return;
        
        const currentLevel = upgrades[upgradeType] || 0;
        const cost = Math.floor(100 * Math.pow(1.5, currentLevel));
        
        if (userData.total_bananas >= cost) {
            tg.sendData(JSON.stringify({
                action: 'upgrade',
                upgrade_type: upgradeType,
                cost: cost
            }));
        } else {
            showFloatingNumber(`❌ Нужно ${cost} бананов!`, e.clientX, e.clientY, '#ff6b6b');
        }
    });
});

tg.onEvent('message', (message) => {
    try {
        const data = JSON.parse(message.data);
        
        if (data.user) {
            userData = {
                total_bananas: data.user.total_bananas || 0,
                level: data.user.level || 1,
                experience: data.user.experience || 0,
                energy_current: data.user.energy_current || 100,
                energy_max: data.user.energy_max || 100,
                click_power: data.user.click_power || 1,
                prestige_count: data.user.prestige_count || 0,
                prestige_bonus: data.user.prestige_bonus || 1.0,
                offline_level: data.user.offline_clicker_level || 0
            };
        }
        
        if (data.upgrades) {
            upgrades = data.upgrades;
        }
        
        if (data.level_up) {
            showFloatingNumber(`⭐️ УРОВЕНЬ ${data.level_up}!`, window.innerWidth/2, 100, '#ffd700');
        }
        
        updateUI();
    } catch (e) {
        console.error('Error parsing:', e);
    }
});

function loadUserData() {
    tg.sendData(JSON.stringify({ action: 'get_user_data' }));
}

loadUserData();
startEnergyRegen();

const minionDiv = document.getElementById('minion');
if (minionDiv) {
    minionDiv.addEventListener('click', handleClick);
}