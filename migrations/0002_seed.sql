-- Clean start for seeding (Optional: DELETE FROM transactions; DELETE FROM items; DELETE FROM categories;)

-- Seed Categories
INSERT INTO categories (id, name, created_at) VALUES 
('cat-1', 'Baut & Mur', '2025-01-01 00:00:00'),
('cat-2', 'Pelumas (Oli)', '2025-01-01 00:00:00'),
('cat-3', 'Ban & Roda', '2025-01-01 00:00:00'),
('cat-4', 'Kelistrikan', '2025-01-01 00:00:00'),
('cat-5', 'Pengereman', '2025-01-01 00:00:00'),
('cat-6', 'Body Parts', '2025-01-01 00:00:00'),
('cat-7', 'Aksesoris', '2025-01-01 00:00:00');

-- Seed Items
INSERT INTO items (id, code, name, category_id, current_stock, unit, last_updated_at) VALUES 
('item-1', 'WS-0001', 'Baut M6 10mm', 'cat-1', 45, 'pcs', CURRENT_TIMESTAMP),
('item-2', 'WS-0002', 'Mur M6 Nut', 'cat-1', 120, 'pcs', CURRENT_TIMESTAMP),
('item-3', 'WS-0003', 'Oli Yamalube Silver 0.8L', 'cat-2', 12, 'pcs', CURRENT_TIMESTAMP),
('item-4', 'WS-0004', 'Oli MPX2 0.8L', 'cat-2', 15, 'pcs', CURRENT_TIMESTAMP),
('item-5', 'WS-0005', 'Ban Luar IRC 80/90-14', 'cat-3', 4, 'pcs', CURRENT_TIMESTAMP),
('item-6', 'WS-0006', 'Ban Dalam Primaax 14', 'cat-3', 10, 'pcs', CURRENT_TIMESTAMP),
('item-7', 'WS-0007', 'Busi NGK CPR9EA-9', 'cat-4', 20, 'pcs', CURRENT_TIMESTAMP),
('item-8', 'WS-0008', 'Aki GS Astra GTZ5S', 'cat-4', 3, 'pcs', CURRENT_TIMESTAMP),
('item-9', 'WS-0009', 'Kampas Rem Depan Vario', 'cat-5', 15, 'pcs', CURRENT_TIMESTAMP),
('item-10', 'WS-0010', 'Kampas Rem Belakang BeAT', 'cat-5', 8, 'pcs', CURRENT_TIMESTAMP),
('item-11', 'WS-0011', 'Spion Standar Honda', 'cat-6', 6, 'pcs', CURRENT_TIMESTAMP),
('item-12', 'WS-0012', 'Bohlam Utama OSRAM', 'cat-4', 25, 'pcs', CURRENT_TIMESTAMP),
('item-13', 'WS-0013', 'Grip Variasi RCB', 'cat-7', 5, 'pcs', CURRENT_TIMESTAMP),
('item-14', 'WS-0014', 'Filter Udara Vario 125', 'cat-6', 12, 'pcs', CURRENT_TIMESTAMP);

-- Seed Transactions (Dummy history for reports)

-- Transactions from LAST YEAR (2025)
INSERT INTO transactions (id, item_id, type, quantity, notes, created_at, sync_status) VALUES 
('tx-old-1', 'item-1', 'IN', 100, 'Stok tahun lalu', '2025-06-15 10:00:00', 'SYNCED'),
('tx-old-2', 'item-3', 'IN', 50, 'Stok tahun lalu', '2025-07-20 14:00:00', 'SYNCED'),
('tx-old-3', 'item-8', 'OUT', 5, 'Dipakai servis besar', '2025-12-10 16:30:00', 'SYNCED');

-- Transactions from LAST MONTH (Dec 2025 - assuming current is Jan 2026)
-- Note: Adjusting manually to be roughly "last month" based on your local time 2026-01-11
INSERT INTO transactions (id, item_id, type, quantity, notes, created_at, sync_status) VALUES 
('tx-prev-1', 'item-1', 'OUT', 20, 'Servis bulanan', '2025-12-15 09:00:00', 'SYNCED'),
('tx-prev-2', 'item-9', 'IN', 20, 'Restok kampas', '2025-12-20 11:00:00', 'SYNCED'),
('tx-prev-3', 'item-9', 'OUT', 5, 'Ganti kampas Vario', '2025-12-28 15:00:00', 'SYNCED');

-- Transactions for TODAY (Jan 11, 2026)
INSERT INTO transactions (id, item_id, type, quantity, notes, created_at, sync_status) VALUES 
('tx-today-1', 'item-4', 'IN', 10, 'Supplier Honda', CURRENT_TIMESTAMP, 'PENDING'),
('tx-today-2', 'item-4', 'OUT', 2, 'Ganti oli BeAT Pagi', CURRENT_TIMESTAMP, 'PENDING'),
('tx-today-3', 'item-10', 'OUT', 1, 'Ganti kampas belakang', CURRENT_TIMESTAMP, 'PENDING'),
('tx-today-4', 'item-7', 'OUT', 5, 'Servis borongan', CURRENT_TIMESTAMP, 'PENDING'),
('tx-today-5', 'item-12', 'IN', 30, 'Stok bohlam', CURRENT_TIMESTAMP, 'PENDING'),
('tx-today-6', 'item-2', 'OUT', 10, 'Dipakai buat bengkel sendiri', CURRENT_TIMESTAMP, 'PENDING'),
('tx-today-7', 'item-14', 'OUT', 1, 'Servis Vario 125', CURRENT_TIMESTAMP, 'PENDING');
