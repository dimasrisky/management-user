import { SetMetadata } from '@nestjs/common';

export const GROUPS_KEY = 'groups';
/** Restrict an endpoint to specific Keycloak groups (e.g. 'admin', 'visitor'). */
export const Groups = (...groups: string[]) => SetMetadata(GROUPS_KEY, groups);
