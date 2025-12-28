/**
 * Auctions Page - Active auctions list
 *
 * ENHANCED FEATURES:
 * - Displays min_price (floor price)
 * - Displays buyout_price (instant purchase option)
 * - Shows category badge for bidders
 */
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAuctions,
  selectAuctions,
  selectAuctionsLoading,
} from '../../store/slices/auctionsSlice';
import Loading from '../../components/Loading';

import AuctionsHeader from './AuctionsHeader';
import AuctionCard from './AuctionCard';
import EmptyState from './EmptyState';

const Auctions = () => {
  const dispatch = useDispatch();
  const auctions = useSelector(selectAuctions);
  const loading = useSelector(selectAuctionsLoading);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    dispatch(fetchAuctions(!showAll));
  }, [dispatch, showAll]);

  if (loading && auctions.length === 0) return <Loading />;

  return (
    <div className="page-container">
      <AuctionsHeader
        showAll={showAll}
        onShowAllChange={setShowAll}
      />

      {auctions.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      ) : (
        <EmptyState showAll={showAll} />
      )}
    </div>
  );
};

export default Auctions;
