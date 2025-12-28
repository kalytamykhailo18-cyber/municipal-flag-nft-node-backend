/**
 * Region Detail Page - Show municipalities of a region
 */
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRegion, selectCurrentRegion, selectCountriesLoading } from '../../store/slices/countriesSlice';
import Loading from '../../components/Loading';

import Breadcrumb from './Breadcrumb';
import RegionHeader from './RegionHeader';
import MunicipalityCard from './MunicipalityCard';
import EmptyState from './EmptyState';
import ErrorDisplay from './ErrorDisplay';

const RegionDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const region = useSelector(selectCurrentRegion);
  const loading = useSelector(selectCountriesLoading);

  useEffect(() => {
    dispatch(fetchRegion(id));
  }, [dispatch, id]);

  if (loading) return <Loading />;
  if (!region) return <ErrorDisplay message="Region not found" />;

  return (
    <div className="page-container">
      <Breadcrumb region={region} />
      <RegionHeader regionName={region.name} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {region.municipalities?.map((muni, index) => (
          <MunicipalityCard key={muni.id} municipality={muni} index={index} />
        ))}
      </div>

      {(!region.municipalities || region.municipalities.length === 0) && <EmptyState />}
    </div>
  );
};

export default RegionDetail;
