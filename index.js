const express = require("express");
const fetch = require("node-fetch");
const https = require("https");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const WORKER_ID = process.env.WORKER || "webcon_001";
const SERVER_URL = "https://dienlanhquangphat.vn/toolvip";
const agent = new https.Agent({ rejectUnauthorized: false });

// ===== Cấu hình chính =====
const WSOL = "So11111111111111111111111111111111111111112";
const DELAY_MS = 2400;
const ROUND_DELAY_MS = 500;
const BATCH_SIZE = 5;
const AMOUNT = 100_000_000;

let rpcUrls = [];

// ===== Đọc danh sách RPC từ apikeys.txt =====
function loadRpcUrls() {
  try {
    const raw = fs.readFileSync("apikeys.txt", "utf-8");
    rpcUrls = raw.trim().split("\n").filter(Boolean);
    if (rpcUrls.length === 0) throw new Error("Không có RPC nào trong file.");
  } catch (e) {
    console.error("❌ Không thể đọc apikeys.txt:", e.message);
    process.exit(1);
  }
}

// ===== Hàm delay =====
const delay = ms => new Promise(res => setTimeout(res, ms));

// ===== Gọi RPC JSON =====
async function callRpc(rpcUrl, method, params) {
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    return await res.json();
  } catch {
    return null;
  }
}

// ===== Lấy giá token qua QuickNode RPC =====
async function getTokenPriceViaQuickNode(mint, rpcUrl) {
  try {
    const largest = await callRpc(rpcUrl, "getTokenLargestAccounts", [mint]);
    const acc = largest?.result?.value?.[0];
    if (!acc) return null;

    const tokenAcc = acc.address;
    const accInfo = await callRpc(rpcUrl, "getAccountInfo", [tokenAcc, { encoding: "jsonParsed" }]);
    const parsed = accInfo?.result?.value?.data?.parsed?.info;
    const owner = parsed?.owner;
    const tokenAmount = parseFloat(parsed?.tokenAmount?.uiAmount || "0");
    if (!owner || tokenAmount === 0) return null;

    const wsolInfo = await callRpc(rpcUrl, "getTokenAccountsByOwner", [
      owner,
      { mint: WSOL },
      { encoding: "jsonParsed" },
    ]);
    const wsolAmount = parseFloat(
      wsolInfo?.result?.value?.[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || "0"
    );

    if (wsolAmount > 0 && tokenAmount > 0) {
      return { value: +(wsolAmount / tokenAmount).toFixed(9), source: "QuickNode" };
    }
  } catch {}
  return null;
}

// ===== Bọc timeout =====
async function getTokenPriceWithTimeout(mint, timeout = 5000) {
  const rpc = rpcUrls[Math.floor(Math.random() * rpcUrls.length)];
  return Promise.race([
    getTokenPriceViaQuickNode(mint, rpc),
    new Promise(resolve => setTimeout(() => resolve(null), timeout))
  ]);
}

// ===== Gọi token từ server =====
async function assignBatchTokens(batchSize) {
  try {
    const res = await fetch(`${SERVER_URL}/assign-token.php?worker=${WORKER_ID}&count=${batchSize}`, { agent });
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && data.mint) return [data];
    return [];
  } catch (err) {
    console.error("❌ Gọi assign-token thất bại:", err.message);
    return [];
  }
}

// ===== Gửi kết quả về server =====
async function sendResults(results) {
  if (!results.length) return;
  try {
    await fetch(`${SERVER_URL}/update-token.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(results),
      agent,
    });
    console.log(`🚀 Gửi ${results.length} token thành công`);
  } catch (err) {
    console.error("❌ Gửi dữ liệu thất bại:", err.message);
  }
}

// ===== Quét từng vòng =====
async function scanRound(round) {
  console.log(`🔁 Round ${round}`);
  const scanTime = new Date().toLocaleTimeString("vi-VN", { hour12: false });
  const tokens = await assignBatchTokens(BATCH_SIZE);

  if (!tokens.length) {
    console.log("⏳ Không có token nào đang pending...");
    return;
  }

  const results = [];
  const start = Date.now();

  for (const token of tokens) {
    const price = await getTokenPriceWithTimeout(token.mint);
    if (price) {
      console.log(`✅ [${token.mint}] Giá: ${price.value} (${price.source})`);
      results.push({
        mint: token.mint,
        index: token.index ?? undefined,
        currentPrice: price.value,
        scanTime
      });
    } else {
      console.log(`❌ [${token.mint}] Lỗi hoặc không có pool`);
    }

    if (Date.now() - start > 25000 && results.length > 0) {
      console.log(`⚠️ Gửi sớm để tránh timeout`);
      await sendResults(results);
      results.length = 0;
    }

    await delay(DELAY_MS);
  }

  if (results.length > 0) {
    await sendResults(results);
  }
}

// ===== Khởi chạy Express + Loop =====
app.get("/", (req, res) => {
  res.send(`✅ WebCon [${WORKER_ID}] đang chạy`);
});

app.listen(PORT, () => {
  console.log(`✅ Worker ${WORKER_ID} chạy tại http://localhost:${PORT}`);
  loadRpcUrls();

  let round = 1;
  (async function loop() {
    while (true) {
      await scanRound(round++);
      await delay(ROUND_DELAY_MS);
    }
  })();
});
