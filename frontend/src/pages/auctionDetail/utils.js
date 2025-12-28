/**
 * Auction Detail - Utility functions
 */

export const formatTimeRemaining = (endsAt, isEnded) => {
  if (isEnded) return 'Ended';

  const timeRemaining = new Date(endsAt) - new Date();
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
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
