import React, { useState } from 'react';
import { Shield, UserCheck, Wallet, Database, Lock, RefreshCw, CheckCircle, Info } from 'lucide-react';
import './App.css';

function App() {
  const [status, setStatus] = useState('Idle'); // Idle, Proving, Success
  const [account, setAccount] = useState(null);

  const mockProof = () => {
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
        <button className="btn btn-outline" style={{width: 'auto'}} onClick={() => setAccount('0x71C...3451')}>
          <Wallet size={18} />
          {account ? account : "Connect MetaMask"}
        </button>
      </header>

      <main className="main-grid">
        {/* Moduł KYC */}
        <section className="zk-card">
          <div className="card-title">
            <UserCheck size={24} color="#3b82f6" />
            <h2>Private Identity (KYC)</h2>
          </div>
          <p className="description">
            Udowodnij, że masz ukończone 18 lat bez ujawniania daty urodzenia.
          </p>
          <div className="input-wrapper">
            <label className="label">Prywatna Data Urodzenia</label>
            <input type="date" />
          </div>
          <button className="btn btn-blue" onClick={mockProof}>
            <Lock size={18} /> Generuj Dowód Noir
          </button>
        </section>

        {/* Moduł Transferu */}
        <section className="zk-card">
          <div className="card-title">
            <Shield size={24} color="#8b5cf6" />
            <h2>Shielded Transfer</h2>
          </div>
          <p className="description">
            Wyślij środki prywatnie. Dane odbiorcy zostaną ukryte w obwodzie ZK.
          </p>
         <div className="input-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
  <input placeholder="Adres odbiorcy (Zaszyfrowany)" />
  <input type="number" placeholder="Kwota ETH" />
</div>
          <button className="btn btn-purple" onClick={mockProof}>
            Wyślij Prywatnie na Scroll
          </button>
        </section>

        {/* Moduł Proof of Reserves */}
        <section className="zk-card full-row">
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
            <input placeholder="Weryfikuj mój depozyt (Leaf Index)" />
            <button className="btn btn-outline" style={{width: '250px'}}>Weryfikuj Wypłacalność</button>
          </div>
        </section>
      </main>

      {/* Status Pop-up */}
      {status !== 'Idle' && (
        <div className="zk-status">
          {status === 'Proving' ? (
            <>
              <RefreshCw size={20} className="spinner" />
              <span>Generowanie dowodu Noir (ZKP)...</span>
            </>
          ) : (
            <>
              <CheckCircle size={20} color="#fff" />
              <span>Zweryfikowano pomyślnie na Scroll!</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;