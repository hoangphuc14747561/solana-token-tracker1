const express = require("express");
const fetch = require("node-fetch");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 3000;
const WORKER_ID = process.env.WORKER || "webcon_001";
const SERVER_URL = "https://dienlanhquangphat.vn/toolvip";

const agent = new https.Agent({ rejectUnauthorized: false });

const WSOL = "So11111111111111111111111111111111111111112";
const AMOUNT = 100_000_000;
const DELAY_MS = 2400;
const ROUND_DELAY_MS = 500;
const BATCH_SIZE = 5;

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function getLocalTime() {
  return new Date().toLocaleTimeString("vi-VN", { hour12: false });
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

// ✅ Gọi 1 lần lấy nhiều token
async function assignBatchTokens(batchSize) {
  try {
    const res = await fetch(`${SERVER_URL}/assign-token.php?worker=${WORKER_ID}&count=${batchSize}`, { agent });
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && data.mint) return [data]; // fallback nếu trả về 1 token
    return [];
  } catch (err) {
    console.error("❌ Lỗi khi gọi assign-token.php:", err.message);
    return [];
  }
}

async function scanRound(round) {
  try {
    const rayPairs = await getRaydiumPairs();
    const scanTime = getLocalTime();
    const tokens = await assignBatchTokens(BATCH_SIZE);

    if (tokens.length === 0) {
      console.log("⏳ Không có token nào pending...");
      return;
    }

    const results = [];

    for (const token of tokens) {
      const price = await getTokenPrice(token.mint, rayPairs);
      if (price) {
        console.log(`✅ [${token.mint}] Giá: ${price.value} (${price.source})`);
        results.push({
          mint: token.mint,
          currentPrice: price.value,
          scanTime: scanTime
        });
      } else {
        console.log(`❌ Không lấy được giá cho ${token.mint}`);
      }
      await delay(DELAY_MS);
    }

    if (results.length > 0) {
      await fetch(`${SERVER_URL}/const express = require("express");
const fetch = require("node-fetch");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 3000;
const WORKER_ID = process.env.WORKER || "webcon_001";
const SERVER_URL = "https://dienlanhquangphat.vn/toolvip";

const agent = new https.Agent({ rejectUnauthorized: false });

const WSOL = "So11111111111111111111111111111111111111112";
const AMOUNT = 100_000_000;
const DELAY_MS = 2400;
const ROUND_DELAY_MS = 500;
const BATCH_SIZE = 5;

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function getLocalTime() {
  return new Date().toLocaleTimeString("vi-VN", { hour12: false });
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

// ✅ Gọi 1 lần lấy nhiều token
async function assignBatchTokens(batchSize) {
  try {
    const res = await fetch(`${SERVER_URL}/assign-token.php?worker=${WORKER_ID}&count=${batchSize}`, { agent });
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && data.mint) return [data]; // fallback nếu trả về 1 token
    return [];
  } catch (err) {
    console.error("❌ Lỗi khi gọi assign-token.php:", err.message);
    return [];
  }
}

async function scanRound(round) {
  try {
    const rayPairs = await getRaydiumPairs();
    const scanTime = getLocalTime();
    const tokens = await assignBatchTokens(BATCH_SIZE);

    if (tokens.length === 0) {
      console.log("⏳ Không có token nào pending...");
      return;
    }

    const results = [];

    for (const token of tokens) {
      const price = await getTokenPrice(token.mint, rayPairs);
      if (price) {
        console.log(`✅ [${token.mint}] Giá: ${price.value} (${price.source})`);
        results.push({
          mint: token.mint,
          currentPrice: price.value,
          scanTime: scanTime
        });
      } else {
        console.log(`❌ Không lấy được giá cho ${token.mint}`);
      }
      await delay(DELAY_MS);
    }

    if (results.length > 0) {
      await fetch(`${SERVER_URL}/const express = require("express");
const fetch = require("node-fetch");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 3000;
const WORKER_ID = process.env.WORKER || "webcon_001";
const SERVER_URL = "https://dienlanhquangphat.vn/toolvip";

const agent = new https.Agent({ rejectUnauthorized: false });

const WSOL = "So11111111111111111111111111111111111111112";
const AMOUNT = 100_000_000;
const DELAY_MS = 2400;
const ROUND_DELAY_MS = 500;
const BATCH_SIZE = 5;

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function getLocalTime() {
  return new Date().toLocaleTimeString("vi-VN", { hour12: false });
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

// ✅ Gọi 1 lần lấy nhiều token
async function assignBatchTokens(batchSize) {
  try {
    const res = await fetch(`${SERVER_URL}/assign-token.php?worker=${WORKER_ID}&count=${batchSize}`, { agent });
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && data.mint) return [data]; // fallback nếu trả về 1 token
    return [];
  } catch (err) {
    console.error("❌ Lỗi khi gọi assign-token.php:", err.message);
    return [];
  }
}

async function scanRound(round) {
  try {
    const rayPairs = await getRaydiumPairs();
    const scanTime = getLocalTime();
    const tokens = await assignBatchTokens(BATCH_SIZE);

    if (tokens.length === 0) {
      console.log("⏳ Không có token nào pending...");
      return;
    }

    const results = [];

    for (const token of tokens) {
      const price = await getTokenPrice(token.mint, rayPairs);
      if (price) {
        console.log(`✅ [${token.mint}] Giá: ${price.value} (${price.source})`);
        results.push({
          mint: token.mint,
          currentPrice: price.value,
          scanTime: scanTime
        });
      } else {
        console.log(`❌ Không lấy được giá cho ${token.mint}`);
      }
      await delay(DELAY_MS);
    }

    if (results.length > 0) {
      await fetch(`${SERVER_URL}/update-wallet.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(results),
        agent
      });
    }
  } catch (err) {
    console.error("❌ Scan error:", err.message);
  }
}

app.get("/", (req, res) => {
  res.send(`✅ WebCon [${WORKER_ID}] đang chạy.`);
});

app.listen(PORT, () => {
  console.log(`✅ WebCon (worker=${WORKER_ID}) listening on port ${PORT}`);
  let round = 1;
  (async function loop() {
    while (true) {
      console.log(`🔁 Round ${round++}`);
      await scanRound(round);
      await delay(ROUND_DELAY_MS);
    }
  })();
});`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(results),
        agent
      });
    }
  } catch (err) {
    console.error("❌ Scan error:", err.message);
  }
}

app.get("/", (req, res) => {
  res.send(`✅ WebCon [${WORKER_ID}] đang chạy.`);
});

app.listen(PORT, () => {
  console.log(`✅ WebCon (worker=${WORKER_ID}) listening on port ${PORT}`);
  let round = 1;
  (async function loop() {
    while (true) {
      console.log(`🔁 Round ${round++}`);
      await scanRound(round);
      await delay(ROUND_DELAY_MS);
    }
  })();
});`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(results),
        agent
      });
    }
  } catch (err) {
    console.error("❌ Scan error:", err.message);
  }
}

app.get("/", (req, res) => {
  res.send(`✅ WebCon [${WORKER_ID}] đang chạy.`);
});

app.listen(PORT, () => {
  console.log(`✅ WebCon (worker=${WORKER_ID}) listening on port ${PORT}`);
  let round = 1;
  (async function loop() {
    while (true) {
      console.log(`🔁 Round ${round++}`);
      await scanRound(round);
      await delay(ROUND_DELAY_MS);
    }
  })();
});
