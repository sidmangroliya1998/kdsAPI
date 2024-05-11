import mongoose from 'mongoose';
import { admins } from './stubs/admins.stub';

import { roles } from './stubs/roles.stub';
import { features, packages } from './stubs/packages.stub';
import { users } from './stubs/users.stub';

export const populateData = async (uri) => {
  await mongoose.connect(uri, { dbName: 'test' });
  //Populating data using stubs
  await mongoose.connection.collection('features').insertMany(features);
  await mongoose.connection.collection('packages').insertMany(packages);
  await mongoose.connection.collection('roles').insertMany(roles);
  await mongoose.connection.collection('admins').insertMany(admins);
};

export const createSupplierAdmin = async (uri, supplier) => {
  await mongoose.connect(uri, { dbName: 'test' });
  users.forEach((u) => {
    u.supplierId = supplier._id;
  });
  await mongoose.connection.collection('users').insertMany(users);
};
