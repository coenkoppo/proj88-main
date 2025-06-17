import React, { useEffect, useState } from 'react';
import { Save, User, Shield, Activity, Database } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ActivityLog {
  id: string;
  action: string;
  details: any;
  created_at: string;
  users: {
    name: string;
    email: string;
  };
}

export default function Settings() {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    role: '',
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchActivityLogs();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, email, role')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      let query = supabase
        .from('activity_logs')
        .select(`
          id,
          action,
          details,
          created_at,
          users (name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // If not admin or manager, only show own logs
      if (userRole === 'employee') {
        query = query.eq('user_id', user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: userProfile.name,
          email: userProfile.email,
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        action: 'update_profile',
        details: {
          updated_fields: ['name', 'email'],
        },
      });

      toast.success('Profil berhasil diperbarui');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionText = (action: string) => {
    const actions: { [key: string]: string } = {
      create_product: 'Menambah produk',
      update_product: 'Memperbarui produk',
      delete_product: 'Menghapus produk',
      create_order: 'Membuat pesanan',
      update_order_status: 'Memperbarui status pesanan',
      update_payment_status: 'Memperbarui status pembayaran',
      create_customer: 'Menambah pelanggan',
      update_customer: 'Memperbarui pelanggan',
      delete_customer: 'Menghapus pelanggan',
      update_profile: 'Memperbarui profil',
    };
    return actions[action] || action;
  };

  const getRoleText = (role: string) => {
    const roles = {
      admin: 'Administrator',
      manager: 'Manajer',
      employee: 'Karyawan',
    };
    return roles[role as keyof typeof roles] || role;
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      employee: 'bg-green-100 text-green-800',
    };
    return roleConfig[role as keyof typeof roleConfig] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pengaturan</h1>
          <p className="text-gray-600">Kelola profil dan pengaturan akun Anda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profil Pengguna
                </h2>
              </div>
              <div className="card-content">
                <form onSubmit={updateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                      className="input w-full"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                      className="input w-full"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge(userProfile.role)}`}>
                        {getRoleText(userProfile.role)}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </form>
              </div>
            </div>

            {/* System Information */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Informasi Sistem
                </h2>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Versi Sistem</div>
                    <div className="font-medium">BarkasBali88 v1.0.0</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Database</div>
                    <div className="font-medium">Supabase PostgreSQL</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="font-medium text-green-600">Online</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Last Update</div>
                    <div className="font-medium">{formatDate(new Date().toISOString())}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Log Aktivitas
                </h2>
              </div>
              <div className="card-content">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activityLogs.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">Belum ada aktivitas</p>
                  ) : (
                    activityLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {getActionText(log.action)}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {log.users?.name || 'Unknown User'}
                            </div>
                            {log.details && (
                              <div className="text-xs text-gray-500 mt-1">
                                {log.details.product_name && `Produk: ${log.details.product_name}`}
                                {log.details.customer_name && `Pelanggan: ${log.details.customer_name}`}
                                {log.details.order_id && `Order: ${log.details.order_id.slice(0, 8)}...`}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          {formatDate(log.created_at)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}