import {
  Controller,
  Get,
  Patch,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: any) {
    // If the request is authenticated via passport, `user` will be populated with { userId, email }
    if (user?.id || user?.userId) {
      const dbUser = await this.usersService.findById(user.id || user.userId);
      if (!dbUser) throw new NotFoundException('User not found');
      return this.mapToPublicDto(dbUser);
    }

    // For mock/dev purposes when auth is disabled, fallback to the seeded user
    const fallbackUser = await this.usersService.findByEmail(
      'admin@futurepath.ai',
    );
    if (!fallbackUser) throw new NotFoundException('No seeded user found');
    return this.mapToPublicDto(fallbackUser);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@CurrentUser() user: any, @Body('profile') profile: any) {
    if (user?.id || user?.userId) {
      const dbUser = await this.usersService.update(user.id || user.userId, {
        profile,
      });
      if (!dbUser) throw new NotFoundException('User not found');
      return this.mapToPublicDto(dbUser);
    }

    // Fallback for mock user
    const fallbackUser = await this.usersService.findByEmail(
      'admin@futurepath.ai',
    );
    if (!fallbackUser) throw new NotFoundException('No seeded user found');
    const updated = await this.usersService.update(fallbackUser.id, {
      profile,
    });
    return this.mapToPublicDto(updated);
  }

  private mapToPublicDto(user: any) {
    // Return standard shape, dropping password/internal details
    return {
      id: user.id,
      email: user.email,
      firstName: user.name?.split(' ')[0] || 'Unknown',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      roles: user.roles,
      profile: user.profile || {},
    };
  }
}
