import { SimulationEntity } from '../entities/simulation.entity';
import { SimulationCategory, SimulationStatus } from '../dto/simulation.dto';
export declare const SIMULATION_REPOSITORY: unique symbol;
export interface ISimulationRepository {
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
}
