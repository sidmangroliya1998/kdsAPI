import mongoose from 'mongoose';
import { roles } from './roles.stub';

export const users = [
  {
    _id: new mongoose.Types.ObjectId(),
    supplierId: new mongoose.Types.ObjectId(),
    name: 'Supplier Admin',
    email: 'supplieradmin@gmail.com',
    password: '$2a$10$VrWbm8PXKb5nd2XfWh1Pv.9wHd3At7XeENMjV7Ajmk0fGxfEyYdny',
    role: roles[0]._id,
    phoneNumber: '1234567890',
  },
];
