/**
 * Countries Header - Title and subtitle
 */
const CountriesHeader = () => {
  return (
    <div className="page-header">
      <h1
        data-animate="fade-down"
        data-duration="normal"
        className="page-title"
      >
        Explore Countries
      </h1>
      <p
        data-animate="fade-up"
        data-duration="normal"
        className="page-subtitle"
      >
        Select a country to explore its regions and municipal flags
      </p>
    </div>
  );
};

export default CountriesHeader;
