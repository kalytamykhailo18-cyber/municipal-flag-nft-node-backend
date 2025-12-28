/**
 * Instructions Banner - Shown to non-connected users
 */
const InstructionsBanner = ({ hasFlags }) => {
  if (!hasFlags) return null;

  return (
    <div
      data-animate="fade-up"
      data-duration="normal"
      className="card p-6 mb-8 bg-gradient-to-r from-primary/10 to-blue-600/10 border border-primary/20"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-white font-semibold mb-2">Discover Mystery Flags</h3>
          <p className="text-gray-400 text-sm mb-3">
            Each flag is hidden until you show interest. Connect your wallet and click on a mystery card to reveal its contents and claim your first NFT for free!
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">1</span>
              <span>Connect Wallet</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">2</span>
              <span>Show Interest</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">3</span>
              <span>Claim Free NFT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionsBanner;
