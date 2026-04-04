// app.js - Express server setup
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import trustRoutes from './routes/trustRoutes.js'
import workAuthRoutes from './routes/workAuthRoutes.js'
import { spacetimeClient } from './spacetime/spacetimeClient.js'

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Routes
app.use('/api/trust', trustRoutes)
app.use('/api/work-auth', workAuthRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    spacetimeConnected: spacetimeClient.isConnected,
  })
})

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// Initialize SpacetimeDB connection
await spacetimeClient.connect()

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TrustHire server running on http://localhost:${PORT}`)
  console.log(`📡 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`)
})

export default app
