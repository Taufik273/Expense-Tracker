# Expense Tracker

Aplikasi web pencatat pengeluaran harian berbasis HTML, CSS, dan JavaScript vanilla. Semua data tersimpan lokal di browser (localStorage) — tanpa server, tanpa database.

## Fitur

- Tambah & hapus transaksi pengeluaran
- Kategori bawaan (🍔 Food, 🚌 Transport, 🎉 Fun) + kategori custom buatan sendiri
- Dropdown kategori custom dengan ikon hapus 🗑️ untuk kategori custom (kategori bawaan terlindungi; menghapus kategori tidak ikut menghapus transaksinya)
- Batas pengeluaran bulanan dengan indikator persentase pemakaian dan peringatan saat melebihi batas, lengkap dengan sisa saldonya
- Grafik pengeluaran per kategori (Canvas API)
- Total saldo & daftar transaksi ter-update otomatis setiap ada perubahan data

## Teknologi

- HTML5, CSS3, JavaScript (ES6) — tanpa framework
- localStorage untuk penyimpanan data
- Canvas API untuk menggambar grafik

## Cara Menjalankan

1. Clone repository ini
2. Buka file `index.html` di browser — atau jalankan lewat ekstensi Live Server di editor

## Struktur Project

- `index.html` — struktur halaman
- `css/style.css` — styling (tema gelap)
- `js/app.js` — seluruh logika aplikasi (state, rendering, event handling)
