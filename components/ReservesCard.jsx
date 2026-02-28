import React, { useState } from 'react';
import { Database, Search, RefreshCw, CheckCircle } from 'lucide-react';
import { runZKProcess } from '../services/zkProvider';
import circuit from '../circuit_reserves.json';

const ReservesCard = ({ userAccount }) => {
  const [status, setStatus] = useState('Idle');
  const [isVerified, setIsVerified] = useState(false);
  const [txHash, setTxHash] = useState("");

  const MOCK_ROOT = "0x23cc1307048dde0f8952df10631d7279b831e0603436b25de0b548a0410bb34c";
  const MOCK_PATH = [
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  ];

  const handleVerify = async () => {
    setStatus('Proving');
    try {
      const inputs = {
        balance: "1000",
        index: "0",
        hash_path: MOCK_PATH,
        root: MOCK_ROOT
      };

      const { txHash: hash } = await runZKProcess(
        circuit, 
        inputs, 
        import.meta.env.VITE_RESERVES_MANAGER_ADDRESS
      );

      setIsVerified(true);
      setTxHash(hash);
      setStatus('Success');
    } catch (err) {
      alert("Błąd Proof of Reserves! Dane nie pasują do korzenia Merkle.");
      setStatus('Idle');
    }
  };

  return (
    <section className={`zk-card full-row ${!userAccount ? 'disabled-card' : ''}`}>
      <div className="card-title">
        <Database size={24} color="#10b981" />
        <h2>Protocol Solvency (Proof of Reserves)</h2>
      </div>
      <div className="reserves-stats">
        <div className="stat-item">
          <p className="stat-label">Całkowite Rezerwy (Scroll L2)</p>
          <p className="stat-value">4,500.00 ETH</p>
        </div>
        <div className="stat-item solvency">
          <p className="stat-label">Weryfikacja</p>
          <p className="stat-value" style={{color: '#10b981'}}>MERKLE-ZK</p>
        </div>
      </div>
      <button 
        className={`btn ${isVerified ? 'btn-outline success-border' : 'btn-blue'}`}
        onClick={handleVerify}
        disabled={!userAccount || isVerified || status === 'Proving'}
      >
        {status === 'Proving' ? <RefreshCw className="spinner" /> : isVerified ? <CheckCircle /> : <Search />}
        {status === 'Proving' ? "Dowodzenie Merkle..." : isVerified ? "Depozyt Potwierdzony" : "Weryfikuj moją obecność w rezerwach"}
      </button>
      {isVerified && (
          <p style={{fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '10px'}}>
            Dowód przynależności zapisany on-chain. <a href={`https://sepolia.scrollscan.com/tx/${txHash}`} target="_blank" rel="noreferrer" style={{color: '#3b82f6'}}>Zobacz Logs</a>
          </p>
      )}
    </section>
  );
};

export default ReservesCard;