/**
 * Countries Preview - Featured countries section
 */
import { useNavigate } from 'react-router-dom';
import { getCountryEmoji } from './utils';

const CountriesPreview = ({ countries }) => {
  const navigate = useNavigate();

  return (
    <section className="page-container py-16">
      <div className="flex items-center justify-between mb-8">
        <h2
          data-animate="fade-right"
          data-duration="normal"
          className="section-title mb-0"
        >
          Explore Countries
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
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {countries.slice(0, 4).map((country) => (
          <div
            key={country.id}
            onClick={() => navigate(`/countries/${country.id}`)}
            data-animate="zoom-in"
            data-duration="normal"
            className="card card-hover card-animate p-6 text-center cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/countries/${country.id}`)}
          >
            <span className="text-5xl mb-4 block">{getCountryEmoji(country.code)}</span>
            <h3 className="text-white font-semibold text-lg mb-1">{country.name}</h3>
            <span className="text-gray-400 text-sm">{country.region_count} regions</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CountriesPreview;
