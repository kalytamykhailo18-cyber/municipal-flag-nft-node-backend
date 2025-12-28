/**
 * Flag Detail Page - Full flag information with actions
 *
 * MATCHING GAME FEATURE:
 * =====================
 * - Flag details are hidden until user shows interest
 * - "Show Interest" reveals the flag information
 * - After interest, user can claim the first NFT (free)
 * - After claiming first NFT, user can purchase the second NFT
 *
 * MULTI-NFT FEATURE:
 * ================================
 * - nfts_required=1: Standard single NFT acquisition
 * - nfts_required=3: Grouped NFTs requiring 3 NFTs to obtain
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchFlag,
  fetchDiscountedPrice,
  registerInterest,
  claimFirstNFT,
  purchaseSecondNFT,
  selectCurrentFlag,
  selectFlagsLoading,
  selectActionLoading,
  selectDiscountedPrice,
} from '../../store/slices/flagsSlice';
import { selectAddress, selectIsConnected, connectWallet } from '../../store/slices/walletSlice';
import { claimFirstNFT as web3ClaimFirst, purchaseSecondNFT as web3PurchaseSecond, getFlagNftsRequired } from '../../services/web3';
import config from '../../config';
import Loading from '../../components/Loading';

import ErrorDisplay from './ErrorDisplay';
import MysteryView from './MysteryView';
import Breadcrumb from './Breadcrumb';
import FlagImage from './FlagImage';
import PriceCard from './PriceCard';
import ActionButtons from './ActionButtons';
import InterestedUsers from './InterestedUsers';
import Owners from './Owners';
import { animationStyles } from './styles';

const FlagDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const flag = useSelector(selectCurrentFlag);
  const loading = useSelector(selectFlagsLoading);
  const actionLoading = useSelector(selectActionLoading);
  const address = useSelector(selectAddress);
  const isConnected = useSelector(selectIsConnected);
  const discountedPrice = useSelector(selectDiscountedPrice(id));

  const [contractNftsRequired, setContractNftsRequired] = useState(null);
  const nftsRequired = contractNftsRequired || flag?.nfts_required || 1;

  const [interestLoading, setInterestLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  const isActionLoading = actionLoading || interestLoading || claimLoading || purchaseLoading;

  useEffect(() => {
    dispatch(fetchFlag(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (flag && address && config.contractAddress) {
      dispatch(fetchDiscountedPrice({ flagId: flag.id, address }));
    }
  }, [dispatch, flag, address]);

  useEffect(() => {
    const fetchContractNftsRequired = async () => {
      if (flag && config.contractAddress) {
        try {
          const nfts = await getFlagNftsRequired(flag.id);
          setContractNftsRequired(nfts);
        } catch (error) {
          console.error('Error fetching nfts_required from contract:', error);
        }
      }
    };
    fetchContractNftsRequired();
  }, [flag]);

  const isRevealed = (() => {
    if (!flag || !address) return false;

    const hasInterest = flag.interests?.some(
      i => i.user?.wallet_address?.toLowerCase() === address?.toLowerCase()
    );
    if (hasInterest) return true;

    const ownsNft = flag.ownerships?.some(
      o => o.user?.wallet_address?.toLowerCase() === address?.toLowerCase()
    );
    if (ownsNft) return true;

    return false;
  })();

  const handleShowInterest = async () => {
    if (!isConnected) {
      dispatch(connectWallet());
      return;
    }
    setInterestLoading(true);
    try {
      await dispatch(registerInterest({ flagId: flag.id, address })).unwrap();
      await dispatch(fetchFlag(id)).unwrap();
      setIsRevealing(true);
      setTimeout(() => setIsRevealing(false), 1000);
    } catch (err) {
      alert(err.message || 'Failed to register interest');
    } finally {
      setInterestLoading(false);
    }
  };

  const handleClaimFirst = async () => {
    if (!isConnected) {
      dispatch(connectWallet());
      return;
    }
    setClaimLoading(true);
    try {
      const result = await web3ClaimFirst(flag.id);
      await dispatch(claimFirstNFT({ flagId: flag.id, address, transactionHash: result.transactionHash })).unwrap();
      await dispatch(fetchFlag(id)).unwrap();
      if (nftsRequired > 1) {
        alert(`Successfully claimed ${nftsRequired} first NFTs!`);
      } else {
        alert('First NFT claimed successfully!');
      }
    } catch (err) {
      alert(err.message || 'Transaction error');
    } finally {
      setClaimLoading(false);
    }
  };

  const handlePurchaseSecond = async () => {
    if (!isConnected) {
      dispatch(connectWallet());
      return;
    }
    setPurchaseLoading(true);
    try {
      const pricePerNft = discountedPrice || flag.price;
      const totalPrice = parseFloat(pricePerNft) * nftsRequired;
      const result = await web3PurchaseSecond(flag.id, totalPrice.toString());
      await dispatch(purchaseSecondNFT({ flagId: flag.id, address, transactionHash: result.transactionHash })).unwrap();
      await dispatch(fetchFlag(id)).unwrap();
      if (nftsRequired > 1) {
        alert(`Successfully purchased ${nftsRequired} second NFTs! Pair complete!`);
      } else {
        alert('Second NFT purchased! Pair complete!');
      }
    } catch (err) {
      alert(err.message || 'Transaction error');
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (loading) return <Loading text="Loading flag details..." />;
  if (!flag) return <ErrorDisplay message="Flag not found" />;

  const hasUserInterest = flag.interests?.some(i => i.user?.wallet_address?.toLowerCase() === address?.toLowerCase());
  const userOwnsFirstNFT = flag.ownerships?.some(
    o => o.user?.wallet_address?.toLowerCase() === address?.toLowerCase() && o.ownership_type?.toUpperCase() === 'FIRST'
  );

  if (!isRevealed) {
    return (
      <MysteryView
        flag={flag}
        nftsRequired={nftsRequired}
        isConnected={isConnected}
        isActionLoading={isActionLoading}
        interestLoading={interestLoading}
        onShowInterest={handleShowInterest}
      />
    );
  }

  return (
    <div className="page-container">
      <Breadcrumb flag={flag} />

      <div className="grid lg:grid-cols-2 gap-8">
        <FlagImage
          flag={flag}
          nftsRequired={nftsRequired}
          isRevealing={isRevealing}
        />

        <div>
          <h1
            data-animate="fade-down"
            data-duration="normal"
            className="text-3xl font-bold text-white mb-2"
          >
            {flag.location_type} Flag
          </h1>
          <p
            data-animate="fade-up"
            data-duration="normal"
            className="text-gray-400 font-mono mb-6"
          >
            {flag.name}
          </p>

          {nftsRequired > 1 && (
            <div
              data-animate="fade-right"
              data-duration="normal"
              className="card p-4 mb-4 bg-purple-900/20 border border-purple-600/30"
            >
              <h3 className="text-purple-300 font-semibold mb-2">Grouped NFT Flag</h3>
              <p className="text-gray-400 text-sm">
                This flag requires <span className="text-purple-300 font-bold">{nftsRequired} NFTs</span> to obtain.
                You will mint/purchase {nftsRequired} NFT pairs in a single transaction.
              </p>
            </div>
          )}

          <PriceCard
            flag={flag}
            nftsRequired={nftsRequired}
            discountedPrice={discountedPrice}
          />

          <ActionButtons
            flag={flag}
            nftsRequired={nftsRequired}
            discountedPrice={discountedPrice}
            userOwnsFirstNFT={userOwnsFirstNFT}
            hasUserInterest={hasUserInterest}
            isActionLoading={isActionLoading}
            interestLoading={interestLoading}
            claimLoading={claimLoading}
            purchaseLoading={purchaseLoading}
            onShowInterest={handleShowInterest}
            onClaimFirst={handleClaimFirst}
            onPurchaseSecond={handlePurchaseSecond}
          />

          <InterestedUsers interests={flag.interests} />
          <Owners ownerships={flag.ownerships} />
        </div>
      </div>

      <style>{animationStyles}</style>
    </div>
  );
};

export default FlagDetail;
