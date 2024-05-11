import { registerAs } from '@nestjs/config';

export default registerAs('feedus', () => ({
  API_BASE_URL: process.env.FEEDUS_API_BASE_URL,
}));
