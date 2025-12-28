/**
 * Breadcrumb - Navigation breadcrumb for flag detail
 */
import { useNavigate } from 'react-router-dom';

const Breadcrumb = ({ flag, isMystery = false }) => {
  const navigate = useNavigate();

  return (
    <nav className="breadcrumb">
      <button
        onClick={() => navigate('/countries')}
        data-animate="fade-right"
        data-duration="fast"
        className="bg-transparent border-none cursor-pointer text-inherit hover:text-primary"
      >
        Countries
      </button>
      {flag.municipality && (
        <>
          <span data-animate="fade" data-duration="fast">/</span>
          <button
            onClick={() => navigate(`/municipalities/${flag.municipality.id}`)}
            data-animate="fade-right"
            data-duration="fast"
            className="bg-transparent border-none cursor-pointer text-inherit hover:text-primary"
          >
            {flag.municipality.name}
          </button>
        </>
      )}
      <span data-animate="fade" data-duration="fast">/</span>
      <span
        data-animate="fade-left"
        data-duration="fast"
        className="text-white"
      >
        {isMystery ? 'Mystery Flag' : flag.location_type}
      </span>
    </nav>
  );
};

export default Breadcrumb;
