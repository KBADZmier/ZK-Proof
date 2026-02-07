import React, { useState } from 'react';
import { Shield, UserCheck, Database, Lock, RefreshCw, CheckCircle, Info, AlertCircle } from 'lucide-react';
import WalletConnect from './WalletConnect'; // Importujemy logikę portfela
import './App.css';

function App() {
  const [status, setStatus] = useState('Idle'); // Idle, Proving, Success
  const [userAccount, setUserAccount] = useState(null); // Tu trzymamy prawdziwy adres z MetaMask

  // Symulacja procesu ZK
  const mockProof = () => {
    if (!userAccount) return;
    setStatus('Proving');
    setTimeout(() => setStatus('Success'), 3000);
    setTimeout(() => setStatus('Idle'), 6000);
  };

  return (
    <div className="dashboard-container">
      <header className="app-header">
        <div className="logo-area">
          <h1>ZK-Finance <span>Shield</span></h1>
          <p>Scroll Testnet Environment</p>
        </div>
        
        {/* Komponent portfela przekazuje adres do stanu userAccount */}
        <WalletConnect onAccountChange={(addr) => setUserAccount(addr)} />
      </header>

      <main className="main-grid">
        
        {/* Moduł 1: KYC */}
        <section className={`zk-card ${!userAccount ? 'disabled-card' : ''}`}>
          <div className="card-title">
            <UserCheck size={24} color={userAccount ? "#3b82f6" : "#4b5563"} />
            <h2>Private Identity (KYC)</h2>
          </div>
          <p className="description">
            {userAccount 
              ? "Udowodnij, że masz ukończone 18 lat bez ujawniania daty urodzenia (Noir Range Proof)."
              : "Podłącz portfel MetaMask, aby zweryfikować swoją tożsamość kryptograficznie."}
          </p>
          
          <div className="input-wrapper">
            <label className="label">Prywatna Data Urodzenia (Witness)</label>
            <input type="date" disabled={!userAccount} />
          </div>
          
          <button 
            className="btn btn-blue" 
            onClick={mockProof}
            disabled={!userAccount || status === 'Proving'}
          >
            {status === 'Proving' ? <RefreshCw className="spinner" size={18} /> : <Lock size={18} />}
            {status === 'Proving' ? "Generowanie..." : "Generuj Dowód Noir"}
          </button>
        </section>

        {/* Moduł 2: Shielded Transfer */}
        <section className={`zk-card ${!userAccount ? 'disabled-card' : ''}`}>
          <div className="card-title">
            <Shield size={24} color={userAccount ? "#8b5cf6" : "#4b5563"} />
            <h2>Shielded Transfer</h2>
          </div>
          <p className="description">
            Wyślij środki prywatnie na sieci Scroll. Dane transakcji zostaną ukryte w obwodzie ZK.
          </p>
          
          <div className="input-wrapper">
            <input placeholder="Adres odbiorcy (Zaszyfrowany)" disabled={!userAccount} />
            <input type="number" placeholder="Kwota ETH" disabled={!userAccount} />
          </div>
          
          <button 
            className="btn btn-purple" 
            onClick={mockProof}
            disabled={!userAccount || status === 'Proving'}
          >
            Wyślij Prywatnie na Scroll
          </button>
        </section>

        {/* Moduł 3: Proof of Reserves */}
        <section className={`zk-card full-row ${!userAccount ? 'disabled-card' : ''}`}>
          <div className="card-title">
            <Database size={24} color={userAccount ? "#10b981" : "#4b5563"} />
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
              <div className="stat-value" style={{color: userAccount ? '#10b981' : '#4b5563'}}>101.2%</div>
            </div>
          </div>
          
          <div style={{display: 'flex', gap: '15px'}}>
            <input placeholder="Weryfikuj mój depozyt (Leaf Index)" disabled={!userAccount} />
            <button 
              className="btn btn-outline" 
              style={{width: '250px'}} 
              disabled={!userAccount}
              onClick={mockProof}
            >
              Weryfikuj Wypłacalność
            </button>
          </div>
        </section>
      </main>

      {/* Powiadomienie o procesie ZK */}
      {status !== 'Idle' && (
        <div className="zk-status">
          {status === 'Proving' ? (
            <>
              <RefreshCw size={20} className="spinner" />
              <span>Obliczanie dowodu ZK po stronie klienta...</span>
            </>
          ) : (
            <>
              <CheckCircle size={20} color="#fff" />
              <span>Dowód zweryfikowany pomyślnie na Scroll!</span>
            </>
          )}
        </div>
      )}

      {!userAccount && (
        <div style={{textAlign: 'center', marginTop: '20px', color: '#94a3b8', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
          <AlertCircle size={16} /> Wymagane połączenie z portfelem do wykonania operacji ZK.
        </div>
      )}
    </div>
  );
}

export default App;