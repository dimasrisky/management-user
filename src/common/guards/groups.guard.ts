import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { GROUPS_KEY } from '../decorators/groups.decorator';
import { ForbiddenException } from '../bases/exceptions/templates/forbiden.exception';

@Injectable()
export class GroupsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const allowedBranchCodes = this.reflector.getAllAndOverride<string[]>(
      GROUPS_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!allowedBranchCodes || allowedBranchCodes.length === 0) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    // SUPER_ADMIN has no branch and scopes across all branches.
    if (user?.roles.includes('superadmin')) {
      return true;
    }

    if (!user?.branchCode || !allowedBranchCodes.includes(user.branchCode)) {
      throw new ForbiddenException(
        `Requires membership in one of these branches: ${allowedBranchCodes.join(', ')}.`,
      );
    }

    return true;
  }
}
