# WorkExperience Auth Feature Setup Guide

## 📦 Installation

This feature requires three additional packages. Install them in the server directory:

```bash
cd server

# Install Twilio for phone calls
npm install twilio

# Install Nodemailer for email verification
npm install nodemailer

# Install ElevenLabs for AI voice generation
npm install elevenlabs
```

**Note:** `elevenlabs` package may need to be installed via:
```bash
npm install @elevenlabs/node
```

## 🔑 Environment Variables

Add these to your `.env` file in the server directory:

```env
# ElevenLabs API Key (for voice generation)
# Get from: https://elevenlabs.io/
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Twilio Configuration (for phone calls)
# Get from: https://www.twilio.com/
TWILIO_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
# Your Twilio phone number (e.g., +1234567890)
TWILIO_PHONE=+1234567890

# Email Configuration (for verification emails)
# Using Gmail (enable Less Secure Apps or App Password)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password_here
```

### Getting API Keys

**ElevenLabs:**
1. Sign up at https://elevenlabs.io/
2. Go to API Keys in your dashboard
3. Copy your API key

**Twilio:**
1. Sign up at https://www.twilio.com/
2. Get your Account SID and Auth Token from Dashboard
3. Get a Twilio phone number

**Gmail:**
1. Use your Gmail address
2. Generate an App Password (if using 2FA):
   - Visit https://myaccount.google.com/apppasswords
   - Select Mail and Windows Computer
   - Copy the generated password

## 🚀 AutoIntegration

The feature is **fully auto-integrated**:

✅ Routes automatically registered in `app.js`  
✅ Frontend route added to `App.jsx`  
✅ Navigation menu updated in Home and Dashboard pages  
✅ No additional setup needed!

## 🎯 Feature Files

**Backend:**
- `server/routes/workAuthRoutes.js` - API endpoints
- `server/controllers/workAuthController.js` - Request handlers
- `server/services/workAuthService.js` - Twilio, ElevenLabs, Nodemailer integration
- `server/models/workAuthModel.js` - Data storage

**Frontend:**
- `client/src/pages/WorkExperienceAuth.jsx` - Main page
- Updated `App.jsx` with routes
- Updated `Home.jsx` and `Dashboard.jsx` with navigation

## 📞 API Endpoints

```
POST /api/work-auth/start
  Body: {
    pocPhone: "+1234567890",
    pocEmail: "contact@company.com",
    candidateName: "John Doe",
    organizationName: "Tech Corp"
  }

GET /api/work-auth/status?id=RECORD_ID
  Returns verification status

GET /api/work-auth/verify?status=yes&id=RECORD_ID
  Verification callback from email link

GET /api/work-auth/records
  Get all verification records
```

## 🔄 Verification Flow

1. **User enters POC phone and email** → Fills form on WorkExperienceAuth page
2. **Click Authenticate** → POST to `/api/work-auth/start`
3. **System initiates verification:**
   - Generates voice message with ElevenLabs
   - Makes call via Twilio
   - Sends email via Nodemailer
4. **POC receives call and email** → Audio plays on phone call
5. **POC clicks YES/NO in email** → GET `/api/work-auth/verify`
6. **Final status updates** → Shown on page

## ✅ Status Values

**Call Status:**
- `pending` - Call being made
- `accepted` - POC picked up the phone
- `failed` - Call failed or declined

**Email Status:**
- `pending` - Email sent, awaiting click
- `accepted` - POC clicked the link

**Final Status:**
- `pending` - Waiting for response
- `correct` - POC confirmed (YES)
- `rejected` - POC rejected (NO)

## 🧪 Testing

1. **Start server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:** http://localhost:5173/work-auth

3. **Fill form** with test data:
   - Phone: Your phone number (needs Twilio setup)
   - Email: Your email (needs Gmail setup)
   - Candidate Name: Test Candidate
   - Organization: Test Org

4. **Monitor status** updates in real-time

## 🐛 Troubleshooting

**"Twilio not configured"**
- Add TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE to .env

**"Email not configured"**
- Add EMAIL_USER and EMAIL_PASS to .env

**"ElevenLabs API error"**
- Add ELEVENLABS_API_KEY to .env
- Verify API key is valid

**Tests won't work without credentials** - This is expected! The system safely falls back with appropriate error messages.

## 📝 Notes

- Feature is completely modular and doesn't modify existing functionality
- Resume analysis system remains 100% untouched
- All routes are auto-integrated
- Uses in-memory storage (can be replaced with database)
- Ready for production with proper environment setup
