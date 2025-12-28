/**
 * Breadcrumb - Navigation breadcrumb
 */
import { useNavigate } from 'react-router-dom';

const Breadcrumb = ({ countryName }) => {
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
      <span data-animate="fade" data-duration="fast">/</span>
      <span
        data-animate="fade-left"
        data-duration="fast"
        className="text-white"
      >
        {countryName}
      </span>
    </nav>
  );
};

export default Breadcrumb;
