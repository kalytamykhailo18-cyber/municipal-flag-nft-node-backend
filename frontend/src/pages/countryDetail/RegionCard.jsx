/**
 * Region Card - Individual region display card
 */
import { useNavigate } from 'react-router-dom';

const RegionCard = ({ region }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/regions/${region.id}`)}
      data-animate="fade-up"
      data-duration="normal"
      className="card card-hover card-animate p-6 cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/regions/${region.id}`)}
    >
      <h2 className="text-white font-semibold text-lg mb-2">{region.name}</h2>
      <p className="text-gray-400 text-sm">{region.municipality_count} municipalities</p>
    </div>
  );
};

export default RegionCard;
