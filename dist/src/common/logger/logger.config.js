"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.winstonLogger = void 0;
const winston_1 = require("winston");
const nest_winston_1 = require("nest-winston");
exports.winstonLogger = nest_winston_1.WinstonModule.createLogger({
    transports: [
        new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.ms(), winston_1.format.colorize(), winston_1.format.printf(({ timestamp, level, message, ms, ...meta }) => {
                const metaString = Object.keys(meta).length
                    ? JSON.stringify(meta)
                    : '';
                return `[FuturePath] ${timestamp} ${level}: ${message} ${metaString} ${ms}`;
            })),
        }),
    ],
});
//# sourceMappingURL=logger.config.js.map