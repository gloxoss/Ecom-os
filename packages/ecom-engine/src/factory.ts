import { EcomEngine } from './interface';

let engineInstance: EcomEngine | null = null;

export function setEngine(engine: EcomEngine) {
  engineInstance = engine;
}

export function getEngine(): EcomEngine | null {
  return engineInstance;
}
