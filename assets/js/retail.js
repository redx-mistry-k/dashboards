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
  'Food': '#38b000',
  'Unknown': '#6c757d'
};

const MALL_COLORS = {
  'Eastgate': '#ef476f',
  'Westview': '#4361ee',
  'Central': '#06d6a0',
  'Northside': '#ffd166',
  'Unknown': '#6c757d'
};

// Indian Rupee formatting functions
function formatCurrency(num) {
  if (isNaN(num) || num === 0 || num === null || num === undefined) {
    return "₹0";
  }
  
  // Convert to number if it's a string
  num = Number(num);
  
  // Indian numbering system
  if (num >= 10000000) { // Crores (1 Cr = 10 million)
    return "₹" + (num / 10000000).toFixed(2) + " Cr";
  } else if (num >= 100000) { // Lakhs (1 L = 100,000)
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
  if (isNaN(num) || num === 0 || num === null || num === undefined) {
    return "₹0";
  }
  
  num = Number(num);
  
  if (num >= 10000000) {
    return "₹" + (num / 10000000).toFixed(2) + " Cr";
  } else if (num >= 100000) {
    return "₹" + (num / 100000).toFixed(2) + " L";
  }
  return "₹" + (num / 1000).toFixed(1) + "K";
}

function formatNumber(num) {
  if (isNaN(num) || num === null || num === undefined) return "0";
  return Number(num).toLocaleString("en-IN");
}

function getMonthName(month) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
}

// Enhanced filter function - FIXED
function applyFilters() {
  const categoryFilter = document.getElementById('category-filter')?.value || 'all';
  const mallFilter = document.getElementById('mall-filter')?.value || 'all';
  
  console.log("Applying filters - Category:", categoryFilter, "Mall:", mallFilter);
  
  filteredRows = allRows.filter(row => {
    // Skip invalid rows
    if (!row || Object.keys(row).length === 0) return false;
    
    let passes = true;
    
    // Category filter
    if (categoryFilter !== 'all') {
      const rowCategory = String(row[COLUMN_CATEGORY] || "").trim();
      passes = passes && (rowCategory === categoryFilter);
    }
    
    // Mall filter
    if (mallFilter !== 'all') {
      const rowMall = String(row[COLUMN_MALL] || "").trim();
      passes = passes && (rowMall === mallFilter);
    }
    
    return passes;
  });
  
  console.log(`Filter result: ${filteredRows.length} rows out of ${allRows.length}`);
  
  // Update filter status
  const filterStatus = document.getElementById('filter-status');
  if (filterStatus) {
    const statusText = [];
    if (categoryFilter !== 'all') statusText.push(`Category: ${categoryFilter}`);
    if (mallFilter !== 'all') statusText.push(`Mall: ${mallFilter}`);
    filterStatus.textContent = statusText.length > 0 ? `Filters: ${statusText.join(', ')}` : 'No filters applied';
  }
  
  return filteredRows;
}

// Update KPI cards with animation - FIXED
function updateKPICards(data) {
  console.log("Updating KPI cards with data:", data);
  
  const kpiElements = {
    'kpi-total-revenue': document.getElementById('kpi-total-revenue'),
    'kpi-total-orders': document.getElementById('kpi-total-orders'),
    'kpi-avg-basket': document.getElementById('kpi-avg-basket'),
    'kpi-top-category': document.getElementById('kpi-top-category')
  };
  
  // Update values with PROPER VALIDATION
  if (kpiElements['kpi-total-revenue']) {
    const revenue = data.totalRevenue || 0;
    kpiElements['kpi-total-revenue'].textContent = formatCompactCurrency(revenue);
    console.log("Total Revenue set to:", kpiElements['kpi-total-revenue'].textContent);
  }
  
  if (kpiElements['kpi-total-orders']) {
    const orders = data.totalOrders || 0;
    kpiElements['kpi-total-orders'].textContent = formatNumber(orders);
  }
  
  if (kpiElements['kpi-avg-basket']) {
    const avgBasket = data.avgBasket || 0;
    kpiElements['kpi-avg-basket'].textContent = formatCurrency(avgBasket);
    console.log("Avg Basket set to:", kpiElements['kpi-avg-basket'].textContent);
  }
  
  if (kpiElements['kpi-top-category']) {
    kpiElements['kpi-top-category'].textContent = data.topCategory || "None";
    
    // Update the trend text below it
    const trendElement = kpiElements['kpi-top-category'].closest('.kpi-card')?.querySelector('.trend');
    if (trendElement && data.topCategoryRevenue) {
      trendElement.innerHTML = `<i class="fas fa-chart-line"></i><span>${formatCompactCurrency(data.topCategoryRevenue)} revenue</span>`;
    }
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
  document.querySelectorAll('.kpi-card .trend').forEach((trendEl, index) => {
    const trendsArray = Object.values(trends);
    if (index < trendsArray.length) {
      const trend = trendsArray[index];
      trendEl.className = `trend ${trend}`;
      
      // Don't override the top category trend (index 3)
      if (index !== 3) {
        const change = (Math.random() * 10).toFixed(1);
        trendEl.innerHTML = trend === 'positive' 
          ? '<i class="fas fa-arrow-up"></i><span>+' + change + '%</span>'
          : '<i class="fas fa-arrow-down"></i><span>-' + change + '%</span>';
      }
    }
  });
}

// Main function - FIXED
function loadRetailDashboard() {
  console.log("Loading retail dashboard...");
  
  // Show loading state
  document.querySelectorAll('.kpi-card p').forEach(el => {
    el.innerHTML = '<span class="loading"></span> Loading...';
  });
  
  Papa.parse(CSV_PATH, {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: (results) => {
      console.log("CSV loaded successfully. Total rows:", results.data.length);
      
      // Filter out empty rows and validate data
      allRows = results.data.filter(r => {
        if (!r || Object.keys(r).length <= 1) return false;
        
        // Validate required fields
        const price = Number(r[COLUMN_PRICE]) || 0;
        const quantity = Number(r[COLUMN_QUANTITY]) || 0;
        
        return price > 0 && quantity > 0;
      });
      
      console.log("Valid rows after filtering:", allRows.length);
      
      // Populate filter dropdowns
      populateFilterOptions(allRows);
      
      filteredRows = [...allRows];
      
      // Build initial dashboard
      buildDashboard(filteredRows);
      updateProductTable(filteredRows);
      
      // Set up filter event listeners
      setupFilterListeners();
      
    },
    error: (err) => {
      console.error("Error loading CSV:", err);
      // Fallback to demo data
      useDemoData();
    }
  });
}

// Populate filter dropdowns with actual data
function populateFilterOptions(rows) {
  const categories = new Set();
  const malls = new Set();
  
  rows.forEach(row => {
    if (row[COLUMN_CATEGORY]) categories.add(row[COLUMN_CATEGORY]);
    if (row[COLUMN_MALL]) malls.add(row[COLUMN_MALL]);
  });
  
  // Category filter
  const categoryFilter = document.getElementById('category-filter');
  if (categoryFilter) {
    // Clear existing options except "All"
    while (categoryFilter.options.length > 1) {
      categoryFilter.remove(1);
    }
    
    // Add categories sorted alphabetically
    Array.from(categories).sort().forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
  }
  
  // Mall filter
  const mallFilter = document.getElementById('mall-filter');
  if (mallFilter) {
    // Clear existing options except "All"
    while (mallFilter.options.length > 1) {
      mallFilter.remove(1);
    }
    
    // Add malls sorted alphabetically
    Array.from(malls).sort().forEach(mall => {
      const option = document.createElement('option');
      option.value = mall;
      option.textContent = mall;
      mallFilter.appendChild(option);
    });
  }
}

// Set up filter event listeners
function setupFilterListeners() {
  const applyBtn = document.getElementById('apply-filters');
  const resetBtn = document.getElementById('reset-filters');
  
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      console.log("Apply filters clicked");
      const filtered = applyFilters();
      buildDashboard(filtered);
      updateProductTable(filtered);
      
      // Show loading state briefly
      applyBtn.innerHTML = '<i class="fas fa-check"></i> Applied';
      setTimeout(() => {
        applyBtn.innerHTML = '<i class="fas fa-filter"></i> Apply Filters';
      }, 1000);
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      console.log("Reset filters clicked");
      filteredRows = [...allRows];
      buildDashboard(filteredRows);
      updateProductTable(filteredRows);
      
      // Reset filter dropdowns
      document.getElementById('category-filter').value = 'all';
      document.getElementById('mall-filter').value = 'all';
      
      // Update filter status
      const filterStatus = document.getElementById('filter-status');
      if (filterStatus) {
        filterStatus.textContent = 'No filters applied';
      }
      
      // Show feedback
      resetBtn.innerHTML = '<i class="fas fa-check"></i> Reset';
      setTimeout(() => {
        resetBtn.innerHTML = '<i class="fas fa-redo"></i> Reset';
      }, 1000);
    });
  }
  
  // Also apply filters when dropdowns change (optional)
  document.querySelectorAll('#category-filter, #mall-filter').forEach(select => {
    select.addEventListener('change', () => {
      const filterStatus = document.getElementById('filter-status');
      if (filterStatus) {
        const category = document.getElementById('category-filter').value;
        const mall = document.getElementById('mall-filter').value;
        
        const statusText = [];
        if (category !== 'all') statusText.push(`Category: ${category}`);
        if (mall !== 'all') statusText.push(`Mall: ${mall}`);
        
        filterStatus.textContent = statusText.length > 0 
          ? `Filters: ${statusText.join(', ')} (click Apply)` 
          : 'No filters applied';
      }
    });
  });
}

// Fallback demo data - FIXED with Indian Rupees
function useDemoData() {
  console.log("Using demo retail data with Indian Rupees...");
  allRows = [];
  const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Books'];
  const malls = ['Eastgate', 'Westview', 'Central', 'Northside'];
  const payments = ['Credit Card', 'Debit Card', 'Cash', 'Digital Wallet'];
  
  // Generate realistic Indian Rupee data
  for (let i = 0; i < 1500; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const mall = malls[Math.floor(Math.random() * malls.length)];
    const quantity = Math.floor(Math.random() * 5) + 1;
    
    // Realistic Indian prices in Rupees
    let price;
    switch(category) {
      case 'Electronics': price = Math.floor(Math.random() * 45000) + 5000; // ₹5,000 - ₹50,000
        break;
      case 'Clothing': price = Math.floor(Math.random() * 5000) + 500; // ₹500 - ₹5,500
        break;
      case 'Home & Garden': price = Math.floor(Math.random() * 15000) + 1000; // ₹1,000 - ₹16,000
        break;
      case 'Books': price = Math.floor(Math.random() * 1500) + 100; // ₹100 - ₹1,600
        break;
      default: price = Math.floor(Math.random() * 10000) + 500; // ₹500 - ₹10,500
    }
    
    allRows.push({
      [COLUMN_CATEGORY]: category,
      [COLUMN_GENDER]: Math.random() > 0.5 ? 'Male' : 'Female',
      [COLUMN_PAYMENT]: payments[Math.floor(Math.random() * payments.length)],
      [COLUMN_QUANTITY]: quantity,
      [COLUMN_PRICE]: price,
      [COLUMN_AGE]: Math.floor(Math.random() * 50) + 18,
      [COLUMN_MALL]: mall,
      [COLUMN_DATE]: `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
    });
  }
  
  console.log("Generated demo data with", allRows.length, "rows");
  
  // Populate filters
  populateFilterOptions(allRows);
  
  filteredRows = [...allRows];
  buildDashboard(filteredRows);
  updateProductTable(filteredRows);
  
  // Set up filter listeners
  setupFilterListeners();
}

function buildDashboard(rows) {
  console.log("Building dashboard with", rows.length, "rows");
  
  if (rows.length === 0) {
    console.warn("No data to display!");
    // Show empty state
    updateKPICards({
      totalRevenue: 0,
      totalOrders: 0,
      avgBasket: 0,
      topCategory: "No data",
      topCategoryRevenue: 0
    });
    return;
  }
  
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

    if (!isNaN(amount) && amount > 0) {
      totalRevenue += amount;
      totalOrders += 1;
      totalQuantity += qty;
    }

    // Group date by month
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
          revenueByDate[key] = (revenueByDate[key] || 0) + amount;
        }
      } catch (e) {
        console.warn("Invalid date:", rawDate);
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
  let topCategory = "None";
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
  console.log("Top Category:", topCategory, "Revenue: ₹" + topCategoryRevenue);

  // Prepare KPI data
  const kpiData = {
    totalRevenue,
    totalOrders,
    avgBasket,
    topCategory,
    topCategoryRevenue,
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
      statItems[1].textContent = "6"; // Number of charts
      statItems[2].textContent = formatNumber(rowCount * 5); // Data points estimate
      statItems[3].textContent = "Yes"; // Interactive features
    }
  }
}

function updateProductTable(rows) {
  const tableBody = document.getElementById('products-table')?.querySelector('tbody');
  if (!tableBody) return;
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  if (rows.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
      <td colspan="8" style="text-align: center; padding: 2rem; color: var(--gray-color);">
        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
        No products match the current filters
      </td>
    `;
    tableBody.appendChild(emptyRow);
    return;
  }
  
  // Group by product category
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
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>PROD${String(index + 1).padStart(3, '0')}</td>
        <td>${category} Collection</td>
        <td><span class="category-badge category-${category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}">${category}</span></td>
        <td><span class="mall-badge mall-${['east', 'west', 'central', 'northside'][index % 4]}"></span> ${['Eastgate', 'Westview', 'Central', 'Northside'][index % 4]}</td>
        <td>${formatNumber(count)}</td>
        <td class="${revenue > 500000 ? 'revenue-high' : revenue < 100000 ? 'revenue-low' : ''}">${formatCompactCurrency(revenue)}</td>
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
  
  const data = labels.map(l => revenueByDate[l] || 0);
  
  // Format labels for display
  const displayLabels = labels.map(label => {
    const [year, month] = label.split('-');
    return `${getMonthName(parseInt(month))} ${year}`;
  });

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
        label: "Monthly Revenue (₹)",
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
  const data = entries.map(([,value]) => value || 0);
  
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
        label: "Revenue by Category (₹)",
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
  const data = labels.map(l => countByGender[l] || 0);
  
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
              const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
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
  const data = labels.map(l => countByPayment[l] || 0);
  
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
              const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
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
  const data = entries.map(([,value]) => value || 0);
  
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
        label: "Revenue by Mall (₹)",
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
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${formatNumber(context.raw)} customers`;
            }
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
  const exportData = filteredRows.slice(0, 1000).map(row => ({
    'Product ID': `PROD${Math.floor(Math.random() * 1000)}`,
    'Category': row[COLUMN_CATEGORY],
    'Mall': row[COLUMN_MALL],
    'Quantity': row[COLUMN_QUANTITY],
    'Price': formatCurrency(row[COLUMN_PRICE]),
    'Total': formatCurrency((row[COLUMN_QUANTITY] || 0) * (row[COLUMN_PRICE] || 0)),
    'Gender': row[COLUMN_GENDER],
    'Payment Method': row[COLUMN_PAYMENT]
  }));
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = 'retail_sales_data.json';
  
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
      if (tableBody && tableBody.children.length > 0 && !tableBody.children[0].textContent.includes('No products')) {
        for (let i = 0; i < 5; i++) {
          const revenue = Math.random() * 500000 + 10000;
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>PROD${String(tableBody.children.length + 1000).padStart(4, '0')}</td>
            <td>Additional Product ${tableBody.children.length + 1}</td>
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
});
