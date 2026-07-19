import type { ISimulationRepository } from './interfaces/simulation.repository.interface';
import { CreateSimulationDto, UpdateSimulationDto, SimulationStatus } from './dto/simulation.dto';
import type { IAIProvider } from '../ai/interfaces/ai.provider.interface';
import { DecisionEngineService } from '../decision-engine/decision-engine.service';
import { SimulationEntity } from './entities/simulation.entity';
import { PrismaService } from '../common/prisma/prisma.service';
export declare class SimulationsService {
    private readonly simulationRepo;
    private readonly aiProvider;
    private readonly decisionEngine;
    private readonly prisma;
    constructor(simulationRepo: ISimulationRepository, aiProvider: IAIProvider, decisionEngine: DecisionEngineService, prisma: PrismaService);
    onModuleInit(): Promise<void>;
    create(userId: string, createDto: CreateSimulationDto): Promise<SimulationEntity>;
    findAll(userId: string, query: any): Promise<{
        data: {
            id: string;
            title: string;
            category: import("./dto/simulation.dto").SimulationCategory;
            status: SimulationStatus;
            riskLevel: string;
            riskPercent: number;
            confidenceScore: number;
            decisionGrade: string;
            statusTag: string;
            updatedAt: Date;
            decisionScore: number | null;
            riskScore: number | null;
            isPublic: boolean | undefined;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
        };
    }>;
    private mapToFrontendDto;
    findPublic(): Promise<{
        authorName: any;
        authorProfile: any;
        id: string;
        title: string;
        category: import("./dto/simulation.dto").SimulationCategory;
        status: SimulationStatus;
        riskLevel: string;
        riskPercent: number;
        confidenceScore: number;
        decisionGrade: string;
        statusTag: string;
        updatedAt: Date;
        decisionScore: number | null;
        riskScore: number | null;
        isPublic: boolean | undefined;
    }[]>;
    findOne(userId: string, id: string): Promise<SimulationEntity>;
    update(userId: string, id: string, updateDto: UpdateSimulationDto): Promise<SimulationEntity | null>;
    togglePublic(userId: string, id: string, isPublic: boolean): Promise<SimulationEntity | null>;
    delete(userId: string, id: string): Promise<boolean>;
    analyze(userId: string, id: string): Promise<SimulationEntity | null>;
    getResults(userId: string, id: string): Promise<{
        id: string;
        title: string;
        isPublic: boolean | undefined;
        finalizedDate: string;
        overallRisk: string;
        riskLabel: string;
        confidence: number;
        bestCase: any;
        mostLikely: any;
        worstCase: any;
        rightReasons: any;
        wrongReasons: any;
        timeline: any;
        alternatives: any;
    }>;
}
