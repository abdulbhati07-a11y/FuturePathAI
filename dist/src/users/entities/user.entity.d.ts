import { BaseEntity } from '../../common/entities/base.entity';
import { Role } from '../../common/enums/role.enum';
export declare class UserEntity extends BaseEntity {
    email: string;
    passwordHash: string;
    name: string;
    roles: Role[];
    profile?: any;
}
