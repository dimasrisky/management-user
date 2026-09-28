import { SetMetadata } from '@nestjs/common';

export const GROUPS_KEY = 'groups';
/** Restrict an endpoint to specific branch groups (e.g. 'JKT', 'SBY'). SUPER_ADMIN always bypasses. */
export const Groups = (...branchCodes: string[]) =>
  SetMetadata(GROUPS_KEY, branchCodes);
