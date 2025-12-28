/**
 * Owners - List of flag owners
 */
import config from '../../config';

const Owners = ({ ownerships }) => {
  return (
    <div
      data-animate="fade-left"
      data-duration="normal"
      className="card p-6"
    >
      <h3 className="text-white font-semibold mb-4">Owners</h3>
      {ownerships?.length > 0 ? (
        <ul className="space-y-2">
          {ownerships.map((ownership) => (
            <li
              key={ownership.id}
              data-animate="fade-right"
              data-duration="fast"
              className="flex justify-between text-sm"
            >
              <span className="text-gray-400 font-mono">{config.truncateAddress(ownership.user?.wallet_address)}</span>
              <span className="text-gray-500">{ownership.ownership_type}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm">No owners yet</p>
      )}
    </div>
  );
};

export default Owners;
