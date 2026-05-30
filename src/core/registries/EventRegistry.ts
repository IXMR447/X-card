import type { EventDefinition, EventOutcome } from '@/entities';

const eventRegistry = new Map<string, EventDefinition>();
const outcomeRegistry = new Map<string, EventOutcome>();

export function registerEvent(event: EventDefinition): void {
  eventRegistry.set(event.id, event);
}

export function registerEvents(events: EventDefinition[]): void {
  events.forEach(registerEvent);
}

export function getEvent(id: string): EventDefinition | undefined {
  return eventRegistry.get(id);
}

export function getAllEvents(): EventDefinition[] {
  return Array.from(eventRegistry.values());
}

export function pickRandomEvent(exclude: string[] = []): EventDefinition | undefined {
  const pool = getAllEvents().filter((e) => !exclude.includes(e.id));
  if (pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function registerOutcome(outcome: EventOutcome): void {
  outcomeRegistry.set(outcome.id, outcome);
}

export function registerOutcomes(outcomes: EventOutcome[]): void {
  outcomes.forEach(registerOutcome);
}

export function getOutcome(id: string): EventOutcome | undefined {
  return outcomeRegistry.get(id);
}
