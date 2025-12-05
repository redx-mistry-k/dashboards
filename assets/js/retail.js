// ✅ Retail CSV headers:
// invoice_no	customer_id	gender	age	category	quantity	price	payment_method	invoice_date	shopping_mall

const COLUMN_DATE = "invoice_date";
const COLUMN_CATEGORY = "category";
const COLUMN_GENDER = "gender";
const COLUMN_PAYMENT = "payment_method";
const COLUMN_QUANTITY = "quantity";
const COLUMN_PRICE = "price";
const COLUMN_AGE = "age";
const COLUMN_MALL = "shopping_mall";

const CSV_PATH = "/data/retail-shopping.csv";

let allRows = [];
let filteredRows = [];
let currentCharts = {};

// Theme colors for charts
const CHART_COLORS = {
  primary: '#4361ee',
  secondary: '#3a0ca3',
  accent: '#4cc9f0',
  success: '#06d6a0',
  warning: '#ffd166',
  danger: '#ef476f',
  dark: '#1a1a2e',
  gray: '#6c757d'
};

// Category-specific colors
const CATEGORY_COLORS = {
  'Electronics': '#4361ee',
  'Clothing': '#ef476f',
  'Home & Garden': '#ffd166',
  'Books': '#06d6a0',
  'Toys': '#7209b7',
  'Sports': '#4cc9f0',
  'Beauty': '#f72585',
  'Food': '#38b000'
};

const MALL_COLORS = {
  'Eastgate': '#ef476f',
  'Westview': '#4361ee',
  'Central': '#06d6a0',
  'Northside': '#ffd166'
};

// Indian Rupee formatting functions
function formatCurrency(num) {
  if (isNaN(num) || num === 0) return "₹0";
  
  // Indian numbering system
  if (num >= 10000000) { // Crores
    return "₹" + (num / 10000000).toFixed(2) + " Cr";
  } else if (num >= 100000) { // Lakhs
    return "₹" + (num / 100000).toFixed(2) + " L";
  } else if (num >= 1000) { // Thousands
    return "₹" + (num / 1000).toFixed(2) + "K";
  }
  
  return "₹" + num.toLocaleString("en-IN", { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  });
}

function formatCompactCurrency(num) {
  if (isNaN(num) || num === 0) return "₹0";
  
  if (num >= 10000000) {
    return "₹" + (num / 10000000).toFixed(2) + " Cr";
  } else if (num >= 100000) {
    return "₹" + (num / 100000).toFixed(2) + " L";
  }
  return "₹" + (num / 1000).toFixed(1) + "K";
}

function formatNumber(num) {
  if (isNaN(num)) return "-";
  return num.toLocaleString("en-IN");
}

function formatPercent(num) {
  if (isNaN(num)) return "-";
  return num.toFixed(1) + "%";
}

function getMonthName(month) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
}

// Filter rows based on current filters
function applyFilters() {
  const periodFilter = document.getElementById('period-filter')?.value || 'monthly';
  const categoryFilter = document.getElementById('category-filter')?.value || 'all';
  const mallFilter = document.getElementById('mall-filter')?.value || 'all';
  
  filteredRows = allRows.filter(row => {
    // Category filter
    if (categoryFilter !== 'all' && row[COLUMN_CATEGORY] !== categoryFilter) {
      return false;
    }
    
    // Mall filter
    if (mallFilter !== 'all' && row[COLUMN_MALL] !== mallFilter) {
      return false;
    }
    
    return true;
  });
  
  return filteredRows;
}

// Update KPI cards with animation
function updateKPICards(data) {
  const kpiElements = {
    'kpi-total-revenue': document.getElementById('kpi-total-revenue'),
    'kpi-total-orders': document.getElementById('kpi-total-orders'),
    'kpi-avg-basket': document.getElementById('kpi-avg-basket'),
    'kpi-top-category': document.getElementById('kpi-top-category')
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
  
  // Update values - FIXED: Using Indian Rupee formatting
  if (kpiElements['kpi-total-revenue']) {
    kpiElements['kpi-total-revenue'].textContent = formatCompactCurrency(data.totalRevenue);
  }
  if (kpiElements['kpi-total-orders']) {
    kpiElements['kpi-total-orders'].textContent = formatNumber(data.totalOrders);
  }
  if (kpiElements['kpi-avg-basket']) {
    kpiElements['kpi-avg-basket'].textContent = formatCurrency(data.avgBasket);
  }
  if (kpiElements['kpi-top-category']) {
    kpiElements['kpi-top-category'].textContent = data.topCategory;
  }
  
  // Update trend indicators
  updateTrendIndicators(data);
}

function updateTrendIndicators(data) {
  // Simulate trend data
  const trends = {
    revenueTrend: Math.random() > 0.5 ? 'positive' : 'negative',
    ordersTrend: Math.random() > 0.3 ? 'positive' : 'negative',
    basketTrend: Math.random() > 0.6 ? 'positive' : 'negative'
  };
  
  // Update trend indicators
  document.querySelectorAll('.trend').forEach((trendEl, index) => {
    const trendsArray = Object.values(trends);
    if (index < trendsArray.length) {
      const trend = trendsArray[index];
      trendEl.className = `trend ${trend}`;
      trendEl.innerHTML = trend === 'positive' 
        ? '<i class="fas fa-arrow-up"></i><span>+' + (Math.random() * 10).toFixed(1) + '%</span>'
        : '<i class="fas fa-arrow-down"></i><span>-' + (Math.random() * 5).toFixed(1) + '%</span>';
    }
  });
}

// Main function
function loadRetailDashboard() {
  console.log("Loading retail dashboard...");
  
  // Show loading state
  document.querySelectorAll('.kpi-card p').forEach(el => {
    el.innerHTML = '<span class="loading"></span>';
  });
  
  Papa.parse(CSV_PATH, {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: (results) => {
      console.log("CSV loaded successfully. Total rows:", results.data.length);
      
      allRows = results.data.filter(r => Object.keys(r).length > 1);
      filteredRows = [...allRows];
      
      console.log("Filtered rows (non-empty):", allRows.length);
      
      // Apply any existing filters
      if (document.getElementById('apply-filters')) {
        filteredRows = applyFilters();
      }
      
      buildDashboard(filteredRows);
      updateProductTable(filteredRows);
      
      // Enable filter buttons
      if (document.getElementById('apply-filters')) {
        document.getElementById('apply-filters').addEventListener('click', () => {
          const filtered = applyFilters();
          buildDashboard(filtered);
          updateProductTable(filtered);
        });
      }
      
      if (document.getElementById('reset-filters')) {
        document.getElementById('reset-filters').addEventListener('click', () => {
          filteredRows = [...allRows];
          buildDashboard(filteredRows);
          updateProductTable(filteredRows);
          
          // Reset filter dropdowns
          if (document.getElementById('category-filter')) {
            document.getElementById('category-filter').value = 'all';
          }
          if (document.getElementById('mall-filter')) {
            document.getElementById('mall-filter').value = 'all';
          }
          if (document.getElementById('period-filter')) {
            document.getElementById('period-filter').value = 'monthly';
          }
        });
      }
    },
    error: (err) => {
      console.error("Error loading CSV:", err);
      // Fallback to demo data
      useDemoData();
    }
  });
}

// Fallback demo data
function useDemoData() {
  console.log("Using demo retail data...");
  allRows = [];
  const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Books', 'Toys'];
  const malls = ['Eastgate', 'Westview', 'Central', 'Northside'];
  const payments = ['Credit Card', 'Debit Card', 'Cash', 'Digital Wallet'];
  
  // Generate realistic Indian Rupee prices (₹100 to ₹50,000)
  for (let i = 0; i < 1000; i++) {
    const quantity = Math.floor(Math.random() * 5) + 1;
    const price = Math.floor(Math.random() * 49000) + 100; // ₹100 to ₹50,000
    
    allRows.push({
      [COLUMN_CATEGORY]: categories[Math.floor(Math.random() * categories.length)],
      [COLUMN_GENDER]: Math.random() > 0.5 ? 'Male' : 'Female',
      [COLUMN_PAYMENT]: payments[Math.floor(Math.random() * payments.length)],
      [COLUMN_QUANTITY]: quantity,
      [COLUMN_PRICE]: price,
      [COLUMN_AGE]: Math.floor(Math.random() * 50) + 18,
      [COLUMN_MALL]: malls[Math.floor(Math.random() * malls.length)],
      [COLUMN_DATE]: `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
    });
  }
  
  filteredRows = [...allRows];
  buildDashboard(filteredRows);
  updateProductTable(filteredRows);
}

function buildDashboard(rows) {
  console.log("Building dashboard with", rows.length, "rows");
  
  let totalRevenue = 0;
  let totalOrders = 0;
  let totalQuantity = 0;

  const revenueByDate = {};
  const revenueByCategory = {};
  const revenueByMall = {};
  const countByGender = {};
  const countByPayment = {};
  const countByAgeGroup = {
    'Under 25': 0,
    '25-34': 0,
    '35-44': 0,
    '45-54': 0,
    '55+': 0
  };

  rows.forEach((row, index) => {
    const qty = Number(row[COLUMN_QUANTITY]) || 0;
    const price = Number(row[COLUMN_PRICE]) || 0;
    const amount = qty * price;
    const age = Number(row[COLUMN_AGE]) || 0;

    const rawDate = row[COLUMN_DATE];
    const category = row[COLUMN_CATEGORY] || "Unknown";
    const gender = row[COLUMN_GENDER] || "Unknown";
    const payment = row[COLUMN_PAYMENT] || "Unknown";
    const mall = row[COLUMN_MALL] || "Unknown";

    // Debug first few rows
    if (index < 3) {
      console.log(`Row ${index}: Qty=${qty}, Price=₹${price}, Amount=₹${amount}`);
    }

    if (!isNaN(amount) && amount > 0) {
      totalRevenue += amount;
      totalOrders += 1;
      totalQuantity += qty;
    }

    // Group date by month like 2024-01
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d)) {
        const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        revenueByDate[key] = (revenueByDate[key] || 0) + amount;
      }
    }

    revenueByCategory[category] = (revenueByCategory[category] || 0) + amount;
    revenueByMall[mall] = (revenueByMall[mall] || 0) + amount;
    countByGender[gender] = (countByGender[gender] || 0) + 1;
    countByPayment[payment] = (countByPayment[payment] || 0) + 1;
    
    // Age groups
    if (age < 25) countByAgeGroup['Under 25']++;
    else if (age <= 34) countByAgeGroup['25-34']++;
    else if (age <= 44) countByAgeGroup['35-44']++;
    else if (age <= 54) countByAgeGroup['45-54']++;
    else countByAgeGroup['55+']++;
  });

  const avgBasket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Find top category
  let topCategory = "-";
  let topCategoryRevenue = 0;
  Object.entries(revenueByCategory).forEach(([cat, rev]) => {
    if (rev > topCategoryRevenue) {
      topCategoryRevenue = rev;
      topCategory = cat;
    }
  });

  console.log("Dashboard calculations:");
  console.log("Total Revenue: ₹" + totalRevenue);
  console.log("Total Orders:", totalOrders);
  console.log("Average Basket: ₹" + avgBasket);
  console.log("Top Category:", topCategory);
  console.log("Revenue by Date:", revenueByDate);

  // Prepare KPI data
  const kpiData = {
    totalRevenue,
    totalOrders,
    avgBasket,
    topCategory,
    totalQuantity
  };

  // Update KPI cards
  updateKPICards(kpiData);

  // Build charts
  buildSalesOverTimeChart(revenueByDate);
  buildRevenueByCategoryChart(revenueByCategory);
  buildGenderSplitChart(countByGender);
  buildPaymentSplitChart(countByPayment);
  buildRevenueByMallChart(revenueByMall);
  buildCustomerAgeChart(countByAgeGroup);
  
  // Update stats in header
  updateStatsHeader(rows.length, totalRevenue);
}

function updateStatsHeader(rowCount, totalRevenue) {
  const statsContainer = document.querySelector('.stats-container');
  if (statsContainer) {
    const statItems = statsContainer.querySelectorAll('.stat-value');
    if (statItems.length >= 4) {
      statItems[0].textContent = formatNumber(rowCount);
      statItems[1].textContent = formatNumber(Math.floor(rowCount / 100) * 100);
      statItems[2].textContent = formatNumber(rowCount * 10);
      statItems[3].textContent = "Interactive";
    }
  }
}

function updateProductTable(rows) {
  const tableBody = document.getElementById('products-table')?.querySelector('tbody');
  if (!tableBody) return;
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Group by product category for demo
  const categoryRevenue = {};
  const categoryCount = {};
  
  rows.forEach(row => {
    const category = row[COLUMN_CATEGORY] || 'Unknown';
    const qty = Number(row[COLUMN_QUANTITY]) || 0;
    const price = Number(row[COLUMN_PRICE]) || 0;
    const revenue = qty * price;
    
    if (!categoryRevenue[category]) {
      categoryRevenue[category] = 0;
      categoryCount[category] = 0;
    }
    
    categoryRevenue[category] += revenue;
    categoryCount[category] += qty;
  });
  
  // Create table rows for top categories
  Object.entries(categoryRevenue)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([category, revenue], index) => {
      const count = categoryCount[category] || 0;
      const avgPrice = count > 0 ? revenue / count : 0;
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>PROD${String(index + 1).padStart(3, '0')}</td>
        <td>${category} Collection</td>
        <td><span class="category-badge category-${category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}">${category}</span></td>
        <td><span class="mall-badge mall-${['east', 'west', 'central', 'northside'][index % 4]}"></span> ${['Eastgate', 'Westview', 'Central', 'Northside'][index % 4]}</td>
        <td>${formatNumber(count)}</td>
        <td class="${revenue > 50000 ? 'revenue-high' : revenue < 10000 ? 'revenue-low' : ''}">${formatCompactCurrency(revenue)}</td>
        <td>${(Math.random() * 1.5 + 3.5).toFixed(1)} ★</td>
        <td><span class="prediction-score ${revenue > 500000 ? 'low-risk-score' : revenue > 200000 ? 'medium-risk-score' : 'high-risk-score'}" 
                 style="${revenue > 500000 ? 'background: #06d6a0' : revenue > 200000 ? 'background: #ffd166; color: #333' : 'background: #ef476f'}">
              ${revenue > 500000 ? 'Top Seller' : revenue > 200000 ? 'Steady' : 'Low Performer'}
            </span></td>
      `;
      tableBody.appendChild(row);
    });
}

function buildSalesOverTimeChart(revenueByDate) {
  // Sort dates chronologically
  const labels = Object.keys(revenueByDate).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    return yearA === yearB ? monthA - monthB : yearA - yearB;
  });
  
  const data = labels.map(l => revenueByDate[l]);
  
  // Format labels for display
  const displayLabels = labels.map(label => {
    const [year, month] = label.split('-');
    return `${getMonthName(parseInt(month))} ${year}`;
  });

  console.log("Sales Over Time Chart Data:");
  console.log("Labels:", displayLabels);
  console.log("Data:", data);

  const ctx = document.getElementById("salesOverTime");
  if (!ctx) {
    console.error("Canvas element #salesOverTime not found");
    return;
  }
  
  // Destroy existing chart if it exists
  if (currentCharts.salesOverTime) {
    currentCharts.salesOverTime.destroy();
  }

  currentCharts.salesOverTime = new Chart(ctx, {
    type: "line",
    data: {
      labels: displayLabels,
      datasets: [{
        label: "Monthly Revenue",
        data,
        borderColor: CHART_COLORS.primary,
        backgroundColor: CHART_COLORS.primary + '20',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: CHART_COLORS.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Revenue: ${formatCurrency(context.raw)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCompactCurrency(value);
            }
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

function buildRevenueByCategoryChart(revenueByCategory) {
  // Sort by revenue descending
  const entries = Object.entries(revenueByCategory)
    .sort(([,a], [,b]) => b - a);
  
  const labels = entries.map(([label]) => label);
  const data = entries.map(([,value]) => value);
  
  // Generate colors based on category
  const backgroundColors = labels.map(label => 
    CATEGORY_COLORS[label] || CHART_COLORS.gray
  );

  const ctx = document.getElementById("revenueByCategory");
  if (!ctx) return;
  
  if (currentCharts.revenueByCategory) {
    currentCharts.revenueByCategory.destroy();
  }

  currentCharts.revenueByCategory = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Revenue by Category",
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color + 'CC'),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Revenue: ${formatCurrency(context.raw)}`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCompactCurrency(value);
            }
          },
          grid: {
            drawBorder: false
          }
        },
        y: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function buildGenderSplitChart(countByGender) {
  const labels = Object.keys(countByGender);
  const data = labels.map(l => countByGender[l]);
  
  const backgroundColors = [
    CHART_COLORS.primary,
    CHART_COLORS.danger,
    CHART_COLORS.gray
  ];

  const ctx = document.getElementById("genderSplit");
  if (!ctx) return;
  
  if (currentCharts.genderSplit) {
    currentCharts.genderSplit.destroy();
  }

  currentCharts.genderSplit = new Chart(ctx, {
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

function buildPaymentSplitChart(countByPayment) {
  const labels = Object.keys(countByPayment);
  const data = labels.map(l => countByPayment[l]);
  
  const backgroundColors = [
    CHART_COLORS.primary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.accent
  ];

  const ctx = document.getElementById("paymentMethodSplit");
  if (!ctx) return;
  
  if (currentCharts.paymentMethodSplit) {
    currentCharts.paymentMethodSplit.destroy();
  }

  currentCharts.paymentMethodSplit = new Chart(ctx, {
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

function buildRevenueByMallChart(revenueByMall) {
  const entries = Object.entries(revenueByMall);
  const labels = entries.map(([label]) => label);
  const data = entries.map(([,value]) => value);
  
  const backgroundColors = labels.map(label => 
    MALL_COLORS[label] || CHART_COLORS.gray
  );

  const ctx = document.getElementById("revenueByMall");
  if (!ctx) return;
  
  if (currentCharts.revenueByMall) {
    currentCharts.revenueByMall.destroy();
  }

  currentCharts.revenueByMall = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Revenue by Mall",
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color + 'CC'),
        borderWidth: 1,
        borderRadius: 8,
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
              return `Revenue: ${formatCurrency(context.raw)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCompactCurrency(value);
            }
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

function buildCustomerAgeChart(countByAgeGroup) {
  const labels = Object.keys(countByAgeGroup);
  const data = Object.values(countByAgeGroup);
  
  const backgroundColors = [
    CHART_COLORS.accent,
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.warning,
    CHART_COLORS.gray
  ];

  const ctx = document.getElementById("customerAge");
  if (!ctx) return;
  
  if (currentCharts.customerAge) {
    currentCharts.customerAge.destroy();
  }

  currentCharts.customerAge = new Chart(ctx, {
    type: "polarArea",
    data: {
      labels,
      datasets: [{
        label: "Customers by Age Group",
        data,
        backgroundColor: backgroundColors,
        borderColor: '#fff',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 20,
            usePointStyle: true,
          }
        }
      },
      scales: {
        r: {
          ticks: {
            display: false
          },
          grid: {
            circular: true
          }
        }
      }
    }
  });
}

// Export functionality
function exportData() {
  const dataStr = JSON.stringify(filteredRows.slice(0, 1000), null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = 'retail_data_export.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

// Run when page loads
document.addEventListener("DOMContentLoaded", function() {
  console.log("Retail dashboard initializing...");
  loadRetailDashboard();
  
  // Set up export button
  const exportBtn = document.getElementById('export-report');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
  }
  
  // Set up load more button
  const loadMoreBtn = document.getElementById('load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      // Simulate loading more data
      const tableBody = document.getElementById('products-table')?.querySelector('tbody');
      if (tableBody) {
        // Add 5 more rows with Indian Rupee values
        for (let i = 0; i < 5; i++) {
          const row = document.createElement('tr');
          const revenue = Math.random() * 500000 + 10000;
          
          row.innerHTML = `
            <td>PROD${String(tableBody.children.length + 1).padStart(3, '0')}</td>
            <td>Additional Product ${String(tableBody.children.length + 1)}</td>
            <td><span class="category-badge category-electronics">Electronics</span></td>
            <td><span class="mall-badge mall-east"></span> Eastgate</td>
            <td>${Math.floor(Math.random() * 1000)}</td>
            <td class="revenue-high">${formatCompactCurrency(revenue)}</td>
            <td>${(Math.random() * 1.5 + 3.5).toFixed(1)} ★</td>
            <td><span class="prediction-score medium-risk-score">New</span></td>
          `;
          tableBody.appendChild(row);
        }
      }
    });
  }
  
  // Add temporary CSS for debugging
  const debugStyle = document.createElement('style');
  debugStyle.textContent = `
    .chart-container canvas {
      border: 1px solid #ddd;
      background: white;
    }
  `;
  document.head.appendChild(debugStyle);
});
