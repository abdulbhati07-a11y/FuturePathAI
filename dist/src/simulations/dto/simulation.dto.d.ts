export declare enum SimulationCategory {
    CAREER = "CAREER",
    FINANCIAL = "FINANCIAL",
    PERSONAL = "PERSONAL",
    BUSINESS = "BUSINESS",
    HEALTH = "HEALTH",
    EDUCATION = "EDUCATION"
}
export declare enum SimulationStatus {
    DRAFT = "DRAFT",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    ARCHIVED = "ARCHIVED"
}
export declare class CreateSimulationDto {
    title: string;
    category: SimulationCategory;
}
export declare class UpdateSimulationDto {
    title?: string;
    category?: SimulationCategory;
    status?: SimulationStatus;
    answers?: Record<string, any>;
}
