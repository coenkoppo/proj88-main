import React, { useEffect, useState } from 'react';
import { Download, Calendar, TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';

interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  recentOrders: Array<{
    id: string;
    customer_name: string;
    total: number;
    created_at: string;
    order_status: string;
  }>;
}

export default function Reports() {
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    monthlyRevenue: [],
    topProducts: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch basic stats
      const [
        revenueResult,
        ordersResult,
        productsResult,
        customersResult,
        recentOrdersResult,
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('total, created_at')
          .eq('payment_status', 'paid')
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end + 'T23:59:59'),
        supabase
          .from('orders')
          .select('id, created_at')
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end + 'T23:59:59'),
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('customers').select('id', { count: 'exact' }),
        supabase
          .from('orders')
          .select('id, customer_name, total, created_at, order_status')
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end + 'T23:59:59')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      // Calculate totals
      const totalRevenue = revenueResult.data?.reduce((sum, order) => sum + order.total, 0) || 0;
      const totalOrders = ordersResult.data?.length || 0;

      // Group revenue by month
      const monthlyData: { [key: string]: { revenue: number; orders: number } } = {};
      
      revenueResult.data?.forEach(order => {
        const month = new Date(order.created_at).toLocaleDateString('id-ID', { 
          year: 'numeric', 
          month: 'short' 
        });
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, orders: 0 };
        }
        monthlyData[month].revenue += order.total;
      });

      ordersResult.data?.forEach(order => {
        const month = new Date(order.created_at).toLocaleDateString('id-ID', { 
          year: 'numeric', 
          month: 'short' 
        });
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, orders: 0 };
        }
        monthlyData[month].orders += 1;
      });

      const monthlyRevenue = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        orders: data.orders,
      }));

      // Fetch top products
      const { data: topProductsData } = await supabase
        .from('order_items')
        .select(`
          product_name,
          quantity,
          total,
          order_id,
          orders!inner(created_at)
        `)
        .gte('orders.created_at', dateRange.start)
        .lte('orders.created_at', dateRange.end + 'T23:59:59');

      // Group by product
      const productStats: { [key: string]: { quantity: number; revenue: number } } = {};
      topProductsData?.forEach(item => {
        if (!productStats[item.product_name]) {
          productStats[item.product_name] = { quantity: 0, revenue: 0 };
        }
        productStats[item.product_name].quantity += item.quantity;
        productStats[item.product_name].revenue += item.total;
      });

      const topProducts = Object.entries(productStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setReportData({
        totalRevenue,
        totalOrders,
        totalProducts: productsResult.count || 0,
        totalCustomers: customersResult.count || 0,
        monthlyRevenue,
        topProducts,
        recentOrders: recentOrdersResult.data || [],
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
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
    });
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Laporan Penjualan BarkasBali88'],
      ['Periode:', `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`],
      [''],
      ['Ringkasan'],
      ['Total Pendapatan', formatPrice(reportData.totalRevenue)],
      ['Total Pesanan', reportData.totalOrders],
      ['Total Produk', reportData.totalProducts],
      ['Total Pelanggan', reportData.totalCustomers],
      [''],
      ['Pendapatan Bulanan'],
      ['Bulan', 'Pendapatan', 'Jumlah Pesanan'],
      ...reportData.monthlyRevenue.map(item => [item.month, item.revenue, item.orders]),
      [''],
      ['Produk Terlaris'],
      ['Nama Produk', 'Terjual', 'Pendapatan'],
      ...reportData.topProducts.map(item => [item.name, item.quantity, item.revenue]),
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

    // Recent orders sheet
    const ordersData = [
      ['Pesanan Terbaru'],
      ['ID Pesanan', 'Pelanggan', 'Total', 'Status', 'Tanggal'],
      ...reportData.recentOrders.map(order => [
        order.id,
        order.customer_name,
        order.total,
        order.order_status,
        formatDate(order.created_at),
      ]),
    ];

    const ordersSheet = XLSX.utils.aoa_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(workbook, ordersSheet, 'Pesanan');

    // Export
    const fileName = `laporan-penjualan-${dateRange.start}-${dateRange.end}.xlsx`;
    XLSX.writeFile(workbook, fileName);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Laporan Penjualan</h1>
            <p className="text-gray-600">Analisis performa bisnis dan tren penjualan</p>
          </div>
          <button
            onClick={exportToExcel}
            className="btn btn-primary mt-4 sm:mt-0"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Excel
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="card mb-8">
          <div className="card-content">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <div className="flex items-center space-x-2 mb-4 sm:mb-0">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="font-medium">Periode:</span>
              </div>
              <div className="flex space-x-4">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="input"
                />
                <span className="flex items-center">-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pendapatan</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(reportData.totalRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pesanan</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.totalOrders}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Produk</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.totalProducts}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pelanggan</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.totalCustomers}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Revenue */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-bold">Pendapatan Bulanan</h2>
            </div>
            <div className="card-content">
              {reportData.monthlyRevenue.length === 0 ? (
                <p className="text-gray-600 text-center py-4">Tidak ada data untuk periode ini</p>
              ) : (
                <div className="space-y-4">
                  {reportData.monthlyRevenue.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{item.month}</div>
                        <div className="text-sm text-gray-600">{item.orders} pesanan</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary-600">
                          {formatPrice(item.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-bold">Produk Terlaris</h2>
            </div>
            <div className="card-content">
              {reportData.topProducts.length === 0 ? (
                <p className="text-gray-600 text-center py-4">Tidak ada data untuk periode ini</p>
              ) : (
                <div className="space-y-4">
                  {reportData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium line-clamp-1">{product.name}</div>
                        <div className="text-sm text-gray-600">Terjual: {product.quantity} unit</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary-600">
                          {formatPrice(product.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold">Pesanan Terbaru</h2>
          </div>
          <div className="card-content">
            {reportData.recentOrders.length === 0 ? (
              <p className="text-gray-600 text-center py-4">Tidak ada pesanan untuk periode ini</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">ID Pesanan</th>
                      <th className="text-left py-2">Pelanggan</th>
                      <th className="text-left py-2">Total</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="py-3 text-sm font-mono">
                          {order.id.slice(0, 8)}...
                        </td>
                        <td className="py-3">{order.customer_name}</td>
                        <td className="py-3 font-medium">{formatPrice(order.total)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.order_status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.order_status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.order_status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.order_status === 'delivered' ? 'Selesai' :
                             order.order_status === 'shipped' ? 'Dikirim' :
                             order.order_status === 'processing' ? 'Diproses' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-gray-600">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}