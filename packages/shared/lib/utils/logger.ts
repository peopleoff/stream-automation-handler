import winston from 'winston';
import path from 'path';

export interface LoggerConfig {
  level: string;
  file?: string;
  console?: boolean;
}

const createLogger = (config: LoggerConfig): winston.Logger => {
  const formats = [
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ];

  const transports: winston.transport[] = [];

  if (config.console !== false) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    );
  }

  if (config.file) {
    const logDir = path.dirname(config.file);
    transports.push(
      new winston.transports.File({
        filename: config.file,
        format: winston.format.combine(...formats)
      })
    );
  }

  return winston.createLogger({
    level: config.level || 'info',
    format: winston.format.combine(...formats),
    transports,
    exceptionHandlers: [
      new winston.transports.File({ filename: 'logs/exceptions.log' })
    ],
    rejectionHandlers: [
      new winston.transports.File({ filename: 'logs/rejections.log' })
    ]
  });
};

export const createAppLogger = (config: LoggerConfig) => {
  const logger = createLogger(config);

  return {
    info: (message: string, meta?: Record<string, any>) =>
      logger.info(message, meta),
    warn: (message: string, meta?: Record<string, any>) =>
      logger.warn(message, meta),
    error: (message: string, error?: Error | Record<string, any>) =>
      logger.error(message, error),
    debug: (message: string, meta?: Record<string, any>) =>
      logger.debug(message, meta),
    stream: (message: string, platform: string, meta?: Record<string, any>) =>
      logger.info(`[${platform}] ${message}`, meta),
    gift: (giftName: string, fromUser: string, value: number, meta?: Record<string, any>) =>
      logger.info(`Gift received: ${giftName} from ${fromUser} (value: ${value})`, meta),
    light: (action: string, lightIds: string[], meta?: Record<string, any>) =>
      logger.info(`Light action: ${action} on lights [${lightIds.join(', ')}]`, meta)
  };
};

export type AppLogger = ReturnType<typeof createAppLogger>;