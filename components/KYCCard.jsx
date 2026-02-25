import React, { useState } from 'react';
import { UserCheck, Lock, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { runZKProcess } from '../services/zkProvider';
import circuit from '../circuit.json';

const KYCCard = ({ userAccount }) => {
  const [status, setStatus] = useState('Idle');
  const [secretInput, setSecretInput] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [txHash, setTxHash] = useState("");

 const handleVerify = async () => {
    if (!secretInput) return alert("Wpisz swój klucz tożsamości!");
    
    setStatus('Proving');
    try {
      
      const inputs = {
        secret: secretInput.toString(), 
        user_address: userAccount.toString(), 
        expected_commitment: import.meta.env.VITE_TARGET_HASH.toString() 
      };

      console.log("--- PROCES KYC ZK (Commitment Mode) ---");
      console.log("Dane wejściowe:", inputs);

      const { isValid, txHash } = await runZKProcess(
        circuit, 
        inputs, 
        import.meta.env.VITE_KYC_MANAGER_ADDRESS
      );

      if (isValid) {
        setIsVerified(true);
        setTxHash(txHash);
        setStatus('Success');
        setSecretInput(""); 
      }
    } catch (err) {
      console.error("BŁĄD:", err);
      alert("Błędny sekret! Dowód ZK nie mógł zostać wygenerowany.");
      setStatus('Idle');
    }
  };

  return (
    <section className={`zk-card ${!userAccount ? 'disabled-card' : ''}`}>
      <div className="card-title">
        <UserCheck size={24} color={isVerified ? "#10b981" : "#3b82f6"} />
        <h2>Private Identity (KYC)</h2>
      </div>
      <p className="description">Udowodnij znajomość sekretu bez ujawniania danych PII.</p>
      
      <div className="input-wrapper">
        <label className="label">Prywatny Klucz Tożsamości</label>
        <input 
          type="password" 
          value={secretInput}
          onChange={(e) => setSecretInput(e.target.value)}
          disabled={!userAccount || isVerified}
          placeholder="Wpisz swój sekret (np. 123)"
          className="input-field"
        />
        
    
        <div className="privacy-info-box">
           <div className="flex-row" style={{fontSize: '11px', color: '#94a3b8', gap: '5px'}}>
              <AlertCircle size={12} /> 
              <span>Sekret zostanie przetworzony lokalnie przez silnik ZK.</span>
           </div>
        </div>

        {isVerified && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#10b981' }}>
             <CheckCircle size={12} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
             Weryfikacja zapisana on-chain: 
             <a href={`https://sepolia.scrollscan.com/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', marginLeft: '5px' }}>
               {txHash.slice(0,10)}...
             </a>
          </div>
        )}
      </div>

      <button 
        className={`btn ${isVerified ? 'btn-outline' : 'btn-blue'}`}
        onClick={handleVerify}
        disabled={!userAccount || status === 'Proving' || isVerified}
      >
        {status === 'Proving' ? <RefreshCw className="spinner" size={18} /> : isVerified ? <CheckCircle size={18} /> : <Lock size={18} />}
        {status === 'Proving' ? "Obliczanie..." : isVerified ? "Tożsamość Potwierdzona" : "Generuj Dowód KYC"}
      </button>
    </section>
  );
};

export default KYCCard;