import { format, transports } from 'winston';
import { WinstonModule } from 'nest-winston';

export const winstonLogger = WinstonModule.createLogger({
  transports: [
    new transports.Console({
      format: format.combine(
        format.timestamp(),
        format.ms(),
        format.colorize(),
        format.printf(({ timestamp, level, message, ms, ...meta }) => {
          const metaString = Object.keys(meta).length
            ? JSON.stringify(meta)
            : '';
          return `[FuturePath] ${timestamp} ${level}: ${message} ${metaString} ${ms}`;
        }),
      ),
    }),
    // In production, you would add File transports or external logging services here
  ],
});
