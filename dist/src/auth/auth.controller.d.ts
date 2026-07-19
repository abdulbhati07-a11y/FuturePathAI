import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            roles: import("../common/enums/role.enum").Role[];
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string;
            roles: import("../common/enums/role.enum").Role[];
        };
    }>;
    logout(user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    refresh(): Promise<{
        success: boolean;
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(): Promise<{
        success: boolean;
        message: string;
    }>;
    getProfile(user: any): Promise<any>;
}
