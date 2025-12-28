/**
 * Country Detail Page - Show regions of a country
 */
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCountry, selectCurrentCountry, selectCountriesLoading } from '../../store/slices/countriesSlice';
import Loading from '../../components/Loading';

import Breadcrumb from './Breadcrumb';
import CountryHeader from './CountryHeader';
import RegionCard from './RegionCard';
import EmptyState from './EmptyState';
import ErrorDisplay from './ErrorDisplay';

const CountryDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const country = useSelector(selectCurrentCountry);
  const loading = useSelector(selectCountriesLoading);

  useEffect(() => {
    dispatch(fetchCountry(id));
  }, [dispatch, id]);

  if (loading) return <Loading />;
  if (!country) return <ErrorDisplay message="Country not found" />;

  return (
    <div className="page-container">
      <Breadcrumb countryName={country.name} />
      <CountryHeader countryName={country.name} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {country.regions?.map((region) => (
          <RegionCard key={region.id} region={region} />
        ))}
      </div>

      {(!country.regions || country.regions.length === 0) && <EmptyState />}
    </div>
  );
};

export default CountryDetail;
