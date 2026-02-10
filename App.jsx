import React, { useState, useEffect } from 'react';
import { Shield, UserCheck, Database, Lock, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import WalletConnect from './WalletConnect';
import './App.css';

// INTEGRACJA ZK (Noir & Barretenberg)
import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import circuit from './circuit.json'; // Skompilowany obwód z folderu src
import { ethers } from 'ethers';


const VERIFIER_ADDRESS = import.meta.env.VITE_VERIFIER_ADDRESS;
const TARGET_HASH = import.meta.env.VITE_TARGET_HASH;
const VERIFIER_ABI = [
  "function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view returns (bool)"
];

function App() {
  const [status, setStatus] = useState('Idle'); 
  const [userAccount, setUserAccount] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
const [secretInput, setSecretInput] = useState("");
  //logika zk
  const handleGenerateAndVerify = async () => {
    console.log(VERIFIER_ADDRESS);
    if (!userAccount) return alert("Podłącz portfel MetaMask!");
    if (!VERIFIER_ADDRESS) return alert("Błąd: Brak adresu kontraktu w pliku .env");
 if (!secretInput) return alert("Wpisz swój Klucz Tożsamości!");
    try {
      setStatus('Proving');
      console.log("Inicjalizacja silnika Noir JS...");

    //inicjalizacja Barretenberg
      const backend = new BarretenbergBackend(circuit);
      const noir = new Noir(circuit, backend);

      
      const inputs = {
      secret_id: secretInput, 
      user_address: userAccount, //Publiczny adres portfela
      public_hash: TARGET_HASH 
    };

      console.log("Generowanie dowodu ZK (UltraPlonk)...");
      const { proof, publicInputs } = await noir.generateProof(inputs);
      console.log("Dowód wygenerowany lokalnie w przeglądarce!");

  
      console.log("Łączenie ze smart kontraktem na Scroll...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const verifierContract = new ethers.Contract(VERIFIER_ADDRESS, VERIFIER_ABI, signer);

      
      //wywołanie funkcji werifikującej na blockchainnie
      const isValid = await verifierContract.verify(proof, publicInputs);

      if (isValid) {
        setStatus('Success');
        setIsVerified(true);
        console.log("Sukces! Blockchain Scroll potwierdził poprawność dowodu.");
        setSecretInput(""); // czyscimy
      } else {
        throw new Error("Kontrakt odrzucił dowód ZK.");
      }

    } catch (err) {
      console.error("Błąd procesu ZK:", err);
      setStatus('Error');
      alert("Błąd: " + (err.reason || err.message || "Nieznany błąd"));
      setTimeout(() => setStatus('Idle'), 3000);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="app-header">
        <div className="logo-area">
          <h1>ZK-Finance <span>Shield</span></h1>
          <p>Scroll Sepolia Testnet | Noir ZKP</p>
        </div>
        
        {/* Komponent portfela */}
        <WalletConnect onAccountChange={(addr) => setUserAccount(addr)} />
      </header>

      <main className="main-grid">
        
      
        <section className={`zk-card ${!userAccount ? 'disabled-card' : ''}`}>
          <div className="card-title">
            <UserCheck size={24} color={isVerified ? "#10b981" : "#3b82f6"} />
            <h2>Private Identity (KYC)</h2>
          </div>
          <p className="description">
            {isVerified 
              ? "Tożsamość zweryfikowana kryptograficznie on-chain." 
              : "Udowodnij znajomość sekretu powiązanego z Twoim kontem bez jego ujawniania."}
          </p>
          
          <div className="input-wrapper">
            <label className="label">Twój Prywatny Sekret (Znasz go tylko Ty)</label>
            <input 
              type="password" 
              placeholder="Wpisz sekret" 
              disabled={!userAccount || isVerified} 
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)} // Aktualizacja stanu
              className="input-field"
            />
          </div>
          
          <button 
            className={`btn ${isVerified ? 'btn-outline' : 'btn-blue'}`}
            onClick={handleGenerateAndVerify}
            disabled={!userAccount || status === 'Proving' || isVerified}
          >
            {status === 'Proving' ? <RefreshCw className="spinner" size={18} /> : isVerified ? <CheckCircle size={18} /> : <Lock size={18} />}
            {status === 'Proving' ? "Obliczanie..." : isVerified ? "Zweryfikowano" : "Generuj Dowód Noir"}
          </button>
        </section>

      
        <section className={`zk-card ${!userAccount ? 'disabled-card' : ''}`}>
          <div className="card-title">
            <Shield size={24} color="#8b5cf6" />
            <h2>Shielded Transfer</h2>
          </div>
          <p className="description">
            Prywatne przelewy ETH na Scroll. Kwota i odbiorca są ukryte w dowodzie ZK.
          </p>
          <div className="input-wrapper">
            <input placeholder="Adres odbiorcy" disabled={!userAccount} />
            <input type="number" placeholder="Kwota ETH" disabled={!userAccount} />
          </div>
          <button className="btn btn-purple" disabled={true}>
            Funkcja w trakcie implementacji
          </button>
        </section>

       
        <section className={`zk-card full-row ${!userAccount ? 'disabled-card' : ''}`}>
          <div className="card-title">
            <Database size={24} color="#10b981" />
            <h2>Protocol Solvency (Proof of Reserves)</h2>
          </div>
          <div className="reserves-stats">
            <div className="stat-item">
              <div className="stat-label">Total Assets (ZK-Proven)</div>
              <div className="stat-value">1,402.50 ETH</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Total Liabilities</div>
              <div className="stat-value">1,390.00 ETH</div>
            </div>
            <div className="stat-item solvency">
              <div className="stat-label">Solvency Ratio</div>
              <div className="stat-value" style={{color: '#10b981'}}>101.2%</div>
            </div>
          </div>
          <div style={{display: 'flex', gap: '15px'}}>
            <input placeholder="Weryfikuj mój depozyt (Leaf Index)" disabled={!userAccount} />
            <button className="btn btn-outline" style={{width: '250px'}} disabled={!userAccount}>Weryfikuj</button>
          </div>
        </section>
      </main>

      
      {status !== 'Idle' && (
        <div className="zk-status">
          {status === 'Proving' && (
            <><RefreshCw size={20} className="spinner" /><span>Generowanie dowodu UltraPlonk...</span></>
          )}
          {status === 'Success' && (
            <><CheckCircle size={20} color="#fff" /><span>Zweryfikowano pomyślnie na Scroll!</span></>
          )}
        </div>
      )}

      {!userAccount && (
        <div className="footer-info" style={{textAlign: 'center', marginTop: '20px', color: '#94a3b8'}}>
          <AlertCircle size={16} style={{verticalAlign: 'middle', marginRight: '5px'}} />
          Połącz portfel MetaMask, aby odblokować funkcje prywatności.
        </div>
      )}
    </div>
  );
}

export default App;