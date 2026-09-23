import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { ethers } from 'ethers';

function getMemoryUsageMB() {
  if (!performance.memory) return null;

  return {
    usedJSHeapSize: (
      performance.memory.usedJSHeapSize / 1024 / 1024
    ).toFixed(2),

    totalJSHeapSize: (
      performance.memory.totalJSHeapSize / 1024 / 1024
    ).toFixed(2),

    jsHeapSizeLimit: (
      performance.memory.jsHeapSizeLimit / 1024 / 1024
    ).toFixed(2)
  };
}

async function measureSection(name, fn) {
  console.log(`\n========== ${name} ==========`);

  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;

  const memory = getMemoryUsageMB();

  console.log(`⏱ Time: ${(duration / 1000).toFixed(2)} s`);

  if (memory) {
    console.log(`🧠 RAM:
    Used Heap:  ${memory.usedJSHeapSize} MB
    Total Heap: ${memory.totalJSHeapSize} MB
    Heap Limit: ${memory.jsHeapSizeLimit} MB
    `);
  } else {
    console.log(`🧠 RAM: unavailable (non-Chromium browser)`);
  }

  return {
    result,
    metrics: { durationMs: duration, memory }
  };
}

export const runZKProcess = async (
  circuitData,
  inputs,
  managerAddress
) => {
  try {

    const globalStart = performance.now();


    const backendInit = await measureSection(
      "BACKEND INITIALIZATION",
      async () => {
        const backend = new BarretenbergBackend(
          circuitData,
          { threads: 1 }
        );
        const noir = new Noir(circuitData, backend);
        return { backend, noir };
      }
    );

    const backend = backendInit.result.backend;
    const noir = backendInit.result.noir;


    const witnessExec = await measureSection(
      "WITNESS GENERATION",
      async () => {
        return await noir.execute(inputs);
      }
    );

    const witness = witnessExec.result.witness;


    const proofExec = await measureSection(
      "PROOF GENERATION",
      async () => {
        return await backend.generateProof(witness);
      }
    );

    const proofData = proofExec.result;

    console.log(
      `Proof Size: ${(proofData.proof.length / 1024).toFixed(2)} KB`
    );


    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const managerABI = [
      "function submitProof(bytes calldata _proof, bytes32[] calldata _publicInputs) external"
    ];

    const managerContract = new ethers.Contract(
      managerAddress,
      managerABI,
      signer
    );


    const formatExec = await measureSection(
      "PUBLIC INPUT FORMATTING",
      async () => {
        return proofData.publicInputs.map(input =>
          ethers.zeroPadValue(input, 32)
        );
      }
    );

    const formattedPublicInputs = formatExec.result;

    const txExec = await measureSection(
      "SCROLL TRANSACTION SUBMISSION",
      async () => {
        const tx = await managerContract.submitProof(
          proofData.proof,
          formattedPublicInputs,
          { gasLimit: 1000000 }
        );

        console.log("Transakcja wysłana! Hash:", tx.hash);

        const receipt = await tx.wait();
        return { tx, receipt };
      }
    );

    const tx = txExec.result.tx;
    const receipt = txExec.result.receipt;

    const feeData = await provider.getFeeData();

    const gasUsed = receipt.gasUsed;

    const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas ?? 0n;

    const totalCostWei = gasUsed * gasPrice;
    const totalCostETH = ethers.formatEther(totalCostWei);

    console.log(`\n========== GAS ANALYSIS ==========`);
    console.log(`Gas Used: ${gasUsed.toString()}`);
    console.log(`Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} GWEI`);
    console.log(`Transaction Cost: ${totalCostETH} ETH`);
    console.log("Potwierdzono w bloku:", receipt.blockNumber);


    const globalEnd = performance.now();
    const totalDuration = globalEnd - globalStart;

    console.log(
      `\n========== TOTAL EXECUTION ==========\n⏱ Total Time: ${(totalDuration / 1000).toFixed(2)} s`
    );


    const benchmarkReport = {
      backendInitialization: backendInit.metrics,
      witnessGeneration:     witnessExec.metrics,
      proofGeneration:       proofExec.metrics,
      publicInputFormatting: formatExec.metrics,
      transactionSubmission: txExec.metrics,

      gasAnalysis: {
        gasUsed:      gasUsed.toString(),
        gasPriceGwei: ethers.formatUnits(gasPrice, "gwei"),
        totalCostETH
      },

      proof: {
        sizeBytes: proofData.proof.length,
        sizeKB:    (proofData.proof.length / 1024).toFixed(2)
      },

      totalExecution: { durationMs: totalDuration },

      txHash:      tx.hash,
      blockNumber: receipt.blockNumber,
      timestamp:   new Date().toISOString()
    };

    console.log("\n========== BENCHMARK REPORT ==========");

    console.table({
      "Witness Time (s)": (witnessExec.metrics.durationMs / 1000).toFixed(2),
      "Proof Time (s)":   (proofExec.metrics.durationMs   / 1000).toFixed(2),
      "Tx Time (s)":      (txExec.metrics.durationMs      / 1000).toFixed(2),
      "Gas Used":         gasUsed.toString(),
      "Proof Size KB":    benchmarkReport.proof.sizeKB,
      "Total Time (s)":   (totalDuration / 1000).toFixed(2)
    });

    return {
      isValid: true,
      txHash: tx.hash,
      benchmarkReport
    };

  } catch (error) {
    console.error("=== BŁĄD TRANSAKCJI ZK ===");
    console.error(error?.message);
    throw error;
  }
};