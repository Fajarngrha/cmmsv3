-- ============================================================
-- CMMS - Seed Data untuk PostgreSQL (sesuai mock terbaru)
-- Jalankan SETELAH schema-postgres.sql
-- Contoh: psql -d cmms_db -f seed-postgres.sql
-- ============================================================

-- ------------------------------------------------------------
-- Assets (8 asset, section: Die Casting, Line 1/2/3, installed_at opsional)
-- ------------------------------------------------------------
INSERT INTO assets (asset_id, name, section, health, last_pm_date, next_pm_date, uptime_percent, installed_at) VALUES
('AST-001', '350T 4', 'Die Casting', 'Running', '2025-04-01', '2026-05-01', 98.50, '2020-03-01'),
('AST-002', 'Conveyor Belt A', 'Line 2', 'Warning', '2026-03-15', '2026-04-25', 92.00, '2019-06-01'),
('AST-003', 'Hydraulic Pump #2', 'Line 3', 'Running', '2026-04-10', '2026-05-10', 96.00, '2021-01-01'),
('AST-004', 'Boiler #1', 'Line 1', 'Warning', '2026-03-20', '2026-04-28', 88.00, NULL),
('AST-005', 'Motor Listrik 3 Phase', 'Line 2', 'Running', '2026-04-05', '2026-05-05', 99.00, '2020-09-01'),
('AST-006', 'Chiller System', 'Line 3', 'Running', '2026-04-12', '2026-05-12', 97.00, NULL),
('AST-007', 'Cooling Tower', 'Line 1', 'Breakdown', '2026-02-28', '2026-04-29', 72.00, '2018-11-01'),
('AST-008', 'Air Compressor #2', 'Line 2', 'Warning', '2026-03-28', '2026-04-26', 85.00, NULL);

-- ------------------------------------------------------------
-- Work Orders (9 WO, section Die Casting / Line 1/2/3, tanggal 2026)
-- ------------------------------------------------------------
INSERT INTO work_orders (wo_id, machine_name, machine_brand, section, machine_status, damage_type, status, due_date, reported_by, technician, assigned, type, created_at) VALUES
('WO1032', '350T 4', 'Toshiba', 'Die Casting', 'Running', 'Preventive maintenance scheduled', 'PM', '2026-04-24', 'Maintenance', 'Sehat', 'Agso', 'PM', '2026-04-20 08:00:00'),
('WO1048', '350T 4', 'Toshiba', 'Die Casting', 'Stopped', 'Mechanical wear on belt; unusual noise when running', 'Open', '2026-04-20', 'Tim Produksi', 'Agus', 'Budi', 'Corrective', '2026-04-18 10:00:00'),
('WO1051', 'Hydraulic Pump #2', 'ABB', 'Line 3', 'Breakdown', 'Leak detected at seal; oil pool under unit', 'Pending', '2026-04-27', 'Maintenance', 'Budi', 'Wiharyi', 'Corrective', '2026-04-22 09:00:00'),
('WO1056', 'Boiler #1', 'Mitsubishi', 'Line 1', 'Under Maintenance', 'Pressure fluctuation; gauge reading inconsistent', 'Open', '2026-04-22', 'Tim Produksi', 'Rian', 'Riarp', 'Corrective', '2026-04-21 14:00:00'),
('WO1042', 'Motor Listrik 3 Phase', 'Siemens', 'Line 2', 'Breakdown', 'Electrical; motor trips after 10 min run; burning smell', 'In Progress', '2026-04-25', 'Maintenance', 'Ahmad', 'Agso', 'Corrective', '2026-04-23 08:00:00'),
('WO1065', 'Chiller System', 'Carrier', 'Line 3', 'Running', 'Cooling capacity drop; outlet temp rising', 'Pending', '2026-04-28', 'Tim Produksi', 'Dedi', 'Budi', 'Corrective', '2026-04-24 11:00:00');

UPDATE work_orders SET started_at = '2026-04-24 09:00:00' WHERE wo_id = 'WO1042';

INSERT INTO work_orders (wo_id, machine_name, machine_brand, section, machine_status, damage_type, status, due_date, reported_by, technician, type, created_at, closed_at, cause_of_damage, repairs_performed, action_type, replaced_spare_parts, replaced_parts_spec, replaced_parts_qty, total_downtime_hours) VALUES
('WO1020', '350T 4', 'Toshiba', 'Die Casting', 'Running', 'PM rutin; ganti filter dan oli', 'Completed', '2026-04-01', 'Maintenance', 'Sehat', 'PM', '2026-04-01 07:00:00', '2026-04-01 11:30:00', 'Scheduled PM', 'Ganti filter udara, ganti oli kompresor', 'Replace', 'Air Filter 10", Hydraulic Oil ISO 46', 'Filter 10 inch; Oil 5L', 2, 4.50),
('WO1015', '350T 4', 'Toshiba', 'Die Casting', 'Running', 'Bearing aus; suara tidak normal', 'Completed', '2026-03-10', 'Tim Produksi', 'Agus', 'Corrective', '2026-03-10 08:00:00', '2026-03-10 14:00:00', 'Bearing rusak akibat keausan', 'Ganti ball bearing 6205', 'Replace', 'Ball Bearing 6205', 'SKF 6205-2RS', 1, 6.00),
('WO1018', 'Conveyor Belt A', 'Siemens', 'Line 2', 'Running', 'V-belt slip; conveyor lambat', 'Completed', '2026-03-20', 'Tim Produksi', 'Budi', 'Corrective', '2026-03-20 09:00:00', '2026-03-20 12:00:00', 'V-belt aus', 'Ganti V-belt', 'Replace', 'V-Belt A42', 'A42', 1, 3.00);

-- ------------------------------------------------------------
-- Spare Parts (8 item, spec & for_machine)
-- ------------------------------------------------------------
INSERT INTO spare_parts (part_code, name, category, stock, min_stock, unit, location, spec, for_machine) VALUES
('FLT-001', 'Air Filter 10"', 'Filters', 45, 20, 'pcs', 'A1-01', '10 inch', 'Compressor Unit 1'),
('BRG-001', 'Ball Bearing 6205', 'Bearings', 28, 15, 'pcs', 'B2-03', 'SKF 6205-2RS', 'Conveyor Belt A'),
('BLT-001', 'V-Belt A42', 'Belts', 12, 10, 'pcs', 'A1-05', 'A42', 'Conveyor Belt A'),
('LUB-001', 'Hydraulic Oil ISO 46', 'Lubricants', 80, 30, 'L', 'C1-02', '5L drum', 'Hydraulic Pump #2'),
('SNR-001', 'Proximity Sensor', 'Sensors', 8, 5, 'pcs', 'B1-04', '24VDC NPN', 'Motor Listrik 3 Phase'),
('FLT-002', 'Oil Filter', 'Filters', 18, 12, 'pcs', 'A1-01', 'Spin-on', 'Boiler #1'),
('BRG-002', 'Spherical Bearing', 'Bearings', 5, 8, 'pcs', 'B2-03', 'Self-aligning', 'Chiller System'),
('BLT-002', 'Timing Belt', 'Belts', 6, 5, 'pcs', 'A1-05', 'HTD 5M', 'Air Compressor #2');

-- ------------------------------------------------------------
-- Purchase Orders (2 PO, tanggal 2026 - untuk Dashboard filter & History)
-- ------------------------------------------------------------
INSERT INTO purchase_orders (tanggal, item_deskripsi, model, harga_per_unit, qty, no_registrasi, no_po, mesin, no_quotation, supplier, kategori, total_harga, status) VALUES
('2026-04-15', 'Ball Bearing 6205', 'SKF 6205-2RS', 85000, 10, 'MTC/SPB/04/24/0001', 'PO-2026-001', 'Conveyor Belt A', 'QUO-2026-015', 'PT Teknik Jaya', 'Sparepart', 850000, 'Tahap 3'),
('2026-04-18', 'Hydraulic Oil ISO 46', 'Shell Tellus 46', 125000, 4, 'MTC/SPB/04/24/0002', 'PO-2026-002', 'Hydraulic Pump #2', 'QUO-2026-018', 'PT Sumber Lubrikasi', 'Preventive', 500000, 'Tahap 2');

-- ------------------------------------------------------------
-- Upcoming PM (5 jadwal, 2026 - filter Dashboard by section via asset_name)
-- ------------------------------------------------------------
INSERT INTO upcoming_pm (pm_id, asset_name, activity, scheduled_date, assigned_to) VALUES
('PM2401', 'Air Compressor #1', 'Monthly Inspection', '2026-04-25', 'Sehat'),
('PM2402', 'Conveyor Belt #3', 'Lubrication', '2026-04-26', 'Agus'),
('PM2403', 'Hydraulic Pump #2', 'Oil Change', '2026-04-27', 'Budi'),
('PM2404', 'Boiler #1', 'Safety Check', '2026-04-28', 'Rian'),
('PM2405', 'Cooling Tower', 'Cleaning & Inspection', '2026-04-29', 'Ahmad');
