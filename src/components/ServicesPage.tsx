import { useState, useEffect } from 'react';
import { supabase, type Service } from '../lib/supabase';
import { Plus, Edit2, Trash2, Scissors, Clock } from 'lucide-react';
import ServiceForm from './ServiceForm';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingService(null);
    loadServices();
  };

  const toggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ active: !service.active, updated_at: new Date().toISOString() })
        .eq('id', service.id);

      if (error) throw error;
      loadServices();
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Services</h2>
          <p className="text-gray-600 mt-1">Manage your beauty services</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors active:scale-98 text-base w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add Service</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {services.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-md p-8 lg:p-12 text-center">
            <Scissors className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">No services found</p>
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-lg shadow-md p-4 lg:p-6 border-2 transition-all ${
                service.active ? 'border-green-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{service.name}</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{service.duration} minutes</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={service.active}
                    onChange={() => toggleActive(service)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-blue-600">₹{service.price.toFixed(2)}</div>
                {service.tax_rate > 0 && (
                  <div className="text-sm text-gray-500 mt-1">Tax: {service.tax_rate}%</div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors active:scale-98 text-base"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="px-4 py-3 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors active:scale-98"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && <ServiceForm service={editingService} onClose={handleFormClose} />}
    </div>
  );
}