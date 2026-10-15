export interface HealthRepository {
  checkDbHealth(): Promise<boolean>;
}
