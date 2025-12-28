/**
 * Popular Flags - Featured flags section
 */
import { useNavigate } from 'react-router-dom';
import FlagCard from '../../components/FlagCard';

const PopularFlags = ({ flags }) => {
  const navigate = useNavigate();

  if (flags.length === 0) return null;

  return (
    <section className="page-container py-16 bg-dark">
      <div className="flex items-center justify-between mb-8">
        <h2
          data-animate="fade-right"
          data-duration="normal"
          className="section-title mb-0"
        >
          Popular Flags
        </h2>
        <button
          onClick={() => navigate('/countries')}
          data-animate="fade-left"
          data-duration="normal"
          className="text-primary hover:text-primary-light transition-colors bg-transparent border-none cursor-pointer"
        >
          View All →
        </button>
      </div>
      <div className="grid-cards">
        {flags.map((flag, index) => (
          <div
            key={flag.id}
            data-animate="fade-up"
            data-duration="normal"
          >
            <FlagCard flag={flag} showMunicipality index={index} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PopularFlags;
