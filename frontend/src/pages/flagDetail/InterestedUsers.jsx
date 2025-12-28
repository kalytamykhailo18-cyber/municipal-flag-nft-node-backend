/**
 * Interested Users - List of users who showed interest
 */
import config from '../../config';

const InterestedUsers = ({ interests }) => {
  return (
    <div
      data-animate="fade-left"
      data-duration="normal"
      className="card p-6 mb-4"
    >
      <h3 className="text-white font-semibold mb-4">Interested Users ({interests?.length || 0})</h3>
      {interests?.length > 0 ? (
        <ul className="space-y-2">
          {interests.map((interest) => (
            <li
              key={interest.id}
              data-animate="fade-right"
              data-duration="fast"
              className="text-gray-400 text-sm font-mono"
            >
              {config.truncateAddress(interest.user?.wallet_address)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm">No one has shown interest yet</p>
      )}
    </div>
  );
};

export default InterestedUsers;
