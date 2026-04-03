#!/usr/bin/env node

/**
 * setup-check.js - Verify TrustHire environment setup
 * 
 * Run: node setup-check.js (from root directory)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))

class SetupChecker {
  constructor() {
    this.checks = []
    this.passed = 0
    this.failed = 0
  }

  check(name, condition, details = '') {
    const status = condition ? '✅' : '❌'
    this.checks.push({ name, status, details, passed: condition })
    if (condition) this.passed++
    else this.failed++
    console.log(`${status} ${name}${details ? ' - ' + details : ''}`)
  }

  fileExists(filePath, friendlyName = '') {
    const exists = fs.existsSync(filePath)
    const name = friendlyName || path.basename(filePath)
    this.check(`File exists: ${name}`, exists, exists ? 'found' : 'missing')
    return exists
  }

  dirExists(dirPath, friendlyName = '') {
    const exists = fs.existsSync(dirPath)
    const name = friendlyName || path.basename(dirPath)
    this.check(`Directory exists: ${name}`, exists, exists ? 'found' : 'missing')
    return exists
  }

  envVariableExists(filename, keys) {
    const filePath = path.join(__dir, filename)
    if (!fs.existsSync(filePath)) {
      this.check(`Config check: ${filename}`, false, 'file not found')
      return false
    }

    const content = fs.readFileSync(filePath, 'utf8')
    const allKeysPresent = keys.every(key => content.includes(key))
    this.check(`Config variables in ${filename}`, allKeysPresent, allKeysPresent ? 'all found' : 'some missing')
    return allKeysPresent
  }

  summary() {
    console.log('\n' + '='.repeat(50))
    console.log(`Setup Check Summary: ${this.passed} passed, ${this.failed} failed`)
    console.log('='.repeat(50) + '\n')

    if (this.failed === 0) {
      console.log('✅ All checks passed! Your setup is ready.')
      console.log('\nNext steps:')
      console.log('1. cd server && npm install')
      console.log('2. cd ../client && npm install')
      console.log('3. Update .env files with your API keys')
      console.log('4. npm run dev (in both directories)')
    } else {
      console.log(`⚠️  ${this.failed} check(s) failed. Please review above.`)
      console.log('\nCommon issues:')
      console.log('- Missing directories: Run setup scripts')
      console.log('- Missing .env files: Copy from .env.example')
      console.log('- npm not installed: Install Node.js and npm')
    }
  }
}

// Run checks
const checker = new SetupChecker()

console.log('\n🔍 TrustHire Setup Verification\n')

// Client structure
console.log('📁 Checking Client Structure...')
checker.dirExists(path.join(__dir, 'client'), 'client/')
checker.dirExists(path.join(__dir, 'client/src'), 'client/src/')
checker.dirExists(path.join(__dir, 'client/src/components'), 'client/src/components/')
checker.dirExists(path.join(__dir, 'client/src/pages'), 'client/src/pages/')
checker.fileExists(path.join(__dir, 'client/package.json'), 'client/package.json')

// Server structure
console.log('\n🔍 Checking Server Structure...')
checker.dirExists(path.join(__dir, 'server'), 'server/')
checker.dirExists(path.join(__dir, 'server/services'), 'server/services/')
checker.dirExists(path.join(__dir, 'server/controllers'), 'server/controllers/')
checker.dirExists(path.join(__dir, 'server/routes'), 'server/routes/')
checker.fileExists(path.join(__dir, 'server/package.json'), 'server/package.json')

// Configuration files
console.log('\n🔍 Checking Configuration Files...')
checker.fileExists(path.join(__dir, 'server/.env.example'), 'server/.env.example')
checker.fileExists(path.join(__dir, 'client/.env.example'), 'client/.env.example')
checker.fileExists(path.join(__dir, 'README.md'), 'README.md')

// Environment templates
console.log('\n🔍 Checking Environment Templates...')
checker.envVariableExists('server/.env.example', [
  'PORT',
  'GEMINI_API_KEY',
  'GITHUB_TOKEN',
])
checker.envVariableExists('client/.env.example', [
  'VITE_API_URL',
  'VITE_APP_TITLE',
])

// Root documentation
console.log('\n🔍 Checking Documentation...')
checker.fileExists(path.join(__dir, 'SETUP_GUIDE.md'), 'SETUP_GUIDE.md')
checker.fileExists(path.join(__dir, 'API.md'), 'API.md')
checker.fileExists(path.join(__dir, 'CONTRIBUTING.md'), 'CONTRIBUTING.md')
checker.fileExists(path.join(__dir, 'ARCHITECTURE.md'), 'ARCHITECTURE.md')

// Summary
checker.summary()
