/**
 * Header Component with navigation and wallet connection
 * Refactored to use useNavigate instead of Link
 * Supports multiple wallets: MetaMask, Phantom, etc.
 */
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { connectWallet, disconnect, selectWallet } from '../store/slices/walletSlice';
import { getAvailableWallets } from '../services/web3';
import config from '../config';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { address, balance, isConnected, isConnecting, isMetaMaskInstalled, walletType } = useSelector(selectWallet);

  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [availableWallets, setAvailableWallets] = useState([]);

  useEffect(() => {
    setAvailableWallets(getAvailableWallets());
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showWalletSelector && !event.target.closest('.wallet-selector-container')) {
        setShowWalletSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWalletSelector]);

  const isActive = (path) => location.pathname === path;

  const handleConnect = (selectedWalletType = null) => {
    dispatch(connectWallet(selectedWalletType));
    setShowWalletSelector(false);
  };

  const handleDisconnect = () => {
    dispatch(disconnect());
  };

  const toggleWalletSelector = () => {
    setShowWalletSelector(!showWalletSelector);
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleExternalLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="bg-dark border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            type="button"
            onClick={() => handleNavigation('/')}
            className="flex items-center gap-2 text-white hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
          >
            <svg
              className="w-8 h-8"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Flag pole */}
              <rect x="4" y="2" width="2.5" height="28" rx="1" fill="#A78BFA" />
              {/* Flag pole top */}
              <circle cx="5.25" cy="3" r="2" fill="#C4B5FD" />
              {/* Flag body with wave effect */}
              <path
                d="M8 4C8 4 10 3 14 4C18 5 22 6 26 5C28 4.5 29 5 29 6V16C29 17 28 17.5 26 17C22 16 18 17 14 16C10 15 8 16 8 16V4Z"
                fill="url(#flagGradient)"
              />
              {/* Flag highlight */}
              <path
                d="M8 4C8 4 10 3 14 4C18 5 22 6 26 5C28 4.5 29 5 29 6V8C28 8.5 26 9 22 8C18 7 14 6 10 7C8 7.5 8 7 8 7V4Z"
                fill="rgba(255,255,255,0.2)"
              />
              <defs>
                <linearGradient id="flagGradient" x1="8" y1="4" x2="29" y2="16" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8B5CF6" />
                  <stop offset="1" stopColor="#6366F1" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-bold text-lg hidden sm:inline">Municipal Flag NFT</span>
          </button>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavButton path="/countries" active={isActive('/countries')} onClick={handleNavigation}>Explore</NavButton>
            <NavButton path="/auctions" active={isActive('/auctions')} onClick={handleNavigation}>Auctions</NavButton>
            <NavButton path="/rankings" active={isActive('/rankings')} onClick={handleNavigation}>Rankings</NavButton>
            <NavButton path="/profile" active={isActive('/profile')} onClick={handleNavigation}>Profile</NavButton>
            <NavButton path="/admin" active={isActive('/admin')} onClick={handleNavigation}>Admin</NavButton>
          </nav>

          {/* Wallet Section */}
          <div className="flex items-center gap-3 relative wallet-selector-container">
            {availableWallets.length === 0 ? (
              <button
                onClick={() => handleExternalLink('https://metamask.io/download/')}
                className="btn btn-primary text-sm py-2"
              >
                Install Wallet
              </button>
            ) : isConnected ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Balance Display - Always visible */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-lighter rounded-[3px] border border-gray-700">
                  <span className="text-xs">{getWalletIcon(walletType)}</span>
                  <div className="flex flex-col">
                    <span className="text-primary font-semibold text-sm">
                      {parseFloat(balance || 0).toFixed(4)} MATIC
                    </span>
                    <span className="text-gray-400 text-xs hidden sm:block">
                      {config.truncateAddress(address)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={toggleWalletSelector}
                  className="px-3 py-2 text-sm bg-gray-800 text-gray-300 rounded-[3px] hover:bg-gray-700 transition-colors hidden sm:block"
                  title="Switch Wallet"
                >
                  Switch
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-3 sm:px-4 py-2 text-sm bg-red-600/20 text-red-400 rounded-[3px] hover:bg-red-600/30 transition-colors"
                >
                  <span className="hidden sm:inline">Disconnect</span>
                  <span className="sm:hidden">×</span>
                </button>
              </div>
            ) : (
              <button
                onClick={toggleWalletSelector}
                disabled={isConnecting}
                className="btn btn-primary text-sm py-2"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}

            {/* Wallet Selector Dropdown */}
            {showWalletSelector && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-dark-darker border border-gray-700 rounded-[3px] shadow-xl z-50">
                <div className="p-2">
                  <div className="text-gray-400 text-xs uppercase font-semibold px-3 py-2">
                    Select Wallet
                  </div>
                  {availableWallets.map((wallet) => (
                    <button
                      key={wallet.type}
                      onClick={() => handleConnect(wallet.type)}
                      className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-800 rounded-[3px] transition-colors text-left"
                    >
                      <span className="text-2xl">{wallet.icon}</span>
                      <div className="flex-1">
                        <div className="text-white font-medium">{wallet.name}</div>
                        {walletType === wallet.type && isConnected && (
                          <div className="text-green-400 text-xs">Connected</div>
                        )}
                      </div>
                      {walletType === wallet.type && isConnected && (
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-700 p-2">
                  <button
                    onClick={() => setShowWalletSelector(false)}
                    className="w-full px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t border-gray-800 px-4 py-2 flex justify-around">
        <MobileNavButton path="/countries" active={isActive('/countries')} onClick={handleNavigation}>Explore</MobileNavButton>
        <MobileNavButton path="/auctions" active={isActive('/auctions')} onClick={handleNavigation}>Auctions</MobileNavButton>
        <MobileNavButton path="/rankings" active={isActive('/rankings')} onClick={handleNavigation}>Rankings</MobileNavButton>
        <MobileNavButton path="/profile" active={isActive('/profile')} onClick={handleNavigation}>Profile</MobileNavButton>
      </nav>
    </header>
  );
};

const getWalletIcon = (walletType) => {
  const icons = {
    metamask: '🦊',
    phantom: '👻',
    coinbase: '🔵',
    unknown: '🔗',
  };
  return icons[walletType] || '💼';
};

const NavButton = ({ path, active, onClick, children }) => (
  <button
    type="button"
    onClick={() => onClick(path)}
    className={`px-4 py-2 rounded-[3px] text-sm font-medium transition-colors cursor-pointer bg-transparent border-none ${
      active
        ? 'bg-primary/20 text-primary'
        : 'text-gray-300 hover:text-white hover:bg-gray-800'
    }`}
  >
    {children}
  </button>
);

const MobileNavButton = ({ path, active, onClick, children }) => (
  <button
    type="button"
    onClick={() => onClick(path)}
    className={`px-3 py-1 text-xs font-medium transition-colors cursor-pointer bg-transparent border-none ${
      active ? 'text-primary' : 'text-gray-400 hover:text-white'
    }`}
  >
    {children}
  </button>
);

export default Header;
