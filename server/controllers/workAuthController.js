// workAuthController.js - WorkExperience Auth API Controller
import workAuthModel from '../models/workAuthModel.js'
import workAuthService from '../services/workAuthService.js'

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
    })

    // Step 1: Generate voice message
    const audioBuffer = await workAuthService.generateVoiceMessage(
      pocEmail
    )

    // Step 2: Make call (if audio generated)
    let callResult = null
    if (audioBuffer) {
      // In production, would upload to storage and get permanent URL
      // For now, using a placeholder
      callResult = await workAuthService.makeVerificationCall(
        pocPhone,
        'https://example.com/audio/verification.mp3'
      )

      if (callResult.callSid) {
        await workAuthModel.update(record.id, {
          callStatus: 'pending',
        })
      }
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

    logger.info(`✅ Verification flow started for record: ${record.id}`)

    res.json({
      success: true,
      data: {
        recordId: record.id,
        message:
          'Verification initiated. Check phone for call and email inbox.',
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

    logger.info(
      `✅ Verification ${finalStatus} for record: ${id}`
    )

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
