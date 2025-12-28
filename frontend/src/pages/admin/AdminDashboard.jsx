/**
 * Admin Dashboard - Main admin interface with tabs
 */
import { useState } from 'react';
import StatsTab from './StatsTab';
import CountriesTab from './CountriesTab';
import RegionsTab from './RegionsTab';
import MunicipalitiesTab from './MunicipalitiesTab';
import FlagsTab from './FlagsTab';
import GenerateNFTTab from './GenerateNFTTab';
import DemoUserTab from './DemoUserTab';
import UtilitiesTab from './UtilitiesTab';

const TABS = ['Stats', 'Countries', 'Regions', 'Municipalities', 'Flags', 'Generate NFT', 'Demo User', 'Utilities'];

const AdminDashboard = ({
  stats, countries, regions, municipalities, flags, ipfsStatus, demoUser,
  nftGenerationResult, nftGenerating, checkingStreetView, streetViewAvailable, previewImages,
  loading, actionLoading, message, error, dispatch, onLogout
}) => {
  const [activeTab, setActiveTab] = useState('Stats');

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title" data-animate="fade-right" data-duration="normal">
          Admin Panel
        </h1>
        <button
          onClick={onLogout}
          className="btn btn-secondary"
          data-animate="fade-left"
          data-duration="fast"
        >
          Logout
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-6 p-4 bg-green-600/20 border border-green-600/50 rounded-[3px] text-green-400">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-600/20 border border-red-600/50 rounded-[3px] text-red-400">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex gap-2 mb-6 overflow-x-auto pb-2"
        data-animate="fade-up"
        data-duration="normal"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-[3px] font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-primary text-white'
                : 'bg-dark-lighter text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'Stats' && <StatsTab stats={stats} />}
        {activeTab === 'Countries' && (
          <CountriesTab
            countries={countries}
            dispatch={dispatch}
            actionLoading={actionLoading}
          />
        )}
        {activeTab === 'Regions' && (
          <RegionsTab
            regions={regions}
            countries={countries}
            dispatch={dispatch}
            actionLoading={actionLoading}
          />
        )}
        {activeTab === 'Municipalities' && (
          <MunicipalitiesTab
            municipalities={municipalities}
            regions={regions}
            dispatch={dispatch}
            actionLoading={actionLoading}
          />
        )}
        {activeTab === 'Flags' && (
          <FlagsTab
            flags={flags}
            municipalities={municipalities}
            dispatch={dispatch}
            actionLoading={actionLoading}
          />
        )}
        {activeTab === 'Generate NFT' && (
          <GenerateNFTTab
            municipalities={municipalities}
            dispatch={dispatch}
            nftGenerationResult={nftGenerationResult}
            nftGenerating={nftGenerating}
            checkingStreetView={checkingStreetView}
            streetViewAvailable={streetViewAvailable}
            previewImages={previewImages}
          />
        )}
        {activeTab === 'Demo User' && (
          <DemoUserTab
            demoUser={demoUser}
            dispatch={dispatch}
            loading={loading}
            actionLoading={actionLoading}
          />
        )}
        {activeTab === 'Utilities' && (
          <UtilitiesTab
            ipfsStatus={ipfsStatus}
            dispatch={dispatch}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
