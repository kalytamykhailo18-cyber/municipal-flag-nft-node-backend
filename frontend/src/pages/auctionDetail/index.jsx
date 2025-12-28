/**
 * Auction Detail Page - View auction details and place bids
 *
 * ENHANCED FEATURES:
 * - Displays min_price (floor price)
 * - Displays buyout_price with instant buyout button
 * - Bidder category selection for tie-breaking
 * - Shows winner_category for closed auctions
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAuction,
  placeBid,
  buyoutAuction,
  selectCurrentAuction,
  selectAuctionsLoading,
  selectActionLoading,
  clearCurrentAuction,
} from '../../store/slices/auctionsSlice';
import { selectAddress, selectIsConnected, connectWallet } from '../../store/slices/walletSlice';
import Loading from '../../components/Loading';
import config from '../../config';

import AuctionNotFound from './AuctionNotFound';
import AuctionImage from './AuctionImage';
import AuctionInfo from './AuctionInfo';
import SellerInfo from './SellerInfo';
import BuyoutSection from './BuyoutSection';
import BidForm from './BidForm';
import BidHistory from './BidHistory';

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auction = useSelector(selectCurrentAuction);
  const loading = useSelector(selectAuctionsLoading);
  const actionLoading = useSelector(selectActionLoading);
  const address = useSelector(selectAddress);
  const isConnected = useSelector(selectIsConnected);

  const [bidAmount, setBidAmount] = useState('');
  const [bidderCategory, setBidderCategory] = useState('standard');
  const [bidding, setBidding] = useState(false);
  const [buyingOut, setBuyingOut] = useState(false);

  useEffect(() => {
    dispatch(fetchAuction(id));
    return () => {
      dispatch(clearCurrentAuction());
    };
  }, [dispatch, id]);

  const handleConnect = () => dispatch(connectWallet());

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      alert('Please enter a valid bid amount');
      return;
    }

    if (parseFloat(bidAmount) < parseFloat(auction.min_price)) {
      alert(`Bid must be at least ${config.formatPrice(auction.min_price)} POL (minimum price)`);
      return;
    }

    setBidding(true);
    try {
      await dispatch(placeBid({
        auctionId: parseInt(id),
        walletAddress: address,
        amount: parseFloat(bidAmount),
        bidderCategory: bidderCategory,
      })).unwrap();

      alert('Bid placed successfully!');
      setBidAmount('');
    } catch (error) {
      alert(error || 'Failed to place bid');
    } finally {
      setBidding(false);
    }
  };

  const handleBuyout = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!window.confirm(`Are you sure you want to buyout this auction for ${config.formatPrice(auction.buyout_price)} POL?`)) {
      return;
    }

    setBuyingOut(true);
    try {
      await dispatch(buyoutAuction({
        auctionId: parseInt(id),
        walletAddress: address,
      })).unwrap();

      alert('Buyout successful! You now own this flag.');
    } catch (error) {
      alert(error || 'Failed to buyout auction');
    } finally {
      setBuyingOut(false);
    }
  };

  if (loading && !auction) return <Loading text="Loading auction details..." />;
  if (!auction) return <AuctionNotFound />;

  const timeRemaining = new Date(auction.ends_at) - new Date();
  const isEnded = timeRemaining <= 0 || auction.status !== 'active';
  const isSeller = address?.toLowerCase() === auction.seller?.wallet_address?.toLowerCase();
  const currentHighestBid = auction.current_highest_bid || auction.starting_price;
  const minBidAmount = Math.max(
    parseFloat(auction.min_price),
    parseFloat(currentHighestBid) + 0.001
  );

  return (
    <div className="page-container">
      {/* Breadcrumb */}
      <nav className="breadcrumb mb-6">
        <button
          onClick={() => navigate('/auctions')}
          data-animate="fade-right"
          data-duration="fast"
          className="bg-transparent border-none cursor-pointer text-inherit hover:text-primary"
        >
          Auctions
        </button>
        <span data-animate="fade" data-duration="fast">/</span>
        <span
          data-animate="fade-left"
          data-duration="fast"
          className="text-white"
        >
          Auction #{auction.id}
        </span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <AuctionImage auction={auction} />

        {/* Auction Info Section */}
        <div>
          <AuctionInfo
            auction={auction}
            isEnded={isEnded}
            currentHighestBid={currentHighestBid}
          />

          <SellerInfo auction={auction} />

          <BuyoutSection
            auction={auction}
            isEnded={isEnded}
            isSeller={isSeller}
            isConnected={isConnected}
            buyingOut={buyingOut}
            actionLoading={actionLoading}
            onConnect={handleConnect}
            onBuyout={handleBuyout}
          />

          <BidForm
            auction={auction}
            isEnded={isEnded}
            isSeller={isSeller}
            isConnected={isConnected}
            bidAmount={bidAmount}
            bidderCategory={bidderCategory}
            bidding={bidding}
            actionLoading={actionLoading}
            minBidAmount={minBidAmount}
            onConnect={handleConnect}
            onBidAmountChange={setBidAmount}
            onBidderCategoryChange={setBidderCategory}
            onSubmit={handlePlaceBid}
          />
        </div>
      </div>

      <BidHistory auction={auction} />
    </div>
  );
};

export default AuctionDetail;
