-- Seed Categories
INSERT INTO categories (id, name, created_at) VALUES 
('cat-1', 'Baut & Mur', '2025-01-01 00:00:00'),
('cat-2', 'Pelumas (Oli)', '2025-01-01 00:00:00'),
('cat-3', 'Ban & Roda', '2025-01-01 00:00:00'),
('cat-4', 'Kelistrikan', '2025-01-01 00:00:00'),
('cat-5', 'Pengereman', '2025-01-01 00:00:00');

-- Seed Items
INSERT INTO items (id, code, name, category_id, current_stock, unit, price, last_updated_at) VALUES 
('item-1', 'WS-0001', 'Baut M6 10mm', 'cat-1', 45, 'pcs', 500, CURRENT_TIMESTAMP),
('item-2', 'WS-0002', 'Oli Yamalube Silver 0.8L', 'cat-2', 12, 'pcs', 45000, CURRENT_TIMESTAMP),
('item-3', 'WS-0003', 'Oli MPX2 0.8L', 'cat-2', 15, 'pcs', 48000, CURRENT_TIMESTAMP),
('item-4', 'WS-0004', 'Ban Luar IRC 80/90-14', 'cat-3', 4, 'pcs', 185000, CURRENT_TIMESTAMP),
('item-5', 'WS-0005', 'Busi NGK CPR9EA-9', 'cat-4', 20, 'pcs', 15000, CURRENT_TIMESTAMP),
('item-6', 'WS-0006', 'Kampas Rem Depan Vario', 'cat-5', 15, 'pcs', 35000, CURRENT_TIMESTAMP);

-- Transactions History (Last 3 Months)

-- OCTOBER 2025 (Initial Stock and High Usage)
INSERT INTO transactions (id, item_id, type, quantity, notes, created_at, sync_status) VALUES 
('tx-oct-1', 'item-1', 'IN', 100, 'Stok awal Oktober', '2025-10-01 08:00:00', 'SYNCED'),
('tx-oct-2', 'item-2', 'IN', 50, 'Kulakan Oli', '2025-10-02 09:30:00', 'SYNCED'),
('tx-oct-3', 'item-1', 'OUT', 10, 'Servis harian', '2025-10-15 14:00:00', 'SYNCED'),
('tx-oct-4', 'item-4', 'IN', 10, 'Stok ban', '2025-10-20 11:00:00', 'SYNCED'),
('tx-oct-5', 'item-3', 'OUT', 5, 'Ganti oli borongan', '2025-10-28 16:00:00', 'SYNCED');

-- NOVEMBER 2025 (Mid-Month Restock)
INSERT INTO transactions (id, item_id, type, quantity, notes, created_at, sync_status) VALUES 
('tx-nov-1', 'item-5', 'IN', 40, 'Restok busi', '2025-11-05 10:00:00', 'SYNCED'),
('tx-nov-2', 'item-1', 'OUT', 25, 'Project bengkel rekan', '2025-11-12 13:00:00', 'SYNCED'),
('tx-nov-3', 'item-6', 'IN', 30, 'Suplai kampas rem', '2025-11-15 09:00:00', 'SYNCED'),
('tx-nov-4', 'item-2', 'OUT', 15, 'Penjualan ritel', '2025-11-22 15:45:00', 'SYNCED'),
('tx-nov-5', 'item-4', 'OUT', 3, 'Ganti ban CBR', '2025-11-29 17:00:00', 'SYNCED');

-- DECEMBER 2025 (Holiday Peak)
INSERT INTO transactions (id, item_id, type, quantity, notes, created_at, sync_status) VALUES 
('tx-dec-1', 'item-3', 'IN', 20, 'Persiapan libur tahun baru', '2025-12-05 11:00:00', 'SYNCED'),
('tx-dec-2', 'item-5', 'OUT', 12, 'Servis motor mudik', '2025-12-15 10:30:00', 'SYNCED'),
('tx-dec-3', 'item-6', 'OUT', 10, 'Kampas rem habis stok', '2025-12-20 14:00:00', 'SYNCED'),
('tx-dec-4', 'item-2', 'OUT', 10, 'Ganti oli malam', '2025-12-28 19:00:00', 'SYNCED'),
('tx-dec-5', 'item-1', 'OUT', 20, 'Pembersihan stok', '2025-12-30 16:00:00', 'SYNCED');

-- JANUARY 2026 (Recent Data)
INSERT INTO transactions (id, item_id, type, quantity, notes, created_at, sync_status) VALUES 
('tx-jan-1', 'item-3', 'OUT', 2, 'Ganti oli rutin', '2026-01-05 09:00:00', 'SYNCED'),
('tx-jan-2', 'item-4', 'OUT', 1, 'Ban bocor parah', '2026-01-08 11:30:00', 'SYNCED'),
('tx-jan-3', 'item-6', 'IN', 10, 'Restok awal tahun', '2026-01-10 13:00:00', 'SYNCED'),
('tx-jan-4', 'item-5', 'OUT', 3, 'Servis pagi', CURRENT_TIMESTAMP, 'PENDING');
