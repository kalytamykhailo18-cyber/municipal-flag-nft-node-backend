/**
 * Profile Stats - Stats grid section
 */
const ProfileStats = ({ profile, flagsCount, interestsCount }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div
        data-animate="flip-up"
        data-duration="normal"
        className="stat-card"
      >
        <span className="stat-value">{profile?.reputation_score || 0}</span>
        <span className="stat-label">Reputation</span>
      </div>
      <div
        data-animate="flip-up"
        data-duration="normal"
        className="stat-card"
      >
        <span className="stat-value">{flagsCount}</span>
        <span className="stat-label">Flags Owned</span>
      </div>
      <div
        data-animate="flip-up"
        data-duration="normal"
        className="stat-card"
      >
        <span className="stat-value">{interestsCount}</span>
        <span className="stat-label">Interests</span>
      </div>
      <div
        data-animate="flip-up"
        data-duration="normal"
        className="stat-card"
      >
        <span className="stat-value">{profile?.followers_count || 0}</span>
        <span className="stat-label">Followers</span>
      </div>
    </div>
  );
};

export default ProfileStats;
