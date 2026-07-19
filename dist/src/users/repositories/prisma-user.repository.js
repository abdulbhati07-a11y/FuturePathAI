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
exports.PrismaUserRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const role_enum_1 = require("../../common/enums/role.enum");
let PrismaUserRepository = class PrismaUserRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        return user ? this.mapToEntity(user) : null;
    }
    async findByEmail(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        return user ? this.mapToEntity(user) : null;
    }
    async create(user) {
        const created = await this.prisma.user.create({
            data: {
                id: user.id,
                email: user.email,
                passwordHash: user.passwordHash,
                name: user.name,
                roles: (user.roles || [role_enum_1.Role.USER]),
                profile: user.profile ?? undefined,
            },
        });
        return this.mapToEntity(created);
    }
    async update(id, user) {
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                ...(user.email && { email: user.email }),
                ...(user.passwordHash && { passwordHash: user.passwordHash }),
                ...(user.name && { name: user.name }),
                ...(user.roles !== undefined && { roles: user.roles }),
                ...(user.profile !== undefined && { profile: user.profile }),
            },
        });
        return this.mapToEntity(updated);
    }
    async delete(id) {
        try {
            await this.prisma.user.delete({ where: { id } });
            return true;
        }
        catch {
            return false;
        }
    }
    mapToEntity(user) {
        return {
            id: user.id,
            email: user.email,
            passwordHash: user.passwordHash,
            name: user.name,
            roles: (user.roles ?? []),
            profile: user.profile ?? null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
};
exports.PrismaUserRepository = PrismaUserRepository;
exports.PrismaUserRepository = PrismaUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaUserRepository);
//# sourceMappingURL=prisma-user.repository.js.map