import { PrismaService } from '../../common/prisma/prisma.service';
import { SimulationEntity } from '../entities/simulation.entity';
import { ISimulationRepository } from '../interfaces/simulation.repository.interface';
import { SimulationCategory, SimulationStatus } from '../dto/simulation.dto';
export declare class PrismaSimulationRepository implements ISimulationRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<SimulationEntity | null>;
    findAll(filters: {
        userId?: string;
        category?: SimulationCategory;
        status?: SimulationStatus;
        page: number;
        limit: number;
    }): Promise<{
        data: SimulationEntity[];
        total: number;
    }>;
    create(simulation: Partial<SimulationEntity>): Promise<SimulationEntity>;
    update(id: string, simulation: Partial<SimulationEntity>): Promise<SimulationEntity | null>;
    delete(id: string): Promise<boolean>;
    private mapToEntity;
}
