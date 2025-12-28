/**
 * Interests Section - Display user's flag interests
 */
import { useNavigate } from 'react-router-dom';

const InterestsSection = ({ interests, isOwnProfile }) => {
  const navigate = useNavigate();

  return (
    <section>
      <h2
        data-animate="fade-right"
        data-duration="normal"
        className="text-xl font-bold text-white mb-4"
      >
        {isOwnProfile ? 'My Interests' : 'Interests'} ({interests.length})
      </h2>
      {interests.length > 0 ? (
        <div
          data-animate="fade-up"
          data-duration="normal"
          className="card divide-y divide-gray-800"
        >
          {interests.map((interest) => (
            <div
              key={interest.id}
              onClick={() => navigate(`/flags/${interest.flag_id}`)}
              data-animate="fade-right"
              data-duration="fast"
              className="flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/flags/${interest.flag_id}`)}
            >
              <span className="text-white">Flag #{interest.flag_id}</span>
              <span className="text-gray-500 text-sm">
                {new Date(interest.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div
          data-animate="fade-up"
          data-duration="slow"
          className="card p-8 text-center"
        >
          <p className="text-gray-500">You haven't shown interest in any flags</p>
        </div>
      )}
    </section>
  );
};

export default InterestsSection;
