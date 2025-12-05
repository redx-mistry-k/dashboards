// ✅ HR CSV headers:
// Age	Attrition	BusinessTravel	DailyRate	Department	DistanceFromHome	Education	EducationField
// EmployeeCount	EmployeeNumber	EnvironmentSatisfaction	Gender	HourlyRate	JobInvolvement	JobLevel
// JobRole	JobSatisfaction	MaritalStatus	MonthlyIncome	MonthlyRate	NumCompaniesWorked	Over18
// OverTime	PercentSalaryHike	PerformanceRating	RelationshipSatisfaction	StandardHours	StockOptionLevel
// TotalWorkingYears	TrainingTimesLastYear	WorkLifeBalance	YearsAtCompany	YearsInCurrentRole
// YearsSinceLastPromotion	YearsWithCurrManager

const CSV_PATH_HR = "/data/hr-attrition.csv";

function loadHrDashboard() {
  Papa.parse(CSV_PATH_HR, {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: (results) => {
      const rows = results.data.filter(r => r.EmployeeNumber); // ignore empties
      buildHrDashboard(rows);
    },
    error: (err) => console.error("Error loading HR CSV:", err),
  });
}

function buildHrDashboard(rows) {
  const totalEmployees = rows.length;

  let attritionYes = 0;
  let totalAge = 0;
  let totalYears = 0;

  const attritionCounts = { Yes: 0, No: 0 };
  const deptStats = {};  // { Dept: { attritionYes, total } }
  const roleStats = {};  // { Role: { attritionYes, total } }
  const ageStats = {};   // { "20-29": { attritionYes, total }, ... }

  rows.forEach(row => {
    const attrition = String(row.Attrition || "").trim(); // "Yes"/"No"
    const dept = row.Department || "Unknown";
    const role = row.JobRole || "Unknown";
    const age = Number(row.Age) || 0;
    const years = Number(row.YearsAtCompany) || 0;

    if (attrition === "Yes") {
      attritionYes += 1;
      attritionCounts.Yes += 1;
    } else {
      attritionCounts.No += 1;
    }

    totalAge += age;
    totalYears += years;

    if (!deptStats[dept]) deptStats[dept] = { attritionYes: 0, total: 0 };
    deptStats[dept].total += 1;
    if (attrition === "Yes") deptStats[dept].attritionYes += 1;

    if (!roleStats[role]) roleStats[role] = { attritionYes: 0, total: 0 };
    roleStats[role].total += 1;
    if (attrition === "Yes") roleStats[role].attritionYes += 1;

    const ageGroup = ageBand(age);
    if (!ageStats[ageGroup]) ageStats[ageGroup] = { attritionYes: 0, total: 0 };
    ageStats[ageGroup].total += 1;
    if (attrition === "Yes") ageStats[ageGroup].attritionYes += 1;
  });

  const attritionRate = totalEmployees ? (attritionYes / totalEmployees) * 100 : 0;
  const avgAge = totalEmployees ? totalAge / totalEmployees : 0;
  const avgYears = totalEmployees ? totalYears / totalEmployees : 0;

  document.getElementById("kpi-total-employees").textContent = totalEmployees.toLocaleString("en-IN");
  document.getElementById("kpi-attrition-rate").textContent = attritionRate.toFixed(1) + "%";
  document.getElementById("kpi-avg-age").textContent = avgAge.toFixed(1);
  document.getElementById("kpi-avg-years").textContent = avgYears.toFixed(1);

  buildAttritionOverallChart(attritionCounts);
  buildAttritionByDeptChart(deptStats);
  buildAttritionByRoleChart(roleStats);
  buildAttritionByAgeChart(ageStats);
}

function ageBand(age) {
  if (age < 30) return "20–29";
  if (age < 40) return "30–39";
  if (age < 50) return "40–49";
  return "50+";
}

function buildAttritionOverallChart(counts) {
  const labels = Object.keys(counts);
  const data = labels.map(l => counts[l]);

  new Chart(document.getElementById("attritionOverall"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data }]
    }
  });
}

function buildAttritionByDeptChart(stats) {
  const labels = Object.keys(stats);
  const data = labels.map(label => {
    const s = stats[label];
    return s.total ? (s.attritionYes / s.total) * 100 : 0;
  });

  new Chart(document.getElementById("attritionByDept"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Attrition rate (%)",
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

function buildAttritionByRoleChart(stats) {
  const labels = Object.keys(stats);
  const data = labels.map(label => {
    const s = stats[label];
    return s.total ? (s.attritionYes / s.total) * 100 : 0;
  });

  new Chart(document.getElementById("attritionByRole"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Attrition rate (%)",
        data
      }]
    },
    options: {
      indexAxis: "y",
        scales: {
          x: { ticks: { callback: (v) => v + "%" } }
        }
    }
  });
}

function buildAttritionByAgeChart(stats) {
  const labels = Object.keys(stats).sort((a, b) => {
    const na = parseInt(a);
    const nb = parseInt(b);
    return na - nb;
  });
  const data = labels.map(label => {
    const s = stats[label];
    return s.total ? (s.attritionYes / s.total) * 100 : 0;
  });

  new Chart(document.getElementById("attritionByAge"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Attrition rate (%)",
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

document.addEventListener("DOMContentLoaded", loadHrDashboard);
