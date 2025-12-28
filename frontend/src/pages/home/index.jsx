/**
 * Home Page - Landing page for the application
 */
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCountries, selectCountries, selectCountriesLoading } from '../../store/slices/countriesSlice';
import { fetchPopularFlags, selectPopularFlags } from '../../store/slices/flagsSlice';
import Loading from '../../components/Loading';

import HeroSection from './HeroSection';
import HowItWorks from './HowItWorks';
import PopularFlags from './PopularFlags';
import CountriesPreview from './CountriesPreview';
import Categories from './Categories';

const Home = () => {
  const dispatch = useDispatch();
  const countries = useSelector(selectCountries);
  const popularFlags = useSelector(selectPopularFlags);
  const loading = useSelector(selectCountriesLoading);

  useEffect(() => {
    dispatch(fetchCountries());
    dispatch(fetchPopularFlags(4));
  }, [dispatch]);

  if (loading && countries.length === 0) return <Loading text="Loading..." />;

  return (
    <div className="min-h-screen">
      <HeroSection countriesCount={countries.length} />
      <HowItWorks />
      <PopularFlags flags={popularFlags} />
      <CountriesPreview countries={countries} />
      <Categories />
    </div>
  );
};

export default Home;
