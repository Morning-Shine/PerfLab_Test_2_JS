'use strict'

let wallet = {
    coinAmount: 0,//поставить в 0
    contribution: [
    ]
};
const fundDisplay = document.querySelector('.amount span');
const inputValue = document.querySelector('.staking input');
const stakingButton = document.querySelector('.staking button');
const stakingPeriod = document.querySelector('.staking select');
const tableInfo = document.querySelector('#gameContainer table');
const config = {
    dayLength: 200, //400 или 1000
    periodOptions: [{
        value: 30,
        text: '30d',
        coef: 20,
    },
    {
        value: 60,
        text: '60d',
        coef: 35,
    },
    {
        value: 90,
        text: '90d',
        coef: 50,
    }],
};

fundDisplay.innerHTML = wallet.coinAmount;
for (let i = 0; i < config.periodOptions.length; i++) {
    stakingPeriod.insertAdjacentHTML('beforeend',
        `<option value=${config.periodOptions[i].value}>${config.periodOptions[i].text}</option>`);
}

let stakingResources = 0;
let rowId = 0;

document.addEventListener('keypress', e => coinPressD(e));
document.addEventListener('DOMContentLoaded', burnMoney(wallet, fundDisplay, config.dayLength));
inputValue.addEventListener('input', e => checkInput(e));
inputValue.addEventListener('focusout', (e) => {
    if (inputValue.contains(e.relatedTarget))
        return
    else {
        hideErrMessages();
    }
});
stakingButton.addEventListener('click', () => placeStaking());

function coinPressD(e) {
    if (e.code == 'KeyD' && e.target != inputValue) {
        wallet.coinAmount = Math.round((wallet.coinAmount + 1) * 10000) / 10000;
        fundDisplay.innerHTML = wallet.coinAmount;
    }
}

let messageErrLetter = document.getElementById('errLetter');
let messageErrNoRes = document.getElementById('errNoRes');
let messageErrMoreOne = document.getElementById('errMoreOne');

function checkInput(e) {
    hideErrMessages();
    if ((/^(\d*[.,])?(\d+)?$/.test(e.target.value))) {
        let coinsForStaking = +(e.target.value.replace(',', '.'));
        if (coinsForStaking > wallet.coinAmount) {
            messageErrNoRes.hidden = false;
            stakingButton.setAttribute('disabled', true);
        } else if (coinsForStaking <= 1) {
            messageErrMoreOne.hidden = false;
            stakingButton.setAttribute('disabled', true);
        } else {
            stakingResources = Math.round(coinsForStaking * 10000) / 10000;
            stakingButton.removeAttribute('disabled');
        }
    } else {
        messageErrLetter.hidden = false;
    }
}

function hideErrMessages() {
    messageErrLetter.hidden = true;
    messageErrNoRes.hidden = true;
    messageErrMoreOne.hidden = true;
}

function placeStaking() {
    inputValue.value = '';

    const placementPeriod = +(document.querySelector('.staking select').value);
    let coeff;
    let displayPeriod;
    for (let i = 0; i < config.periodOptions.length; i++) {
        if (config.periodOptions[i].value == placementPeriod) {
            coeff = config.periodOptions[i].coef;
            displayPeriod = config.periodOptions[i].text;
            break
        };
    }

    const staking = stakingResources;
    stakingResources = 0;
    //wallet.coinAmount -= staking; некорректный расчет разницы (с дробями), округлять
    wallet.coinAmount = Math.round((wallet.coinAmount - staking) * 10000) / 10000;

    fundDisplay.innerHTML = wallet.coinAmount;
    const dividend = Math.log10(staking) * coeff / 100;
    const dividendRounded = Math.round(dividend * 10000) / 10000;

    let infoForPaste = `   
        <tr id='row${rowId}'>
        <td>${staking}</td>
        <td>${displayPeriod}</td>
        <td>${displayPeriod}</td>
        <td></td>
        </tr>`;
    tableInfo.insertAdjacentHTML("beforeend", infoForPaste);
    stakingButton.setAttribute('disabled', true);

    wallet.contribution.push({
        id: 'row' + rowId,
        deposit: staking,
        period: displayPeriod,
        dividend: dividendRounded
    });

    rowId++;

    const dataForDisplay = wallet.contribution[wallet.contribution.length - 1];

    displayProfit(
        dataForDisplay,
        config.dayLength,
        wallet,
        fundDisplay
    );
}

function displayProfit(contribution, dayDuration, wallet, fund) {
    const duration = +contribution.period.slice(0, -1);
    const dayProfit = contribution.dividend / duration;
    const cellForTime = tableInfo.querySelector(`#${contribution.id} :nth-child(3)`);
    const cellForSum = tableInfo.querySelector(`#${contribution.id} :nth-child(4)`);

    let daysCounter = duration - 1;
    const timer = setInterval(() => {
        if (daysCounter == 1) {
            clearInterval(timer);
            setTimeout(() => {
                cellForTime.innerHTML = `завершено`;
                cellForSum.innerHTML = contribution.dividend;
            }, dayDuration);
        }
        const profitCounter = Math.round(dayProfit * (duration - daysCounter) * 10000) / 10000;
        cellForTime.innerHTML = `${daysCounter}d`;
        cellForSum.innerHTML = profitCounter;
        daysCounter--;
    }, dayDuration);

    setTimeout(() => fillUpWallet(wallet, contribution, fund), duration * dayDuration);

}

function fillUpWallet(wallet, contribution, fund) {
    const capital = Math.round((wallet.coinAmount + contribution.deposit + contribution.dividend) * 10000) / 10000;
    wallet.coinAmount = capital;
    fund.innerHTML = capital;
}

function burnMoney(wallet, fund, dayDuration) {
    setInterval(() => {
        if (wallet.coinAmount > 1) {//1 монета минимум для снятия %%
            wallet.coinAmount = wallet.coinAmount - Math.round(Math.log(wallet.coinAmount) / 100 * 10000) / 10000;
            fund.innerHTML = Math.round(wallet.coinAmount* 10000) / 10000;;
        }
    }, 100 * dayDuration);
}