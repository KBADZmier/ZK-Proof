import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { ethers } from 'ethers';

export const runZKProcess = async (circuitData, inputs, managerAddress) => {
  try {
    console.log("Inicjalizacja backendu dla Zarządcy:", managerAddress);

    // 1. Generowanie dowodu lokalnie
    const backend = new BarretenbergBackend(circuitData, { threads: 1 });
    const noir = new Noir(circuitData, backend);

    console.log("Generowanie Witness i Proof...");
    const { witness } = await noir.execute(inputs);
    const proofData = await backend.generateProof(witness);

    // 2. Połączenie z portfelem i kontraktem Zarządcy
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // ABI musi pasować do Twojego pliku ZKManager.sol z Remixa!
    const managerABI = [
      "function submitProof(bytes calldata _proof, bytes32[] calldata _publicInputs) external"
    ];
    
    const managerContract = new ethers.Contract(managerAddress, managerABI, signer);

    // 3. Przygotowanie wejść (Padding do 32 bajtów - standard EVM)
    const formattedPublicInputs = proofData.publicInputs.map(input =>
      ethers.zeroPadValue(input, 32)
    );

    console.log("Wysyłanie transakcji submitProof na Scroll...");

    // 4. WYWOŁANIE TRANSAKCJI (Tu MetaMask poprosi o podpis)
    const tx = await managerContract.submitProof(
      proofData.proof,
      formattedPublicInputs,
      { gasLimit: 1000000 } // Ręczny limit, aby uniknąć błędów estymacji na Scroll
    );

    console.log("Transakcja wysłana! Hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("Potwierdzono w bloku:", receipt.blockNumber);

    return { isValid: true, txHash: tx.hash };

  } catch (error) {
    console.error("=== BŁĄD TRANSAKCJI ZK ===");
    console.error(error?.message);
    throw error;
  }
};