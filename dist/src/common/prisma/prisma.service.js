"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor() {
        const url = process.env.DATABASE_URL;
        const mariadbUrl = url.replace('mysql://', 'mariadb://');
        const useSsl = process.env.DATABASE_SSL === 'true';
        const adapter = useSsl
            ? new adapter_mariadb_1.PrismaMariaDb({
                ...parseMysqlUrl(mariadbUrl),
                ssl: {
                    rejectUnauthorized: process.env.DATABASE_SSL_INSECURE !== 'true',
                },
            })
            : new adapter_mariadb_1.PrismaMariaDb(mariadbUrl);
        super({ adapter });
    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    async cleanDatabase() {
        if (process.env.NODE_ENV === 'production')
            return;
        await this.notification.deleteMany();
        await this.report.deleteMany();
        await this.simulation.deleteMany();
        await this.user.deleteMany();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
function parseMysqlUrl(connectionUrl) {
    const u = new URL(connectionUrl);
    return {
        host: u.hostname,
        port: u.port ? parseInt(u.port, 10) : 3306,
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: u.pathname.replace(/^\//, ''),
    };
}
//# sourceMappingURL=prisma.service.js.map