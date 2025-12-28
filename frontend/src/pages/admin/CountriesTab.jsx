/**
 * CountriesTab - Admin CRUD interface for countries
 */
import { useState } from 'react';
import {
  createCountry,
  updateCountry,
  deleteCountry,
  toggleCountryVisibility,
} from '../../store/slices/adminSlice';
import AdminTable from './AdminTable';

const CountriesTab = ({ countries, dispatch, actionLoading }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', is_visible: true });

  const resetForm = () => {
    setFormData({ name: '', code: '', is_visible: true });
    setEditItem(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editItem) {
      await dispatch(updateCountry({ countryId: editItem.id, countryData: formData }));
    } else {
      await dispatch(createCountry(formData));
    }
    resetForm();
  };

  const handleEdit = (country) => {
    setFormData({ name: country.name, code: country.code, is_visible: country.is_visible });
    setEditItem(country);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this country? This will also delete all regions, municipalities, and flags.')) {
      dispatch(deleteCountry(id));
    }
  };

  const columns = [
    { key: 'id', label: 'ID', className: 'text-gray-300' },
    { key: 'name', label: 'Name', className: 'text-white' },
    { key: 'code', label: 'Code', className: 'text-gray-400' },
    {
      key: 'region_count',
      label: 'Regions',
      className: 'text-gray-400',
      render: (item) => item.region_count || 0
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
          <button onClick={() => handleEdit(item)} className="text-blue-400 hover:text-blue-300">
            Edit
          </button>
          <button
            onClick={() => dispatch(toggleCountryVisibility({ countryId: item.id, isVisible: item.is_visible }))}
            className={item.is_visible ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}
          >
            {item.is_visible ? 'Hide' : 'Show'}
          </button>
          <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300">
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4" data-animate="fade-right" data-duration="fast">
        <h2 className="text-xl font-bold text-white">Countries ({countries.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : 'Add Country'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6" data-animate="fade-down" data-duration="fast">
          <h3 className="text-white font-semibold mb-4">{editItem ? 'Edit Country' : 'Add New Country'}</h3>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Country Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
            <input
              type="text"
              placeholder="Code (e.g., ESP)"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="input"
              maxLength={3}
              required
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-gray-400">
                <input
                  type="checkbox"
                  checked={formData.is_visible}
                  onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                />
                Visible
              </label>
              <button type="submit" disabled={actionLoading} className="btn btn-primary">
                {actionLoading ? 'Saving...' : editItem ? 'Update' : 'Create'}
              </button>
              {editItem && (
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <AdminTable columns={columns} data={countries} emptyMessage="No countries found." />
    </div>
  );
};

export default CountriesTab;
