/**
 * Country Card - Individual country display card
 */
import { useNavigate } from 'react-router-dom';
import { getCountryEmoji } from './utils';

const CountryCard = ({ country, index }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/countries/${country.id}`)}
      data-animate={index % 2 === 0 ? "fade-up" : "zoom-in"}
      data-duration="normal"
      className="card card-hover card-animate p-6 flex items-center gap-4 cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/countries/${country.id}`)}
    >
      <span className="text-5xl">{getCountryEmoji(country.code)}</span>
      <div>
        <h2 className="text-white font-semibold text-lg">{country.name}</h2>
        <span className="text-gray-500 text-sm">{country.code}</span>
        <p className="text-gray-400 text-sm mt-1">
          {country.region_count} {country.region_count === 1 ? 'region' : 'regions'}
        </p>
      </div>
    </div>
  );
};

export default CountryCard;
