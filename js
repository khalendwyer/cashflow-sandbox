// ---------------------- Formatting Helper Functions ----------------------
function formatDollar(value) {
  // Round to the nearest whole dollar.
  let rounded = Math.round(value);
  // Format with comma separators and no decimals.
  let formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(Math.abs(rounded));
  return (rounded < 0) ? `(${formatted})` : formatted;
}

function unformatDollar(str) {
  // Remove commas, dollar signs, and whitespace.
  str = str.replace(/[\$,]/g, '').trim();
  // If the string is wrapped in parentheses, interpret as negative.
  if (str.startsWith('(') && str.endsWith(')')) {
    str = '-' + str.slice(1, -1);
  }
  return parseFloat(str) || 0;
}

// ---------------------- Attach Dollar Formatting to Inputs ----------------------
function attachDollarFormatter(input) {
  // On focus, remove formatting.
  input.addEventListener('focus', function() {
    this.value = unformatDollar(this.value);
  });
  // On blur, format the value.
  input.addEventListener('blur', function() {
    let val = parseFloat(this.value);
    if (!isNaN(val)) {
      this.value = formatDollar(val);
    }
  });
}

// ---------------------- Tab Functionality ----------------------
document.querySelectorAll('.tab-button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ---------------------- Toggle Partner Fields ----------------------
document.getElementById('addPartner').addEventListener('change', function() {
  document.getElementById('partnerFields').style.display = this.checked ? 'block' : 'none';
});

// ---------------------- Global Arrays ----------------------
const accounts = [];
const contributions = [];
const expenses = [];

// We'll store per–account simulation results here.
window.simulationPerAccount = [];

// ---------------------- Assets (Accounts) ----------------------
document.getElementById('addAccountBtn').addEventListener('click', () => addAccount());

function addAccount(defaults) {
  defaults = defaults || {};
  const accountTitle = defaults.title || "Account Name";
  const accountType = defaults.type || "Taxable";
  const balance = (defaults.balance !== undefined) ? defaults.balance : 200000;
  const stocks = (defaults.stocks !== undefined) ? defaults.stocks : 60;
  const bonds = (defaults.bonds !== undefined) ? defaults.bonds : 30;
  const cash = (defaults.cash !== undefined) ? defaults.cash : 10;
  
  const accountIndex = accounts.length;
  const container = document.getElementById('accountsContainer');
  const accountDiv = document.createElement('div');
  accountDiv.classList.add('dynamic-item');
  accountDiv.setAttribute('data-index', accountIndex);
  
  // Title Row
  const titleRow = document.createElement('div');
  titleRow.classList.add('dynamic-item-row');
  titleRow.innerHTML = `<input type="text" class="accountTitleInput" value="${accountTitle}" />`;
  
  // Row 1: Account Type & Balance (accountBalance is a dollar amount)
  const row1 = document.createElement('div');
  row1.classList.add('dynamic-item-row');
  row1.innerHTML = `
    <label>
      Account Type:
      <select class="accountType">
        <option value="Taxable" ${accountType === "Taxable" ? "selected" : ""}>Taxable</option>
        <option value="Roth" ${accountType === "Roth" ? "selected" : ""}>Roth</option>
        <option value="401k" ${accountType === "401k" ? "selected" : ""}>401k</option>
      </select>
    </label>
    <label>
      Balance:
      <input type="text" class="accountBalance dollar" value="${formatDollar(balance)}" />
    </label>
  `;
  
  // Row 2: Allocations (percentages remain plain numbers)
  const row2 = document.createElement('div');
  row2.classList.add('dynamic-item-row');
  row2.innerHTML = `
    <label>
      Stocks (%):
      <input type="number" class="stocksAlloc" step="0.1" value="${stocks}" />
    </label>
    <label>
      Bonds (%):
      <input type="number" class="bondsAlloc" step="0.1" value="${bonds}" />
    </label>
    <label>
      Cash (%):
      <input type="number" class="cashAlloc" step="0.1" value="${cash}" />
    </label>
  `;
  
  // Remove Button
  const removeBtn = document.createElement('button');
  removeBtn.classList.add('remove-btn');
  removeBtn.innerText = 'X';
  removeBtn.setAttribute('onclick', `removeAccount(${accountIndex})`);
  
  accountDiv.appendChild(removeBtn);
  accountDiv.appendChild(titleRow);
  accountDiv.appendChild(row1);
  accountDiv.appendChild(row2);
  
  accounts.push(accountDiv);
  container.appendChild(accountDiv);
  addAutoUpdateListeners(accountDiv);
  refreshAccountDetailDropdown();
  generateOutput();
}

function removeAccount(index) {
  const container = document.getElementById('accountsContainer');
  const accountDiv = container.querySelector(`[data-index="${index}"]`);
  if (accountDiv) {
    container.removeChild(accountDiv);
    accounts[index] = null;
    generateOutput();
    refreshAccountDetailDropdown();
  }
}

// ---------------------- Contributions ----------------------
document.getElementById('addContributionBtn').addEventListener('click', () => addContribution());

function addContribution(defaults) {
  defaults = defaults || {};
  const title = defaults.title || "Regular Contribution";
  const amount = (defaults.amount !== undefined) ? defaults.amount : 10000;
  const startAge = (defaults.startAge !== undefined) ? defaults.startAge : 45;
  const endAge = (defaults.endAge !== undefined) ? defaults.endAge : 65;
  const accountIndex = (defaults.accountIndex !== undefined) ? defaults.accountIndex : "";
  
  const contributionIndex = contributions.length;
  const container = document.getElementById('contributionsContainer');
  const contrDiv = document.createElement('div');
  contrDiv.classList.add('dynamic-item');
  contrDiv.setAttribute('data-index', contributionIndex);
  
  // Build account options from existing accounts.
  let accountOptions = `<option value="">Select Account</option>`;
  accounts.forEach((acc, idx) => {
    if (acc) {
      const accTitle = acc.querySelector('.accountTitleInput').value;
      accountOptions += `<option value="${idx}">${accTitle}</option>`;
    }
  });
  
  contrDiv.innerHTML = `
    <button class="remove-btn" onclick="removeContribution(${contributionIndex})">X</button>
    <div class="dynamic-item-row">
      <label>
        Title:
        <input type="text" class="contributionTitle" value="${title}" />
      </label>
      <label>
        Contribution Amount:
        <input type="text" class="contributionAmount dollar" value="${formatDollar(amount)}" />
      </label>
    </div>
    <div class="dynamic-item-row">
      <label>
        Age Range (Start):
        <input type="number" class="contrStartAge" value="${startAge}" />
      </label>
      <label>
        Age Range (End):
        <input type="number" class="contrEndAge" value="${endAge}" />
      </label>
      <label>
        Account:
        <select class="contributionAccount">
          ${accountOptions}
        </select>
      </label>
    </div>
  `;
  
  contributions.push(contrDiv);
  container.appendChild(contrDiv);
  addAutoUpdateListeners(contrDiv);
  if (accountIndex !== "") {
    contrDiv.querySelector('.contributionAccount').value = accountIndex;
  }
  generateOutput();
}

function removeContribution(index) {
  const container = document.getElementById('contributionsContainer');
  const contrDiv = container.querySelector(`[data-index="${index}"]`);
  if (contrDiv) {
    container.removeChild(contrDiv);
    contributions[index] = null;
    generateOutput();
  }
}

// ---------------------- Expenses ----------------------
document.getElementById('addExpenseBtn').addEventListener('click', () => addExpense());

function addExpense(defaults) {
  defaults = defaults || {};
  const labelText = defaults.label || "One-time Vacation";
  const amount = (defaults.amount !== undefined) ? defaults.amount : 15000;
  const accountIndex = (defaults.accountIndex !== undefined) ? defaults.accountIndex : "";
  const expenseTypeDefault = defaults.expenseType || "oneTime"; // "oneTime" or "recurring"
  const oneTimeAge = (defaults.oneTimeAge !== undefined) ? defaults.oneTimeAge : 60;
  const expStartAge = (defaults.expStartAge !== undefined) ? defaults.expStartAge : 65;
  const expEndAge = (defaults.expEndAge !== undefined) ? defaults.expEndAge : 85;
  const expenseIndefinite = defaults.expenseIndefinite || "partner";
  
  const expenseIndex = expenses.length;
  const container = document.getElementById('expensesContainer');
  const expDiv = document.createElement('div');
  expDiv.classList.add('dynamic-item');
  expDiv.setAttribute('data-index', expenseIndex);
  
  // Build account options from existing accounts.
  let accountOptions = `<option value="">Default Order</option>`;
  accounts.forEach((acc, idx) => {
    if (acc) {
      const accTitle = acc.querySelector('.accountTitleInput').value;
      accountOptions += `<option value="${idx}">${accTitle}</option>`;
    }
  });
  
  const oneTimeSelected = expenseTypeDefault === "oneTime" ? "selected" : "";
  const recurringSelected = expenseTypeDefault === "recurring" ? "selected" : "";
  const oneTimeDisplay = expenseTypeDefault === "oneTime" ? "block" : "none";
  const recurringDisplay = expenseTypeDefault === "recurring" ? "block" : "none";
  
  expDiv.innerHTML = `
    <button class="remove-btn" onclick="removeExpense(${expenseIndex})">X</button>
    <div class="dynamic-item-row">
      <label>
        Expense Label:
        <input type="text" class="expenseLabel" value="${labelText}" />
      </label>
      <label>
        Expense Amount:
        <input type="text" class="expenseAmount dollar" value="${formatDollar(amount)}" />
      </label>
      <label>
        Withdraw From:
        <select class="expenseAccount">
          ${accountOptions}
        </select>
      </label>
    </div>
    <div class="dynamic-item-row">
      <label>
        Expense Type:
        <select class="expenseType">
          <option value="oneTime" ${oneTimeSelected}>One Time</option>
          <option value="recurring" ${recurringSelected}>Recurring</option>
        </select>
      </label>
      <div class="oneTimeDetails" style="display: ${oneTimeDisplay};">
        <label>
          Occurrence Age:
          <input type="number" class="expenseOneTimeAge" value="${oneTimeAge}" />
        </label>
      </div>
      <div class="recurringDetails" style="display: ${recurringDisplay};">
        <label>
          Age Range (Start):
          <input type="number" class="expStartAge" value="${expStartAge}" />
        </label>
        <label>
          Age Range (End):
          <input type="number" class="expEndAge" value="${expEndAge}" />
        </label>
        <label>
          Or, Occurs Indefinitely Until:
          <select class="expenseIndefinite">
            <option value="partner" ${expenseIndefinite === "partner" ? "selected" : ""}>One partner dies</option>
            <option value="both" ${expenseIndefinite === "both" ? "selected" : ""}>Both die</option>
          </select>
        </label>
      </div>
    </div>
  `;
  
  const expenseTypeEl = expDiv.querySelector('.expenseType');
  const oneTimeDiv = expDiv.querySelector('.oneTimeDetails');
  const recurringDiv = expDiv.querySelector('.recurringDetails');
  
  expenseTypeEl.addEventListener('change', function() {
    if (this.value === 'oneTime') {
      oneTimeDiv.style.display = 'block';
      recurringDiv.style.display = 'none';
    } else {
      oneTimeDiv.style.display = 'none';
      recurringDiv.style.display = 'block';
    }
    generateOutput();
  });
  
  expenses.push(expDiv);
  container.appendChild(expDiv);
  addAutoUpdateListeners(expDiv);
  if (accountIndex !== "") {
    expDiv.querySelector('.expenseAccount').value = accountIndex;
  }
  generateOutput();
}

function removeExpense(index) {
  const container = document.getElementById('expensesContainer');
  const expDiv = container.querySelector(`[data-index="${index}"]`);
  if (expDiv) {
    container.removeChild(expDiv);
    expenses[index] = null;
    generateOutput();
  }
}

// ---------------------- Simulation Calculation ----------------------
// We run a single simulation that produces both aggregated data and per–account simulation.
function generateOutput() {
  const tableBody = document.querySelector('#cashFlowTable tbody');
  tableBody.innerHTML = '';
  
  const currentAge = parseFloat(document.getElementById('currentAge').value) || 50;
  const lifeExpectancy = parseFloat(document.getElementById('lifeExpectancy').value) || 90;
  const taxRate = parseFloat(document.getElementById('taxRate').value) / 100;
  const stocksReturnRate = parseFloat(document.getElementById('stocksReturn').value) / 100;
  const bondsReturnRate = parseFloat(document.getElementById('bondsReturn').value) / 100;
  const cashReturnRate = parseFloat(document.getElementById('cashReturn').value) / 100;
  
  const numAccounts = accounts.length;
  // Initialize per-account balances and simulation arrays.
  let accountBalances = [];
  let accountTypes = [];
  let simulationPerAccount = [];
  for (let i = 0; i < numAccounts; i++) {
    if (accounts[i] !== null) {
      accountBalances[i] = unformatDollar(accounts[i].querySelector('.accountBalance').value) || 0;
      accountTypes[i] = accounts[i].querySelector('.accountType').value;
      simulationPerAccount[i] = []; // an empty array for yearly records
    }
  }
  
  let aggregatedData = [];
  // Loop through each year.
  for (let year = currentAge; year <= lifeExpectancy; year++) {
    // Calculate total beginning balance across all accounts.
    let totalBeg = 0;
    for (let i = 0; i < numAccounts; i++) {
      if (accounts[i] !== null) {
        totalBeg += accountBalances[i];
      }
    }
    
    // Compute global expense for this year (from expenses that are unassigned).
    let globalExp = 0;
    expenses.forEach(eDiv => {
      if (eDiv !== null) {
        const eAcc = eDiv.querySelector('.expenseAccount').value;
        if (eAcc === "") {
          const eType = eDiv.querySelector('.expenseType').value;
          const eAmt = unformatDollar(eDiv.querySelector('.expenseAmount').value) || 0;
          if (eType === 'oneTime') {
            const occAge = parseFloat(eDiv.querySelector('.expenseOneTimeAge').value);
            if (year === occAge) {
              globalExp += eAmt;
            }
          } else if (eType === 'recurring') {
            const sAge = parseFloat(eDiv.querySelector('.expStartAge').value);
            let dAge = parseFloat(eDiv.querySelector('.expEndAge').value);
            const indef = eDiv.querySelector('.expenseIndefinite').value;
            if (indef === "both") {
              dAge = lifeExpectancy;
            }
            if (year >= sAge && year <= dAge) {
              globalExp += eAmt;
            }
          }
        }
      }
    });
    
    let aggBeg = 0, aggContr = 0, aggReturn = 0, aggTaxes = 0, aggExp = 0;
    
    // Process each account.
    for (let i = 0; i < numAccounts; i++) {
      if (accounts[i] !== null) {
        let beg = accountBalances[i];
        
        // Sum contributions for this account.
        let contr = 0;
        contributions.forEach(cDiv => {
          if (cDiv !== null) {
            const cStart = parseFloat(cDiv.querySelector('.contrStartAge').value);
            const cEnd = parseFloat(cDiv.querySelector('.contrEndAge').value);
            const cAmt = unformatDollar(cDiv.querySelector('.contributionAmount').value) || 0;
            const cAcc = cDiv.querySelector('.contributionAccount').value;
            if (year >= cStart && year <= cEnd && parseInt(cAcc,10) === i) {
              contr += cAmt;
            }
          }
        });
        
        // Sum expenses assigned explicitly to this account.
        let assignedExp = 0;
        expenses.forEach(eDiv => {
          if (eDiv !== null) {
            const eAcc = eDiv.querySelector('.expenseAccount').value;
            if (eAcc !== "" && parseInt(eAcc,10) === i) {
              const eType = eDiv.querySelector('.expenseType').value;
              const eAmt = unformatDollar(eDiv.querySelector('.expenseAmount').value) || 0;
              if (eType === 'oneTime') {
                const occAge = parseFloat(eDiv.querySelector('.expenseOneTimeAge').value);
                if (year === occAge) {
                  assignedExp += eAmt;
                }
              } else if (eType === 'recurring') {
                const sAge = parseFloat(eDiv.querySelector('.expStartAge').value);
                let dAge = parseFloat(eDiv.querySelector('.expEndAge').value);
                const indef = eDiv.querySelector('.expenseIndefinite').value;
                if (indef === "both") {
                  dAge = lifeExpectancy;
                }
                if (year >= sAge && year <= dAge) {
                  assignedExp += eAmt;
                }
              }
            }
          }
        });
        
        // Distribute global expense proportionally.
        let globalShare = (totalBeg > 0) ? globalExp * (beg / totalBeg) : 0;
        
        // Calculate account return based on allocations.
        const stocksAlloc = parseFloat(accounts[i].querySelector('.stocksAlloc').value) || 0;
        const bondsAlloc = parseFloat(accounts[i].querySelector('.bondsAlloc').value) || 0;
        const cashAlloc = parseFloat(accounts[i].querySelector('.cashAlloc').value) || 0;
        const weightedReturn = (stocksAlloc/100)*stocksReturnRate + (bondsAlloc/100)*bondsReturnRate + (cashAlloc/100)*cashReturnRate;
        let ret = beg * weightedReturn;
        
        let tax = (accountTypes[i] === "Taxable") ? ret * taxRate : 0;
        
        let totalExpense = assignedExp + globalShare;
        let end = beg + contr + ret - tax - totalExpense;
        
        // Save this year's simulation for account i.
        simulationPerAccount[i].push({
          year: year,
          beg: beg,
          contributions: contr,
          annualReturn: ret,
          taxes: tax,
          assignedExpense: assignedExp,
          globalExpenseShare: globalShare,
          totalExpense: totalExpense,
          end: end
        });
        
        accountBalances[i] = end;
        
        aggBeg += beg;
        aggContr += contr;
        aggReturn += ret;
        aggTaxes += tax;
        aggExp += totalExpense;
      }
    }
    
    let aggEnd = aggBeg + aggContr + aggReturn - aggTaxes - aggExp;
    aggregatedData.push({
      year: year,
      begBalance: aggBeg,
      contributions: aggContr,
      annualReturn: aggReturn,
      taxes: aggTaxes,
      expenses: aggExp,
      endBalance: aggEnd
    });
  }
  
  window.simulationPerAccount = simulationPerAccount;
  
  // Populate Aggregated Table using formatted dollar amounts.
  aggregatedData.forEach(rowData => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${rowData.year}</td>
      <td>${formatDollar(rowData.begBalance)}</td>
      <td>${formatDollar(rowData.contributions)}</td>
      <td>${formatDollar(rowData.annualReturn)}</td>
      <td>${formatDollar(-rowData.taxes)}</td>
      <td>${formatDollar(-rowData.expenses)}</td>
      <td>${formatDollar(rowData.endBalance)}</td>
    `;
    tableBody.appendChild(row);
  });
  
  generateChartAggregated(aggregatedData);
  generateAccountDetail();
}

function generateChartAggregated(aggregatedData) {
  const ctx = document.getElementById('balanceChart').getContext('2d');
  const labels = aggregatedData.map(d => d.year);
  const data = aggregatedData.map(d => d.endBalance);
  if (window.balanceChart && typeof window.balanceChart.destroy === 'function') {
    window.balanceChart.destroy();
  }
  window.balanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Portfolio Balance',
        data: data,
        borderColor: '#000',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderWidth: 2,
        pointBackgroundColor: '#000',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#000',
            font: { size: 12 }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#000' },
          grid: { color: '#ccc' },
          title: { display: true, text: 'Age', color: '#000' }
        },
        y: {
          ticks: { color: '#000' },
          grid: { color: '#ccc' },
          title: { display: true, text: 'Balance', color: '#000' }
        }
      }
    }
  });
}

function refreshAccountDetailDropdown() {
  const accountSelect = document.getElementById('accountDetailSelect');
  accountSelect.innerHTML = '';
  accounts.forEach((accDiv, idx) => {
    if (accDiv !== null) {
      const titleInput = accDiv.querySelector('.accountTitleInput');
      const option = document.createElement('option');
      option.value = idx;
      option.textContent = titleInput.value || `Account ${idx+1}`;
      accountSelect.appendChild(option);
    }
  });
  generateAccountDetail();
}

document.addEventListener('DOMContentLoaded', () => {
  const accountSelect = document.getElementById('accountDetailSelect');
  accountSelect.addEventListener('change', generateAccountDetail);
});

// Render account-level details using the precomputed simulation.
function generateAccountDetail() {
  const accountSelect = document.getElementById('accountDetailSelect');
  const tableBody = document.querySelector('#accountDetailTable tbody');
  tableBody.innerHTML = '';
  if (accountSelect.value === "") return;
  const accountIndex = parseInt(accountSelect.value, 10);
  const simData = window.simulationPerAccount[accountIndex];
  if (!simData) return;
  
  simData.forEach(record => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${record.year}</td>
      <td>${formatDollar(record.beg)}</td>
      <td>${formatDollar(record.contributions)}</td>
      <td>${formatDollar(record.annualReturn)}</td>
      <td>${formatDollar(-record.taxes)}</td>
      <td>${formatDollar(-record.totalExpense)}</td>
      <td>${formatDollar(record.end)}</td>
    `;
    tableBody.appendChild(row);
  });
}

// ---------------------- Auto-Update Listeners ----------------------
function addAutoUpdateListeners(container) {
  const inputs = container.querySelectorAll('input, select');
  inputs.forEach(input => {
    input.addEventListener('input', generateOutput);
    input.addEventListener('change', generateOutput);
    if (input.classList.contains('accountTitleInput')) {
      input.addEventListener('input', refreshAccountDetailDropdown);
    }
    if (input.classList.contains('dollar')) {
      attachDollarFormatter(input);
    }
  });
}

document.addEventListener('input', generateOutput);
document.addEventListener('change', generateOutput);

// ---------------------- Initialize Defaults ----------------------
document.addEventListener('DOMContentLoaded', () => {
  // Add default accounts
  addAccount({ title: "Roth IRA", type: "Roth", balance: 250000, stocks: 80, bonds: 20, cash: 0 });
  addAccount({ title: "401(k)", type: "401k", balance: 500000, stocks: 70, bonds: 30, cash: 0 });
  addAccount({ title: "Brokerage", type: "Taxable", balance: 800000, stocks: 50, bonds: 30, cash: 20 });
  
  // Add default contributions
  addContribution({ title: "Contributions to Roth IRA", amount: 6500, startAge: 55, endAge: 64, accountIndex: "0" });
  addContribution({ title: "Contributions to 401(k)", amount: 10000, startAge: 55, endAge: 64, accountIndex: "1" });
  addContribution({ title: "Contributions to Brokerage Account", amount: 5000, startAge: 55, endAge: 64, accountIndex: "2" });
  
  // Add default expenses
  addExpense({ label: "Early Retirement Living Expenses", amount: 250000, expenseType: "recurring", expStartAge: 65, expEndAge: 70 });
  addExpense({ label: "Mid-Retirement Living Expenses", amount: 200000, expenseType: "recurring", expStartAge: 71, expEndAge: 80, expenseIndefinite: "both" });
  
  refreshAccountDetailDropdown();
  generateOutput();
});
