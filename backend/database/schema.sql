-- ============================================================
-- CMMS - Database Schema (MySQL 8 / MariaDB 10.5+)
-- Sesuai entitas di backend/src/data/mock.ts
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Database
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS cmms_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE cmms_db;

-- ------------------------------------------------------------
-- Tabel: assets
-- ------------------------------------------------------------
DROP TABLE IF EXISTS assets;
CREATE TABLE assets (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id VARCHAR(50) NOT NULL COMMENT 'e.g. AST-001',
  name VARCHAR(255) NOT NULL,
  section VARCHAR(100) NOT NULL,
  health ENUM('Running', 'Warning', 'Breakdown') NOT NULL DEFAULT 'Running',
  last_pm_date DATE NULL,
  next_pm_date DATE NULL,
  uptime_percent DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_asset_id (asset_id),
  KEY idx_assets_section (section),
  KEY idx_assets_health (health)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabel: work_orders
-- ------------------------------------------------------------
DROP TABLE IF EXISTS work_orders;
CREATE TABLE work_orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  wo_id VARCHAR(50) NOT NULL COMMENT 'e.g. WO1032',
  machine_name VARCHAR(255) NOT NULL,
  machine_brand VARCHAR(100) NULL,
  section VARCHAR(100) NOT NULL,
  machine_status VARCHAR(50) NULL,
  damage_type TEXT NOT NULL,
  status ENUM('PM', 'Open', 'Pending', 'In Progress', 'Completed') NOT NULL DEFAULT 'Open',
  due_date DATE NOT NULL,
  reported_by VARCHAR(100) NOT NULL,
  technician VARCHAR(100) NULL,
  assigned VARCHAR(100) NULL,
  type ENUM('Corrective', 'PM', 'Inspection') NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME NULL,
  closed_at DATETIME NULL,
  cause_of_damage TEXT NULL,
  repairs_performed TEXT NULL,
  action_type VARCHAR(50) NULL,
  replaced_spare_parts VARCHAR(500) NULL,
  replaced_parts_spec VARCHAR(255) NULL,
  replaced_parts_qty INT UNSIGNED NULL,
  total_downtime_hours DECIMAL(10,2) NULL,
  pending_reason TEXT NULL,
  pm_scheduled_date DATE NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wo_id (wo_id),
  KEY idx_wo_status (status),
  KEY idx_wo_machine (machine_name),
  KEY idx_wo_created (created_at),
  KEY idx_wo_section (section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabel: spare_parts
-- ------------------------------------------------------------
DROP TABLE IF EXISTS spare_parts;
CREATE TABLE spare_parts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  part_code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  min_stock INT UNSIGNED NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'pcs',
  location VARCHAR(100) NULL,
  spec VARCHAR(500) NULL COMMENT 'Spesifikasi part',
  for_machine VARCHAR(255) NULL COMMENT 'Untuk mesin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_part_code (part_code),
  KEY idx_spare_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabel: purchase_orders
-- ------------------------------------------------------------
DROP TABLE IF EXISTS purchase_orders;
CREATE TABLE purchase_orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tanggal DATE NOT NULL,
  item_deskripsi VARCHAR(500) NOT NULL,
  model VARCHAR(255) NULL,
  harga_per_unit DECIMAL(18,2) NOT NULL DEFAULT 0,
  qty INT UNSIGNED NOT NULL DEFAULT 0,
  no_registrasi VARCHAR(50) NOT NULL COMMENT 'MTC/SPB/MM/YY/XXXX',
  no_po VARCHAR(50) NULL,
  mesin VARCHAR(255) NULL,
  no_quotation VARCHAR(50) NULL,
  supplier VARCHAR(255) NULL,
  kategori ENUM('Preventive', 'Sparepart', 'Breakdown/Repair') NOT NULL DEFAULT 'Sparepart',
  total_harga DECIMAL(18,2) NOT NULL DEFAULT 0,
  status ENUM('Tahap 1', 'Tahap 2', 'Tahap 3', 'Tahap 4', 'Tahap 5', 'Tahap 6', 'Tahap 7') NOT NULL DEFAULT 'Tahap 1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_no_registrasi (no_registrasi),
  KEY idx_po_tanggal (tanggal),
  KEY idx_po_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Tabel: upcoming_pm
-- ------------------------------------------------------------
DROP TABLE IF EXISTS upcoming_pm;
CREATE TABLE upcoming_pm (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pm_id VARCHAR(50) NOT NULL COMMENT 'e.g. PM2401',
  asset_name VARCHAR(255) NOT NULL,
  activity VARCHAR(255) NOT NULL,
  scheduled_date DATE NOT NULL,
  assigned_to VARCHAR(100) NOT NULL,
  asset_serial_number VARCHAR(100) NULL,
  asset_location VARCHAR(255) NULL,
  pm_type VARCHAR(50) NULL,
  pm_category VARCHAR(50) NULL,
  start_time TIME NULL,
  end_time TIME NULL,
  frequency VARCHAR(50) NULL,
  manpower INT UNSIGNED NULL,
  shift_schedule VARCHAR(100) NULL,
  required_equipment TEXT NULL,
  spare_parts_list TEXT NULL,
  detailed_instructions TEXT NULL,
  procedural_doc_link VARCHAR(500) NULL,
  priority VARCHAR(50) NULL,
  pm_status VARCHAR(50) NULL,
  approval_status VARCHAR(50) NULL,
  reminder_enabled TINYINT(1) NOT NULL DEFAULT 0,
  warning_days INT UNSIGNED NULL,
  special_notes TEXT NULL,
  feedback TEXT NULL,
  manager_approval VARCHAR(100) NULL,
  audit_trail TEXT NULL,
  photo_urls TEXT NULL,
  report_generated TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pm_id (pm_id),
  KEY idx_upcoming_scheduled (scheduled_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- Catatan:
-- - Dashboard KPIs (pm_compliance, total_downtime, dll) dapat
--   dihitung dari work_orders, assets, purchase_orders via query.
-- - maintenance_trend, pareto_downtime, wo_status_distribution,
--   asset_health_counts, quick_stats = agregasi, bisa VIEW atau
--   query di aplikasi.
-- ------------------------------------------------------------
