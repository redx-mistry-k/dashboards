// ✅ Retail CSV headers:
// invoice_no	customer_id	gender	age	category	quantity	price	payment_method	invoice_date	shopping_mall

const COLUMN_DATE = "invoice_date";
const COLUMN_CATEGORY = "category";
const COLUMN_GENDER = "gender";
const COLUMN_PAYMENT = "payment_method";
const COLUMN_QUANTITY = "quantity";
const COLUMN_PRICE = "price";

const CSV_PATH = "/data/retail-shopping.csv";


function formatCurrency(num) {
  if (isNaN(num)) return "-";
  return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function formatNumber(num) {
  if (isNaN(num)) return "-";
  return num.toLocaleString("en-IN");
}

// Main function
function loadRetailDashboard() {
  Papa.parse(CSV_PATH, {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: (results) => {
      const rows = results.data.filter(r => Object.keys(r).length > 1);
      buildDashboard(rows);
    },
    error: (err) => {
      console.error("Error loading CSV:", err);
    }
  });
}

function buildDashboard(rows) {
  let totalRevenue = 0;
  let totalOrders = 0;

  const revenueByDate = {};
  const revenueByCategory = {};
  const countByGender = {};
  const countByPayment = {};

  rows.forEach(row => {
    const qty = Number(row[COLUMN_QUANTITY]) || 0;
    const price = Number(row[COLUMN_PRICE]) || 0;
    const amount = qty * price;

    const rawDate = row[COLUMN_DATE];
    const category = row[COLUMN_CATEGORY] || "Unknown";
    const gender = row[COLUMN_GENDER] || "Unknown";
    const payment = row[COLUMN_PAYMENT] || "Unknown";

    if (!isNaN(amount) && amount > 0) {
      totalRevenue += amount;
      totalOrders += 1;
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
    countByGender[gender] = (countByGender[gender] || 0) + 1;
    countByPayment[payment] = (countByPayment[payment] || 0) + 1;
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

  // Fill KPI cards
  document.getElementById("kpi-total-revenue").textContent = formatCurrency(totalRevenue);
  document.getElementById("kpi-total-orders").textContent = formatNumber(totalOrders);
  document.getElementById("kpi-avg-basket").textContent = formatCurrency(avgBasket);
  document.getElementById("kpi-top-category").textContent = topCategory;

  // Charts
  buildSalesOverTimeChart(revenueByDate);
  buildRevenueByCategoryChart(revenueByCategory);
  buildGenderSplitChart(countByGender);
  buildPaymentSplitChart(countByPayment);
}

function buildSalesOverTimeChart(revenueByDate) {
  const labels = Object.keys(revenueByDate).sort();
  const data = labels.map(l => revenueByDate[l]);

  const ctx = document.getElementById("salesOverTime");
  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Revenue",
        data
      }]
    }
  });
}

function buildRevenueByCategoryChart(revenueByCategory) {
  const labels = Object.keys(revenueByCategory);
  const data = labels.map(l => revenueByCategory[l]);

  const ctx = document.getElementById("revenueByCategory");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Revenue",
        data
      }]
    },
    options: {
      indexAxis: "y"
    }
  });
}

function buildGenderSplitChart(countByGender) {
  const labels = Object.keys(countByGender);
  const data = labels.map(l => countByGender[l]);

  const ctx = document.getElementById("genderSplit");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data
      }]
    }
  });
}

function buildPaymentSplitChart(countByPayment) {
  const labels = Object.keys(countByPayment);
  const data = labels.map(l => countByPayment[l]);

  const ctx = document.getElementById("paymentMethodSplit");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data
      }]
    }
  });
}

// Run when page loads
document.addEventListener("DOMContentLoaded", loadRetailDashboard);
