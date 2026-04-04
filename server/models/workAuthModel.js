// workAuthModel.js - WorkExperience Auth Data Model
// In-memory storage (can be replaced with database)

const workAuthRecords = new Map()
let recordIdCounter = 1

export const workAuthModel = {
  // Create new verification record
  create: async (data) => {
    const id = `wa_${recordIdCounter++}`
    const record = {
      id,
      pocPhone: data.pocPhone,
      pocEmail: data.pocEmail,
      candidateName: data.candidateName || 'Candidate',
      organizationName: data.organizationName || 'Organization',
      callStatus: 'pending', // pending | accepted | failed
      mailStatus: 'pending', // pending | accepted
      finalStatus: 'pending', // pending | correct | rejected
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    workAuthRecords.set(id, record)
    console.log(`📝 Work Auth record created: ${id}`)
    return record
  },

  // Get record by ID
  getById: async (id) => {
    return workAuthRecords.get(id) || null
  },

  // Update record
  update: async (id, updates) => {
    const record = workAuthRecords.get(id)
    if (!record) throw new Error(`Record not found: ${id}`)

    const updated = {
      ...record,
      ...updates,
      updatedAt: new Date(),
    }

    workAuthRecords.set(id, updated)
    console.log(`✏️ Work Auth record updated: ${id}`)
    return updated
  },

  // Get all records
  getAll: async () => {
    return Array.from(workAuthRecords.values())
  },

  // Delete record
  delete: async (id) => {
    workAuthRecords.delete(id)
    console.log(`🗑️ Work Auth record deleted: ${id}`)
  },

  // Get records by email
  getByEmail: async (email) => {
    return Array.from(workAuthRecords.values()).filter(
      (r) => r.pocEmail === email
    )
  },
}

export default workAuthModel
