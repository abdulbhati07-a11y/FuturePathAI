import { SimulationsService } from './simulations.service';
import { CreateSimulationDto, UpdateSimulationDto } from './dto/simulation.dto';
export declare class SimulationsController {
    private readonly simulationsService;
    constructor(simulationsService: SimulationsService);
    private getUserId;
    create(user: any, createSimulationDto: CreateSimulationDto): Promise<import("./entities/simulation.entity").SimulationEntity>;
    findPublic(): Promise<{
        authorName: any;
        authorProfile: any;
        id: string;
        title: string;
        category: import("./dto/simulation.dto").SimulationCategory;
        status: import("./dto/simulation.dto").SimulationStatus;
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
    findAll(user: any, query: any): Promise<{
        data: {
            id: string;
            title: string;
            category: import("./dto/simulation.dto").SimulationCategory;
            status: import("./dto/simulation.dto").SimulationStatus;
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
    findOne(user: any, id: string): Promise<import("./entities/simulation.entity").SimulationEntity>;
    update(user: any, id: string, updateSimulationDto: UpdateSimulationDto): Promise<import("./entities/simulation.entity").SimulationEntity | null>;
    togglePublic(user: any, id: string, isPublic: boolean): Promise<import("./entities/simulation.entity").SimulationEntity | null>;
    remove(user: any, id: string): Promise<boolean>;
    getResults(user: any, id: string): Promise<{
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
    analyze(user: any, id: string): Promise<import("./entities/simulation.entity").SimulationEntity | null>;
}
