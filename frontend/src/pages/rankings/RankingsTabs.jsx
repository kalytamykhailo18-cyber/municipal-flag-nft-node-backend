/**
 * Rankings Tabs - Tab navigation for ranking types
 */
import TabButton from './TabButton';

const RankingsTabs = ({ activeTab, onTabChange }) => {
  return (
    <div
      data-animate="fade-up"
      data-duration="normal"
      className="flex gap-2 mb-8 border-b border-gray-800 pb-4"
    >
      <TabButton active={activeTab === 'users'} onClick={() => onTabChange('users')}>
        By Reputation
      </TabButton>
      <TabButton active={activeTab === 'collectors'} onClick={() => onTabChange('collectors')}>
        By Collection
      </TabButton>
      <TabButton active={activeTab === 'flags'} onClick={() => onTabChange('flags')}>
        Popular Flags
      </TabButton>
    </div>
  );
};

export default RankingsTabs;
