/**
 * Municipality Detail Page - Show flags of a municipality
 *
 * MATCHING GAME FEATURE:
 * - Flags are displayed as mystery cards until user shows interest
 * - User must click a card and "Show Interest" to reveal the flag
 * - After revealing, user can claim the first NFT for free
 */
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMunicipality, selectCurrentMunicipality, selectCountriesLoading } from '../../store/slices/countriesSlice';
import { selectIsConnected } from '../../store/slices/walletSlice';
import Loading from '../../components/Loading';

import Breadcrumb from './Breadcrumb';
import MunicipalityHeader from './MunicipalityHeader';
import InstructionsBanner from './InstructionsBanner';
import FlagsGrid from './FlagsGrid';
import ErrorDisplay from './ErrorDisplay';

const MunicipalityDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const municipality = useSelector(selectCurrentMunicipality);
  const loading = useSelector(selectCountriesLoading);
  const isConnected = useSelector(selectIsConnected);

  useEffect(() => {
    dispatch(fetchMunicipality(id));
  }, [dispatch, id]);

  if (loading) return <Loading />;
  if (!municipality) return <ErrorDisplay message="Municipality not found" />;

  return (
    <div className="page-container">
      <Breadcrumb municipality={municipality} />
      <MunicipalityHeader municipality={municipality} />

      {!isConnected && (
        <InstructionsBanner hasFlags={municipality.flags?.length > 0} />
      )}

      <FlagsGrid flags={municipality.flags} />
    </div>
  );
};

export default MunicipalityDetail;
