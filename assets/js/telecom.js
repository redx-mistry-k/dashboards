// ✅ Telco CSV headers:
// customerID	gender	SeniorCitizen	Partner	Dependents	tenure	PhoneService	MultipleLines
// InternetService	OnlineSecurity	OnlineBackup	DeviceProtection	TechSupport	StreamingTV
// StreamingMovies	Contract	PaperlessBilling	PaymentMethod	MonthlyCharges	TotalCharges	Churn

const CSV_PATH_TELECOM = "/data/telco-churn.csv";

let allRows = [];
let filteredRows = [];
let currentCharts = {};
let atRiskCustomers = [];

// Theme colors for charts
const CHART_COLORS = {
  primary: '#06d6a0',
  secondary: '#4361ee',
  accent: '#4cc9f0',
  success: '#06d6a0',
  warning: '#ffd166',
  danger: '#ef476f',
  dark: '#1a1a2e',
  gray: '#6c757d',
  churn: '#ef476f',
  retention: '#06d6a0'
};

// Contract type colors
const CONTRACT_COLORS = {
  'Month-to-month': '#ef476f',
  'One year': '#ffd166',
  'Two year': '#06d6a0'
};

// Internet service colors
const INTERNET_COLORS = {
  'Fiber optic': '#ef476f',
  'DSL': '#4361ee',
  'No': '#6c757d'
};

// Payment method colors
const PAYMENT_COLORS = {
  'Electronic check': '#ef476f',
  'Mailed check': '#ffd166',
  'Bank transfer (automatic)': '#4361ee',
  'Credit card (automatic)': '#06d6a0'
};

function formatNumber(num) {
  if (isNaN(num)) return "-";
  return num.toLocaleString("en-US");
}

function formatPercent(num) {
  if (isNaN(num)) return "-";
  return num.toFixed(1) + "%";
}

function formatCurrency(num) {
  if (isNaN(num)) return "-";
  return "$" + num.toLocaleString("en-US", { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });
}

function getChurnRisk(churnRate, tenure, contractType, monthlyCharges) {
  let riskScore = 0;
  
  // Contract type risk
  if (contractType === 'Month-to-month') riskScore += 40;
  else if (contractType === 'One year') riskScore += 20;
  else riskScore += 10; // Two year
  
  // Tenure risk (lower tenure = higher risk)
  if (tenure < 12) riskScore += 30;
  else if (tenure < 24) riskScore += 20;
  else if (tenure < 36) riskScore += 10;
  
  // Monthly charges risk (higher charges = higher risk)
  if (monthlyCharges > 80) riskScore += 20;
  else if (monthlyCharges > 60) riskScore += 10;
  
  // Add some randomness to simulate ML prediction
  riskScore += Math.random() * 10;
  
  if (riskScore > 70) return { 
    level: 'High', 
    color: '#ef476f', 
    class: 'high-risk-score',
    score: Math.min(riskScore, 95)
  };
  if (riskScore > 40) return { 
    level: 'Medium', 
    color: '#ffd166', 
    class: 'medium-risk-score',
    score: riskScore
  };
  return { 
    level: 'Low', 
    color: '#06d6a0', 
    class: 'low-risk-score',
    score: Math.max(riskScore, 15)
  };
}

function tenureGroup(tenure) {
  if (tenure <= 6) return "0-6 months";
  if (tenure <= 12) return "7-12 months";
  if (tenure <= 24) return "13-24 months";
  if (tenure <= 36) return "25-36 months";
  if (tenure <= 48) return "37-48 months";
  return "49+ months";
}

function predictChurnProbability(customer) {
  // Simple prediction algorithm based on key factors
  let probability = 0;
  
  // Contract type is the biggest predictor
  if (customer.Contract === 'Month-to-month') probability += 40;
  else if (customer.Contract === 'One year') probability += 20;
  else probability += 5; // Two year
  
  // Internet service
  if (customer.InternetService === 'Fiber optic') probability += 20;
  else if (customer.InternetService === 'DSL') probability += 10;
  
  // Tenure (inverse relationship)
  if (customer.tenure < 12) probability += 25;
  else if (customer.tenure < 24) probability += 15;
  else if (customer.tenure < 36) probability += 5;
  
  // Monthly charges
  if (customer.MonthlyCharges > 70) probability += 15;
  else if (customer.MonthlyCharges > 50) probability += 10;
  
  // Tech support
  if (customer.TechSupport === 'No') probability += 10;
  
  // Online security
  if (customer.OnlineSecurity === 'No') probability += 10;
  
  // Add some randomness
  probability += Math.random() * 10 - 5;
  
  return Math.min(Math.max(probability, 5), 95);
}

// Filter rows based on current filters
function applyFilters() {
  const contractFilter = document.getElementById('contract-filter')?.value || 'all';
  const internetFilter = document.getElementById('internet-filter')?.value || 'all';
  const tenureFilter = document.getElementById('tenure-filter')?.value || 'all';
  
  filteredRows = allRows.filter(row => {
    // Contract filter
    if (contractFilter !== 'all' && row.Contract !== contractFilter) {
      return false;
    }
    
    // Internet filter
    if (internetFilter !== 'all' && row.InternetService !== internetFilter) {
      return false;
    }
    
    // Tenure filter
    if (tenureFilter !== 'all') {
      const group = tenureGroup(row.tenure || 0);
      if (group !== tenureFilter) {
        return false;
      }
    }
    
    return true;
  });
  
  return filteredRows;
}

// Update KPI cards with animation
function updateKPICards(data) {
  const kpiElements = {
    'kpi-total-customers': document.getElementById('kpi-total-customers'),
    'kpi-churn-rate': document.getElementById('kpi-churn-rate'),
    'kpi-avg-tenure': document.getElementById('kpi-avg-tenure'),
    'kpi-avg-charges': document.getElementById('kpi-avg-charges')
  };
  
  // Add loading animation
  Object.values(kpiElements).forEach(el => {
    if (el) {
      el.style.transform = 'scale(1.05)';
      el.style.transition = 'transform 0.3s ease';
    }
  });
  
  setTimeout(() => {
    Object.values(kpiElements).forEach(el => {
      if (el) {
        el.style.transform = 'scale(1)';
      }
    });
  }, 300);
  
  // Update values
  if (kpiElements['kpi-total-customers']) {
    kpiElements['kpi-total-customers'].textContent = formatNumber(data.totalCustomers);
  }
  if (kpiElements['kpi-churn-rate']) {
    const churnRate = data.churnRate;
    kpiElements['kpi-churn-rate'].textContent = formatPercent(churnRate);
    kpiElements['kpi-churn-rate'].className = churnRate > 20 ? 'churn-high' : 'churn-low';
  }
  if (kpiElements['kpi-avg-tenure']) {
    kpiElements['kpi-avg-tenure'].textContent = data.avgTenure.toFixed(1);
  }
  if (kpiElements['kpi-avg-charges']) {
    kpiElements['kpi-avg-charges'].textContent = formatCurrency(data.avgMonthly);
  }
  
  // Update trend indicators
  updateTrendIndicators(data);
}

function updateTrendIndicators(data) {
  // Simulate trend data
  const trends = {
    customersTrend: Math.random() > 0.3 ? 'positive' : 'negative',
    churnTrend: Math.random() > 0.5 ? 'negative' : 'positive', // Negative is bad for churn
    tenureTrend: Math.random() > 0.6 ? 'positive' : 'negative',
    chargesTrend: Math.random() > 0.4 ? 'positive' : 'negative'
  };
  
  // Update trend indicators
  document.querySelectorAll('.kpi-card .trend').forEach((trendEl, index) => {
    const trendsArray = Object.values(trends);
    if (index < trendsArray.length) {
      const trend = trendsArray[index];
      trendEl.className = `trend ${trend}`;
      
      if (index === 1) { // Churn trend - reversed logic
        const change = (Math.random() * 4).toFixed(1);
        trendEl.innerHTML = trend === 'negative' 
          ? '<i class="fas fa-arrow-up"></i><span>+' + change + '%</span>'
          : '<i class="fas fa-arrow-down"></i><span>-' + change + '%</span>';
      } else {
        const change = (Math.random() * 6).toFixed(1);
        trendEl.innerHTML = trend === 'positive' 
          ? '<i class="fas fa-arrow-up"></i><span>+' + change + '%</span>'
          : '<i class="fas fa-arrow-down"></i><span>-' + change + '%</span>';
      }
    }
  });
}

// Main function
function loadTelecomDashboard() {
  // Show loading state
  document.querySelectorAll('.kpi-card p').forEach(el => {
    el.innerHTML = '<span class="loading"></span>';
  });
  
  Papa.parse(CSV_PATH_TELECOM, {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: (results) => {
      allRows = results.data.filter(r => r.customerID);
      filteredRows = [...allRows];
      
      // Apply any existing filters
      if (document.getElementById('apply-filters')) {
        filteredRows = applyFilters();
      }
      
      buildTelecomDashboard(filteredRows);
      updateCustomerTable(filteredRows);
      
      // Enable filter buttons
      if (document.getElementById('apply-filters')) {
        document.getElementById('apply-filters').addEventListener('click', () => {
          const filtered = applyFilters();
          buildTelecomDashboard(filtered);
          updateCustomerTable(filtered);
        });
      }
      
      if (document.getElementById('reset-filters')) {
        document.getElementById('reset-filters').addEventListener('click', () => {
          filteredRows = [...allRows];
          buildTelecomDashboard(filteredRows);
          updateCustomerTable(filteredRows);
          
          // Reset filter dropdowns
          if (document.getElementById('contract-filter')) {
            document.getElementById('contract-filter').value = 'all';
          }
          if (document.getElementById('internet-filter')) {
            document.getElementById('internet-filter').value = 'all';
          }
          if (document.getElementById('tenure-filter')) {
            document.getElementById('tenure-filter').value = 'all';
          }
        });
      }
    },
    error: (err) => {
      console.error("Error loading telecom CSV:", err);
      // Fallback to demo data
      useDemoData();
    }
  });
}

// Fallback demo data
function useDemoData() {
  console.log("Using demo telecom data...");
  allRows = [];
  
  const contracts = ['Month-to-month', 'One year', 'Two year'];
  const internetServices = ['Fiber optic', 'DSL', 'No'];
  const paymentMethods = ['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)'];
  const techSupportOptions = ['Yes', 'No', 'No internet service'];
  const onlineSecurityOptions = ['Yes', 'No', 'No internet service'];
  
  for (let i = 0; i < 2000; i++) {
    const contract = contracts[Math.floor(Math.random() * contracts.length)];
    const churn = Math.random() < 0.265 ? 'Yes' : 'No'; // 26.5% churn rate
    const tenure = Math.floor(Math.random() * 72);
    const monthlyCharges = Math.random() * 100 + 20;
    
    allRows.push({
      customerID: `C${i + 1000}`,
      Churn: churn,
      Contract: contract,
      InternetService: internetServices[Math.floor(Math.random() * internetServices.length)],
      tenure: tenure,
      MonthlyCharges: monthlyCharges,
      PaymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      TechSupport: techSupportOptions[Math.floor(Math.random() * techSupportOptions.length)],
      OnlineSecurity: onlineSecurityOptions[Math.floor(Math.random() * onlineSecurityOptions.length)],
      PhoneService: Math.random() > 0.1 ? 'Yes' : 'No',
      MultipleLines: Math.random() > 0.5 ? 'Yes' : 'No',
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      SeniorCitizen: Math.random() > 0.8 ? 1 : 0
    });
  }
  
  filteredRows = [...allRows];
  buildTelecomDashboard(filteredRows);
  updateCustomerTable(filteredRows);
}

function buildTelecomDashboard(rows) {
  const totalCustomers = rows.length;

  let churned = 0;
  let totalTenure = 0;
  let totalMonthlyCharges = 0;

  const churnCounts = { Yes: 0, No: 0 };
  const contractStats = {};   // { ContractType: { churned, total } }
  const internetStats = {};   // { InternetService: { churned, total } }
  const tenureStats = {};     // { "0-6": { churned, total }, ... }
  const paymentStats = {};    // { PaymentMethod: { churned, total } }
  const techSupportStats = {}; // { TechSupport: { churned, total } }
  const phoneServiceStats = {}; // { PhoneService: { churned, total } }

  rows.forEach(row => {
    const churn = String(row.Churn || "").trim();
    const contract = row.Contract || "Unknown";
    const internet = row.InternetService || "Unknown";
    const tenure = Number(row.tenure) || 0;
    const monthly = Number(row.MonthlyCharges) || 0;
    const payment = row.PaymentMethod || "Unknown";
    const techSupport = row.TechSupport || "Unknown";
    const phoneService = row.PhoneService || "Unknown";

    if (churn === "Yes") {
      churned += 1;
      churnCounts.Yes += 1;
    } else {
      churnCounts.No += 1;
    }

    totalTenure += tenure;
    totalMonthlyCharges += monthly;

    // Contract stats
    if (!contractStats[contract]) {
      contractStats[contract] = { churned: 0, total: 0 };
    }
    contractStats[contract].total += 1;
    if (churn === "Yes") contractStats[contract].churned += 1;

    // Internet stats
    if (!internetStats[internet]) {
      internetStats[internet] = { churned: 0, total: 0 };
    }
    internetStats[internet].total += 1;
    if (churn === "Yes") internetStats[internet].churned += 1;

    // Tenure groups
    const group = tenureGroup(tenure);
    if (!tenureStats[group]) {
      tenureStats[group] = { churned: 0, total: 0 };
    }
    tenureStats[group].total += 1;
    if (churn === "Yes") tenureStats[group].churned += 1;

    // Payment stats
    if (!paymentStats[payment]) {
      paymentStats[payment] = { churned: 0, total: 0 };
    }
    paymentStats[payment].total += 1;
    if (churn === "Yes") paymentStats[payment].churned += 1;

    // Tech support stats
    if (!techSupportStats[techSupport]) {
      techSupportStats[techSupport] = { churned: 0, total: 0 };
    }
    techSupportStats[techSupport].total += 1;
    if (churn === "Yes") techSupportStats[techSupport].churned += 1;

    // Phone service stats
    if (!phoneServiceStats[phoneService]) {
      phoneServiceStats[phoneService] = { churned: 0, total: 0 };
    }
    phoneServiceStats[phoneService].total += 1;
    if (churn === "Yes") phoneServiceStats[phoneService].churned += 1;
  });

  const churnRate = totalCustomers ? (churned / totalCustomers) * 100 : 0;
  const avgTenure = totalCustomers ? totalTenure / totalCustomers : 0;
  const avgMonthly = totalCustomers ? totalMonthlyCharges / totalCustomers : 0;

  // Prepare KPI data
  const kpiData = {
    totalCustomers,
    churnRate,
    avgTenure,
    avgMonthly
  };

  // Update KPI cards
  updateKPICards(kpiData);

  // Build charts
  buildChurnOverallChart(churnCounts);
  buildChurnByContractChart(contractStats);
  buildChurnByInternetChart(internetStats);
  buildChurnByTenureChart(tenureStats);
  buildChurnByPhoneChart(phoneServiceStats);
  buildChurnByTechSupportChart(techSupportStats);
  
  // Update at-risk customers list
  identifyAtRiskCustomers(rows);
}

function identifyAtRiskCustomers(rows) {
  atRiskCustomers = [];
  
  rows.forEach(row => {
    if (row.Churn === 'No') { // Only predict for current customers
      const churnProbability = predictChurnProbability(row);
      if (churnProbability > 60) {
        const risk = getChurnRisk(
          churnProbability, 
          row.tenure || 0, 
          row.Contract || 'Unknown', 
          row.MonthlyCharges || 0
        );
        
        atRiskCustomers.push({
          ...row,
          churnProbability,
          riskLevel: risk.level,
          riskScore: risk.score
        });
      }
    }
  });
  
  // Sort by risk score descending
  atRiskCustomers.sort((a, b) => b.riskScore - a.riskScore);
}

function updateCustomerTable(rows) {
  const tableBody = document.getElementById('customer-table')?.querySelector('tbody');
  if (!tableBody) return;
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Add at-risk customers first, then some regular customers
  const displayRows = [...atRiskCustomers.slice(0, 10)];
  
  // If not enough at-risk customers, add some regular ones
  if (displayRows.length < 10) {
    const regularCustomers = rows
      .filter(row => row.Churn === 'No')
      .slice(0, 10 - displayRows.length);
    
    regularCustomers.forEach(row => {
      const churnProbability = predictChurnProbability(row);
      const risk = getChurnRisk(
        churnProbability, 
        row.tenure || 0, 
        row.Contract || 'Unknown', 
        row.MonthlyCharges || 0
      );
      
      displayRows.push({
        ...row,
        churnProbability,
        riskLevel: risk.level,
        riskScore: risk.score
      });
    });
  }
  
  // Add rows to table
  displayRows.forEach((row, index) => {
    const contractClass = row.Contract === 'Month-to-month' ? 'contract-monthly' : 
                         row.Contract === 'One year' ? 'contract-yearly' : 'contract-two-year';
    
    const rowElement = document.createElement('tr');
    rowElement.innerHTML = `
      <td>${row.customerID || `TEL${index + 1000}`}</td>
      <td><span class="contract-badge ${contractClass}">${row.Contract || 'Unknown'}</span></td>
      <td>${row.tenure || 0}</td>
      <td>${formatCurrency(row.MonthlyCharges || 0)}</td>
      <td>${row.InternetService || 'Unknown'}</td>
      <td><span class="${row.riskLevel === 'High' ? 'churn-high' : row.riskLevel === 'Medium' ? '' : 'churn-low'}">${row.riskLevel}</span></td>
      <td><span class="prediction-score ${row.riskLevel === 'High' ? 'high-risk-score' : row.riskLevel === 'Medium' ? 'medium-risk-score' : 'low-risk-score'}">${Math.round(row.riskScore)}%</span></td>
      <td><button class="btn retain-btn" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" data-customer="${row.customerID || index}">Retain</button></td>
    `;
    tableBody.appendChild(rowElement);
  });
  
  // Add event listeners to retain buttons
  document.querySelectorAll('.retain-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const customerId = this.getAttribute('data-customer');
      sendRetentionOffer(customerId, this);
    });
  });
}

function buildChurnOverallChart(churnCounts) {
  const labels = Object.keys(churnCounts);
  const data = labels.map(l => churnCounts[l]);
  
  const backgroundColors = [
    CHART_COLORS.churn,    // Yes
    CHART_COLORS.retention // No
  ];

  const ctx = document.getElementById("churnOverall");
  if (!ctx) return;
  
  // Destroy existing chart if it exists
  if (currentCharts.churnOverall) {
    currentCharts.churnOverall.destroy();
  }

  currentCharts.churnOverall = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderColor: '#fff',
        borderWidth: 3,
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `${context.label}: ${formatNumber(context.raw)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function buildChurnByContractChart(stats) {
  const labels = Object.keys(stats);
  const data = labels.map(label => {
    const s = stats[label];
    return s.total ? (s.churned / s.total) * 100 : 0;
  });
  
  // Generate colors based on contract type
  const backgroundColors = labels.map(label => 
    CONTRACT_COLORS[label] || CHART_COLORS.gray
  );

  const ctx = document.getElementById("churnByContract");
  if (!ctx) return;
  
  if (currentCharts.churnByContract) {
    currentCharts.churnByContract.destroy();
  }

  currentCharts.churnByContract = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Churn Rate (%)",
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color + 'CC'),
        borderWidth: 1,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = stats[context.label].total;
              const churned = stats[context.label].churned;
              return `${context.raw.toFixed(1)}% (${churned} of ${total} customers)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => v + "%"
          },
          grid: {
            drawBorder: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function buildChurnByInternetChart(stats) {
  const labels = Object.keys(stats);
  const data = labels.map(label => {
    const s = stats[label];
    return s.total ? (s.churned / s.total) * 100 : 0;
  });
  
  // Generate colors based on internet service
  const backgroundColors = labels.map(label => 
    INTERNET_COLORS[label] || CHART_COLORS.gray
  );

  const ctx = document.getElementById("churnByInternet");
  if (!ctx) return;
  
  if (currentCharts.churnByInternet) {
    currentCharts.churnByInternet.destroy();
  }

  currentCharts.churnByInternet = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Churn Rate (%)",
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color + 'CC'),
        borderWidth: 1,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = stats[context.label].total;
              const churned = stats[context.label].churned;
              return `${context.raw.toFixed(1)}% (${churned} of ${total} customers)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => v + "%"
          },
          grid: {
            drawBorder: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function buildChurnByTenureChart(stats) {
  // Sort tenure groups logically
  const tenureOrder = ["0-6 months", "7-12 months", "13-24 months", "25-36 months", "37-48 months", "49+ months"];
  const labels = tenureOrder.filter(label => stats[label]);
  const data = labels.map(label => {
    const s = stats[label];
    return s.total ? (s.churned / s.total) * 100 : 0;
  });
  
  // Gradient colors (red for short tenure, green for long tenure)
  const backgroundColors = labels.map((label, index) => {
    const hue = 0 + (index * 40); // Red to yellow to green
    return `hsl(${hue}, 70%, 60%)`;
  });

  const ctx = document.getElementById("churnByTenure");
  if (!ctx) return;
  
  if (currentCharts.churnByTenure) {
    currentCharts.churnByTenure.destroy();
  }

  currentCharts.churnByTenure = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Churn Rate (%)",
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('60%)', '50%)')),
        borderWidth: 1,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = labels[context.dataIndex];
              const total = stats[label].total;
              const churned = stats[label].churned;
              return `${context.raw.toFixed(1)}% (${churned} of ${total} customers)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => v + "%"
          },
          grid: {
            drawBorder: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function buildChurnByPhoneChart(stats) {
  const labels = Object.keys(stats);
  const data = labels.map(label => {
    const s = stats[label];
    return s.total ? (s.churned / s.total) * 100 : 0;
  });
  
  const backgroundColors = [
    CHART_COLORS.primary,
    CHART_COLORS.gray,
    CHART_COLORS.accent
  ];

  const ctx = document.getElementById("churnByPhone");
  if (!ctx) return;
  
  if (currentCharts.churnByPhone) {
    currentCharts.churnByPhone.destroy();
  }

  currentCharts.churnByPhone = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Churn Rate (%)",
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color + 'CC'),
        borderWidth: 1,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = stats[context.label].total;
              const churned = stats[context.label].churned;
              return `${context.raw.toFixed(1)}% (${churned} of ${total} customers)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => v + "%"
          },
          grid: {
            drawBorder: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function buildChurnByTechSupportChart(stats) {
  const labels = Object.keys(stats);
  const data = labels.map(label => {
    const s = stats[label];
    return s.total ? (s.churned / s.total) * 100 : 0;
  });
  
  const backgroundColors = [
    CHART_COLORS.success,  // Yes
    CHART_COLORS.danger,   // No
    CHART_COLORS.gray      // No internet service
  ];

  const ctx = document.getElementById("churnByTechSupport");
  if (!ctx) return;
  
  if (currentCharts.churnByTechSupport) {
    currentCharts.churnByTechSupport.destroy();
  }

  currentCharts.churnByTechSupport = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Churn Rate (%)",
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color + 'CC'),
        borderWidth: 1,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = stats[context.label].total;
              const churned = stats[label].churned;
              return `${context.raw.toFixed(1)}% (${churned} of ${total} customers)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => v + "%"
          },
          grid: {
            drawBorder: false
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function sendRetentionOffer(customerId, buttonElement) {
  // Show loading state
  buttonElement.innerHTML = '<span class="loading" style="width: 12px; height: 12px;"></span>';
  buttonElement.disabled = true;
  
  // Simulate API call
  setTimeout(() => {
    buttonElement.textContent = 'Offer Sent';
    buttonElement.classList.remove('btn');
    buttonElement.classList.add('btn-outline');
    buttonElement.disabled = false;
    
    // Show success notification
    showNotification(`Retention offer sent to customer ${customerId}`, 'success');
    
    // Log the action
    console.log(`Retention offer sent to customer: ${customerId}`);
  }, 1200);
}

function exportAtRiskCustomers() {
  const exportData = atRiskCustomers.slice(0, 100).map(customer => ({
    'Customer ID': customer.customerID,
    'Contract Type': customer.Contract,
    'Tenure (months)': customer.tenure,
    'Monthly Charges': formatCurrency(customer.MonthlyCharges),
    'Internet Service': customer.InternetService,
    'Churn Probability': `${Math.round(customer.riskScore)}%`,
    'Risk Level': customer.riskLevel,
    'Recommended Action': 'Send retention offer'
  }));
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = 'telecom_at_risk_customers.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

// Real-time simulation - add new customer
function simulateNewCustomer() {
  if (allRows.length > 0) {
    const contracts = ['Month-to-month', 'One year', 'Two year'];
    const internetServices = ['Fiber optic', 'DSL', 'No'];
    const churn = Math.random() < 0.27 ? 'Yes' : 'No';
    const contract = contracts[Math.floor(Math.random() * contracts.length)];
    
    const newCustomer = {
      customerID: `C${allRows.length + 2000}`,
      Churn: churn,
      Contract: contract,
      InternetService: internetServices[Math.floor(Math.random() * internetServices.length)],
      tenure: Math.floor(Math.random() * 60),
      MonthlyCharges: Math.random() * 80 + 30,
      PaymentMethod: ['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)'][Math.floor(Math.random() * 4)],
      TechSupport: ['Yes', 'No', 'No internet service'][Math.floor(Math.random() * 3)],
      PhoneService: Math.random() > 0.1 ? 'Yes' : 'No'
    };
    
    allRows.push(newCustomer);
    filteredRows.push(newCustomer);
    
    // Rebuild dashboard with slight delay
    setTimeout(() => {
      buildTelecomDashboard(filteredRows);
      
      // Show notification
      const action = churn === 'Yes' ? 'churned' : 'joined';
      showNotification(`New customer ${action}: ${contract} contract, $${newCustomer.MonthlyCharges.toFixed(2)}/month`);
    }, 500);
  }
}

function showNotification(message, type = 'info') {
  const bgColor = type === 'success' ? CHART_COLORS.success : CHART_COLORS.primary;
  
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: slideIn 0.3s ease;
  `;
  
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-user-plus';
  notification.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Run when page loads
document.addEventListener("DOMContentLoaded", function() {
  loadTelecomDashboard();
  
  // Set up real-time updates (every 40 seconds)
  setInterval(simulateNewCustomer, 40000);
  
  // Set up load more button
  const loadMoreBtn = document.getElementById('load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      // Simulate loading more data
      const tableBody = document.getElementById('customer-table')?.querySelector('tbody');
      if (tableBody) {
        // Add 5 more rows
        for (let i = 0; i < 5; i++) {
          const contracts = ['Month-to-month', 'One year', 'Two year'];
          const contract = contracts[Math.floor(Math.random() * 3)];
          const contractClass = contract === 'Month-to-month' ? 'contract-monthly' : 
                              contract === 'One year' ? 'contract-yearly' : 'contract-two-year';
          const riskScore = Math.random() * 70 + 20;
          const riskLevel = riskScore > 70 ? 'High' : riskScore > 40 ? 'Medium' : 'Low';
          
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>TEL${String(tableBody.children.length + 2000).padStart(4, '0')}</td>
            <td><span class="contract-badge ${contractClass}">${contract}</span></td>
            <td>${Math.floor(Math.random() * 60)}</td>
            <td>${formatCurrency(Math.random() * 80 + 30)}</td>
            <td>${['Fiber optic', 'DSL', 'No'][Math.floor(Math.random() * 3)]}</td>
            <td><span class="${riskLevel === 'High' ? 'churn-high' : riskLevel === 'Medium' ? '' : 'churn-low'}">${riskLevel}</span></td>
            <td><span class="prediction-score ${riskLevel === 'High' ? 'high-risk-score' : riskLevel === 'Medium' ? 'medium-risk-score' : 'low-risk-score'}">${Math.round(riskScore)}%</span></td>
            <td><button class="btn retain-btn" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" data-customer="TEL${tableBody.children.length + 2000}">Retain</button></td>
          `;
          tableBody.appendChild(row);
        }
        
        // Re-add event listeners to new buttons
        document.querySelectorAll('.retain-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const customerId = this.getAttribute('data-customer');
            sendRetentionOffer(customerId, this);
          });
        });
      }
    });
  }
  
  // Set up export button
  const exportRiskBtn = document.getElementById('export-risk');
  if (exportRiskBtn) {
    exportRiskBtn.addEventListener('click', exportAtRiskCustomers);
  }
});
