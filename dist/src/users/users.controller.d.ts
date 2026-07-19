import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(user: any): Promise<{
        id: any;
        email: any;
        firstName: any;
        lastName: any;
        roles: any;
        profile: any;
    }>;
    updateMe(user: any, profile: any): Promise<{
        id: any;
        email: any;
        firstName: any;
        lastName: any;
        roles: any;
        profile: any;
    }>;
    private mapToPublicDto;
}
