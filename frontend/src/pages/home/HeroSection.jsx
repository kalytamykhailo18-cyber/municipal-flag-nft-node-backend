/**
 * Hero Section - Main landing banner
 */
import { useNavigate } from 'react-router-dom';

const HeroSection = ({ countriesCount }) => {
  const navigate = useNavigate();

  return (
    <section className="bg-gradient-to-br from-dark via-secondary to-dark py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h1
          data-animate="fade-down"
          data-duration="slow"
          className="text-4xl md:text-6xl font-bold text-white mb-6"
        >
          Collect <span className="text-gradient">Municipal Flags</span> as NFTs
        </h1>
        <p
          data-animate="fade-up"
          data-duration="normal"
          className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-8"
        >
          Discover and collect unique flags from municipalities around the world.
          Each flag is an AI-generated NFT on the Polygon network.
        </p>
        <div
          data-animate="zoom-in"
          data-duration="normal"
          className="flex flex-wrap justify-center gap-4"
        >
          <button onClick={() => navigate('/countries')} className="btn btn-primary">
            Start Exploring
          </button>
          <button onClick={() => navigate('/rankings')} className="btn btn-outline">
            View Rankings
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-12">
          <div
            data-animate="flip-up"
            data-duration="normal"
            className="stat-card"
          >
            <span className="stat-value">{countriesCount}</span>
            <span className="stat-label">Countries</span>
          </div>
          <div
            data-animate="flip-up"
            data-duration="normal"
            className="stat-card"
          >
            <span className="stat-value">64</span>
            <span className="stat-label">Unique Flags</span>
          </div>
          <div
            data-animate="flip-up"
            data-duration="normal"
            className="stat-card"
          >
            <span className="stat-value">3</span>
            <span className="stat-label">Categories</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
