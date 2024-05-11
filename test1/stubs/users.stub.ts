import { UserCreateDto } from 'src/users/dto/users.dto';

export const UserCreateStub = (): UserCreateDto => {
  return {
    name: 'Sumit',
    phoneNumber: '1234567890',
    password: 'Test@12345',
  };
};
