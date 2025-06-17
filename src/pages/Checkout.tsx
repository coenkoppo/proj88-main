import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, MapPin, Phone, User } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    paymentMethod: 'cod' as 'dp' | 'cod' | 'cash' | 'transfer',
    notes: '',
    voucherCode: '',
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Keranjang belanja kosong');
      return;
    }

    setLoading(true);

    try {
      // Create order
      const orderData = {
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        customer_address: formData.customerAddress,
        subtotal: total,
        discount: 0,
        shipping_cost: 0,
        total: total,
        payment_method: formData.paymentMethod,
        payment_status: 'pending' as const,
        order_status: 'pending' as const,
        notes: formData.notes,
        voucher_code: formData.voucherCode,
        created_by: user?.id || null,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        total: item.product.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of items) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: item.product.stock - item.quantity })
          .eq('id', item.product.id);

        if (stockError) throw stockError;
      }

      // Log activity
      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'create_order',
          details: {
            order_id: order.id,
            total: total,
            items_count: items.length,
          },
        });
      }

      clearCart();
      toast.success('Pesanan berhasil dibuat!');
      navigate('/');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Gagal membuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Keranjang Belanja Kosong
            </h2>
            <p className="text-gray-600 mb-8">
              Silakan tambahkan produk ke keranjang terlebih dahulu
            </p>
            <Link to="/catalog" className="btn btn-primary px-8 py-3">
              Mulai Belanja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Kembali ke Keranjang
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-bold flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Informasi Pelanggan
                  </h2>
                </div>
                <div className="card-content space-y-4">
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor HP *
                    </label>
                    <input
                      type="tel"
                      id="customerPhone"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      className="input w-full"
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 mb-2">
                      Alamat Lengkap *
                    </label>
                    <textarea
                      id="customerAddress"
                      name="customerAddress"
                      value={formData.customerAddress}
                      onChange={handleInputChange}
                      rows={3}
                      className="input w-full resize-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-bold flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Metode Pembayaran
                  </h2>
                </div>
                <div className="card-content">
                  <div className="space-y-3">
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">COD (Cash on Delivery)</div>
                        <div className="text-sm text-gray-600">Bayar saat barang diterima</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="dp"
                        checked={formData.paymentMethod === 'dp'}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">DP (Down Payment)</div>
                        <div className="text-sm text-gray-600">Bayar sebagian terlebih dahulu</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transfer"
                        checked={formData.paymentMethod === 'transfer'}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">Transfer Bank</div>
                        <div className="text-sm text-gray-600">Transfer ke rekening toko</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={formData.paymentMethod === 'cash'}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">Tunai</div>
                        <div className="text-sm text-gray-600">Bayar tunai di toko</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-bold">Informasi Tambahan</h2>
                </div>
                <div className="card-content space-y-4">
                  <div>
                    <label htmlFor="voucherCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Kode Voucher (Opsional)
                    </label>
                    <input
                      type="text"
                      id="voucherCode"
                      name="voucherCode"
                      value={formData.voucherCode}
                      onChange={handleInputChange}
                      className="input w-full"
                      placeholder="Masukkan kode voucher"
                    />
                  </div>
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Catatan Pesanan (Opsional)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="input w-full resize-none"
                      placeholder="Catatan khusus untuk pesanan ini..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-8">
                <div className="card-header">
                  <h2 className="text-xl font-bold">Ringkasan Pesanan</h2>
                </div>
                <div className="card-content space-y-4">
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex justify-between text-sm">
                        <div className="flex-1">
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-gray-600">
                            {formatPrice(item.product.price)} × {item.quantity}
                          </div>
                        </div>
                        <div className="font-medium">
                          {formatPrice(item.product.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ongkos Kirim</span>
                      <span className="text-green-600">Gratis</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Diskon</span>
                      <span>-</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-xl font-bold text-primary-600">
                          {formatPrice(total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full py-3 text-lg"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Memproses...
                      </div>
                    ) : (
                      'Buat Pesanan'
                    )}
                  </button>

                  <div className="text-center text-sm text-gray-600 space-y-1">
                    <p>• Pesanan akan diproses dalam 1-2 hari kerja</p>
                    <p>• Anda akan mendapat konfirmasi via WhatsApp</p>
                    <p>• Garansi resmi untuk semua produk</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}