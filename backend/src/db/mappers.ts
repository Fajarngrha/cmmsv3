/** Map DB rows (snake_case) to API shape (camelCase) */

export function rowToWorkOrder(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    woId: row.wo_id,
    machineName: row.machine_name,
    machineBrand: row.machine_brand ?? undefined,
    section: row.section,
    machineStatus: row.machine_status ?? undefined,
    damageType: row.damage_type,
    status: row.status,
    dueDate: (row.due_date as Date)?.toISOString?.()?.slice(0, 10) ?? String(row.due_date),
    reportedBy: row.reported_by,
    technician: row.technician ?? undefined,
    assigned: row.assigned ?? undefined,
    createdAt: (row.created_at as Date)?.toISOString?.() ?? String(row.created_at),
    type: row.type ?? undefined,
    startedAt: row.started_at ? ((row.started_at as Date)?.toISOString?.() ?? String(row.started_at)) : undefined,
    closedAt: row.closed_at ? ((row.closed_at as Date)?.toISOString?.() ?? String(row.closed_at)) : undefined,
    causeOfDamage: row.cause_of_damage ?? undefined,
    repairsPerformed: row.repairs_performed ?? undefined,
    actionType: row.action_type ?? undefined,
    replacedSpareParts: row.replaced_spare_parts ?? undefined,
    replacedPartsSpec: row.replaced_parts_spec ?? undefined,
    replacedPartsQty: row.replaced_parts_qty != null ? Number(row.replaced_parts_qty) : undefined,
    totalDowntimeHours: row.total_downtime_hours != null ? Number(row.total_downtime_hours) : undefined,
    pendingReason: row.pending_reason ?? undefined,
    pmScheduledDate: row.pm_scheduled_date ? String(row.pm_scheduled_date).slice(0, 10) : undefined,
  }
}

export function rowToAsset(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    assetId: row.asset_id,
    name: row.name,
    section: row.section,
    health: row.health,
    lastPmDate: row.last_pm_date ? String(row.last_pm_date).slice(0, 10) : '',
    nextPmDate: row.next_pm_date ? String(row.next_pm_date).slice(0, 10) : '',
    uptimePercent: Number(row.uptime_percent ?? 100),
    installedAt: row.installed_at ? String(row.installed_at).slice(0, 10) : undefined,
  }
}

export function rowToSparePart(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    partCode: row.part_code,
    name: row.name,
    category: row.category,
    stock: Number(row.stock ?? 0),
    minStock: Number(row.min_stock ?? 0),
    unit: row.unit ?? 'pcs',
    location: row.location ?? '',
    spec: row.spec ?? undefined,
    forMachine: row.for_machine ?? undefined,
  }
}

export function rowToSparePartMovement(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    partId: String(row.part_id),
    partCode: row.part_code,
    partName: row.part_name,
    type: row.type as 'in' | 'out',
    qty: Number(row.qty),
    unit: row.unit,
    reason: row.reason ?? undefined,
    pic: row.pic ?? undefined,
    createdAt: (row.created_at as Date)?.toISOString?.() ?? String(row.created_at),
  }
}

export function rowToPurchaseOrder(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    tanggal: String(row.tanggal).slice(0, 10),
    itemDeskripsi: row.item_deskripsi,
    model: row.model,
    hargaPerUnit: Number(row.harga_per_unit ?? 0),
    qty: Number(row.qty ?? 0),
    noRegistrasi: row.no_registrasi,
    noPO: row.no_po ?? '',
    mesin: row.mesin ?? '',
    noQuotation: row.no_quotation ?? '',
    supplier: row.supplier ?? '',
    kategori: row.kategori,
    totalHarga: Number(row.total_harga ?? 0),
    status: row.status,
  }
}

export function rowToUpcomingPM(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    pmId: row.pm_id,
    assetName: row.asset_name,
    activity: row.activity,
    scheduledDate: String(row.scheduled_date).slice(0, 10),
    assignedTo: row.assigned_to,
    assetSerialNumber: row.asset_serial_number ?? undefined,
    assetLocation: row.asset_location ?? undefined,
    pmType: row.pm_type ?? undefined,
    pmCategory: row.pm_category ?? undefined,
    startTime: row.start_time ?? undefined,
    endTime: row.end_time ?? undefined,
    frequency: row.frequency ?? undefined,
    manpower: row.manpower != null ? Number(row.manpower) : undefined,
    shiftSchedule: row.shift_schedule ?? undefined,
    requiredEquipment: row.required_equipment ?? undefined,
    sparePartsList: row.spare_parts_list ?? undefined,
    detailedInstructions: row.detailed_instructions ?? undefined,
    proceduralDocLink: row.procedural_doc_link ?? undefined,
    priority: row.priority ?? undefined,
    pmStatus: row.pm_status ?? undefined,
    approvalStatus: row.approval_status ?? undefined,
    reminderEnabled: row.reminder_enabled ?? undefined,
    warningDays: row.warning_days != null ? Number(row.warning_days) : undefined,
    specialNotes: row.special_notes ?? undefined,
    feedback: row.feedback ?? undefined,
    managerApproval: row.manager_approval ?? undefined,
    auditTrail: row.audit_trail ?? undefined,
    photoUrls: row.photo_urls ?? undefined,
    reportGenerated: row.report_generated ?? undefined,
    keteranganStatus: (row as Record<string, unknown>).keterangan_status ?? undefined,
    keteranganNotes: (row as Record<string, unknown>).keterangan_notes ?? undefined,
  }
}
