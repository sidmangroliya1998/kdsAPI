import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';

import { users } from './users.stub';
import mongoose from 'mongoose';
import { PermissionActions } from 'src/core/Constants/permission.type';

export const permissions = [
  {
    subject: PermissionSubject.ALL,
    permissions: [PermissionActions.MANAGE],
  },
];

export const roles = [
  {
    _id: new mongoose.Types.ObjectId(),
    clientId: new mongoose.Types.ObjectId(),
    name: 'Super Admin',
    permissions: [permissions[0]],
    slug: 'super admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
