/**
 * FlagsTab - Admin CRUD interface for flags
 */
import { useState } from 'react';
import { createFlag, updateFlag } from '../../store/slices/adminSlice';
import AdminTable from './AdminTable';
import config from '../../config';

const FlagsTab = ({ flags, municipalities, dispatch, actionLoading }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterMunicipalityId, setFilterMunicipalityId] = useState('');
  const [formData, setFormData] = useState({
    name: '', municipality_id: '', location_type: '', category: 'standard', nfts_required: '1', price: config.prices.standard,
  });

  const filteredFlags = filterMunicipalityId
    ? flags.filter((f) => f.municipality_id === parseInt(filterMunicipalityId))
    : flags;

  const resetForm = () => {
    setFormData({ name: '', municipality_id: '', location_type: '', category: 'standard', nfts_required: '1', price: config.prices.standard });
    setEditItem(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      municipality_id: parseInt(formData.municipality_id),
      nfts_required: parseInt(formData.nfts_required),
      price: formData.price,
    };
    if (editItem) {
      await dispatch(updateFlag({ flagId: editItem.id, flagData: data }));
    } else {
      await dispatch(createFlag(data));
    }
    resetForm();
  };

  const handleEdit = (flag) => {
    setFormData({
      name: flag.name,
      municipality_id: flag.municipality_id.toString(),
      location_type: flag.location_type,
      category: flag.category,
      nfts_required: flag.nfts_required.toString(),
      price: flag.price.toString(),
    });
    setEditItem(flag);
    setShowForm(true);
  };

  const getMunicipalityName = (id) => municipalities.find((m) => m.id === id)?.name || 'Unknown';

  const getCategoryBadge = (category) => {
    const classes = {
      standard: 'bg-gray-500/20 text-gray-400',
      plus: 'bg-blue-500/20 text-blue-400',
      premium: 'bg-yellow-500/20 text-yellow-400',
    };
    return classes[category] || classes.standard;
  };

  const columns = [
    { key: 'id', label: 'ID', className: 'text-gray-300' },
    { key: 'name', label: 'Name', className: 'text-white text-sm' },
    {
      key: 'municipality_id',
      label: 'Municipality',
      className: 'text-gray-400',
      render: (item) => getMunicipalityName(item.municipality_id),
    },
    { key: 'location_type', label: 'Type', className: 'text-gray-400' },
    {
      key: 'category',
      label: 'Category',
      render: (item) => (
        <span className={`px-2 py-1 rounded text-xs ${getCategoryBadge(item.category)}`}>
          {item.category}
        </span>
      ),
    },
    { key: 'nfts_required', label: 'NFTs', className: 'text-gray-400' },
    {
      key: 'price',
      label: 'Price',
      className: 'text-primary',
      render: (item) => `${item.price} POL`,
    },
    {
      key: 'is_pair_complete',
      label: 'Status',
      render: (item) => (
        <span className={`badge ${item.is_pair_complete ? 'badge-claimed' : 'badge-available'}`}>
          {item.is_pair_complete ? 'Complete' : 'Available'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item) => (
        <button onClick={() => handleEdit(item)} className="text-blue-400 hover:text-blue-300">
          Edit
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4" data-animate="fade-right" data-duration="fast">
        <h2 className="text-xl font-bold text-white">Flags ({filteredFlags.length})</h2>
        <div className="flex gap-4">
          <select value={filterMunicipalityId} onChange={(e) => setFilterMunicipalityId(e.target.value)} className="input">
            <option value="">All Municipalities</option>
            {municipalities.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? 'Cancel' : 'Add Flag'}
          </button>
        </div>
      </div>

      <AdminTable columns={columns} data={filteredFlags} emptyMessage="No flags found." />

      {/* Flag Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div
            className="card max-w-2xl w-full p-6"
            data-animate="zoom-in"
            data-duration="fast"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editItem ? 'Edit Flag' : 'Add New Flag'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Flag Name (Coordinates)</label>
                  <input
                    type="text"
                    placeholder="e.g., 41.385100, 2.173400"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Municipality
                    {editItem && <span className="text-gray-500 ml-1">(cannot be changed)</span>}
                  </label>
                  <select
                    value={formData.municipality_id}
                    onChange={(e) => setFormData({ ...formData, municipality_id: e.target.value })}
                    className={`input w-full ${editItem ? 'opacity-50 cursor-not-allowed' : ''}`}
                    required
                    disabled={!!editItem}
                  >
                    <option value="">Select Municipality</option>
                    {municipalities.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Location Type</label>
                  <input
                    type="text"
                    placeholder="e.g., Fire Station, Town Hall"
                    value={formData.location_type}
                    onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input w-full"
                  >
                    <option value="standard">Standard</option>
                    <option value="plus">Plus</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">NFTs Required</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="1"
                    value={formData.nfts_required}
                    onChange={(e) => setFormData({ ...formData, nfts_required: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Price (MATIC)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary flex-1"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary flex-1"
                >
                  {actionLoading ? 'Saving...' : editItem ? 'Update Flag' : 'Create Flag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlagsTab;
