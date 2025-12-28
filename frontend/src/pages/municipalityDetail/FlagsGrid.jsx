/**
 * Flags Grid - Display municipality flags
 */
import FlagCard from '../../components/FlagCard';

const FlagsGrid = ({ flags }) => {
  if (!flags || flags.length === 0) {
    return (
      <div
        data-animate="fade-up"
        data-duration="slow"
        className="text-center py-16"
      >
        <p className="text-gray-400">No flags available in this municipality.</p>
      </div>
    );
  }

  return (
    <div className="grid-cards">
      {flags.map((flag) => (
        <div
          key={flag.id}
          data-animate="fade-up"
          data-duration="normal"
        >
          <FlagCard flag={flag} />
        </div>
      ))}
    </div>
  );
};

export default FlagsGrid;
