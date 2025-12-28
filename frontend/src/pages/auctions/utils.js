/**
 * Auctions - Utility functions
 */

export const formatTimeRemaining = (endsAt) => {
  const now = new Date();
  const end = new Date(endsAt);
  const diff = end - now;

  if (diff <= 0) return 'Ended';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
};

export const getCategoryBadgeClass = (category) => {
  switch (category) {
    case 'premium':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    case 'plus':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  }
};
