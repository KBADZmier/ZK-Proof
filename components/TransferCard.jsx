import React, { useState } from 'react';
import { Shield, Send, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { runZKProcess } from '../services/zkProvider';
import circuit from '../circuit_transfer.json'; // Nowy plik JSON

const TransferCard = ({ userAccount }) => {
  const [status, setStatus] = useState('Idle');
  const [amount, setAmount] = useState("");
  const [isSent, setIsSent] = useState(false);

  const handleTransfer = async () => {
    if (!amount) return alert("Podaj kwotę przelewu!");
    if (parseFloat(amount) <= 0) return alert("Kwota musi być dodatnia!");

    setStatus('Proving');
    try {
      const inputs = {
        sender_balance: "1000", // PRYWATNE: Twoje ukryte środki
         transfer_amount: parseInt(amount) // PUBLICZNE: To widzi system
      };

      console.log("Generowanie dowodu wypłacalności dla kwoty:", amount);
      
      const { isValid } = await runZKProcess(
        circuit, 
        inputs, 
        import.meta.env.VITE_TRANSFER_VERIFIER_ADDRESS
      );

      if (isValid) {
        setIsSent(true);
        setStatus('Success');
        console.log("SUKCES: Blockchain Scroll zweryfikował wypłacalność!");
      }
    } catch (err) {
      console.error(err);
      alert("Błąd: Prawdopodobnie kwota przelewu przekracza Twoje prywatne saldo (1000 ETH)!");
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
        Udowodnij, że posiadasz wystarczające środki on-chain bez ujawniania swojego całkowitego salda.
      </p>
      
      <div className="input-wrapper">
        <label className="label">Kwota Przelewu (Widoczna)</label>
        <input 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!userAccount || isSent}
          placeholder="np. 50"
          className="input-field"
        />
        <div style={{fontSize: '11px', color: '#94a3b8', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px'}}>
            <AlertCircle size={12} /> Twoje prywatne saldo w systemie: 1000 ETH
        </div>
      </div>

      <button 
        className={`btn ${isSent ? 'btn-outline' : 'btn-purple'}`}
        onClick={handleTransfer}
        disabled={!userAccount || status === 'Proving' || isSent}
      >
        {status === 'Proving' ? <RefreshCw className="spinner" size={18} /> : isSent ? <CheckCircle size={18} /> : <Send size={18} />}
        {status === 'Proving' ? "Obliczanie ZK-Proof..." : isSent ? "Pomyślnie Zweryfikowano" : "Wyślij z Dowodem Wypłacalności"}
      </button>
    </section>
  );
};

export default TransferCard;