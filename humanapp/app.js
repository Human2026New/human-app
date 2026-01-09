/* =====================================================
   HUMAN — WebApp sincronizada com backend
   ===================================================== */

// ALTERA PARA O TEU BACKEND
const API_BASE = "https://TEU_BACKEND.onrender.com"; // <-- substitui isto

/* ---------- TELEGRAM SAFE ---------- */
Telegram.WebApp.ready();

/* ---------- STATE ---------- */
let state = {
  hum: 0,
  percent: 0,
  phase: 0,
  rules: {}
};

/* ---------- ELEMENTS ---------- */
const humValue = document.getElementById("humValue");
const percentText = document.getElementById("percentText");
const phaseText = document.getElementById("phaseText");

/* ---------- UI ---------- */
function updateUI() {
  humValue.textContent = state.hum.toFixed(5) + " HUM";
  percentText.textContent = state.percent.toFixed(2) + "% minerado";

  phaseText.textContent =
    state.phase === 0
      ? "Fase 0 — Génese\nHUM dormente"
      : state.phase === 1
      ? "Fase 1 — Ativação"
      : "Fase 2 — Circulação";
}

/* ---------- SYNC USER HUM ---------- */
async function syncUser() {
  try {
    const uid = Telegram.WebApp.initDataUnsafe.user.id;

    const r = await fetch(`${API_BASE}/hum/me/${uid}`);
    const d = await r.json();

    state.hum = d.hum_balance;
    updateUI();
  } catch (err) {
    console.warn("❌ Falhou /hum/me:", err);
  }
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
  } catch (err) {
    console.warn("❌ Falhou /hum/mine:", err);
  }
}

/* ---------- SYNC GLOBAL STATUS ---------- */
async function syncStatus() {
  try {
    const r = await fetch(`${API_BASE}/hum/status`);
    const d = await r.json();

    state.phase = d.phase;
    state.percent = d.percent_mined;
    state.rules = d.rules;

    updateUI();
  } catch (err) {
    console.warn("❌ Falhou /hum/status:", err);
  }
}

/* ---------- INIT ---------- */
(async () => {
  await syncStatus();     // preço, % minerada, fase
  await syncUser();       // saldo real do user
  await markPresence();   // dar HUM do dia
})();

// Atualiza percentagem e regras regularmente
setInterval(syncStatus, 30000);
