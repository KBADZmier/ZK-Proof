import React, { useState } from 'react';
import WalletConnect from '../services/walletConnect';
import { AlertCircle } from 'lucide-react'; 
import '../css/App.css';
import SystemCard from './systemCard';
function App() {
  const [userAccount, setUserAccount] = useState(null);

  return (
    <div className="dashboard-container">
      <header className="app-header">
        <div className="logo-area">
        </div>
        <WalletConnect onAccountChange={(addr) => setUserAccount(addr)} />
      </header>

       <main className="main-grid">
         <SystemCard userAccount={userAccount} />
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