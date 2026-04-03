// server/utils/logger.js - Logging utility

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
}

class Logger {
  constructor(namespace) {
    this.namespace = namespace
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      namespace: this.namespace,
      message,
      ...data,
    }

    if (level === LOG_LEVELS.ERROR) {
      console.error(JSON.stringify(logEntry))
    } else if (level === LOG_LEVELS.WARN) {
      console.warn(JSON.stringify(logEntry))
    } else {
      console.log(JSON.stringify(logEntry))
    }
  }

  error(message, data) {
    this.log(LOG_LEVELS.ERROR, message, data)
  }

  warn(message, data) {
    this.log(LOG_LEVELS.WARN, message, data)
  }

  info(message, data) {
    this.log(LOG_LEVELS.INFO, message, data)
  }

  debug(message, data) {
    this.log(LOG_LEVELS.DEBUG, message, data)
  }
}

export const createLogger = (namespace) => new Logger(namespace)
