import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Save, Store, Lock, Phone } from 'lucide-react';
import bcrypt from 'bcryptjs';

type SettingsData = {
  default_tax_rate: string;
  invoice_prefix: string;
  store_name: string;
  store_address: string;
  store_phone: string;
  store_logo: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    default_tax_rate: '18',
    invoice_prefix: 'INV',
    store_name: 'Beauty Parlour',
    store_address: '',
    store_phone: '',
    store_logo: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordChanging, setPasswordChanging] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', [
          'default_tax_rate',
          'invoice_prefix',
          'store_name',
          'store_address',
          'store_phone',
          'store_logo',
        ]);

      if (error) throw error;

      const settingsMap = data?.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {} as Record<string, string>);

      setSettings({
        default_tax_rate: settingsMap?.default_tax_rate || '18',
        invoice_prefix: settingsMap?.invoice_prefix || 'INV',
        store_name: settingsMap?.store_name || 'Beauty Parlour',
        store_address: settingsMap?.store_address || '',
        store_phone: settingsMap?.store_phone || '',
        store_logo: settingsMap?.store_logo || '',
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('settings')
          .upsert(update, { onConflict: 'key' });

        if (error) throw error;
      }

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New password and confirm password do not match!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('New password must be at least 6 characters long!');
      return;
    }

    setPasswordChanging(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('User not found. Please login again.');
        return;
      }

      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!user) {
        alert('User not found.');
        return;
      }

      const isValidOldPassword = await bcrypt.compare(passwordData.oldPassword, user.password);

      if (!isValidOldPassword) {
        alert('Old password is incorrect!');
        return;
      }

      const hashedNewPassword = await bcrypt.hash(passwordData.newPassword, 10);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          password: hashedNewPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      alert('Password changed successfully!');
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error changing password. Please try again.');
    } finally {
      setPasswordChanging(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">Settings</h2>
          <p className="text-gray-600 mt-1">Configure your store and billing preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 active:scale-98 text-base w-full sm:w-auto"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      <div className="space-y-4 lg:space-y-6">
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Store className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-800">Store Information</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={settings.store_address}
                onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                rows={3}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={settings.store_phone}
                onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL (Optional)
              </label>
              <input
                type="text"
                value={settings.store_logo}
                onChange={(e) => setSettings({ ...settings, store_logo: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Settings className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-800">Billing Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.default_tax_rate}
                onChange={(e) => setSettings({ ...settings, default_tax_rate: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
              <p className="text-sm text-gray-500 mt-1">
                This will be the default tax rate for new products and services
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={settings.invoice_prefix}
                onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
              <p className="text-sm text-gray-500 mt-1">
                Invoice numbers will be formatted as: {settings.invoice_prefix}-1001,{' '}
                {settings.invoice_prefix}-1002, etc.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Lock className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-800">Change Password</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Old Password
              </label>
              <input
                type="password"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="Enter your current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                minLength={6}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="Enter your new password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Re-enter New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
                minLength={6}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="Re-enter your new password"
              />
            </div>

            <button
              type="submit"
              disabled={passwordChanging}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Lock className="w-5 h-5" />
              <span>{passwordChanging ? 'Changing Password...' : 'Change Password'}</span>
            </button>
          </form>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md p-6 lg:p-8">
          <div className="flex items-center space-x-3 mb-4">
            <Phone className="w-8 h-8" />
            <h3 className="text-2xl font-semibold">Need Help?</h3>
          </div>
          <p className="text-blue-100 mb-4 text-lg">
            If you have any queries or need assistance, feel free to contact us.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-sm text-blue-100 mb-2">Contact Person</p>
            <p className="text-xl font-bold mb-1">Gokul</p>
            <a
              href="tel:6383702551"
              className="text-2xl font-bold hover:text-blue-200 transition-colors inline-flex items-center gap-2"
            >
              <Phone className="w-5 h-5" />
              6383702551
            </a>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 lg:p-6">
          <h4 className="font-semibold text-blue-900 mb-2">Quick Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Store information will appear on all printed invoices</li>
            <li>• Tax rates can be customized per product or service</li>
            <li>• Invoice numbering is automatic and sequential</li>
            <li>• Changes take effect immediately after saving</li>
          </ul>
        </div>
      </div>
    </div>
  );
}