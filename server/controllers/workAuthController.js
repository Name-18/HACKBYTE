// workAuthController.js - WorkExperience Auth API Controller
import workAuthModel from '../models/workAuthModel.js'
import workAuthService from '../services/workAuthService.js'
import { VerifiedWorkAuth } from '../models/verifiedWorkAuthModel.js'

const logger = {
  info: (msg) => console.log(`📞 ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
}

export const startVerification = async (req, res) => {
  try {
    const {
      pocPhone,
      pocEmail,
      candidateName,
      organizationName,
    } = req.body

    // Validate input
    if (!pocPhone || !pocEmail) {
      return res.status(400).json({
        success: false,
        error: 'POC Phone and Email are required',
      })
    }

    logger.info(`Starting work auth verification for: ${pocEmail}`)

    // Create record
    const record = await workAuthModel.create({
      pocPhone,
      pocEmail,
      candidateName,
      organizationName,
      resumeId: req.body.resumeId || null,
    })

    // Step 1: Skip ElevenLabs voice generation (not working)
    // Step 2: Send SMS directly with Twilio
    let callResult = null
    callResult = await workAuthService.makeVerificationCall(
      pocPhone,
      candidateName,
      organizationName
    )

    if (callResult.callSid) {
      await workAuthModel.update(record.id, {
        callStatus: 'pending', // Keep as callStatus for compatibility
      })
    }

    // Step 3: Send email
    const emailResult = await workAuthService.sendVerificationEmail(
      pocEmail,
      candidateName,
      organizationName,
      record.id
    )

    if (emailResult.status === 'pending') {
      await workAuthModel.update(record.id, {
        mailStatus: 'pending',
      })
    }

    // Create MongoDB record immediately when email is sent (status: pending)
    try {
      await VerifiedWorkAuth.create({
        workAuthRecordId: record.id,
        resumeId: record.resumeId || null,
        candidateName: record.candidateName || '',
        organizationName: record.organizationName || '',
        pocPhone: record.pocPhone || '',
        pocEmail: record.pocEmail || '',
        verificationMethod: 'email',
        finalStatus: 'pending',
      })
      logger.info(`💾 Pending record created in MongoDB for: ${record.id}`)
    } catch (mongoErr) {
      logger.error(`MongoDB create failed (non-critical): ${mongoErr.message}`)
    }

    logger.info(`✅ Verification flow started for record: ${record.id}`)

    res.json({
      success: true,
      data: {
        recordId: record.id,
        message:
          'Verification initiated. Check phone for SMS and email inbox.',
        callStatus: callResult?.status || 'pending',
        emailStatus: emailResult?.status || 'pending',
      },
    })
  } catch (error) {
    logger.error(`Start verification error: ${error.message}`)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

export const getVerificationStatus = async (req, res) => {
  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Verification ID required',
      })
    }

    const record = await workAuthModel.getById(id)

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Verification record not found',
      })
    }

    res.json({
      success: true,
      data: {
        recordId: record.id,
        pocPhone: record.pocPhone,
        pocEmail: record.pocEmail,
        callStatus: record.callStatus,
        mailStatus: record.mailStatus,
        finalStatus: record.finalStatus,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    })
  } catch (error) {
    logger.error(`Get status error: ${error.message}`)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

export const handleVerification = async (req, res) => {
  try {
    const { status, id } = req.query

    if (!id || !status) {
      return res.status(400).json({
        success: false,
        error: 'ID and status required',
      })
    }

    const record = await workAuthModel.getById(id)

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Verification record not found',
      })
    }

    // Update record based on verification response
    const finalStatus = status === 'yes' ? 'correct' : 'rejected'

    await workAuthModel.update(id, {
      mailStatus: 'accepted',
      finalStatus: finalStatus,
    })

    logger.info(`✅ Verification ${finalStatus} for record: ${id}`)

    // Persist outcome to MongoDB — update the existing pending record
    try {
      const updated = await VerifiedWorkAuth.findOneAndUpdate(
        { workAuthRecordId: id },
        { finalStatus: finalStatus },
        { new: true, sort: { createdAt: -1 } }
      )
      if (updated) {
        logger.info(`💾 MongoDB record updated (${finalStatus}) for: ${id}`)
      } else {
        // Fallback: create if somehow not found
        const freshRecord = await workAuthModel.getById(id)
        await VerifiedWorkAuth.create({
          workAuthRecordId: id,
          resumeId: freshRecord?.resumeId || null,
          candidateName: freshRecord?.candidateName || '',
          organizationName: freshRecord?.organizationName || '',
          pocPhone: freshRecord?.pocPhone || '',
          pocEmail: freshRecord?.pocEmail || '',
          verificationMethod: 'email',
          finalStatus: finalStatus,
        })
        logger.info(`💾 Fallback: new MongoDB record created (${finalStatus}) for: ${id}`)
      }
    } catch (mongoErr) {
      logger.error(`MongoDB update failed (non-critical): ${mongoErr.message}`)
    }

    // Return HTML response
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification ${finalStatus === 'correct' ? 'Confirmed' : 'Rejected'}</title>
        <style>
          body { font-family: Arial; text-align: center; padding: 50px; background: #f5f5f5; }
          .container { background: white; max-width: 400px; margin: 50px auto; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .success { color: #4CAF50; }
          .reject { color: #f44336; }
          h1 { margin: 0 0 20px 0; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="${finalStatus === 'correct' ? 'success' : 'reject'}">
            ${finalStatus === 'correct' ? '✓ Verified Successfully' : '✗ Verification Rejected'}
          </h1>
          <p>Thank you for your response.</p>
          <p>Record ID: <strong>${id}</strong></p>
          <p><a href="http://localhost:5173">← Back to Dashboard</a></p>
        </div>
      </body>
      </html>
    `)
  } catch (error) {
    logger.error(`Handle verification error: ${error.message}`)
    res.status(500).send('<h1>Error</h1><p>Verification failed</p>')
  }
}

export const getAllRecords = async (req, res) => {
  try {
    const records = await workAuthModel.getAll()
    res.json({
      success: true,
      data: records,
    })
  } catch (error) {
    logger.error(`Get all records error: ${error.message}`)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

export const getVerifiedRecords = async (req, res) => {
  try {
    const records = await VerifiedWorkAuth.find().sort({ createdAt: -1 })
    res.json({ success: true, data: records })
  } catch (error) {
    logger.error(`Get verified records error: ${error.message}`)
    res.status(500).json({ success: false, error: error.message })
  }
}

export const checkVerification = async (req, res) => {
  try {
    const { resumeId } = req.query
    if (!resumeId) {
      return res.status(400).json({ success: false, error: 'resumeId required' })
    }

    const record = await VerifiedWorkAuth.findOne({ resumeId }).sort({ createdAt: -1 })

    if (!record) {
      return res.json({ success: true, status: 'not_verified', record: null })
    }

    return res.json({
      success: true,
      status: record.finalStatus === 'correct'
        ? 'verified'
        : record.finalStatus === 'rejected'
        ? 'rejected'
        : 'pending',
      record: {
        candidateName: record.candidateName,
        organizationName: record.organizationName,
        verifiedAt: record.createdAt,
      },
    })
  } catch (error) {
    logger.error(`Check verification error: ${error.message}`)
    res.status(500).json({ success: false, error: error.message })
  }
}
