import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { GROUPS_KEY } from '../decorators/groups.decorator';
import { ForbiddenException } from '../bases/exceptions/templates/forbiden.exception';

@Injectable()
export class GroupsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const allowedGroups = this.reflector.getAllAndOverride<string[]>(
      GROUPS_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!allowedGroups || allowedGroups.length === 0) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    const userGroups = user?.groups ?? [];
    const isMember = allowedGroups.some((group) => userGroups.includes(group));

    if (!isMember) {
      throw new ForbiddenException(
        `Requires membership in one of these groups: ${allowedGroups.join(', ')}.`,
      );
    }

    return true;
  }
}
