/**
 * Connect Wallet Prompt - Shown when user is not connected
 */
const ConnectWalletPrompt = ({ onConnect }) => {
  return (
    <div className="page-container">
      <div className="max-w-md mx-auto text-center py-20">
        <div
          data-animate="zoom-in"
          data-duration="slow"
          className="card p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">Please connect your wallet to view your profile</p>
          <button onClick={onConnect} className="btn btn-primary">
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectWalletPrompt;