/**
 * Main App Component
 */
import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkConnection } from './store/slices/walletSlice';
import Header from './components/Header';
import Loading from './components/Loading';
import Home from './pages/Home';
import Countries from './pages/Countries';
import FlagDetail from './pages/FlagDetail';

// Lazy load other pages
const CountryDetail = lazy(() => import('./pages/CountryDetail'));
const RegionDetail = lazy(() => import('./pages/RegionDetail'));
const MunicipalityDetail = lazy(() => import('./pages/MunicipalityDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Auctions = lazy(() => import('./pages/Auctions'));
const AuctionDetail = lazy(() => import('./pages/AuctionDetail'));
const Rankings = lazy(() => import('./pages/Rankings'));
const Admin = lazy(() => import('./pages/Admin'));

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkConnection());
  }, [dispatch]);

  return (
    <Router>
      <div className="min-h-screen bg-dark-darker flex flex-col">
        <Header />
        <main className="flex-1">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/countries" element={<Countries />} />
              <Route path="/countries/:id" element={<CountryDetail />} />
              <Route path="/regions/:id" element={<RegionDetail />} />
              <Route path="/municipalities/:id" element={<MunicipalityDetail />} />
              <Route path="/flags/:id" element={<FlagDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:address" element={<Profile />} />
              <Route path="/auctions" element={<Auctions />} />
              <Route path="/auctions/:id" element={<AuctionDetail />} />
              <Route path="/rankings" element={<Rankings />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </Suspense>
        </main>
        <footer className="bg-dark border-t border-gray-800 py-6 text-center">
          <p className="text-gray-400 text-sm">Municipal Flag NFT Game - Demo Version</p>
          <p className="text-gray-500 text-xs mt-1">Built on Polygon Amoy Testnet</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
