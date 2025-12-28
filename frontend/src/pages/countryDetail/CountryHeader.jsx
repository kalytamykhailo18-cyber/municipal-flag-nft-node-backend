/**
 * Country Header - Title and subtitle
 */
const CountryHeader = ({ countryName }) => {
  return (
    <div className="page-header">
      <h1
        data-animate="fade-down"
        data-duration="normal"
        className="page-title"
      >
        {countryName}
      </h1>
      <p
        data-animate="fade-up"
        data-duration="normal"
        className="page-subtitle"
      >
        Select a region to explore municipalities
      </p>
    </div>
  );
};

export default CountryHeader;
