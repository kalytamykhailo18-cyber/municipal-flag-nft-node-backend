/**
 * RegionsTab - Admin CRUD interface for regions
 */
import { useState } from 'react';
import {
  createRegion,
  updateRegion,
  deleteRegion,
  toggleRegionVisibility,
} from '../../store/slices/adminSlice';
import AdminTable from './AdminTable';

const RegionsTab = ({ regions, countries, dispatch, actionLoading }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterCountryId, setFilterCountryId] = useState('');
  const [formData, setFormData] = useState({ name: '', country_id: '', is_visible: true });

  const filteredRegions = filterCountryId
    ? regions.filter((r) => r.country_id === parseInt(filterCountryId))
    : regions;

  const resetForm = () => {
    setFormData({ name: '', country_id: '', is_visible: true });
    setEditItem(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...formData, country_id: parseInt(formData.country_id) };
    if (editItem) {
      await dispatch(updateRegion({ regionId: editItem.id, regionData: data }));
    } else {
      await dispatch(createRegion(data));
    }
    resetForm();
  };

  const handleEdit = (region) => {
    setFormData({ name: region.name, country_id: region.country_id.toString(), is_visible: region.is_visible });
    setEditItem(region);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this region and all its municipalities/flags?')) {
      dispatch(deleteRegion(id));
    }
  };

  const getCountryName = (countryId) => countries.find((c) => c.id === countryId)?.name || 'Unknown';

  const columns = [
    { key: 'id', label: 'ID', className: 'text-gray-300' },
    { key: 'name', label: 'Name', className: 'text-white' },
    {
      key: 'country_id',
      label: 'Country',
      className: 'text-gray-400',
      render: (item) => getCountryName(item.country_id),
    },
    {
      key: 'municipality_count',
      label: 'Municipalities',
      className: 'text-gray-400',
      render: (item) => item.municipality_count || 0,
    },
    {
      key: 'is_visible',
      label: 'Visible',
      render: (item) => (
        <span className={`badge ${item.is_visible ? 'badge-available' : 'bg-gray-600'}`}>
          {item.is_visible ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(item)} className="text-blue-400 hover:text-blue-300">Edit</button>
          <button
            onClick={() => dispatch(toggleRegionVisibility({ regionId: item.id, isVisible: item.is_visible }))}
            className={item.is_visible ? 'text-yellow-400' : 'text-green-400'}
          >
            {item.is_visible ? 'Hide' : 'Show'}
          </button>
          <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4" data-animate="fade-right" data-duration="fast">
        <h2 className="text-xl font-bold text-white">Regions ({filteredRegions.length})</h2>
        <div className="flex gap-4">
          <select
            value={filterCountryId}
            onChange={(e) => setFilterCountryId(e.target.value)}
            className="input"
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? 'Cancel' : 'Add Region'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card p-6 mb-6" data-animate="fade-down" data-duration="fast">
          <h3 className="text-white font-semibold mb-4">{editItem ? 'Edit Region' : 'Add New Region'}</h3>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Region Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
            <select
              value={formData.country_id}
              onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
              className="input"
              required
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-gray-400">
              <input
                type="checkbox"
                checked={formData.is_visible}
                onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
              />
              Visible
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={actionLoading} className="btn btn-primary">
                {actionLoading ? 'Saving...' : editItem ? 'Update' : 'Create'}
              </button>
              {editItem && <button type="button" onClick={resetForm} className="btn btn-secondary">Cancel</button>}
            </div>
          </form>
        </div>
      )}

      <AdminTable columns={columns} data={filteredRegions} emptyMessage="No regions found." />
    </div>
  );
};

export default RegionsTab;
