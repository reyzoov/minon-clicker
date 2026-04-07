const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let user = null;
let upgrades = { click: 0, energy: 0, regen: 0, bonus: 0 };
let loading = false;

async function sendToBot(action, data = {}) {
    if (loading) return;
    loading = true;
    
    return new Promise((resolve) => {
        const handler = (msg) => {
            try {
                const response = JSON.parse(msg.data);
                tg.offEvent('message', handler);
                loading = false;
                resolve(response);
            } catch(e) {}
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

async function loadData() {
    const data = await sendToBot('get_data');
    if (data) {
        user = data.user;
        upgrades = data.upgrades;
        updateUI();
    }
}

function updateUI() {
    if (!user) return;
    
    document.getElementById('bananas').textContent = Math.floor(user.bananas);
    document.getElementById('level').textContent = user.level;
    document.getElementById('energy').textContent = user.energy;
    document.getElementById('energyMax').textContent = user.energy_max;
    
    const power = Math.floor(user.click_power * user.prestige_bonus);
    document.getElementById('clickPower').textContent = power;
    document.getElementById('bonus').textContent = Math.floor((user.prestige_bonus - 1) * 100);
    
    const expNeeded = user.level * 100;
    const expPercent = (user.exp / expNeeded) * 100;
    document.getElementById('expFill').style.width = `${expPercent}%`;
    document.getElementById('expText').textContent = `${Math.floor(user.exp)}/${expNeeded}`;
    
    const energyPercent = (user.energy / user.energy_max) * 100;
    document.getElementById('energyFill').style.width = `${energyPercent}%`;
    
    document.getElementById('clickLvl').textContent = upgrades.click;
    document.getElementById('energyLvl').textContent = upgrades.energy;
    document.getElementById('regenLvl').textContent = upgrades.regen;
    document.getElementById('bonusLvl').textContent = upgrades.bonus;
    
    document.getElementById('clickCost').textContent = Math.floor(100 * Math.pow(1.5, upgrades.click));
    document.getElementById('energyCost').textContent = Math.floor(100 * Math.pow(1.5, upgrades.energy));
    document.getElementById('regenCost').textContent = Math.floor(150 * Math.pow(1.5, upgrades.regen));
    document.getElementById('bonusCost').textContent = Math.floor(200 * Math.pow(1.5, upgrades.bonus));
}

function showFloating(text, x, y) {
    const div = document.createElement('div');
    div.textContent = text;
    div.className = 'floating';
    div.style.left = `${x}px`;
    div.style.top = `${y - 50}px`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 500);
}

async function handleClick(e) {
    if (!user || user.energy <= 0) {
        showFloating('❌ Нет энергии!', e.clientX, e.clientY);
        return;
    }
    
    const rect = e.target.closest('.minion').getBoundingClientRect();
    showFloating('+🍌', rect.left + rect.width/2, rect.top + rect.height/2);
    
    const data = await sendToBot('click');
    if (data && data.success) {
        user.bananas = data.bananas;
        user.energy = data.energy;
        user.level = data.level;
        user.exp = data.exp;
        
        if (data.leveled) {
            tg.showAlert(`⭐️ УРОВЕНЬ ${data.level}! ⭐️`);
        }
        updateUI();
    } else if (data && data.error) {
        showFloating(data.error, e.clientX, e.clientY);
    }
}

async function buyUpgrade(type) {
    const data = await sendToBot('buy', { type });
    if (data && data.success) {
        user.bananas = data.bananas;
        upgrades = data.upgrades;
        if (data.click_power) user.click_power = data.click_power;
        if (data.energy_max) user.energy_max = data.energy_max;
        updateUI();
        tg.showAlert(data.message);
    } else if (data && data.message) {
        tg.showAlert(data.message);
    }
}

document.getElementById('minion').addEventListener('click', handleClick);
document.getElementById('clickBtn').onclick = () => buyUpgrade('click');
document.getElementById('energyBtn').onclick = () => buyUpgrade('energy');
document.getElementById('regenBtn').onclick = () => buyUpgrade('regen');
document.getElementById('bonusBtn').onclick = () => buyUpgrade('bonus');

document.querySelectorAll('.tab').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    };
});

setInterval(async () => {
    const data = await sendToBot('get_data');
    if (data) {
        user = data.user;
        upgrades = data.upgrades;
        updateUI();
    }
}, 3000);

loadData();
