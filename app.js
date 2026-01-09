/* =====================================================
   HUMAN — WebApp ligada ao backend e TON
   ===================================================== */

// >>> ALTERA para o teu backend no Render <<<
const API_BASE = "https://TEU_BACKEND.onrender.com";

/* ---------- TELEGRAM ---------- */
Telegram.WebApp.ready();

/* ---------- STATE GLOBAL ---------- */
let state = {
  hum: 0,
  percent: 0,
  phase: 0,
  rules: {}
};

/* ---------- UI ELEMENTS ---------- */
const humValue = document.getElementById("humValue");
const percentText = document.getElementById("percentText");
const phaseText = document.getElementById("phaseText");

/* =====================================================
   UI — Atualizar e refletir o estado real
   ===================================================== */
function updateUI() {
  humValue.textContent = state.hum.toFixed(5) + " HUM";
  percentText.textContent = state.percent.toFixed(2) + "% minerado";

  const phaseName =
    state.phase === 0
      ? "Fase 0 — Génese\nHUM dormente"
      : state.phase === 1
      ? "Fase 1 — Ativação"
      : "Fase 2 — Circulação";

  phaseText.textContent = phaseName;
}

/* =====================================================
   SYNC — Utilizador → Backend
   ===================================================== */
async function syncUser() {
  try {
    const uid = Telegram.WebApp.initDataUnsafe.user.id;

    const r = await fetch(`${API_BASE}/hum/me/${uid}`);
    const data = await r.json();

    state.hum = data.hum_balance;
    updateUI();

  } catch (err) {
    console.warn("❌ Falhou /hum/me", err);
  }
}

/* =====================================================
   SYNC — Estado global (preço / fase / % minerada)
   ===================================================== */
async function syncStatus() {
  try {
    const r = await fetch(`${API_BASE}/hum/status`);
    const d = await r.json();

    state.phase = d.phase;
    state.percent = d.percent_mined;
    state.rules = d.rules;

    updateUI();

  } catch (err) {
    console.warn("❌ Falhou /hum/status", err);
  }
}

/* =====================================================
   PRESENÇA DIÁRIA — 1 HUM/dia se aplicável
   ===================================================== */
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
    console.warn("❌ Falhou /hum/mine", err);
  }
}

/* =====================================================
   COMPRAR HUM — Tonkeeper
   ===================================================== */
async function buyHum(amount) {
  try {
    const uid = Telegram.WebApp.initDataUnsafe.user.id;

    const r = await fetch(`${API_BASE}/hum/buy/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_id: uid, hum_amount: amount })
    });

    const d = await r.json();

    Telegram.WebApp.openLink(
      `ton://transfer/${d.ton_address}?amount=${d.ton_amount}&text=${encodeURIComponent(d.payload)}`
    );

  } catch (err) {
    console.warn("❌ Falhou /hum/buy/prepare", err);
  }
}

// EXPOR PARA HTML (botões)
window.buyHum = buyHum;

/* =====================================================
   ARRANQUE
   ===================================================== */
(async function init() {
  await syncStatus();     // Ver regras + fase + preço
  await syncUser();       // Buscar saldo
  await markPresence();   // Dar HUM diário se aplicável
})();

// Atualiza status regularmente
setInterval(syncStatus, 30000);
