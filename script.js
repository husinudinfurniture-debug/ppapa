
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

// ===================== PRESET AUTO FILL =====================
document.getElementById("presetSelect").addEventListener("change", function () {
  if (!this.value) return;

  const [name, watt] = this.value.split("|");

  document.getElementById("name").value = name;
  document.getElementById("power").value = watt;
});

// ===================== ADD DEVICE =====================
document.getElementById("addDevice").onclick = () => {
  const name = document.getElementById("name").value.trim();
  const power = Number(document.getElementById("power").value);
  const qty = Number(document.getElementById("qty").value);
  const hours = Number(document.getElementById("hours").value);
  const type = document.getElementById("type").value;

  if (!name || power <= 0 || qty <= 0 || hours <= 0) {
    alert("Semua input harus valid (> 0)");
    return;
  }

  devices.push({ name, power, qty, hours, type });
  renderDevices();
  clearInputs();
};

// ===================== RENDER DEVICE =====================
function renderDevices() {
  const list = document.getElementById("deviceList");
  list.innerHTML = "";

  devices.forEach(d => {
    const li = document.createElement("li");
    li.textContent = `${d.name} | ${d.power}W | ${d.qty} unit | ${d.hours} jam | ${d.type}`;
    list.appendChild(li);
  });
}

// ===================== CLEAR INPUT =====================
function clearInputs() {
  document.getElementById("name").value = "";
  document.getElementById("power").value = "";
  document.getElementById("qty").value = "";
  document.getElementById("hours").value = "";
  document.getElementById("presetSelect").value = "";
}

// ===================== CORE LOGIC =====================

// Energi
function calculateEnergy(d) {
  return (d.power * d.qty * d.hours * 30) / 1000;
}

// AF
function getAF(type) {
  if (type === "always") return 0;
  if (type === "routine") return 0.5;
  return 1;
}

// Optimasi
function optimizeDevice(d) {
  const AF = getAF(d.type);
  const deltaT = 2 * AF;
  const newHours = Math.max(d.hours - deltaT, 1);

  return { ...d, newHours };
}

// ===================== CALCULATE =====================
document.getElementById("calculate").onclick = () => {

  if (devices.length === 0) {
    alert("Tambahkan perangkat terlebih dahulu");
    return;
  }

  const select = document.getElementById("vaSelect");
  if (!select.value) {
    alert("Pilih VA terlebih dahulu");
    return;
  }

  const tariff = Number(select.value);
  const VA = Number(select.options[select.selectedIndex].dataset.va);

  let totalEnergy = 0;
  let optimizedEnergy = 0;

  const labels = [];
  const energies = [];

  devices.forEach(d => {
    const energy = calculateEnergy(d);
    totalEnergy += energy;

    const opt = optimizeDevice(d);
    const eOpt = (opt.power * opt.qty * opt.newHours * 30) / 1000;
    optimizedEnergy += eOpt;

    labels.push(d.name);
    energies.push(Number(energy.toFixed(2)));
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

// ===================== SUMMARY =====================
function renderSummary(total, cost, status, R) {
  document.getElementById("summary").innerText =
    `Energi: ${total.toFixed(2)} kWh | Biaya: Rp ${Math.round(cost).toLocaleString("id-ID")} | Status: ${status} | Rasio: ${R.toFixed(2)}`;
}

// ===================== BAR CHART =====================
function renderChart(labels, data) {
  const canvas = document.getElementById("chart");

  if (!canvas) {
    console.error("Canvas tidak ditemukan");
    return;
  }

  const ctx = canvas.getContext("2d");

  if (chart) chart.destroy();

  if (!labels.length || !data.length) return;

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Energi (kWh)",
        data: data,
        backgroundColor: "#38bdf8"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: "#ffffff" }
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#ffffff" }
        }
      }
    }
  });
}

// ===================== TABLE =====================
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

// ===================== ANALYSIS =====================
function renderAnalysis(energies) {
  const max = Math.max(...energies);
  const idx = energies.indexOf(max);

  document.getElementById("analysis").innerText =
    `Perangkat paling boros: ${devices[idx].name}`;
}

// ===================== RECOMMENDATION =====================
function renderRecommendation() {
  const div = document.getElementById("recommendation");
  div.innerHTML = "<h3>Rekomendasi</h3>";

  devices.forEach(d => {
    const AF = getAF(d.type);
    const reduce = 2 * AF;

    if (reduce > 0) {
      const p = document.createElement("p");
      p.innerText = `${d.name}: kurangi ${reduce} jam/hari`;
      div.appendChild(p);
    }
  });
}

// ===================== RESET =====================
document.getElementById("reset").onclick = () => location.reload();
