import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { PermissionService } from './permission.service';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { PermissionActions } from 'src/core/Constants/permission.type';
import { PERMISSION } from 'src/core/decorators/permission.decorator';
import { STATUS_MSG } from 'src/core/Constants/status-message.constants';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) { }

  async canActivate(context: ExecutionContext) {
    const permissionDecorator = this.reflector.getAllAndOverride<{
      subject: PermissionSubject;
      permission: PermissionActions;
    }>(PERMISSION, [context.getHandler(), context.getClass()]);

    if (permissionDecorator) {
      const request = context.switchToHttp().getRequest();
      console.log(
        "request ========>", request
      );
      
      const user = request.user;
      const supplierPermission = await this.permissionService.supplierHasPermission(
          user,
          permissionDecorator.subject,
          permissionDecorator.permission,
        )
        console.log("supplierPermission", supplierPermission);
        
      const userPermission = await this.permissionService.userHasPermission(
          user,
          permissionDecorator.subject,
          permissionDecorator.permission,
        )
      console.log("userPermission", userPermission)
      if (
        (await this.permissionService.supplierHasPermission(
          user,
          permissionDecorator.subject,
          permissionDecorator.permission,
        )) &&
        (await this.permissionService.userHasPermission(
          user,
          permissionDecorator.subject,
          permissionDecorator.permission,
        ))
      )
        return true;

      throw new UnauthorizedException({
        ...STATUS_MSG.ERROR.FORBIDDEN,
        message:
          'You are forbidden to access this api. You need ' +
          permissionDecorator.permission +
          ' on ' +
          permissionDecorator.subject +
          ' permission to access this API',
      });
    }
    return true;
  }
}
