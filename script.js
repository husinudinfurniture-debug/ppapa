// ===================== script.js =====================
const pages = {
  landing: document.getElementById("landing"),
  input: document.getElementById("inputPage"),
  result: document.getElementById("resultPage")
};

const devices = [];
let chart;

function show(page) {
  Object.values(pages).forEach(p => p.classList.remove("active"));
  pages[page].classList.add("active");
}

document.getElementById("startBtn").onclick = () => show("input");

document.getElementById("addDevice").onclick = () => {
  const name = document.getElementById("name").value;
  const power = +document.getElementById("power").value;
  const qty = +document.getElementById("qty").value;
  const hours = +document.getElementById("hours").value;
  const type = document.getElementById("type").value;

  if (!name || power <= 0 || qty <= 0 || hours <= 0) return alert("Input tidak valid");

  devices.push({ name, power, qty, hours, type });
  renderDevices();
};

function renderDevices() {
  const list = document.getElementById("deviceList");
  list.innerHTML = "";
  devices.forEach(d => {
    const li = document.createElement("li");
    li.textContent = `${d.name} - ${d.power}W`;
    list.appendChild(li);
  });
}

function calcEnergy(d) {
  return (d.power * d.qty * d.hours * 30) / 1000;
}

function getAF(type) {
  return type === "always" ? 0 : type === "routine" ? 0.5 : 1;
}

document.getElementById("calculate").onclick = () => {
  if (devices.length === 0) return alert("Tambahkan perangkat");

  const tariff = +document.getElementById("vaSelect").value;

  let total = 0;
  const energies = devices.map(d => {
    const e = calcEnergy(d);
    total += e;
    return e;
  });

  const cost = total * tariff;
  const R = total / 1000;

  let status = "Hemat";
  if (R >= 0.6) status = "Boros";
  else if (R >= 0.3) status = "Normal";

  document.getElementById("summary").innerText = `Energi: ${total.toFixed(2)} kWh | Biaya: Rp ${cost.toFixed(0)} | Status: ${status}`;

  renderChart(energies);
  renderTable(energies, total);
  renderAnalysis(energies);
  renderRecommendation();

  show("result");
};

function renderChart(data) {
  const ctx = document.getElementById("chart");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: devices.map(d => d.name),
      datasets: [{ data }]
    }
  });
}

function renderTable(energies, total) {
  const div = document.getElementById("table");
  div.innerHTML = "<h3>Detail</h3>";
  devices.forEach((d, i) => {
    const p = document.createElement("p");
    p.innerText = `${d.name}: ${energies[i].toFixed(2)} kWh (${((energies[i]/total)*100).toFixed(1)}%)`;
    div.appendChild(p);
  });
}

function renderAnalysis(energies) {
  const max = Math.max(...energies);
  const idx = energies.indexOf(max);
  document.getElementById("analysis").innerText = `Paling boros: ${devices[idx].name}`;
}

function renderRecommendation() {
  const div = document.getElementById("recommendation");
  div.innerHTML = "<h3>Rekomendasi</h3>";
  devices.forEach(d => {
    const af = getAF(d.type);
    const reduce = 2 * af;
    if (reduce > 0) {
      const p = document.createElement("p");
      p.innerText = `${d.name}: kurangi ${reduce} jam/hari`;
      div.appendChild(p);
    }
  });
}

document.getElementById("reset").onclick = () => location.reload();