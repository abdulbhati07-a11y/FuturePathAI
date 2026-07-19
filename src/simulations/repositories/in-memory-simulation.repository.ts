import { Injectable } from '@nestjs/common';
import { ISimulationRepository } from '../interfaces/simulation.repository.interface';
import { SimulationEntity } from '../entities/simulation.entity';
import { SimulationCategory, SimulationStatus } from '../dto/simulation.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class InMemorySimulationRepository implements ISimulationRepository {
  private simulations: Map<string, SimulationEntity> = new Map();

  async findById(id: string): Promise<SimulationEntity | null> {
    return this.simulations.get(id) || null;
  }

  async findAll(filters: {
    userId?: string;
    category?: SimulationCategory;
    status?: SimulationStatus;
    page: number;
    limit: number;
  }): Promise<{ data: SimulationEntity[]; total: number }> {
    let results = Array.from(this.simulations.values());

    if (filters.userId) {
      results = results.filter((s) => s.userId === filters.userId);
    }
    if (filters.category) {
      results = results.filter((s) => s.category === filters.category);
    }
    if (filters.status) {
      results = results.filter((s) => s.status === filters.status);
    }

    const total = results.length;
    const start = (filters.page - 1) * filters.limit;
    const end = start + filters.limit;
    const paginatedData = results.slice(start, end);

    return { data: paginatedData, total };
  }

  async create(
    simulation: Partial<SimulationEntity>,
  ): Promise<SimulationEntity> {
    const newSim: SimulationEntity = {
      id: randomUUID(),
      userId: simulation.userId!,
      title: simulation.title!,
      category: simulation.category!,
      status: simulation.status || SimulationStatus.DRAFT,
      answers: simulation.answers || {},
      generatedQuestions: simulation.generatedQuestions || [],
      decisionScore: simulation.decisionScore || null,
      riskScore: simulation.riskScore || null,
      confidenceScore: simulation.confidenceScore || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.simulations.set(newSim.id, newSim);
    return newSim;
  }

  async update(
    id: string,
    simulationUpdate: Partial<SimulationEntity>,
  ): Promise<SimulationEntity | null> {
    const sim = this.simulations.get(id);
    if (!sim) return null;

    const updatedSim = { ...sim, ...simulationUpdate, updatedAt: new Date() };
    this.simulations.set(id, updatedSim);
    return updatedSim;
  }

  async delete(id: string): Promise<boolean> {
    return this.simulations.delete(id);
  }
}
