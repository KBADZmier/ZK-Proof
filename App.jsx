import React, { useState } from 'react';
import WalletConnect from './WalletConnect';
import KYCCard from './components/KYCCard';
import { AlertCircle } from 'lucide-react'; // Dodany brakujący import
import './App.css';
import TransferCard from './components/TransferCard';
import ReservesCard from './components/ReservesCard';
function App() {
  const [userAccount, setUserAccount] = useState(null);

  return (
    <div className="dashboard-container">
      <header className="app-header">
        <div className="logo-area">
          <h1>ZK-Finance <span>Shield</span></h1>
          <p>Institutional ZK-DeFi Framework</p>
        </div>
        <WalletConnect onAccountChange={(addr) => setUserAccount(addr)} />
      </header>

       <main className="main-grid">
        
        <KYCCard userAccount={userAccount} />

       
        <TransferCard userAccount={userAccount} />

       
        <ReservesCard userAccount={userAccount} />
      </main>
        {!userAccount && (
          <div className="footer-info" style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8' }}>
            <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Połącz portfel MetaMask, aby odblokować funkcje prywatności.
          </div>
        )}
    </div>
   
  );
  
}

export default App;