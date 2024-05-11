import { Model, Schema } from 'mongoose';

import * as redis from 'redis';

export function AutoCachePlugin(schema: Schema<any>, options: any) {
  schema.post('save', async function (doc, res) {
    const { _id, collection, isNew } = this;

    const redisClient = redis.createClient({
      host: process.env.AWS_REDIS_HOST,
      port: parseInt(process.env.AWS_REDIS_PORT),
    });
    await redisClient.set(doc._id.toString(), JSON.stringify(doc?.toObject()));
  });
  schema.post(/^(updateOne|findOneAndUpdate)$/, async function (doc, res) {
    if (doc && doc._id) {
      const redisClient = redis.createClient({
        host: process.env.AWS_REDIS_HOST,
        port: parseInt(process.env.AWS_REDIS_PORT),
      });
      await redisClient.set(doc._id.toString(), JSON.stringify(doc));
    }
  });
}
