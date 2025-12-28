/**
 * Breadcrumb - Navigation breadcrumb for municipality detail
 */
import { useNavigate } from 'react-router-dom';

const Breadcrumb = ({ municipality }) => {
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
      <button
        onClick={() => navigate(`/regions/${municipality.region?.id}`)}
        data-animate="fade-right"
        data-duration="fast"
        className="bg-transparent border-none cursor-pointer text-inherit hover:text-primary"
      >
        {municipality.region?.name}
      </button>
      <span data-animate="fade" data-duration="fast">/</span>
      <span
        data-animate="fade-left"
        data-duration="fast"
        className="text-white"
      >
        {municipality.name}
      </span>
    </nav>
  );
};

export default Breadcrumb;
