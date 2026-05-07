# X Account Analyzer

A Web3 tool powered by **GenLayer Intelligent Contracts** that analyzes any X (Twitter) account to detect bot activity and fake followers.

## How It Works

1. Paste any X account URL or username
2. GenLayer AI fetches the profile via Nitter mirrors
3. Optimistic Democracy consensus judges the result
4. Returns a **Bot Score (0–100)** with full breakdown

## Output

- ✅ Bot Score & Verdict
- 📊 Followers, Following, Account Age, Engagement Quality
- ⚠️ Red Flags & Green Flags
- 🤖 AI Analysis Reasoning
- 📉 Estimated % of Bot Followers

## Tech Stack

- **Frontend**: React → deployed on Vercel
- **Smart Contract**: GenLayer Intelligent Contract (Python)
- **Network**: Bradbury Testnet
- **AI**: Optimistic Democracy Consensus + Nitter mirrors

## Contract

```
Network:  Bradbury Testnet
Address:  0xD2AD10F14F698Abed61fC4F372F25b9443aAf77A
```

## Live Demo

[x-account-analyzer.vercel.app](https://x-account-analyzer.vercel.app)

---

Built for **GenLayer Community Contributions** · [portal.genlayer.foundation](https://portal.genlayer.foundation)
