import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { ethers } from 'ethers';

export const runZKProcess = async (circuitData, inputs, verifierAddress) => {
  try {
    console.log("Inicjalizacja backendu dla:", verifierAddress);

    const backend = new BarretenbergBackend(circuitData);


    const noir = new Noir(circuitData, backend);

    console.log("Generowanie Witness dla danych:", inputs);
    const { witness } = await noir.execute(inputs);
    
    console.log("Generowanie Proof (UltraPlonk)...");
    const proofData = await backend.generateProof(witness);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    const verifierABI = [
      "function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view returns (bool)"
    ];
    
    const verifierContract = new ethers.Contract(verifierAddress, verifierABI, signer);

    // Formatowanie wejść publicznych do standardu bytes32 dla Solidity
    const formattedPublicInputs = proofData.publicInputs.map(input =>
      ethers.zeroPadValue(input, 32)
    );

    console.log("Weryfikacja on-chain na Scroll...");
    const isValid = await verifierContract.verify(
      proofData.proof,
      formattedPublicInputs
    );

    return { isValid, proofData };
  } catch (error) {
    console.error("=== ZK ERROR DETAILS ===");
    console.error("Wiadomość:", error?.message);
    throw error;
  }
};