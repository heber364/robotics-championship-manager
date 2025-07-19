import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums';
import { ROLES_KEY } from '../decorators';
import { JwtPayload } from 'src/auth/types';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }
    const client: Socket & { user: JwtPayload } = context.switchToWs().getClient();
    const { user } = client as { user: JwtPayload };

    const hasPermission =
      user.role === Role.SUPER_ADMIN || requiredRoles.some((role) => user.role === role);

    if (!hasPermission) {
      throw new WsException('Insufficient role permissions.');
    }

    return false;
  }
}
