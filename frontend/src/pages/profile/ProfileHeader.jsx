/**
 * Profile Header - Title and address display
 */
import config from '../../config';

const ProfileHeader = ({ isOwnProfile, profile, address }) => {
  return (
    <div className="page-header">
      <h1
        data-animate="fade-down"
        data-duration="normal"
        className="page-title"
      >
        {isOwnProfile ? 'My Profile' : (profile?.username || 'User Profile')}
      </h1>
      <p
        data-animate="fade-up"
        data-duration="normal"
        className="text-gray-400 font-mono"
      >
        {config.truncateAddress(address, 8)}
      </p>
    </div>
  );
};

export default ProfileHeader;
