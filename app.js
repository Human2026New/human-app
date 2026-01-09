/* =====================================================
   HUMAN — WebApp com XP, Missões, Ranking e TON Wallet
===================================================== */

const API_BASE = "https://TEU_BACKEND.onrender.com";

Telegram.WebApp.ready();

let state = {
  hum: 0,
  percent: 0,
  phase: 0,
  xp: 0,
  level: 0,
  missions: []
};

const humValue = document.getElementById("humValue");
const percentText = document.getElementById("percentText");
const phaseText = document.getElementById("phaseText");
const xpLine = document.getElementById("xpLine");
const missionList = document.getElementById("missionList");
const rankingList = document.getElementById("rankingList");

function updateUI() {
  humValue.textContent = state.hum.toFixed(5) + " HUM";
  percentText.textContent = state.percent.toFixed(2) + "% minerado";
  xpLine.textContent = `XP: ${state.xp} — Nível ${state.level}`;
  phaseText.textContent =
    state.phase === 0 ? "Fase 0 — Génese\nHUM dormente"
    : state.phase === 1 ? "Fase 1 — Ativação"
    : "Fase 2 — Circulação";
}

/* ---------- SYNC USER ---------- */
async function syncUser() {
  try {
    const uid = Telegram.WebApp.initDataUnsafe.user.id;
    const r = await fetch(`${API_BASE}/hum/me/${uid}`);
    const d = await r.json();
    state.hum = d.hum_balance;
    state.xp = d.xp || 0;
    state.level = d.level || 0;
    updateUI();
  } catch {}
}

/* ---------- MARK PRESENCE ---------- */
async function markPresence() {
  try {
    const uid = Telegram.WebApp.initDataUnsafe.user.id;
    await fetch(`${API_BASE}/hum/mine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: uid })
    });
    await syncUser();
    await syncMissions();
  } catch {}
}

/* ---------- MISSÕES ---------- */
async function syncMissions() {
  try {
    const uid = Telegram.WebApp.initDataUnsafe.user.id;
    const r = await fetch(`${API_BASE}/hum/missions/${uid}`);
    state.missions = await r.json();
    missionList.innerHTML = state.missions
      .map(m => `<li>${m.done ? "✔️" : "❌"} ${m.name}</li>`)
      .join("");
  } catch {
    missionList.innerHTML = "<li>Falhou a carregar missões</li>";
  }
}

/* ---------- RANKING ---------- */
async function syncRanking() {
  try {
    const r = await fetch(`${API_BASE}/hum/ranking`);
    const d = await r.json();
    rankingList.innerHTML = d
      .map((u, i) => `<li>${i+1}. ${u.name} — ${u.hum.toFixed(5)} HUM</li>`)
      .join("");
  } catch {
    rankingList.innerHTML = "<li>Erro ao carregar ranking</li>";
  }
}

/* ---------- STATUS GLOBAL ---------- */
async function syncStatus() {
  try {
    const r = await fetch(`${API_BASE}/hum/status`);
    const d = await r.json();
    state.phase = d.phase;
    state.percent = d.percent_mined;
    updateUI();
  } catch {}
}

/* ---------- TON CONNECT ---------- */
const connector = new tonConnect.TonConnect({
  manifestUrl: "https://TEU_DOMINIO.com/tonconnect-manifest.json"
});

async function updateTonUI() {
  document.getElementById('connectBtn').style.display =
    connector.connected ? 'none' : 'block';
  document.getElementById('disconnectBtn').style.display =
    connector.connected ? 'block' : 'none';
}

document.getElementById('connectBtn').addEventListener('click', async () => {
  await connector.connect();
  updateTonUI();
});

document.getElementById('disconnectBtn').addEventListener('click', async () => {
  await connector.disconnect();
  updateTonUI();
});

connector.onStatusChange(walletInfo => {
  if (walletInfo) {
    console.log("Wallet ligada:", walletInfo.account.address);
  }
  updateTonUI();
});

/* ---------- INIT ---------- */
(async () => {
  await syncStatus();
  await syncUser();
  await syncMissions();
  await syncRanking();
  await markPresence();
})();

/* ---------- MODALS & LOOPS ---------- */
document.getElementById("mineBtn").addEventListener("click", markPresence);

document.querySelectorAll("[data-open]").forEach(btn =>
  btn.addEventListener("click", () =>
    document.getElementById(btn.dataset.open).classList.remove("hidden")
  )
);

document.querySelectorAll(".close").forEach(btn =>
  btn.addEventListener("click", () =>
    btn.closest(".space").classList.add("hidden")
  )
);

setInterval(syncStatus, 30000);
setInterval(syncRanking, 60000);
setInterval(syncMissions, 45000);
