import { useState } from "react";

// ─── CONFIG ──────────────────────────────────────────────
const CONTRACT = "0xD2AD10F14F698Abed61fC4F372F25b9443aAf77A";
const WALLET   = "0xeb350f1692b16c8b7b02c66dedb76d018f6a9662";
const RPC      = "https://studio.genlayer.com/api";

// ─── RPC HELPERS ─────────────────────────────────────────
async function sendTx(method, params) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "eth_sendTransaction",
      params: [{ from: WALLET, to: CONTRACT, data: JSON.stringify({ method, params }) }],
    }),
  });
  const data = await res.json();
  return data.result || null;
}

async function callView(method, params = []) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "eth_call",
      params: [{ to: CONTRACT, data: JSON.stringify({ method, params }) }, "latest"],
    }),
  });
  const data = await res.json();
  try { return JSON.parse(data.result); } catch { return null; }
}

async function waitTx(hash, timeout = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await sleep(3000);
    try {
      const res = await fetch(RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1,
          method: "eth_getTransactionReceipt",
          params: [hash],
        }),
      });
      const data = await res.json();
      if (data.result?.status === "0x1") return true;
    } catch {}
  }
  return false;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── VERDICT CONFIG ───────────────────────────────────────
const VERDICTS = {
  definitely_human: { label: "Definitely Human", emoji: "✅", color: "#00e676", bar: "#00e676" },
  likely_human:     { label: "Likely Human",     emoji: "🟢", color: "#69f0ae", bar: "#69f0ae" },
  suspicious:       { label: "Suspicious",       emoji: "🟡", color: "#ffee58", bar: "#ffee58" },
  likely_bot:       { label: "Likely Bot",       emoji: "🔴", color: "#ff7043", bar: "#ff7043" },
  definitely_bot:   { label: "Definitely Bot",   emoji: "🚨", color: "#f44336", bar: "#f44336" },
};

function getScoreColor(score) {
  if (score <= 25) return "#00e676";
  if (score <= 50) return "#69f0ae";
  if (score <= 65) return "#ffee58";
  if (score <= 80) return "#ff7043";
  return "#f44336";
}

// ─── COMPONENTS ───────────────────────────────────────────
function ScoreRing({ score }) {
  const color = getScoreColor(score);
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 110, height: 110 }}>
      <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="55" cy="55" r={r} fill="none" stroke="#1a1a1a" strokeWidth="8" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease", strokeLinecap: "round" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontWeight: 900, color, fontFamily: "monospace" }}>{score}</span>
        <span style={{ fontSize: 9, color: "#555", fontFamily: "monospace", letterSpacing: 1 }}>BOT SCORE</span>
      </div>
    </div>
  );
}

function Tag({ text, type }) {
  const isRed = type === "red";
  return (
    <span style={{
      display: "inline-block", fontSize: 11, padding: "3px 10px", borderRadius: 3, margin: "3px 3px 3px 0",
      background: isRed ? "#2a0a0a" : "#0a2a15",
      color: isRed ? "#ff7043" : "#69f0ae",
      border: `1px solid ${isRed ? "#ff704322" : "#69f0ae22"}`,
      fontFamily: "monospace",
    }}>
      {isRed ? "⚠ " : "✓ "}{text}
    </span>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────
export default function App() {
  const [input, setInput]     = useState("");
  const [status, setStatus]   = useState("idle"); // idle | loading | done | error
  const [step, setStep]       = useState("");
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");

  async function handleAnalyze() {
    const val = input.trim();
    if (!val) return;

    setStatus("loading");
    setResult(null);
    setError("");

    try {
      setStep("Submitting to GenLayer blockchain...");
      const txHash = await sendTx("analyze", [val]);

      if (!txHash) throw new Error("Transaction failed to submit");

      setStep("Waiting for AI consensus (Optimistic Democracy)...");
      const confirmed = await waitTx(txHash, 90000);
      if (!confirmed) throw new Error("Transaction timed out");

      setStep("Fetching AI verdict...");
      await sleep(1000);
      const data = await callView("get_last_result");

      if (!data || data.error) throw new Error("Could not fetch result");

      setResult(data);
      setStatus("done");
      setStep("");
    } catch (err) {
      setError(err.message || "Something went wrong");
      setStatus("error");
      setStep("");
    }
  }

  function handleReset() {
    setInput("");
    setStatus("idle");
    setResult(null);
    setError("");
    setStep("");
  }

  const verdictCfg = result ? (VERDICTS[result.verdict] || VERDICTS.suspicious) : null;

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>
          <span style={{ color: "#00e676" }}>X</span>
          <span style={{ color: "#eee" }}>Account</span>
          <span style={{ color: "#555" }}>Analyzer</span>
        </div>
        <div style={{ fontSize: 10, color: "#333", fontFamily: "monospace", marginTop: 4, letterSpacing: 2 }}>
          POWERED BY GENLAYER AI · BRADBURY TESTNET
        </div>
      </div>

      <div style={s.body}>
        {/* Input */}
        {status !== "done" && (
          <div style={s.card}>
            <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", marginBottom: 10, letterSpacing: 1 }}>
              ENTER X ACCOUNT
            </div>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && status === "idle" && handleAnalyze()}
              placeholder="https://x.com/username  or  @username"
              disabled={status === "loading"}
              style={s.input}
            />
            <button
              onClick={handleAnalyze}
              disabled={status === "loading" || !input.trim()}
              style={{ ...s.btn, opacity: (!input.trim() || status === "loading") ? 0.4 : 1 }}
            >
              {status === "loading" ? "ANALYZING..." : "ANALYZE →"}
            </button>
          </div>
        )}

        {/* Loading */}
        {status === "loading" && (
          <div style={s.card}>
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={s.spinner} />
              <div style={{ fontFamily: "monospace", color: "#00e676", fontSize: 12, marginTop: 16 }}>
                {step}
              </div>
              <div style={{ fontFamily: "monospace", color: "#333", fontSize: 10, marginTop: 8 }}>
                This may take 30–60 seconds
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div style={{ ...s.card, border: "1px solid #ff704333" }}>
            <div style={{ fontFamily: "monospace", color: "#ff7043", fontSize: 12, marginBottom: 12 }}>
              ⚠ {error}
            </div>
            <button onClick={handleReset} style={s.btnOutline}>TRY AGAIN</button>
          </div>
        )}

        {/* Result */}
        {status === "done" && result && (
          <>
            {/* Score card */}
            <div style={{ ...s.card, border: `1px solid ${verdictCfg.color}22` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <ScoreRing score={result.bot_score || 0} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "#555", marginBottom: 4 }}>
                    @{result.username}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: verdictCfg.color, fontFamily: "monospace" }}>
                    {verdictCfg.emoji} {verdictCfg.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", marginTop: 6 }}>
                    Est. bot followers: <span style={{ color: "#aaa" }}>{result.bot_follower_estimate || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={s.card}>
              <div style={s.sectionLabel}>ACCOUNT STATS</div>
              <div style={s.grid}>
                {[
                  ["Followers",   result.followers],
                  ["Following",   result.following],
                  ["Ratio",       result.follower_ratio],
                  ["Account Age", result.account_age],
                  ["Engagement",  result.engagement_quality],
                  ["Confidence",  result.confidence || "—"],
                ].map(([label, val]) => (
                  <div key={label} style={s.statBox}>
                    <div style={{ fontSize: 9, color: "#444", fontFamily: "monospace", marginBottom: 3, letterSpacing: 1 }}>{label}</div>
                    <div style={{ fontSize: 13, color: "#ddd", fontFamily: "monospace" }}>{val || "N/A"}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Red flags */}
            {result.red_flags?.length > 0 && (
              <div style={s.card}>
                <div style={s.sectionLabel}>RED FLAGS</div>
                <div>{result.red_flags.map((f, i) => <Tag key={i} text={f} type="red" />)}</div>
              </div>
            )}

            {/* Green flags */}
            {result.green_flags?.length > 0 && (
              <div style={s.card}>
                <div style={s.sectionLabel}>GREEN FLAGS</div>
                <div>{result.green_flags.map((f, i) => <Tag key={i} text={f} type="green" />)}</div>
              </div>
            )}

            {/* AI Reason */}
            {result.reason && (
              <div style={s.card}>
                <div style={s.sectionLabel}>AI ANALYSIS</div>
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.7, fontStyle: "italic" }}>
                  "{result.reason}"
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ ...s.card, background: "transparent", border: "1px solid #111", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#333", fontFamily: "monospace", lineHeight: 1.8 }}>
                🤖 Analysis by GenLayer Intelligent Contract<br />
                ⛓ Optimistic Democracy Consensus · Bradbury Testnet<br />
                📄 {CONTRACT.slice(0, 10)}...{CONTRACT.slice(-6)}
              </div>
            </div>

            <button onClick={handleReset} style={{ ...s.btn, marginTop: 4 }}>
              ANALYZE ANOTHER →
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #333; }
        input:focus { outline: none; border-color: #00e676 !important; }
        button:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    minHeight: "100vh",
    background: "#080808",
    color: "#eee",
    maxWidth: 480,
    margin: "0 auto",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    padding: "28px 20px 20px",
    borderBottom: "1px solid #111",
    textAlign: "center",
  },
  logo: {
    fontSize: 28,
    fontWeight: 900,
    fontFamily: "monospace",
    letterSpacing: -1,
  },
  body: {
    padding: "16px 16px 40px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  card: {
    background: "#0d0d0d",
    border: "1px solid #1a1a1a",
    borderRadius: 10,
    padding: 16,
  },
  input: {
    width: "100%",
    background: "#111",
    border: "1px solid #222",
    borderRadius: 6,
    padding: "12px 14px",
    color: "#eee",
    fontSize: 13,
    fontFamily: "monospace",
    marginBottom: 10,
    boxSizing: "border-box",
  },
  btn: {
    width: "100%",
    padding: "13px",
    background: "#00e676",
    color: "#000",
    border: "none",
    borderRadius: 6,
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 2,
    transition: "opacity 0.2s",
  },
  btnOutline: {
    width: "100%",
    padding: "12px",
    background: "transparent",
    color: "#555",
    border: "1px solid #222",
    borderRadius: 6,
    fontFamily: "monospace",
    fontSize: 13,
    cursor: "pointer",
    letterSpacing: 2,
  },
  sectionLabel: {
    fontSize: 9,
    color: "#444",
    fontFamily: "monospace",
    letterSpacing: 2,
    marginBottom: 10,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
  },
  statBox: {
    background: "#111",
    borderRadius: 6,
    padding: "8px 10px",
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid #1a1a1a",
    borderTop: "3px solid #00e676",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto",
  },
};
