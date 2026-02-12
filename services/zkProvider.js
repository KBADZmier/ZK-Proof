import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { ethers } from 'ethers';

/**

 * @param {Object} circuitData - Zaimportowany plik circuit.json
 * @param {Object} inputs - Dane wejściowe (Witness)
 * @param {String} verifierAddress - Adres kontraktu na Scroll
 */
export const runZKProcess = async (circuitData, inputs, verifierAddress) => {
  try {
 
    const backend = new BarretenbergBackend(circuitData);
    const noir = new Noir(circuitData, backend);


    console.log("Generowanie Witness...");
    const { witness } = await noir.execute(inputs);
    
    console.log("Generowanie Proof (UltraPlonk)...");
    const proofData = await backend.generateProof(witness);


    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    const verifierABI = [
      "function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view returns (bool)"
    ];
    
    const verifierContract = new ethers.Contract(verifierAddress, verifierABI, signer);


    console.log("Weryfikacja on-chain na Scroll...");
    const isValid = await verifierContract.verify(proofData.proof, proofData.publicInputs);

    return { isValid, proofData };
  } catch (error) {
    console.error("Błąd w zkProvider:", error);
    throw error;
  }
};