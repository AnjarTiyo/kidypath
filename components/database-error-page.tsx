'use client';

import { AlertTriangle, Database, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface DatabaseErrorPageProps {
  error?: string;
  showRefresh?: boolean;
}

export default function DatabaseErrorPage({ 
  error = 'Tidak dapat terhubung ke database', 
  showRefresh = true 
}: DatabaseErrorPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Database className="w-20 h-20 text-red-500" />
            <div className="absolute -top-2 -right-2 bg-red-100 rounded-full p-2">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Koneksi Database Bermasalah
        </h1>
        
        <p className="text-gray-600 mb-6">
          Aplikasi tidak dapat terhubung ke database. Silakan hubungi administrator sistem.
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 font-mono break-all">
              {error}
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          {showRefresh && (
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Coba Lagi
            </button>
          )}
          
          <Link
            href="/"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Jika masalah berlanjut, pastikan:
          </p>
          <ul className="text-xs text-gray-500 mt-2 space-y-1 text-left">
            <li>• Database server sedang berjalan</li>
            <li>• Kredensial database sudah benar</li>
            <li>• Koneksi jaringan stabil</li>
            <li>• Environment variables sudah dikonfigurasi</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
