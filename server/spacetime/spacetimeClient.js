// spacetime/spacetimeClient.js
// SpacetimeDB v2.1 HTTP API client for Express server

const SPACETIME_HOST = process.env.SPACETIME_URI || 'https://maincloud.spacetimedb.com'
const SPACETIME_DB = process.env.SPACETIME_DB_NAME || 'my-spacetime-app-w3lqu'
const SPACETIME_TOKEN = process.env.SPACETIME_TOKEN

class SpacetimeClient {
  constructor() {
    this.host = SPACETIME_HOST
    this.db = SPACETIME_DB
    this.token = SPACETIME_TOKEN
    this.isConnected = false
    this.candidates = new Map()
  }

  get headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    }
  }

  get baseUrl() {
    // Correct v2.1 format: /v1/database/:name_or_identity
    return `${this.host}/v1/database/${this.db}`
  }

  async connect() {
    try {
      console.log(`🔌 Connecting to SpacetimeDB...`)
      console.log(`   Host: ${this.host}`)
      console.log(`   DB:   ${this.db}`)

      const res = await fetch(`${this.baseUrl}`, {
        method: 'GET',
        headers: this.headers,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`SpacetimeDB responded ${res.status}: ${text}`)
      }

      const info = await res.json()
      console.log('✅ SpacetimeDB connected!')
      console.log(`   Database identity: ${info.database_identity}`)
      console.log(`   Owner identity:    ${info.owner_identity}`)
      this.isConnected = true

      await this._syncCandidates()
      return true
    } catch (error) {
      console.error('❌ Failed to connect to SpacetimeDB:', error.message)
      console.warn('⚠️  Running in degraded mode — results cached in-memory only')
      this.isConnected = false
      return false
    }
  }

  async _callReducer(reducerName, argsArray) {
    // Body must be a JSON array of positional args per SpacetimeDB HTTP API
    const res = await fetch(`${this.baseUrl}/call/${reducerName}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(argsArray),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Reducer '${reducerName}' failed (${res.status}): ${text}`)
    }

    return res
  }

  async _querySql(sql) {
    const res = await fetch(`${this.baseUrl}/sql`, {
      method: 'POST',
      headers: this.headers,
      body: sql,  // SQL sent as raw text, not JSON
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`SQL query failed (${res.status}): ${text}`)
    }

    // Returns array of { schema, rows }
    const results = await res.json()
    return results[0] ?? null  // first statement result
  }

  _rowToObject(row, schema) {
    if (!schema || !row) return null
    const obj = {}
    schema.elements.forEach((col, i) => {
      const key = col.name?.some ?? col.name ?? `col${i}`
      obj[key] = row[i]
    })
    return obj
  }

  async _syncCandidates() {
    try {
      const result = await this._querySql('SELECT * FROM candidates')
      if (result?.rows?.length) {
        this.candidates.clear()
        for (const row of result.rows) {
          const candidate = this._rowToObject(row, result.schema)
          if (candidate?.id) this.candidates.set(candidate.id, candidate)
        }
        console.log(`📥 Synced ${this.candidates.size} candidates from SpacetimeDB`)
      } else {
        console.log('📥 candidates table is empty (fresh start)')
      }
    } catch (err) {
      console.warn('⚠️  Could not sync candidates:', err.message)
    }
  }

  async storeCandidateAnalysis(analysisResult) {
    const candidateId = `${analysisResult.username || 'unknown'}_${Date.now()}`

    const candidate = {
      id: candidateId,
      username: analysisResult.username || 'unknown',
      timestamp: analysisResult.timestamp || new Date().toISOString(),
      trustScore: analysisResult.trustScore || 0,
      verdict: analysisResult.verdict || '',
      explanation: analysisResult.explanation || '',
      flags: JSON.stringify(analysisResult.flags || []),
      breakdown: JSON.stringify(analysisResult.breakdown || {}),
    }

    // Always cache locally first
    this.candidates.set(candidateId, candidate)

    if (this.isConnected) {
      try {
        // Args must match reducer param order: id, username, timestamp, trustScore, verdict, explanation, flags, breakdown
        await this._callReducer('store_candidate_analysis', [
          candidate.id,
          candidate.username,
          candidate.timestamp,
          candidate.trustScore,
          candidate.verdict,
          candidate.explanation,
          candidate.flags,
          candidate.breakdown,
        ])
        console.log('💾 Candidate stored in SpacetimeDB:', candidateId)
      } catch (err) {
        console.error('⚠️  SpacetimeDB store failed (using local cache):', err.message)
      }
    } else {
      console.log('💾 Candidate cached in-memory (SpacetimeDB offline):', candidateId)
    }

    return candidate
  }

  async getCandidates() {
    if (this.isConnected) {
      await this._syncCandidates()
    }
    return Array.from(this.candidates.values())
  }

  async getCandidateById(id) {
    if (this.isConnected) {
      try {
        const result = await this._querySql(`SELECT * FROM candidates WHERE id = '${id}'`)
        if (result?.rows?.length) {
          const candidate = this._rowToObject(result.rows[0], result.schema)
          if (candidate) {
            this.candidates.set(id, candidate)
            return candidate
          }
        }
      } catch (err) {
        console.warn('SpacetimeDB query failed, using cache:', err.message)
      }
    }
    return this.candidates.get(id) ?? null
  }

  disconnect() {
    console.log('🔌 Disconnecting from SpacetimeDB')
    this.isConnected = false
  }
}

export const spacetimeClient = new SpacetimeClient()