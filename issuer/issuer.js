import fs from "fs";
import path from "path";
import os from "os";
import process from "process";
import { performance } from "perf_hooks";
import { fileURLToPath } from "url";
import { Barretenberg } from "@aztec/bb.js";
import { ethers } from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = "../db_large_10000.json";
const TARGET_ADDRESS = import.meta.env.VITE_ADDRESS.toLowerCase();
const DEPTH = 17;
const TREE_SIZE = Math.pow(2, DEPTH);
const TARGET_BIRTH_DATE = 19980515;

function hexToUint8Array(hexStr) {
  let cleanHex = typeof hexStr === "string" ? hexStr.replace(/^0x/i, "") : "";
  cleanHex = cleanHex.padStart(64, "0");
  return new Uint8Array(Buffer.from(cleanHex, "hex"));
}

function bufferToHex(buffer) {
  return "0x" + Buffer.from(buffer).toString("hex").padStart(64, "0");
}

function parseHashResult(res) {
  const inner = (res && res.hash !== undefined) ? res.hash : res;
  if (inner instanceof Uint8Array) return inner;
  if (Buffer.isBuffer(inner)) return new Uint8Array(inner);
  if (inner && typeof inner.toBuffer === "function") return new Uint8Array(inner.toBuffer());

  let str = typeof inner === "string" ? inner : JSON.stringify(inner);
  let cleanHex = str.replace(/^0x/i, "").padStart(64, "0");
  return new Uint8Array(Buffer.from(cleanHex, "hex"));
}

function getMemoryUsageMB() {
  const mem = process.memoryUsage();
  return {
    rss: (mem.rss / 1024 / 1024).toFixed(2),
    heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2),
    heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2),
    external: (mem.external / 1024 / 1024).toFixed(2),
  };
}


function getCPUUsage(startUsage, startTime, singleCore = false) {
  const elapsedUsage = process.cpuUsage(startUsage);
  const elapsedTimeMs = performance.now() - startTime;

  const userCPUTimeMs = elapsedUsage.user / 1000;
  const systemCPUTimeMs = elapsedUsage.system / 1000;

  const divisor = singleCore
    ? elapsedTimeMs                       
    : elapsedTimeMs * os.cpus().length;    

  const cpuPercent = ((userCPUTimeMs + systemCPUTimeMs) / divisor) * 100;

  return {
    userCPUTimeMs: userCPUTimeMs.toFixed(2),
    systemCPUTimeMs: systemCPUTimeMs.toFixed(2),
    cpuPercent: cpuPercent.toFixed(2),
  };
}

function printSectionMetrics(name, startTime, startCPU, singleCore = false) {
  const endTime = performance.now();
  const durationMs = endTime - startTime;

  const cpu = getCPUUsage(startCPU, startTime, singleCore);
  const mem = getMemoryUsageMB();

  console.log(`\n========== ${name} ==========`);
  console.log(`Time: ${(durationMs / 1000).toFixed(2)} s`);
  console.log(`RAM Usage (snapshot at section end):
  RSS:        ${mem.rss} MB
  Heap Total: ${mem.heapTotal} MB
  Heap Used:  ${mem.heapUsed} MB
  External:   ${mem.external} MB
  `);
  console.log(`⚙️ CPU Usage (${singleCore ? "single-core" : "system-wide"}):
  User CPU:        ${cpu.userCPUTimeMs} ms
  System CPU:      ${cpu.systemCPUTimeMs} ms
  CPU Utilization: ${cpu.cpuPercent} %
  `);

  return { durationMs, memory: mem, cpu };
}

async function main() {
  const globalStart = performance.now();
  const globalCPU = process.cpuUsage();


  const bb = await Barretenberg.new();

  const dbPath = path.join(__dirname, DB_FILE);
  const db = JSON.parse(fs.readFileSync(dbPath));
  const addresses = db.addresses.map(a => a.toLowerCase());

  const targetIndex = addresses.indexOf(TARGET_ADDRESS);
  if (targetIndex === -1) throw new Error("Adres nie istnieje w DB!");

  while (addresses.length < TREE_SIZE) {
    addresses.push("0x0");
  }


  const hashStart = performance.now();
  const hashCPU = process.cpuUsage();

  const leavesHashed = [];

  for (let i = 0; i < addresses.length; i++) {
    const addrBytes = hexToUint8Array(addresses[i]);
    let birthDateValue = 0;
    if (addresses[i] !== "0x0") {
      birthDateValue = (i === targetIndex) ? TARGET_BIRTH_DATE : 19900101;
    }
    const dateHex = birthDateValue.toString(16).padStart(64, "0");
    const dateBytes = new Uint8Array(Buffer.from(dateHex, "hex"));

    const hashResult = await bb.pedersenHash({
      inputs: [addrBytes, dateBytes],
      hashIndex: 0
    });
    leavesHashed.push(parseHashResult(hashResult));
  }

  printSectionMetrics("LEAF HASHING", hashStart, hashCPU);


  const treeStart = performance.now();
  const treeCPU = process.cpuUsage();

  let currentLevel = leavesHashed;
  const tree = [currentLevel];

  for (let i = 0; i < DEPTH; i++) {
    const nextLevel = [];
    for (let j = 0; j < currentLevel.length; j += 2) {
      const left = currentLevel[j];
      const right = currentLevel[j + 1];
      const hashResult = await bb.pedersenHash({ inputs: [left, right], hashIndex: 0 });
      nextLevel.push(parseHashResult(hashResult));
    }
    currentLevel = nextLevel;
    tree.push(currentLevel);
  }

  const merkleRoot = tree[DEPTH][0];
  printSectionMetrics("MERKLE TREE CONSTRUCTION", treeStart, treeCPU);

 
  const proofStart = performance.now();
  const proofCPU = process.cpuUsage();

  const merkleProof = [];
  let currentIndex = targetIndex;
  for (let level = 0; level < DEPTH; level++) {
    const isRightNode = currentIndex % 2 !== 0;
    const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;
    merkleProof.push(tree[level][siblingIndex]);
    currentIndex = Math.floor(currentIndex / 2);
  }


  const proofMetrics = printSectionMetrics("MERKLE PROOF GENERATION", proofStart, proofCPU);
  console.log(`Proof path length: ${merkleProof.length} nodes`);

  const signStart = performance.now();
  const signCPU = process.cpuUsage();

  const issuerWallet = ethers.Wallet.createRandom();
  const messageHash = ethers.solidityPackedKeccak256(
    ["address", "uint256"],
    [TARGET_ADDRESS, TARGET_BIRTH_DATE]
  );
  const signature = await issuerWallet.signMessage(ethers.getBytes(messageHash));

  const signMetrics = printSectionMetrics("SIGNATURE GENERATION", signStart, signCPU);
  console.log(`Issuer address: ${issuerWallet.address}`);

  const credentialJson = {
    issuerAddress: issuerWallet.address,
    userAddress: TARGET_ADDRESS,
    birthDate: TARGET_BIRTH_DATE,
    index: targetIndex,
    merkleRoot: bufferToHex(merkleRoot),
    merkleProof: merkleProof.map(p => bufferToHex(p)),
    signature: signature
  };

  const fileName = path.basename(DB_FILE);
  const outPath = path.join(__dirname, `../../credential_final_${fileName}`);
  fs.writeFileSync(outPath, JSON.stringify(credentialJson, null, 2));
  console.log(`\nCredential zapisany do: ${outPath}`);


  const globalMetrics = printSectionMetrics("TOTAL EXECUTION", globalStart, globalCPU);


  console.log("\n========== TIMING SUMMARY ==========");
  console.log(`${"Section".padEnd(35)} ${"Time (s)".padStart(10)}`);
  console.log("-".repeat(47));
  [
    ["Leaf Hashing",              proofMetrics],  
    ["Merkle Proof Generation",   proofMetrics],
    ["Signature Generation",      signMetrics],
    ["Total",                     globalMetrics],
  ].forEach(([label, m]) => {
    if (m) console.log(`${label.padEnd(35)} ${(m.durationMs / 1000).toFixed(2).padStart(10)} s`);
  });

  await bb.destroy();
}

main().catch(console.error);