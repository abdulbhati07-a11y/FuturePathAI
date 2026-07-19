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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getMe(user) {
        if (user?.id || user?.userId) {
            const dbUser = await this.usersService.findById(user.id || user.userId);
            if (!dbUser)
                throw new common_1.NotFoundException('User not found');
            return this.mapToPublicDto(dbUser);
        }
        const fallbackUser = await this.usersService.findByEmail('admin@futurepath.ai');
        if (!fallbackUser)
            throw new common_1.NotFoundException('No seeded user found');
        return this.mapToPublicDto(fallbackUser);
    }
    async updateMe(user, profile) {
        if (user?.id || user?.userId) {
            const dbUser = await this.usersService.update(user.id || user.userId, {
                profile,
            });
            if (!dbUser)
                throw new common_1.NotFoundException('User not found');
            return this.mapToPublicDto(dbUser);
        }
        const fallbackUser = await this.usersService.findByEmail('admin@futurepath.ai');
        if (!fallbackUser)
            throw new common_1.NotFoundException('No seeded user found');
        const updated = await this.usersService.update(fallbackUser.id, {
            profile,
        });
        return this.mapToPublicDto(updated);
    }
    mapToPublicDto(user) {
        return {
            id: user.id,
            email: user.email,
            firstName: user.name?.split(' ')[0] || 'Unknown',
            lastName: user.name?.split(' ').slice(1).join(' ') || '',
            roles: user.roles,
            profile: user.profile || {},
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current user profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('profile')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMe", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map