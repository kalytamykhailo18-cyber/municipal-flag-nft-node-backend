/**
 * Profile Page - User's profile with flags and interests
 * Supports viewing own profile (when connected) or any user's profile by address
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { connectWallet, selectAddress, selectIsConnected } from '../../store/slices/walletSlice';
import { fetchUserData, selectUserProfile, selectUserFlags, selectUserInterests, selectUserLoading } from '../../store/slices/userSlice';
import Loading from '../../components/Loading';
import api from '../../services/api';

import ConnectWalletPrompt from './ConnectWalletPrompt';
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import FlagsSection from './FlagsSection';
import InterestsSection from './InterestsSection';
import AuctionModal from './AuctionModal';

const Profile = () => {
  const dispatch = useDispatch();
  const { address: urlAddress } = useParams();
  const connectedAddress = useSelector(selectAddress);
  const isConnected = useSelector(selectIsConnected);
  const profile = useSelector(selectUserProfile);
  const flags = useSelector(selectUserFlags);
  const interests = useSelector(selectUserInterests);
  const loading = useSelector(selectUserLoading);

  const address = urlAddress || connectedAddress;
  const isOwnProfile = !urlAddress || (isConnected && urlAddress?.toLowerCase() === connectedAddress?.toLowerCase());

  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [auctionData, setAuctionData] = useState({
    starting_price: '',
    duration_hours: 168
  });
  const [creating, setCreating] = useState(false);
  const [activeAuctions, setActiveAuctions] = useState([]);

  useEffect(() => {
    if (address) {
      dispatch(fetchUserData(address));
      loadActiveAuctions();
    }
  }, [dispatch, address]);

  const loadActiveAuctions = async () => {
    try {
      const response = await api.get('/auctions?active_only=true');
      const auctions = response.data || response || [];
      setActiveAuctions(Array.isArray(auctions) ? auctions : []);
    } catch (error) {
      console.error('Failed to load auctions:', error);
    }
  };

  const handleConnect = () => dispatch(connectWallet());

  const handleCreateAuction = (flag) => {
    setSelectedFlag(flag);
    setShowAuctionModal(true);
  };

  const handleCloseModal = () => {
    setShowAuctionModal(false);
    setSelectedFlag(null);
  };

  const handleSubmitAuction = async (e) => {
    e.preventDefault();
    if (!selectedFlag || !address) return;

    setCreating(true);
    try {
      await api.post('/auctions', {
        flag_id: selectedFlag.flag_id,
        wallet_address: address,
        starting_price: parseFloat(auctionData.starting_price),
        duration_hours: parseInt(auctionData.duration_hours)
      });

      alert('Auction created successfully! Check the Auctions page.');

      setShowAuctionModal(false);
      setAuctionData({ starting_price: '', duration_hours: 168 });
      setSelectedFlag(null);

      dispatch(fetchUserData(address));
      loadActiveAuctions();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create auction');
    } finally {
      setCreating(false);
    }
  };

  if (!address) {
    return <ConnectWalletPrompt onConnect={handleConnect} />;
  }

  if (loading) return <Loading />;

  return (
    <div className="page-container">
      <ProfileHeader
        isOwnProfile={isOwnProfile}
        profile={profile}
        address={address}
      />

      <ProfileStats
        profile={profile}
        flagsCount={flags.length}
        interestsCount={interests.length}
      />

      <FlagsSection
        flags={flags}
        isOwnProfile={isOwnProfile}
        activeAuctions={activeAuctions}
        onCreateAuction={handleCreateAuction}
      />

      <InterestsSection
        interests={interests}
        isOwnProfile={isOwnProfile}
      />

      <AuctionModal
        show={showAuctionModal}
        selectedFlag={selectedFlag}
        auctionData={auctionData}
        creating={creating}
        onClose={handleCloseModal}
        onSubmit={handleSubmitAuction}
        onDataChange={setAuctionData}
      />
    </div>
  );
};

export default Profile;
