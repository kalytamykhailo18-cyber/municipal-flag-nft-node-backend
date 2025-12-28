/**
 * How It Works - Step by step guide section
 */

const StepCard = ({ number, title, children, animation = "fade-up" }) => (
  <div
    data-animate={animation}
    data-duration="normal"
    className="text-center"
  >
    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
      {number}
    </div>
    <h3 className="text-white font-semibold mb-2">{title}</h3>
    <p className="text-gray-400 text-sm">{children}</p>
  </div>
);

const HowItWorks = () => {
  return (
    <section className="page-container py-16">
      <h2
        data-animate="fade-down"
        data-duration="normal"
        className="section-title text-center"
      >
        How It Works
      </h2>
      <div className="grid md:grid-cols-4 gap-6 mt-8">
        <StepCard number="1" title="Express Interest">
          Claim the first NFT of a flag pair for free to show your interest.
        </StepCard>
        <StepCard number="2" title="Complete the Pair">
          Purchase the second NFT to complete your collection and remove it from the game.
        </StepCard>
        <StepCard number="3" title="Earn Discounts">
          Collect Plus and Premium flags to unlock discounts on future purchases.
        </StepCard>
        <StepCard number="4" title="Trade & Social">
          Participate in auctions, follow collectors, and climb the rankings.
        </StepCard>
      </div>
    </section>
  );
};

export default HowItWorks;
