import React, { useState } from 'react';
import { Shield, Play, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { runZKProcess } from '../services/zkProvider';
import circuit from '../circuit_final.json'; 
import '../css/systemCard.css';
import { ethers } from 'ethers'; 

const SystemCard = ({ userAccount }) => {
  const [status, setStatus] = useState('Idle');
  const [credential, setCredential] = useState(null);
  const [amount, setAmount] = useState("");
  const [stats, setStats] = useState(null);

 const toField = (x) => "0x" + BigInt(x).toString(16).padStart(64, "0");

  const handleFileUpload = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (e) => {
      const json = JSON.parse(e.target.result);
      setCredential(json);
      console.log("Credential loaded:", json);
    };
  };

  const handleExecute = async () => {
    if (!credential || !amount) {
      alert("Upload a credential and enter an amount!");
      return;
    }


    try {

      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256"],
        [credential.userAddress, credential.birthDate]
      );
      
      const recoveredAddress = ethers.verifyMessage(ethers.getBytes(messageHash), credential.signature);
      
      if (recoveredAddress.toLowerCase() !== credential.issuerAddress.toLowerCase()) {
         alert("Bład");
         setStatus('Idle');
         return;
      }

      if (credential.userAddress.toLowerCase() !== userAccount.toLowerCase()) {
        console.error("ADDRESS MISMATCH!");
        alert("Błąd");
        setStatus('Idle');
        return;
      }


      setStatus('Proving');
      const startTime = performance.now();

      const today = new Date();
      const currentDateNum = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

      const inputs = {
        birth_date: Number(credential.birthDate), 
        merkle_proof: credential.merkleProof.map(toField),
        index: toField(credential.index),
        user_address: toField(credential.userAddress),
        merkle_root: toField(credential.merkleRoot),
        current_date: currentDateNum, 
        transfer_amount: Number(amount),
        aml_limit: 10000
      };

      if (inputs.merkle_proof.length !== 17) {
        console.error("WRONG PROOF LENGTH! Expected 17, got", inputs.merkle_proof.length);
        throw new Error("Nieprawidłowa długość drzewa Merkle w JSON");
      }
   

      const { isValid, txHash } = await runZKProcess(
        circuit,
        inputs,
        import.meta.env.VITE_ECOSYSTEM_MANAGER_ADDRESSFinal
      );

      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      if (isValid) {
        setStatus('Success');
        setStats({ duration, txHash });
      } else {
        alert("Proof rejected by verifier!");
        setStatus('Idle');
      }

    } catch (err) {
      console.error("ERROR FROM PROVER / FRONTEND:");
      console.error(err);

      if (err?.message) console.error("Message:", err.message);
      if (err?.stack)   console.error("Stack:", err.stack);

      alert("Błąd przetwarzania!");
      setStatus('Idle');
    }
  };

  return(
    <section className={`zk-card full-row ${!userAccount ? 'disabled-card' : ''}`}>
        <div className="card-title">
          <h2>System przelewów</h2>
        </div>
  
        <div className="main-flow-container">
          

          <div className="input-section">
            <div className="input-group input-group-spaced">
              <label className="label">Wgraj poświadczenie (JSON)</label>
              <div className="file-upload-wrapper">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="input-field"
                />
              </div>
              {credential && (
                <p className="success-text-small">Poświadczenie załadowne</p>
              )}
            </div>
  
            <div className="input-group">
              <label className="label">Przelew</label>
              <input
                type="number"
                placeholder="Kwota przelewu..."
                className="input-field"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
  
  
          <div className="status-section">
            {status === 'Idle' && (
              <p className="status-idle-text">Oczekiwanie...</p>
            )}
  
            {status === 'Proving' && (
              <div className="proving-loader">
                <RefreshCw className="spinner spinner-spaced" />
                <p>Proszę czekać</p>
              </div>
            )}
  
            {status === 'Success' && stats && (
              <div className="success-results animate-in">
                <div className="success-header">
                  <CheckCircle size={20} />
                  <strong>Operacja się udała!</strong>
                </div>
                <div className="stat-line">
                  <Clock size={14} className="icon-inline" />
                  Czas generowania: <strong>{stats.duration}s</strong>
                </div>
                <a
                  href={`https://sepolia.scrollscan.com/tx/${stats.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-small"
                >
                  Zobacz transakcję na Scrollscan
                </a>
              </div>
            )}
          </div>
        </div>
  
        <button
          className="btn btn-blue execute-btn"
          onClick={handleExecute}
          disabled={status === 'Proving' || !credential || !userAccount}
        >
          <Play size={18} /> Wykonaj przelew
        </button>
      </section>
    );
  };
  
export default SystemCard;