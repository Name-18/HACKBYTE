// database/mongoClient.js - MongoDB connection via Mongoose
import mongoose from 'mongoose'

let isConnected = false

export async function connectMongo() {
  if (isConnected) return

  const uri = process.env.MONGO_URI
  if (!uri) {
    console.warn('⚠️  MONGO_URI not set — MongoDB will not be connected')
    return
  }

  try {
    await mongoose.connect(uri)
    isConnected = true
    console.log('✅ MongoDB connected successfully')
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
  }
}

export { mongoose }
