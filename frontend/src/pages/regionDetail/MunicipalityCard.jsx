/**
 * Municipality Card - Individual municipality display card
 */
import { useNavigate } from 'react-router-dom';

const MunicipalityCard = ({ municipality, index }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/municipalities/${municipality.id}`)}
      data-animate={index % 3 === 0 ? "zoom-in" : "fade-up"}
      data-duration="normal"
      className="card card-hover card-animate p-6 cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/municipalities/${municipality.id}`)}
    >
      <h2 className="text-white font-semibold text-lg mb-1">{municipality.name}</h2>
      <p className="text-gray-500 text-xs mb-2 font-mono">{municipality.coordinates}</p>
      <p className="text-gray-400 text-sm">{municipality.flag_count} flags</p>
    </div>
  );
};

export default MunicipalityCard;
