// twilioDemoController.js - Twilio Demo Call Controller
import twilioDemoService from '../services/twilioDemoService.js'
import workAuthModel from '../models/workAuthModel.js'

const logger = {
  info: (msg) => console.log(`📞 ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
}

export const makeDemoCall = async (req, res) => {
  try {
    const { pocPhone, candidateName, organizationName } = req.body

    // Validate input
    if (!pocPhone || !candidateName || !organizationName) {
      return res.status(400).json({
        success: false,
        error: 'Phone, candidate name, and organization name are required',
      })
    }

    logger.info(`Starting demo call to: ${pocPhone}`)

    // Make demo call
    const callResult = await twilioDemoService.makeDemoCall(
      pocPhone,
      candidateName,
      organizationName
    )

    if (callResult.status === 'failed') {
      return res.status(400).json({
        success: false,
        error: callResult.reason,
      })
    }

    logger.info(`✅ Demo call initiated: ${callResult.callSid}`)

    res.json({
      success: true,
      data: {
        callSid: callResult.callSid,
        message: callResult.message,
        status: callResult.status,
      },
    })
  } catch (error) {
    logger.error(`Demo call error: ${error.message}`)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

export const getCallStatus = async (req, res) => {
  try {
    const { callSid } = req.query

    if (!callSid) {
      return res.status(400).json({
        success: false,
        error: 'Call SID required',
      })
    }

    const status = await twilioDemoService.getCallStatus(callSid)

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Call not found',
      })
    }

    res.json({
      success: true,
      data: status,
    })
  } catch (error) {
    logger.error(`Get call status error: ${error.message}`)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

export const checkTwilioConfig = async (req, res) => {
  try {
    const config = twilioDemoService.checkConfig()
    
    res.json({
      success: true,
      data: config,
    })
  } catch (error) {
    logger.error(`Check config error: ${error.message}`)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

export default {
  makeDemoCall,
  getCallStatus,
  checkTwilioConfig,
}
