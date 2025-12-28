/**
 * Countries Page - List all countries
 */
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCountries, selectCountries, selectCountriesLoading, selectCountriesError } from '../../store/slices/countriesSlice';
import Loading from '../../components/Loading';

import CountriesHeader from './CountriesHeader';
import CountryCard from './CountryCard';
import EmptyState from './EmptyState';
import ErrorDisplay from './ErrorDisplay';

const Countries = () => {
  const dispatch = useDispatch();
  const countries = useSelector(selectCountries);
  const loading = useSelector(selectCountriesLoading);
  const error = useSelector(selectCountriesError);

  useEffect(() => {
    dispatch(fetchCountries());
  }, [dispatch]);

  if (loading && countries.length === 0) return <Loading text="Loading countries..." />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="page-container">
      <CountriesHeader />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {countries.map((country, index) => (
          <CountryCard key={country.id} country={country} index={index} />
        ))}
      </div>

      {countries.length === 0 && <EmptyState />}
    </div>
  );
};

export default Countries;
