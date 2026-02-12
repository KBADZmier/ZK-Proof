import React, { useState } from 'react';
import { UserCheck, Lock, RefreshCw, CheckCircle } from 'lucide-react';
import { runZKProcess } from '../services/zkProvider';
import circuit from '../circuit.json';

const KYCCard = ({ userAccount }) => {
  const [status, setStatus] = useState('Idle');
  const [secretInput, setSecretInput] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = async () => {
    if (!secretInput) return alert("Wpisz swój sekret!");
    
    setStatus('Proving');
    try {
      const inputs = {
        secret_id: secretInput,
        user_address: userAccount,
        public_hash: import.meta.env.VITE_TARGET_HASH
      };

      const { isValid } = await runZKProcess(
        circuit, 
        inputs, 
        import.meta.env.VITE_VERIFIER_ADDRESS
      );

      if (isValid) {
        setIsVerified(true);
        setStatus('Success');
        setSecretInput(""); // Czyszczenie dla bezpieczeństwa
      }
    } catch (err) {
      alert("Weryfikacja nieudana!");
      setStatus('Idle');
    }
  };

  return (
    <section className={`zk-card ${!userAccount ? 'disabled-card' : ''}`}>
      <div className="card-title">
        <UserCheck size={24} color={isVerified ? "#10b981" : "#3b82f6"} />
        <h2>Private Identity (KYC)</h2>
      </div>
      <p className="description">Udowodnij znajomość sekretu bez jego ujawniania.</p>
      
      <div className="input-wrapper">
        <label className="label">Prywatny Sekret (Witness)</label>
        <input 
          type="password" 
          value={secretInput}
          onChange={(e) => setSecretInput(e.target.value)}
          disabled={!userAccount || isVerified}
          placeholder="Wpisz swój sekret"
        />
      </div>

      <button 
        className={`btn ${isVerified ? 'btn-outline' : 'btn-blue'}`}
        onClick={handleVerify}
        disabled={!userAccount || status === 'Proving' || isVerified}
      >
        {status === 'Proving' ? <RefreshCw className="spinner" size={18} /> : isVerified ? <CheckCircle size={18} /> : <Lock size={18} />}
        {status === 'Proving' ? "Obliczanie..." : isVerified ? "Zweryfikowano" : "Generuj Dowód Noir"}
      </button>
    </section>
  );
};

export default KYCCard;