import React, { useState, useEffect } from 'react';
import { Wallet, LogOut } from 'lucide-react';

const WalletConnect = ({ onAccountChange }) => {
  const [account, setAccount] = useState(null);

  // Funkcja skracająca adres
  const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        const linkedAccount = accounts[0];
        setAccount(linkedAccount);
        onAccountChange(linkedAccount); // Przekazujemy adres do App.jsx
      } catch (error) {
        console.error("Połączenie odrzucone przez użytkownika");
      }
    } else {
      alert("Zainstaluj MetaMask!");
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      // Sprawdź czy już jest połączony przy starcie strony
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            onAccountChange(accounts[0]);
          }
        });

      // Słuchaj zmian konta
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          onAccountChange(accounts[0]);
        } else {
          setAccount(null);
          onAccountChange(null);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Słuchaj zmian sieci (np. ze Scroll na Ethereum)
      window.ethereum.on('chainChanged', () => window.location.reload());

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [onAccountChange]);

  return (
    <button className="btn btn-outline" style={{ width: 'auto' }} onClick={connectWallet}>
      <Wallet size={18} />
      {account ? formatAddress(account) : "Connect MetaMask"}
    </button>
  );
};

export default WalletConnect;