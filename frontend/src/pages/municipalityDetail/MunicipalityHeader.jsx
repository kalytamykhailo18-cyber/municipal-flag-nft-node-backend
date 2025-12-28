/**
 * Municipality Header - Title and coordinates
 */
const MunicipalityHeader = ({ municipality }) => {
  return (
    <div className="page-header">
      <h1
        data-animate="fade-down"
        data-duration="normal"
        className="page-title"
      >
        {municipality.name}
      </h1>
      <p
        data-animate="fade-up"
        data-duration="normal"
        className="page-subtitle font-mono"
      >
        {municipality.coordinates}
      </p>
    </div>
  );
};

export default MunicipalityHeader;
