import { BaseEntity } from '../../common/entities/base.entity';
import { SimulationCategory, SimulationStatus } from '../dto/simulation.dto';

export class SimulationEntity extends BaseEntity {
  userId: string;
  title: string;
  category: SimulationCategory;
  status: SimulationStatus;
  answers: Record<string, any>;
  generatedQuestions: Array<{
    id: string;
    text: string;
    type: string;
    options?: string[];
  }>;
  decisionScore: number | null;
  riskScore: number | null;
  confidenceScore: number | null;
  isPublic?: boolean;
}
