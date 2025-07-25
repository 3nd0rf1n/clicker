document.addEventListener('DOMContentLoaded', () => {
    const clickButton = document.getElementById('clickButton');
    const balanceDisplay = document.getElementById('balanceDisplay');
    const clickAnimationContainer = document.getElementById('clickAnimation');

    let currentBalance = 0;
    let userId = null;
    let webAppInitialized = false;

    // АКТУАЛЬНЫЙ URL ВАШЕГО БЭКЭНДА (ngrok туннель к вашему локальному app.py)
    // НЕ ЗАБУДЬТЕ, ЧТО ЭТОТ URL МЕНЯЕТСЯ ПРИ КАЖДОМ ПЕРЕЗАПУСКЕ NGROK!
    const BACKEND_URL = ' https://0b00f215cdc4.ngrok-free.app/api'; 

    if (Telegram.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        webAppInitialized = true;

        const initData = Telegram.WebApp.initData;
        console.log("Telegram WebApp Initialized. InitData:", initData);

        if (Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
            userId = Telegram.WebApp.initDataUnsafe.user.id;
            console.log("User ID from Telegram WebApp:", userId);
        } else {
            console.warn("User ID not found in Telegram WebApp initDataUnsafe.");
        }

        fetchBalance();

    } else {
        console.warn("Not running in Telegram Web App context. For testing purposes, assuming user_id 123.");
        userId = 123;
        balanceDisplay.textContent = "0";
        fetchBalance();
    }

    async function fetchBalance() {
        if (!userId) {
            balanceDisplay.textContent = "Ошибка: Пользователь не определен.";
            return;
        }
        try {
            const response = await fetch(`${BACKEND_URL}/balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-Init-Data': Telegram.WebApp ? Telegram.WebApp.initData : ''
                },
                body: JSON.stringify({ user_id: userId })
            });
            const data = await response.json();

            if (data.success) {
                currentBalance = data.balance;
                balanceDisplay.textContent = formatBalance(currentBalance);
            } else {
                console.error('Failed to fetch balance:', data.message);
                balanceDisplay.textContent = "Ошибка загрузки";
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
            balanceDisplay.textContent = "Ошибка сети";
        }
    }

    clickButton.addEventListener('click', async (event) => {
        if (!userId) {
            alert("Пожалуйста, перезапустите бота.");
            return;
        }

        const animationElement = document.createElement('div');
        animationElement.classList.add('click-animation');
        const rect = clickButton.getBoundingClientRect();
        animationElement.style.left = `${event.clientX - rect.left}px`;
        animationElement.style.top = `${event.clientY - rect.top}px`;
        clickAnimationContainer.appendChild(animationElement);

        setTimeout(() => {
            animationElement.remove();
        }, 700);

        try {
            const response = await fetch(`${BACKEND_URL}/click`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-Init-Data': Telegram.WebApp ? Telegram.WebApp.initData : ''
                },
                body: JSON.stringify({ user_id: userId, amount: 1 })
            });
            const data = await response.json();

            if (data.success) {
                currentBalance = data.newBalance;
                balanceDisplay.textContent = formatBalance(currentBalance);
            } else {
                console.error('Click failed:', data.message);
            }
        } catch (error) {
            console.error('Error sending click:', error);
        }
    });

    function formatBalance(balance) {
        return balance.toLocaleString('ru-RU');
    }
});
