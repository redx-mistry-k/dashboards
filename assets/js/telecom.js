// ✅ Telco CSV headers:
// customerID	gender	SeniorCitizen	Partner	Dependents	tenure	PhoneService	MultipleLines
// InternetService	OnlineSecurity	OnlineBackup	DeviceProtection	TechSupport	StreamingTV
// StreamingMovies	Contract	PaperlessBilling	PaymentMethod	MonthlyCharges	TotalCharges	Churn

const CSV_PATH_TELECOM = "/data/telco-churn.csv";

function loadTelecomDashboard() {
  Papa.parse(CSV_PATH_TELECOM, {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: (results) => {
      const rows = results.data.filter(r => r.customerID); // ignore empty lines
      buildTelecomDashboard(rows);
    },
    error: (err) => console.error("Error loading telco CSV:", err),
  });
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

  rows.forEach(row => {
    const churn = String(row.Churn || "").trim();
    const contract = row.Contract || "Unknown";
    const internet = row.InternetService || "Unknown";
    const tenure = Number(row.tenure) || 0;
    const monthly = Number(row.MonthlyCharges) || 0;

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
  });

  const churnRate = totalCustomers ? (churned / totalCustomers) * 100 : 0;
  const avgTenure = totalCustomers ? totalTenure / totalCustomers : 0;
  const avgMonthly = totalCustomers ? totalMonthlyCharges / totalCustomers : 0;

  // KPIs
  document.getElementById("kpi-total-customers").textContent = totalCustomers.toLocaleString("en-IN");
  document.getElementById("kpi-churn-rate").textContent = churnRate.toFixed(1) + "%";
  document.getElementById("kpi-avg-tenure").textContent = avgTenure.toFixed(1);
  document.getElementById("kpi-avg-charges").textContent = "₹" + avgMonthly.toFixed(0);

  // Charts
  buildChurnOverallChart(churnCounts);
  buildChurnByContractChart(contractStats);
  buildChurnByInternetChart(internetStats);
  buildChurnByTenureChart(tenureStats);
}

function tenureGroup(tenure) {
  if (tenure <= 6) return "0–6";
  if (tenure <= 12) return "7–12";
  if (tenure <= 24) return "13–24";
  if (tenure <= 48) return "25–48";
  return "49+";
}

function buildChurnOverallChart(churnCounts) {
  const labels = Object.keys(churnCounts);
  const data = labels.map(l => churnCounts[l]);

  new Chart(document.getElementById("churnOverall"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data }]
    }
  });
}

function buildChurnByContractChart(stats) {
  const labels = Object.keys(stats);
  const data = labels.map(label => {
    const s = stats[label];
    return s.total ? (s.churned / s.total) * 100 : 0;
  });

  new Chart(document.getElementById("churnByContract"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Churn rate (%)",
        data
      }]
    },
    options: {
      scales: {
        y: { ticks: { callback: (v) => v + "%" } }
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

  new Chart(document.getElementById("churnByInternet"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Churn rate (%)",
        data
      }]
    },
    options: {
      scales: {
        y: { ticks: { callback: (v) => v + "%" } }
      }
    }
  });
}

function buildChurnByTenureChart(stats) {
  const labels = Object.keys(stats).sort((a, b) => {
    // sort based on first number in label
    const na = parseInt(a);
    const nb = parseInt(b);
    return na - nb;
  });
  const data = labels.map(label => {
    const s = stats[label];
    return s.total ? (s.churned / s.total) * 100 : 0;
  });

  new Chart(document.getElementById("churnByTenure"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Churn rate (%)",
        data
      }]
    },
    options: {
      scales: {
        y: { ticks: { callback: (v) => v + "%" } }
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", loadTelecomDashboard);
