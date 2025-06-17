import React, { useEffect, useState } from 'react';
import { Search, Eye, Edit, Printer, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  notes: string;
  voucher_code: string;
  created_at: string;
  order_items: Array<{
    product_name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_name,
            quantity,
            price,
            total
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone.includes(searchTerm) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(order => order.order_status === statusFilter);
    }

    if (paymentFilter) {
      filtered = filtered.filter(order => order.payment_status === paymentFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: status })
        .eq('id', orderId);

      if (error) throw error;

      // Log activity
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'update_order_status',
          details: {
            order_id: orderId,
            new_status: status,
          },
        });
      }

      toast.success('Status pesanan berhasil diperbarui');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Gagal memperbarui status pesanan');
    }
  };

  const updatePaymentStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: status })
        .eq('id', orderId);

      if (error) throw error;

      // Log activity
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'update_payment_status',
          details: {
            order_id: orderId,
            new_status: status,
          },
        });
      }

      toast.success('Status pembayaran berhasil diperbarui');
      fetchOrders();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Gagal memperbarui status pembayaran');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
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

  const getStatusBadge = (status: string, type: 'order' | 'payment') => {
    const orderStatusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800', text: 'Diproses' },
      shipped: { color: 'bg-purple-100 text-purple-800', text: 'Dikirim' },
      delivered: { color: 'bg-green-100 text-green-800', text: 'Selesai' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Dibatal' },
    };

    const paymentStatusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Belum Bayar' },
      dp_paid: { color: 'bg-blue-100 text-blue-800', text: 'DP Dibayar' },
      paid: { color: 'bg-green-100 text-green-800', text: 'Lunas' },
    };

    const config = type === 'order' ? orderStatusConfig : paymentStatusConfig;
    const statusConfig = config[status as keyof typeof config] || config.pending;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
        {statusConfig.text}
      </span>
    );
  };

  const getPaymentMethodText = (method: string) => {
    const methods = {
      dp: 'DP',
      cod: 'COD',
      cash: 'Tunai',
      transfer: 'Transfer',
    };
    return methods[method as keyof typeof methods] || method;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Pesanan</h1>
          <p className="text-gray-600">Kelola dan pantau semua pesanan pelanggan</p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari pesanan, nama pelanggan, atau nomor HP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Diproses</option>
            <option value="shipped">Dikirim</option>
            <option value="delivered">Selesai</option>
            <option value="cancelled">Dibatal</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="input"
          >
            <option value="">Semua Pembayaran</option>
            <option value="pending">Belum Bayar</option>
            <option value="dp_paid">DP Dibayar</option>
            <option value="paid">Lunas</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="card">
          <div className="card-content p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ID Pesanan</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Pelanggan</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Pembayaran</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tanggal</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-t hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">
                        {order.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-sm text-gray-600">{order.customer_phone}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatPrice(order.total)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {getStatusBadge(order.payment_status, 'payment')}
                          <div className="text-xs text-gray-600">
                            {getPaymentMethodText(order.payment_method)}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={order.order_status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Diproses</option>
                          <option value="shipped">Dikirim</option>
                          <option value="delivered">Selesai</option>
                          <option value="cancelled">Dibatal</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowModal(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => window.print()}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-2">Tidak ada pesanan ditemukan</div>
                <div className="text-sm text-gray-400">
                  {searchTerm || statusFilter || paymentFilter
                    ? 'Coba ubah filter pencarian'
                    : 'Belum ada pesanan masuk'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Detail Modal */}
        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Detail Pesanan</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Customer Info */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="font-semibold">Informasi Pelanggan</h3>
                    </div>
                    <div className="card-content space-y-2">
                      <div><strong>Nama:</strong> {selectedOrder.customer_name}</div>
                      <div><strong>HP:</strong> {selectedOrder.customer_phone}</div>
                      <div><strong>Alamat:</strong> {selectedOrder.customer_address}</div>
                    </div>
                  </div>

                  {/* Order Info */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="font-semibold">Informasi Pesanan</h3>
                    </div>
                    <div className="card-content space-y-2">
                      <div><strong>ID:</strong> {selectedOrder.id}</div>
                      <div><strong>Tanggal:</strong> {formatDate(selectedOrder.created_at)}</div>
                      <div><strong>Status:</strong> {getStatusBadge(selectedOrder.order_status, 'order')}</div>
                      <div><strong>Pembayaran:</strong> {getStatusBadge(selectedOrder.payment_status, 'payment')}</div>
                      <div><strong>Metode:</strong> {getPaymentMethodText(selectedOrder.payment_method)}</div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="card mb-6">
                  <div className="card-header">
                    <h3 className="font-semibold">Item Pesanan</h3>
                  </div>
                  <div className="card-content">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Produk</th>
                            <th className="text-left py-2">Harga</th>
                            <th className="text-left py-2">Qty</th>
                            <th className="text-left py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.order_items.map((item, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2">{item.product_name}</td>
                              <td className="py-2">{formatPrice(item.price)}</td>
                              <td className="py-2">{item.quantity}</td>
                              <td className="py-2 font-medium">{formatPrice(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="card mb-6">
                  <div className="card-header">
                    <h3 className="font-semibold">Ringkasan</h3>
                  </div>
                  <div className="card-content">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatPrice(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Diskon:</span>
                        <span>{formatPrice(selectedOrder.discount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ongkir:</span>
                        <span>{formatPrice(selectedOrder.shipping_cost)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>{formatPrice(selectedOrder.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="card mb-6">
                    <div className="card-header">
                      <h3 className="font-semibold">Catatan</h3>
                    </div>
                    <div className="card-content">
                      <p>{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-4">
                  <select
                    value={selectedOrder.payment_status}
                    onChange={(e) => {
                      updatePaymentStatus(selectedOrder.id, e.target.value);
                      setSelectedOrder({...selectedOrder, payment_status: e.target.value});
                    }}
                    className="input"
                  >
                    <option value="pending">Belum Bayar</option>
                    <option value="dp_paid">DP Dibayar</option>
                    <option value="paid">Lunas</option>
                  </select>
                  
                  <button
                    onClick={() => window.print()}
                    className="btn btn-primary"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Cetak Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}