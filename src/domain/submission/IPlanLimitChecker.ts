export interface IPlanLimitChecker {
  checkSubmissions(tenantId: string): Promise<boolean>;
  checkForms(tenantId: string): Promise<boolean>;
}
