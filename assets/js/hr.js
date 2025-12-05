// ✅ HR CSV headers:
// Age	Attrition	BusinessTravel	DailyRate	Department	DistanceFromHome	Education	EducationField
// EmployeeCount	EmployeeNumber	EnvironmentSatisfaction	Gender	HourlyRate	JobInvolvement	JobLevel
// JobRole	JobSatisfaction	MaritalStatus	MonthlyIncome	MonthlyRate	NumCompaniesWorked	Over18
// OverTime	PercentSalaryHike	PerformanceRating	RelationshipSatisfaction	StandardHours	StockOptionLevel
// TotalWorkingYears	TrainingTimesLastYear	WorkLifeBalance	YearsAtCompany	YearsInCurrentRole
// YearsSinceLastPromotion	YearsWithCurrManager

const CSV_PATH_HR = "/data/hr-attrition.csv";

let allRows = [];
let filteredRows = [];
let currentCharts = {};

// Theme colors for charts
const CHART_COLORS = {
  primary: '#3a0ca3',
  secondary: '#4361ee',
  accent: '#4cc9f0',
  success: '#06d6a0',
  warning: '#ffd166',
  danger: '#ef476f',
  dark: '#1a1a2e',
  gray: '#6c757d',
  attrition: '#ef476f',
  retention: '#06d6a0'
};

// Department colors
const DEPARTMENT_COLORS = {
  'Sales': '#ef476f',
  'Research & Development': '#4361ee',
  'Human Resources': '#06d6a0'
};

// Education level colors
const EDUCATION_COLORS = {
  '1': '#4cc9f0',    // Below College
  '2': '#4361ee',    // College
  '3': '#3a0ca3',    // Bachelor
  '4': '#7209b7',    // Master
  '5': '#f72585'     // Doctor
};

// Job satisfaction colors
const SATISFACTION_COLORS = {
  '1': '#ef476f',    // Low
  '2': '#ffd166',    // Medium
  '3': '#4cc9f0',    // High
  '4': '#06d6a0'     // Very High
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  });
}

function getRiskLevel(attritionRate) {
  if (attritionRate > 25) return { level: 'High', color: '#ef476f', class: 'high-risk' };
  if (attritionRate > 15) return { level: 'Medium', color: '#ffd166', class: 'medium-risk' };
  return { level: 'Low', color: '#06d6a0', class: 'low-risk' };
}

function ageBand(age) {
  if (age < 25) return "Under 25";
  if (age < 30) return "25-29";
  if (age < 35) return "30-34";
  if (age < 40) return "35-39";
  if (age < 45) return "40-44";
  if (age < 50) return "45-49";
  if (age < 55) return "50-54";
  return "55+";
}

function salaryBand(income) {
  if (income < 3000) return "Under $3k";
  if (income < 5000) return "$3k-$5k";
  if (income < 8000) return "$5k-$8k";
  if (income < 12000) return "$8k-$12k";
  return "$12k+";
}

// Filter rows based on current filters
function applyFilters() {
  const departmentFilter = document.getElementById('department-filter')?.value || 'all';
  const jobRoleFilter = document.getElementById('job-role-filter')?.value || 'all';
  const ageGroupFilter = document.getElementById('age-group-filter')?.value || 'all';
  
  filteredRows = allRows.filter(row => {
    // Department filter
    if (departmentFilter !== 'all' && row.Department !== departmentFilter) {
      return false;
    }
    
    // Job role filter
    if (jobRoleFilter !== 'all' && row.JobRole !== jobRoleFilter) {
      return false;
    }
    
    // Age group filter
    if (ageGroupFilter !== 'all') {
      const ageGroup = ageBand(row.Age || 0);
      if (ageGroup !== ageGroupFilter) {
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
    'kpi-total-employees': document.getElementById('kpi-total-employees'),
    'kpi-attrition-rate': document.getElementById('kpi-attrition-rate'),
    'kpi-avg-age': document.getElementById('kpi-avg-age'),
    'kpi-avg-years': document.getElementById('kpi-avg-years')
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
  if (kpiElements['kpi-total-employees']) {
    kpiElements['kpi-total-employees'].textContent = formatNumber(data.totalEmployees);
  }
  if (kpiElements['kpi-attrition-rate']) {
    const attritionRate = data.attritionRate;
    kpiElements['kpi-attrition-rate'].textContent = formatPercent(attritionRate);
    kpiElements['kpi-attrition-rate'].className = attritionRate > 15 ? 'attrition-high' : 'attrition-low';
  }
  if (kpiElements['kpi-avg-age']) {
    kpiElements['kpi-avg-age'].textContent = data.avgAge.toFixed(1);
  }
  if (kpiElements['kpi-avg-years']) {
    kpiElements['kpi-avg-years'].textContent = data.avgYears.toFixed(1);
  }
  
  // Update trend indicators
  updateTrendIndicators(data);
}

function updateTrendIndicators(data) {
  // Simulate trend data (would compare with previous period in real scenario)
  const trends = {
    employeesTrend: Math.random() > 0.4 ? 'positive' : 'negative',
    attritionTrend: Math.random() > 0.5 ? 'negative' : 'positive', // Negative is bad for attrition
    ageTrend: Math.random() > 0.6 ? 'positive' : 'negative',
    tenureTrend: Math.random() > 0.3 ? 'positive' : 'negative'
  };
  
  // Update trend indicators
  document.querySelectorAll('.kpi-card .trend').forEach((trendEl, index) => {
    const trendsArray = Object.values(trends);
    if (index < trendsArray.length) {
      const trend = trendsArray[index];
      trendEl.className = `trend ${trend}`;
      
      if (index === 1) { // Attrition trend - reversed logic
        const change = (Math.random() * 5).toFixed(1);
        trendEl.innerHTML = trend === 'negative' 
          ? '<i class="fas fa-arrow-up"></i><span>+' + change + '%</span>'
          : '<i class="fas fa-arrow-down"></i><span>-' + change + '%</span>';
      } else {
        const change = (Math.random() * 8).toFixed(1);
        trendEl.innerHTML = trend === 'positive' 
          ? '<i class="fas fa-arrow-up"></i><span>+' + change + '%</span>'
          : '<i class="fas fa-arrow-down"></i><span>-' + change + '%</span>';
      }
    }
  });
}

// Main function
function loadHrDashboard() {
  // Show loading state
  document.querySelectorAll('.kpi-card p').forEach(el => {
    el.innerHTML = '<span class="loading"></span>';
  });
  
  Papa.parse(CSV_PATH_HR, {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: (results) => {
      allRows = results.data.filter(r => r.EmployeeNumber);
      filteredRows = [...allRows];
      
      // Apply any existing filters
      if (document.getElementById('apply-filters')) {
        filteredRows = applyFilters();
      }
      
      buildHrDashboard(filteredRows);
      updateEmployeeTable(filteredRows);
      
      // Enable filter buttons
      if (document.getElementById('apply-filters')) {
        document.getElementById('apply-filters').addEventListener('click', () => {
          const filtered = applyFilters();
          buildHrDashboard(filtered);
          updateEmployeeTable(filtered);
        });
      }
      
      if (document.getElementById('reset-filters')) {
        document.getElementById('reset-filters').addEventListener('click', () => {
          filteredRows = [...allRows];
          buildHrDashboard(filteredRows);
          updateEmployeeTable(filteredRows);
          
          // Reset filter dropdowns
          if (document.getElementById('department-filter')) {
            document.getElementById('department-filter').value = 'all';
          }
          if (document.getElementById('job-role-filter')) {
            document.getElementById('job-role-filter').value = 'all';
          }
          if (document.getElementById('age-group-filter')) {
            document.getElementById('age-group-filter').value = 'all';
          }
        });
      }
    },
    error: (err) => {
      console.error("Error loading HR CSV:", err);
      // Fallback to demo data
      useDemoData();
    }
  });
}

// Fallback demo data
function useDemoData() {
  console.log("Using demo HR data...");
  allRows = [];
  
  const departments = ['Sales', 'Research & Development', 'Human Resources'];
  const jobRoles = ['Sales Executive', 'Research Scientist', 'Laboratory Technician', 
                   'Manufacturing Director', 'Healthcare Representative', 'Manager',
                   'Sales Representative', 'Research Director', 'Human Resources'];
  const educationLevels = ['1', '2', '3', '4', '5'];
  const satisfactionLevels = ['1', '2', '3', '4'];
  
  for (let i = 0; i < 1500; i++) {
    const dept = departments[Math.floor(Math.random() * departments.length)];
    const attrition = Math.random() < 0.16 ? 'Yes' : 'No';
    const age = Math.floor(Math.random() * 35) + 20;
    const salary = Math.floor(Math.random() * 15000) + 2000;
    
    allRows.push({
      EmployeeNumber: i + 1,
      Attrition: attrition,
      Department: dept,
      JobRole: jobRoles[Math.floor(Math.random() * jobRoles.length)],
      Age: age,
      YearsAtCompany: Math.floor(Math.random() * 20) + 1,
      MonthlyIncome: salary,
      Education: educationLevels[Math.floor(Math.random() * educationLevels.length)],
      JobSatisfaction: satisfactionLevels[Math.floor(Math.random() * satisfactionLevels.length)],
      Gender: Math.random() > 0.5 ? 'Male' : 'Female',
      MaritalStatus: ['Single', 'Married', 'Divorced'][Math.floor(Math.random() * 3)],
      OverTime: Math.random() > 0.7 ? 'Yes' : 'No'
    });
  }
  
  filteredRows = [...allRows];
  buildHrDashboard(filteredRows);
  updateEmployeeTable(filteredRows);
}

function buildHrDashboard(rows) {
  const totalEmployees = rows.length;

  let attritionYes = 0;
  let totalAge = 0;
  let totalYears = 0;
  let totalIncome = 0;

  const attritionCounts = { Yes: 0, No: 0 };
  const deptStats = {};  // { Dept: { attritionYes, total } }
  const roleStats = {};  // { Role: { attritionYes, total } }
  const ageStats = {};   // { "20-29": { attritionYes, total }, ... }
  const educationStats = {}; // { EducationLevel: { attritionYes, total } }
  const salaryStats = {}; // { SalaryBand: { attritionYes, total } }
  const satisfactionStats = {}; // { SatisfactionLevel: { attritionYes, total } }

  rows.forEach(row => {
    const attrition = String(row.Attrition || "").trim(); // "Yes"/"No"
    const dept = row.Department || "Unknown";
    const role = row.JobRole || "Unknown";
    const age = Number(row.Age) || 0;
    const years = Number(row.YearsAtCompany) || 0;
    const income = Number(row.MonthlyIncome) || 0;
    const education = String(row.Education || "");
    const satisfaction = String(row.JobSatisfaction || "");
    const gender = String(row.Gender || "Unknown");

    if (attrition === "Yes") {
      attritionYes += 1;
      attritionCounts.Yes += 1;
    } else {
      attritionCounts.No += 1;
    }

    totalAge += age;
    totalYears += years;
    totalIncome += income;

    // Department stats
    if (!deptStats[dept]) deptStats[dept] = { attritionYes: 0, total: 0 };
    deptStats[dept].total += 1;
    if (attrition === "Yes") deptStats[dept].attritionYes += 1;

    // Role stats
    if (!roleStats[role]) roleStats[role] = { attritionYes: 0, total: 0 };
    roleStats[role].total += 1;
    if (attrition === "Yes") roleStats[role].attritionYes += 1;

    // Age stats
    const ageGroup = ageBand(age);
    if (!ageStats[ageGroup]) ageStats[ageGroup] = { attritionYes: 0, total: 0 };
    ageStats[ageGroup].total += 1;
    if (attrition === "Yes") ageStats[ageGroup].attritionYes += 1;

    // Education stats
    if (!educationStats[education]) educationStats[education] = { attritionYes: 0, total: 0 };
    educationStats[education].total += 1;
    if (attrition === "Yes") educationStats[education].attritionYes += 1;

    // Salary stats
    const salaryGroup = salaryBand(income);
    if (!salaryStats[salaryGroup]) salaryStats[salaryGroup] = { attritionYes: 0, total: 0 };
    salaryStats[salaryGroup].total += 1;
    if (attrition === "Yes") salaryStats[salaryGroup].attritionYes += 1;

    // Satisfaction stats
    if (!satisfactionStats[satisfaction]) satisfactionStats[satisfaction] = { attritionYes: 0, total: 0 };
    satisfactionStats[satisfaction].total += 1;
    if (attrition === "Yes") satisfactionStats[satisfaction].attritionYes += 1;
  });

  const attritionRate = totalEmployees ? (attritionYes / totalEmployees) * 100 : 0;
  const avgAge = totalEmployees ? totalAge / totalEmployees : 0;
  const avgYears = totalEmployees ? totalYears / totalEmployees : 0;
  const avgIncome = totalEmployees ? totalIncome / totalEmployees : 0;

  // Prepare KPI data
  const kpiData = {
    totalEmployees,
    attritionRate,
    avgAge,
    avgYears,
    avgIncome
  };

  // Update KPI cards
  updateKPICards(kpiData);

  // Build charts
  buildAttritionOverallChart(attritionCounts);
  buildAttritionByDeptChart(deptStats);
  buildAttritionByRoleChart(roleStats);
  buildAttritionByAgeChart(ageStats);
  buildAttritionByEducationChart(educationStats);
  buildAttritionBySalaryChart(salaryStats);
  
  // Update risk indicator
  updateRiskIndicator(deptStats);
}

function updateRiskIndicator(deptStats) {
  const riskIndicator = document.querySelector('.risk-indicator.high-risk')?.parentElement;
  if (riskIndicator) {
    // Find department with highest attrition
    let highestDept = '';
    let highestRate = 0;
    
    Object.entries(deptStats).forEach(([dept, stats]) => {
      const rate = (stats.attritionYes / stats.total) * 100;
      if (rate > highestRate) {
        highestRate = rate;
        highestDept = dept;
      }
    });
    
    if (highestDept) {
      riskIndicator.innerHTML = `<span class="risk-indicator high-risk"></span> High Risk Department: ${highestDept} (${highestRate.toFixed(1)}%)`;
    }
  }
}

function updateEmployeeTable(rows) {
  const tableBody = document.getElementById('employee-table')?.querySelector('tbody');
  if (!tableBody) return;
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Add sample rows (first 20 with attrition)
  rows
    .filter(row => row.Attrition === 'Yes')
    .slice(0, 20)
    .forEach((row, index) => {
      const attritionRate = Math.random() * 30 + 10; // Simulated department rate
      const risk = getRiskLevel(attritionRate);
      
      const rowElement = document.createElement('tr');
      rowElement.innerHTML = `
        <td>HR${String(row.EmployeeNumber || index + 1).padStart(3, '0')}</td>
        <td><span class="department-badge">${row.Department || 'Unknown'}</span></td>
        <td>${row.JobRole || 'Unknown'}</td>
        <td>${row.Age || 0}</td>
        <td>${row.YearsAtCompany?.toFixed(1) || '0'}</td>
        <td><span class="${row.Attrition === 'Yes' ? 'attrition-high' : 'attrition-low'}">${row.Attrition || 'No'}</span></td>
        <td><span class="risk-indicator ${risk.class}"></span> ${risk.level}</td>
      `;
      tableBody.appendChild(rowElement);
    });
  
  // If no attrition rows, add some regular employees
  if (tableBody.children.length === 0) {
    rows.slice(0, 10).forEach((row, index) => {
      const attritionRate = Math.random() * 15; // Simulated department rate
      const risk = getRiskLevel(attritionRate);
      
      const rowElement = document.createElement('tr');
      rowElement.innerHTML = `
        <td>HR${String(row.EmployeeNumber || index + 1).padStart(3, '0')}</td>
        <td><span class="department-badge">${row.Department || 'Unknown'}</span></td>
        <td>${row.JobRole || 'Unknown'}</td>
        <td>${row.Age || 0}</td>
        <td>${row.YearsAtCompany?.toFixed(1) || '0'}</td>
        <td><span class="${row.Attrition === 'Yes' ? 'attrition-high' : 'attrition-low'}">${row.Attrition || 'No'}</span></td>
        <td><span class="risk-indicator ${risk.class}"></span> ${risk.level}</td>
      `;
      tableBody.appendChild(rowElement);
    });
  }
}

function buildAttritionOverallChart(counts) {
  const labels = Object.keys(counts);
  const data = labels.map(l => counts[l]);
  
  const backgroundColors = [
    CHART_COLORS.attrition,  // Yes
    CHART_COLORS.retention   // No
  ];

  const ctx = document.getElementById("attritionOverall");
  if (!ctx) return;
  
  // Destroy existing chart if it exists
  if (currentCharts.attritionOverall) {
    currentCharts.attritionOverall.destroy();
  }

  currentCharts.attritionOverall = new Chart(ctx, {
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

function buildAttritionByDeptChart(stats) {
  const labels = Object.keys(stats);
  const data = labels.map(label => {
    const s = stats[label];
    return s.total ? (s.attritionYes / s.total) * 100 : 0;
  });
  
  // Generate colors based on department
  const backgroundColors = labels.map(label => 
    DEPARTMENT_COLORS[label] || CHART_COLORS.gray
  );

  const ctx = document.getElementById("attritionByDept");
  if (!ctx) return;
  
  if (currentCharts.attritionByDept) {
    currentCharts.attritionByDept.destroy();
  }

  currentCharts.attritionByDept = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Attrition Rate (%)",
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
              const attrition = stats[context.label].attritionYes;
              return `${context.raw.toFixed(1)}% (${attrition} of ${total} employees)`;
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

function buildAttritionByRoleChart(stats) {
  // Sort by attrition rate descending
  const entries = Object.entries(stats)
    .sort(([,a], [,b]) => {
      const rateA = a.total ? (a.attritionYes / a.total) * 100 : 0;
      const rateB = b.total ? (b.attritionYes / b.total) * 100 : 0;
      return rateB - rateA;
    });
  
  const labels = entries.map(([label]) => label);
  const data = entries.map(([,stats]) => {
    return stats.total ? (stats.attritionYes / stats.total) * 100 : 0;
  });
  
  // Color by attrition rate (red for high, yellow for medium, green for low)
  const backgroundColors = data.map(rate => {
    if (rate > 25) return CHART_COLORS.danger;
    if (rate > 15) return CHART_COLORS.warning;
    return CHART_COLORS.success;
  });

  const ctx = document.getElementById("attritionByRole");
  if (!ctx) return;
  
  if (currentCharts.attritionByRole) {
    currentCharts.attritionByRole.destroy();
  }

  currentCharts.attritionByRole = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Attrition Rate (%)",
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color + 'CC'),
        borderWidth: 1,
        borderRadius: 4,
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
              const label = labels[context.dataIndex];
              const total = stats[label].total;
              const attrition = stats[label].attritionYes;
              return `${context.raw.toFixed(1)}% (${attrition} of ${total} employees)`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: (v) => v + "%"
          },
          grid: {
            drawBorder: false
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            autoSkip: false,
            font: {
              size: 11
            }
          }
        }
      }
    }
  });
}

function buildAttritionByAgeChart(stats) {
  // Sort age groups logically
  const ageOrder = ["Under 25", "25-29", "30-34", "35-39", "40-44", "45-49", "50-54", "55+"];
  const labels = ageOrder.filter(label => stats[label]);
  const data = labels.map(label => {
    const s = stats[label];
    return s.total ? (s.attritionYes / s.total) * 100 : 0;
  });
  
  // Gradient colors based on age (younger = lighter)
  const backgroundColors = labels.map((label, index) => {
    const hue = 240 - (index * 20); // Blue to purple gradient
    return `hsl(${hue}, 70%, 60%)`;
  });

  const ctx = document.getElementById("attritionByAge");
  if (!ctx) return;
  
  if (currentCharts.attritionByAge) {
    currentCharts.attritionByAge.destroy();
  }

  currentCharts.attritionByAge = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Attrition Rate (%)",
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
              const attrition = stats[label].attritionYes;
              return `${context.raw.toFixed(1)}% (${attrition} of ${total} employees)`;
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

function buildAttritionByEducationChart(stats) {
  // Education level mapping
  const educationLabels = {
    '1': 'Below College',
    '2': 'College',
    '3': 'Bachelor',
    '4': 'Master',
    '5': 'Doctor'
  };
  
  const labels = Object.keys(stats).sort().map(key => educationLabels[key] || `Level ${key}`);
  const data = labels.map((_, index) => {
    const key = Object.keys(stats).sort()[index];
    const s = stats[key];
    return s.total ? (s.attritionYes / s.total) * 100 : 0;
  });
  
  // Colors based on education level
  const backgroundColors = Object.keys(stats).sort().map(key => 
    EDUCATION_COLORS[key] || CHART_COLORS.gray
  );

  const ctx = document.getElementById("attritionByEducation");
  if (!ctx) return;
  
  if (currentCharts.attritionByEducation) {
    currentCharts.attritionByEducation.destroy();
  }

  currentCharts.attritionByEducation = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Attrition Rate (%)",
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
              const key = Object.keys(stats).sort()[context.dataIndex];
              const total = stats[key].total;
              const attrition = stats[key].attritionYes;
              return `${context.raw.toFixed(1)}% (${attrition} of ${total} employees)`;
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

function buildAttritionBySalaryChart(stats) {
  // Salary band order
  const salaryOrder = ["Under $3k", "$3k-$5k", "$5k-$8k", "$8k-$12k", "$12k+"];
  const labels = salaryOrder.filter(label => stats[label]);
  const data = labels.map(label => {
    const s = stats[label];
    return s.total ? (s.attritionYes / s.total) * 100 : 0;
  });
  
  // Gradient from red (high attrition) to green (low attrition)
  const backgroundColors = data.map(rate => {
    if (rate > 25) return CHART_COLORS.danger;
    if (rate > 18) return '#ff9a76';
    if (rate > 12) return CHART_COLORS.warning;
    if (rate > 8) return '#a7d9a9';
    return CHART_COLORS.success;
  });

  const ctx = document.getElementById("attritionBySalary");
  if (!ctx) return;
  
  if (currentCharts.attritionBySalary) {
    currentCharts.attritionBySalary.destroy();
  }

  currentCharts.attritionBySalary = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Attrition Rate (%)",
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
              const label = labels[context.dataIndex];
              const total = stats[label].total;
              const attrition = stats[label].attritionYes;
              return `${context.raw.toFixed(1)}% (${attrition} of ${total} employees)`;
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

// Export functionality
function exportHRData() {
  const exportData = filteredRows.map(row => ({
    'Employee ID': `HR${String(row.EmployeeNumber).padStart(3, '0')}`,
    'Department': row.Department,
    'Job Role': row.JobRole,
    'Age': row.Age,
    'Years at Company': row.YearsAtCompany,
    'Monthly Income': row.MonthlyIncome ? formatCurrency(row.MonthlyIncome) : '-',
    'Attrition': row.Attrition,
    'Risk Level': getRiskLevel((row.Department ? 
      (Math.random() * 30) : 10)).level
  }));
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = 'hr_attrition_data.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

// Real-time simulation - add new employee
function simulateNewEmployee() {
  if (allRows.length > 0) {
    const departments = ['Sales', 'Research & Development', 'Human Resources'];
    const jobRoles = ['Sales Executive', 'Research Scientist', 'Laboratory Technician'];
    const attrition = Math.random() < 0.18 ? 'Yes' : 'No';
    
    const newEmployee = {
      EmployeeNumber: allRows.length + 1,
      Attrition: attrition,
      Department: departments[Math.floor(Math.random() * departments.length)],
      JobRole: jobRoles[Math.floor(Math.random() * jobRoles.length)],
      Age: Math.floor(Math.random() * 30) + 25,
      YearsAtCompany: Math.floor(Math.random() * 10) + 1,
      MonthlyIncome: Math.floor(Math.random() * 10000) + 3000,
      Education: String(Math.floor(Math.random() * 5) + 1),
      JobSatisfaction: String(Math.floor(Math.random() * 4) + 1),
      Gender: Math.random() > 0.5 ? 'Male' : 'Female'
    };
    
    allRows.push(newEmployee);
    filteredRows.push(newEmployee);
    
    // Rebuild dashboard with slight delay
    setTimeout(() => {
      buildHrDashboard(filteredRows);
      
      // Show notification
      showNotification(`New employee added: ${newEmployee.Department} - ${newEmployee.JobRole} (Attrition: ${attrition})`);
    }, 500);
  }
}

function showNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${CHART_COLORS.primary};
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
  
  notification.innerHTML = `
    <i class="fas fa-user-plus"></i>
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
  loadHrDashboard();
  
  // Set up real-time updates (every 45 seconds)
  setInterval(simulateNewEmployee, 45000);
  
  // Set up load more button
  const loadMoreBtn = document.getElementById('load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      // Simulate loading more data
      const tableBody = document.getElementById('employee-table')?.querySelector('tbody');
      if (tableBody) {
        // Add 5 more rows
        for (let i = 0; i < 5; i++) {
          const departments = ['Sales', 'Research & Development', 'Human Resources'];
          const dept = departments[Math.floor(Math.random() * 3)];
          const attrition = Math.random() < 0.2 ? 'Yes' : 'No';
          const attritionRate = Math.random() * 30;
          const risk = getRiskLevel(attritionRate);
          
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>HR${String(tableBody.children.length + 1000).padStart(3, '0')}</td>
            <td><span class="department-badge">${dept}</span></td>
            <td>${['Sales Executive', 'Research Scientist', 'Laboratory Technician'][Math.floor(Math.random() * 3)]}</td>
            <td>${Math.floor(Math.random() * 30) + 25}</td>
            <td>${(Math.random() * 15 + 1).toFixed(1)}</td>
            <td><span class="${attrition === 'Yes' ? 'attrition-high' : 'attrition-low'}">${attrition}</span></td>
            <td><span class="risk-indicator ${risk.class}"></span> ${risk.level}</td>
          `;
          tableBody.appendChild(row);
        }
      }
    });
  }
  
  // Set up export button if exists
  const exportBtn = document.querySelector('a[href*="Download Dataset"]');
  if (exportBtn) {
    exportBtn.addEventListener('click', (e) => {
      e.preventDefault();
      exportHRData();
    });
  }
});
