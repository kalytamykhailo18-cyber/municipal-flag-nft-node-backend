/**
 * Rankings Page - Leaderboards
 */
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAllRankings,
  selectUserRankings,
  selectCollectorRankings,
  selectFlagRankings,
  selectRankingsLoading,
} from '../../store/slices/rankingsSlice';
import Loading from '../../components/Loading';

import RankingsHeader from './RankingsHeader';
import RankingsTabs from './RankingsTabs';
import RankingsList from './RankingsList';

const Rankings = () => {
  const dispatch = useDispatch();
  const [tab, setTab] = useState('users');
  const userRankings = useSelector(selectUserRankings);
  const collectorRankings = useSelector(selectCollectorRankings);
  const flagRankings = useSelector(selectFlagRankings);
  const loading = useSelector(selectRankingsLoading);

  useEffect(() => {
    dispatch(fetchAllRankings(10));
  }, [dispatch]);

  if (loading && userRankings.length === 0) return <Loading />;

  const getCurrentRankings = () => {
    switch (tab) {
      case 'users':
        return userRankings;
      case 'collectors':
        return collectorRankings;
      case 'flags':
        return flagRankings;
      default:
        return [];
    }
  };

  return (
    <div className="page-container">
      <RankingsHeader />
      <RankingsTabs activeTab={tab} onTabChange={setTab} />
      <RankingsList rankings={getCurrentRankings()} tab={tab} />
    </div>
  );
};

export default Rankings;
