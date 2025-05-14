import fetch from "node-fetch";

const WSOL = "So11111111111111111111111111111111111111112";
const CONCURRENCY = 1;
const DELAY_MS = 2300;
const ROUND_DELAY_MS = 5000;
const AMOUNT = 100_000_000;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getTokenPrice(mint) {
  let jupiterPrice = null;
  let jupiterOutAmount = 0;
  let raydiumPrice = null;
  let raydiumWsolAmount = 0;

  try {
    const quoteRes = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${mint}&outputMint=${WSOL}&amount=${AMOUNT}&slippageBps=300`);
    const quote = await quoteRes.json();
    if (quote.outAmount) {
      const outAmount = parseFloat(quote.outAmount) / 1_000_000_000;
      const pricePerToken = outAmount / (AMOUNT / 1_000_000_000);
      let displayPrice = pricePerToken.toFixed(10);
      if (displayPrice.startsWith("0.")) displayPrice = "0.000" + displayPrice.slice(2);
      displayPrice = parseFloat(displayPrice).toFixed(9);
      jupiterOutAmount = outAmount;
      jupiterPrice = { source: "Jupiter", value: parseFloat(displayPrice) };
    }
  } catch (err) {
    console.warn(`Jupiter lỗi cho ${mint}`, err.message);
  }

  try {
    const rayCheck = await fetch(`https://api-v3.raydium.io/mint/ids?mints=${mint}`);
    const rayData = await rayCheck.json();
    if (rayData.length > 0) {
      const pairsRes = await fetch("https://api-v3.raydium.io/pairs");
      const pairs = await pairsRes.json();
      const pool = pairs.find(p => p.baseMint === mint || p.quoteMint === mint);
      if (pool && pool.price && pool.quoteMint === WSOL) {
        raydiumWsolAmount = parseFloat(pool.quoteReserve || 0);
        const rayPrice = parseFloat(pool.price);
        raydiumPrice = { source: "Raydium", value: parseFloat(rayPrice.toFixed(10)) };
      }
    }
  } catch (err) {
    console.warn(`Raydium lỗi cho ${mint}`, err.message);
  }

  let final = null;

  if (jupiterPrice && raydiumPrice) {
    final = raydiumWsolAmount > jupiterOutAmount ? raydiumPrice : jupiterPrice;
  } else {
    final = jupiterPrice || raydiumPrice || null;
  }

  return final;
}

async function scanRound(round) {
  console.log(`🔁 Vòng ${round} bắt đầu...`);
  try {
    const res = await fetch("https://test.pumpvote.com/api/token-metadata2");
    const data = await res.json();
    const mints = data.map(x => x.mint).filter(Boolean);
    const total = mints.length;
    let count = 0;

    const mintQueue = [...mints];

    async function worker() {
      while (mintQueue.length > 0) {
        const mint = mintQueue.shift();
        const priceData = await getTokenPrice(mint);
        const timestamp = new Date().toISOString();
        count++;

        if (priceData) {
          console.log(`✅ ${mint}: ${priceData.value} WSOL (${priceData.source})`);
          await fetch("https://test.pumpvote.com/api/add-token-metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mint, currentPrice: priceData.value, lastUpdated: timestamp })
          });
        } else {
          console.log(`❌ ${mint}: Không có giá`);
        }

        await delay(DELAY_MS);
      }
    }

    const workers = Array(CONCURRENCY).fill().map(() => worker());
    await Promise.all(workers);

    console.log(`✅ Vòng ${round} hoàn tất (${count}/${total})`);
  } catch (err) {
    console.error("❌ Lỗi scan round:", err.message);
  }
}

(async () => {
  let round = 1;
  while (true) {
    await scanRound(round++);
    await delay(ROUND_DELAY_MS);
  }
})();
