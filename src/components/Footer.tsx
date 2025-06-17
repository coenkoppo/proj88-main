import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B88</span>
              </div>
              <span className="font-bold text-xl">BarkasBali88</span>
            </div>
            <p className="text-gray-300 mb-4">
              Sistem digital terpadu untuk manajemen produk, pesanan, dan pelanggan. 
              Solusi modern untuk bisnis retail Anda.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Phone className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Kontak</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-primary-400" />
                <span className="text-gray-300">+62 123 456 7890</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-primary-400" />
                <span className="text-gray-300">info@barkasball88.com</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-primary-400 mt-1" />
                <span className="text-gray-300">Jl. Contoh No. 123, Bali, Indonesia</span>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Jam Operasional</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary-400" />
                <div>
                  <p className="text-gray-300">Senin - Jumat</p>
                  <p className="text-sm text-gray-400">08:00 - 17:00</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary-400" />
                <div>
                  <p className="text-gray-300">Sabtu</p>
                  <p className="text-sm text-gray-400">08:00 - 15:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 BarkasBali88. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}