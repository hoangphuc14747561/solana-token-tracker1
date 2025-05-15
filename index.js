import fetch from "node-fetch";
import https from "https";

const agent = new https.Agent({ rejectUnauthorized: false });

const WSOL = "So11111111111111111111111111111111111111112";
const DELAY_MS = 2400;
const ROUND_DELAY_MS = 5000;
const AMOUNT = 100_000_000;

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function getRaydiumPairs() {
  try {
    const res = await fetch("https://api-v3.raydium.io/pairs");
    return await res.json();
  } catch {
    return [];
  }
}

async function getTokenPrice(mint, rayPairs) {
  let jupiter = null, raydium = null;

  try {
    const q = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${mint}&outputMint=${WSOL}&amount=${AMOUNT}&slippageBps=300`);
    const data = await q.json();
    if (data.outAmount) {
      const price = parseFloat(data.outAmount) / AMOUNT;
      jupiter = { value: +price.toFixed(9), source: "Jupiter" };
    }
  } catch {}

  try {
    const check = await fetch(`https://api-v3.raydium.io/mint/ids?mints=${mint}`);
    const valid = await check.json();
    if (valid.length > 0) {
      const p = rayPairs.find(p => p.baseMint === mint || p.quoteMint === mint);
      if (p && p.price && p.quoteMint === WSOL) {
        raydium = { value: +parseFloat(p.price).toFixed(9), source: "Raydium" };
      }
    }
  } catch {}

  if (jupiter && raydium) return raydium.value > jupiter.value ? raydium : jupiter;
  return jupiter || raydium || null;
}

async function scanRound(round) {
  try {
    const tokenRes = await fetch("https://test.pumpvote.com/api/token-metadata2", { agent });
    const tokens = await tokenRes.json();
    const mints = tokens.map(t => t.mint).filter(Boolean);
    const rayPairs = await getRaydiumPairs();

    for (const mint of mints) {
      const price = await getTokenPrice(mint, rayPairs);
      if (price) {
        await fetch("https://test.pumpvote.com/api/add-token-metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mint,
            currentPrice: price.value,
            lastUpdated: new Date().toISOString()
          }),
          agent
        });
      }
      await delay(DELAY_MS);
    }
  } catch (err) {
    // Không log lỗi luôn nếu muốn ẩn toàn bộ
  }
}

(async () => {
  let round = 1;
  while (true) {
    await scanRound(round++);
    await delay(ROUND_DELAY_MS);
  }
})();
