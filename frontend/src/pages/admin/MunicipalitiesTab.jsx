/**
 * MunicipalitiesTab - Admin CRUD interface for municipalities
 */
import { useState } from 'react';
import {
  createMunicipality,
  updateMunicipality,
  deleteMunicipality,
  toggleMunicipalityVisibility,
} from '../../store/slices/adminSlice';
import AdminTable from './AdminTable';

const MunicipalitiesTab = ({ municipalities, regions, dispatch, actionLoading }) => {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterRegionId, setFilterRegionId] = useState('');
  const [formData, setFormData] = useState({ name: '', region_id: '', latitude: '', longitude: '', is_visible: true });

  const filteredMunicipalities = filterRegionId
    ? municipalities.filter((m) => m.region_id === parseInt(filterRegionId))
    : municipalities;

  const resetForm = () => {
    setFormData({ name: '', region_id: '', latitude: '', longitude: '', is_visible: true });
    setEditItem(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      region_id: parseInt(formData.region_id),
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
    };
    if (editItem) {
      await dispatch(updateMunicipality({ municipalityId: editItem.id, municipalityData: data }));
    } else {
      await dispatch(createMunicipality(data));
    }
    resetForm();
  };

  const handleEdit = (municipality) => {
    setFormData({
      name: municipality.name,
      region_id: municipality.region_id.toString(),
      latitude: municipality.latitude.toString(),
      longitude: municipality.longitude.toString(),
      is_visible: municipality.is_visible,
    });
    setEditItem(municipality);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this municipality and all its flags?')) {
      dispatch(deleteMunicipality(id));
    }
  };

  const getRegionName = (regionId) => regions.find((r) => r.id === regionId)?.name || 'Unknown';

  const columns = [
    { key: 'id', label: 'ID', className: 'text-gray-300' },
    { key: 'name', label: 'Name', className: 'text-white' },
    {
      key: 'region_id',
      label: 'Region',
      className: 'text-gray-400',
      render: (item) => getRegionName(item.region_id),
    },
    {
      key: 'coordinates',
      label: 'Coordinates',
      className: 'text-gray-400 text-sm',
    },
    {
      key: 'flag_count',
      label: 'Flags',
      className: 'text-gray-400',
      render: (item) => item.flag_count || 0,
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
            onClick={() => dispatch(toggleMunicipalityVisibility({ municipalityId: item.id, isVisible: item.is_visible }))}
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
        <h2 className="text-xl font-bold text-white">Municipalities ({filteredMunicipalities.length})</h2>
        <div className="flex gap-4">
          <select value={filterRegionId} onChange={(e) => setFilterRegionId(e.target.value)} className="input">
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? 'Cancel' : 'Add Municipality'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card p-6 mb-6" data-animate="fade-down" data-duration="fast">
          <h3 className="text-white font-semibold mb-4">{editItem ? 'Edit Municipality' : 'Add New Municipality'}</h3>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <input
              type="text"
              placeholder="Municipality Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
            <select
              value={formData.region_id}
              onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
              className="input"
              required
            >
              <option value="">Select Region</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className="input"
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className="input"
              required
            />
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

      <AdminTable columns={columns} data={filteredMunicipalities} emptyMessage="No municipalities found." />
    </div>
  );
};

export default MunicipalitiesTab;
