export interface IUser {
  keycloakId: string;
  email: string | null;
  firstName: string;
  lastName: string | null;
  isActive: boolean;
}
