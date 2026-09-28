export interface IJwtPayload {
  userId: string;
  email?: string;
  roles: string[];
  branchCode?: string;
}
