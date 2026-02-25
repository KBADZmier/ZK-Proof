import React, { useState } from 'react';
import { Shield, Send, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { runZKProcess } from '../services/zkProvider';
import circuit from '../circuit_transfer.json';

const TransferCard = ({ userAccount }) => {
  const [status, setStatus] = useState('Idle');
  const [amount, setAmount] = useState("");
  const [isSent, setIsSent] = useState(false);

  const handleTransfer = async () => {
    if (!amount) return alert("Podaj kwotę przelewu!");
    if (parseFloat(amount) <= 0) return alert("Kwota musi być dodatnia!");

  
    const cleanAmount = Math.floor(Number(amount)).toString();
    
    setStatus('Proving');
    try {
      const inputs = {
        sender_balance: "1000", // Twoje ukryte saldo (Private Witness)
        transfer_amount: cleanAmount // Kwota (Public Input)
      };

      const { isValid } = await runZKProcess(
        circuit, 
        inputs, 
        import.meta.env.VITE_MANAGER_ADDRESS
      );

      if (isValid) {
        setIsSent(true);
        setStatus('Success');
      }
    } catch (err) {
      console.error(err);
      alert("Błąd weryfikacji ZK! Sprawdź czy kwota nie przekracza salda.");
      setStatus('Idle');
    }
  };

  return (
    <section className={`zk-card ${!userAccount ? 'disabled-card' : ''}`}>
      <div className="card-title">
        <Shield size={24} color={isSent ? "#10b981" : "#8b5cf6"} />
        <h2>Shielded Transfer</h2>
      </div>
      <p className="description">
        Udowodnij wypłacalność bez ujawniania salda (Solvency Proof).
      </p>
      
      <div className="input-wrapper">
        <label className="label">Kwota Przelewu</label>
        <input 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!userAccount || isSent}
          placeholder="Wpisz kwotę"
          className="input-field"
        />
        <div className="privacy-info-box">
           <AlertCircle size={12} /> 
           <span>Prywatne saldo: <strong>1000 ETH</strong> (ukryte przed Scroll)</span>
        </div>
      </div>

      <button 
        className={`btn ${isSent ? 'btn-outline success-border' : 'btn-purple'}`}
        onClick={handleTransfer}
        disabled={!userAccount || status === 'Proving' || isSent}
      >
        {status === 'Proving' ? <RefreshCw className="spinner" size={18} /> : isSent ? <CheckCircle size={18} /> : <Send size={18} />}
        {status === 'Proving' ? "Dowodzenie..." : isSent ? "Zweryfikowano" : "Wyślij z ZK-Proof"}
      </button>
    </section>
  );
};

export default TransferCard;