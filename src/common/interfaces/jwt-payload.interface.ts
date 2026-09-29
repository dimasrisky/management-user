export interface IJwtPayload {
  userId: string;
  email?: string;
  roles: string[];
  groups: string[];
}
