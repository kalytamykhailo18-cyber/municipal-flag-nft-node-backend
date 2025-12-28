/**
 * Flag Detail - CSS Animation Styles
 */

export const animationStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animate-gradient {
    animation: gradient 2s ease infinite;
  }
  @keyframes flip {
    0% { transform: rotateY(0deg); }
    50% { transform: rotateY(90deg); }
    100% { transform: rotateY(0deg); }
  }
  .animate-flip {
    animation: flip 0.6s ease-in-out;
  }
`;
