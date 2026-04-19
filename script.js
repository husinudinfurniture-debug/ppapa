// ===================== STATE =====================
const pages = {
  landing: document.getElementById("landing"),
  input: document.getElementById("inputPage"),
  result: document.getElementById("resultPage")
};

let devices = [];
let chart = null;

// ===================== NAVIGATION =====================
function show(page) {
  Object.values(pages).forEach(p => p.classList.remove("active"));
  pages[page].classList.add("active");
}

document.getElementById("startBtn").onclick = () => show("input");

// ===================== DEVICE MANAGEMENT =====================
document.getElementById("addDevice").onclick = () => {
  const name = document.getElementById("name").value.trim();
  const power = Number(document.getElementById("power").value);
  const qty = Number(document.getElementById("qty").value);
  const hours = Number(document.getElementById("hours").value);
  const type = document.getElementById("type").value;

  if (!name || power <= 0 || qty <= 0 || hours <= 0) {
    alert("Semua input harus valid dan > 0");
    return;
  }

  devices.push({ name, power, qty, hours, type });
  renderDevices();
  clearInputs();
};

function renderDevices() {
  const list = document.getElementById("deviceList");
  list.innerHTML = "";

  devices.forEach((d, i) => {
    const li = document.createElement("li");
    li.textContent = `${d.name} | ${d.power}W | ${d.qty} unit | ${d.hours} jam | ${d.type}`;
    list.appendChild(li);
  });
}

function clearInputs() {
  document.getElementById("name").value = "";
  document.getElementById("power").value = "";
  document.getElementById("qty").value = "";
  document.getElementById("hours").value = "";
}

document.getElementById("presetSelect").addEventListener("change", function () {
  const value = this.value;
  if (!value) return;

  const [name, watt] = value.split("|");

  document.getElementById("name").value = name;
  document.getElementById("power").value = watt;
});

// ===================== CORE MATH =====================

// Energi
function calculateEnergy(device) {
  return (device.power * device.qty * device.hours * 30) / 1000;
}

// Adjustability Factor
function getAF(type) {
  switch(type) {
    case "always": return 0;
    case "routine": return 0.5;
    case "flexible": return 1;
    default: return 0;
  }
}

// Optimasi
function optimizeDevice(device) {
  const AF = getAF(device.type);
  const deltaT = 2 * AF;
  const newHours = Math.max(device.hours - deltaT, 1);

  return {
    ...device,
    newHours
  };
}

// ===================== MAIN CALCULATION =====================
document.getElementById("calculate").onclick = () => {

  if (devices.length === 0) {
    alert("Tambahkan minimal 1 perangkat");
    return;
  }

  const select = document.getElementById("vaSelect");
  if (!select.value) {
    alert("Pilih golongan listrik terlebih dahulu");
    return;
  }

  const tariff = Number(select.value);
  const VA = Number(select.options[select.selectedIndex].dataset.va);

  let totalEnergy = 0;
  let optimizedEnergy = 0;

  const energies = [];
  const labels = [];

  devices.forEach(device => {
    const energy = calculateEnergy(device);
    totalEnergy += energy;

    const optimized = optimizeDevice(device);
    const energyOpt = (optimized.power * optimized.qty * optimized.newHours * 30) / 1000;
    optimizedEnergy += energyOpt;

    energies.push(Number(energy.toFixed(2)));
    labels.push(device.name);
  });

  // Cost
  const cost = totalEnergy * tariff;

  // Efficiency Ratio
  const Emax = (VA * 24 * 30) / 1000;
  const R = totalEnergy / Emax;

  // Classification
  let status = "Hemat";
  if (R >= 0.6) status = "Boros";
  else if (R >= 0.3) status = "Normal";

  renderSummary(totalEnergy, cost, status, R);
  renderChart(labels, energies);
  renderTable(energies, totalEnergy);
  renderAnalysis(energies);
  renderRecommendation();

  show("result");
};

// ===================== RENDER =====================

function renderChart(labels, data) {
  const ctx = document.getElementById("chart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Konsumsi Energi (kWh)",
        data: data
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        x: {
          ticks: {
            color: "#f1f5f9"
          },
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#f1f5f9"
          },
          grid: {
            color: "#334155"
          }
        }
      }
    }
  });
}

function renderTable(energies, total) {
  const div = document.getElementById("table");
  div.innerHTML = "<h3>Distribusi Energi</h3>";

  devices.forEach((d, i) => {
    const percent = (energies[i] / total) * 100;

    const p = document.createElement("p");
    p.innerText = `${d.name}: ${energies[i]} kWh (${percent.toFixed(1)}%)`;
    div.appendChild(p);
  });
}

function renderAnalysis(energies) {
  const max = Math.max(...energies);
  const index = energies.indexOf(max);

  document.getElementById("analysis").innerText =
    `Perangkat paling boros: ${devices[index].name}`;
}

function renderRecommendation() {
  const div = document.getElementById("recommendation");
  div.innerHTML = "<h3>Rekomendasi Penghematan</h3>";

  devices.forEach(d => {
    const AF = getAF(d.type);
    const reduction = 2 * AF;

    if (reduction > 0) {
      const p = document.createElement("p");
      p.innerText = `${d.name}: kurangi penggunaan sekitar ${reduction} jam/hari`;
      div.appendChild(p);
    }
  });
}

// ===================== RESET =====================
document.getElementById("reset").onclick = () => {
  devices = [];
  location.reload();
};
