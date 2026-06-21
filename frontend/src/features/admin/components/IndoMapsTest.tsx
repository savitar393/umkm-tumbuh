import React from 'react';
import IndonesiaMap from './IndoMaps';
import { testMapData, allProvincesSummary } from './IndoMaps.testdata';

export function IndoMapsTest() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      <h1>Test Peta Indonesia - Dashboard Admin</h1>
      <p>Komponen ini menunjukkan bagaimana peta Indonesia akan menampilkan persebaran omzet UMKM per provinsi.</p>
      
      <div style={{ marginTop: '30px' }}>
        <h2>1. Dengan Data Terbatas (seperti data aktual)</h2>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <IndonesiaMap mapData={testMapData} />
        </div>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Hanya beberapa provinsi yang memiliki data. Provinsi lain akan ditampilkan dengan warna abu-abu.
        </p>
      </div>
      
      <div style={{ marginTop: '40px' }}>
        <h2>2. Dengan Data Semua Provinsi</h2>
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <IndonesiaMap mapData={allProvincesSummary.map(p => ({
            provinsi: p.provinsi,
            kabupaten_kota: 'Ibu Kota',
            total_umkm: p.total_umkm,
            total_umkm_aktif: Math.floor(p.total_umkm * 0.85),
            total_laba: p.total_laba,
            latitude_avg: 0,
            longitude_avg: 0
          }))} />
        </div>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Semua 38 provinsi Indonesia ditampilkan, termasuk provinsi baru hasil pemekaran. Provinsi tanpa data akan berwarna abu-abu.
        </p>
      </div>
      
      <div style={{ marginTop: '40px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
        <h3>Keterangan Warna:</h3>
        <ul style={{ lineHeight: '1.6' }}>
          <li><strong>Warna Biru:</strong> Provinsi dengan data omzet UMKM. Semakin gelap birunya, semakin tinggi omzetnya.</li>
          <li><strong>Warna Abu-abu:</strong> Provinsi tanpa data omzet UMKM (masih menunggu input data).</li>
          <li><strong>Warna Kuning:</strong> Saat hover di atas provinsi (interaksi pengguna).</li>
        </ul>
        
        <h3 style={{ marginTop: '20px' }}>Fitur yang sudah diperbaiki:</h3>
        <ol style={{ lineHeight: '1.6' }}>
          <li><strong>Proyeksi optimal:</strong> Peta menampilkan seluruh Indonesia dari Aceh sampai Papua.</li>
          <li><strong>Skala warna yang jelas:</strong> Gradien biru menunjukkan volume omzet dari rendah ke tinggi.</li>
          <li><strong>Tooltip responsif:</strong> Menampilkan detail data saat hover, tidak keluar dari layar.</li>
          <li><strong>Legend informatif:</strong> Menjelaskan arti warna dan status "Tidak ada data".</li>
          <li><strong>Handling semua provinsi:</strong> Termasuk provinsi baru hasil pemekaran Papua.</li>
        </ol>
      </div>
    </div>
  );
}

export default IndoMapsTest;