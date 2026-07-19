"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryUserRepository = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let InMemoryUserRepository = class InMemoryUserRepository {
    users = new Map();
    async findById(id) {
        return this.users.get(id) || null;
    }
    async findByEmail(email) {
        for (const user of this.users.values()) {
            if (user.email === email) {
                return user;
            }
        }
        return null;
    }
    async create(user) {
        const newUser = {
            id: (0, crypto_1.randomUUID)(),
            email: user.email,
            passwordHash: user.passwordHash,
            name: user.name,
            roles: user.roles || [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.users.set(newUser.id, newUser);
        return newUser;
    }
    async update(id, userUpdate) {
        const user = this.users.get(id);
        if (!user)
            return null;
        const updatedUser = { ...user, ...userUpdate, updatedAt: new Date() };
        this.users.set(id, updatedUser);
        return updatedUser;
    }
    async delete(id) {
        return this.users.delete(id);
    }
    async clearAndSeed(users) {
        this.users.clear();
        for (const u of users) {
            this.users.set(u.id, u);
        }
    }
};
exports.InMemoryUserRepository = InMemoryUserRepository;
exports.InMemoryUserRepository = InMemoryUserRepository = __decorate([
    (0, common_1.Injectable)()
], InMemoryUserRepository);
//# sourceMappingURL=in-memory-user.repository.js.map