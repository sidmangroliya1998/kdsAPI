import mongoose from 'mongoose';

export const features = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'All Features',
    nameAr: 'string',
    permissions: [
      {
        subject: 'ALL',
        permissions: ['MANAGE'],
      },
    ],
    addedBy: new mongoose.Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const packages = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Ultimate Package',
    nameAr: 'الباقة الاتيميت',
    amount: 110,
    days: 365,
    gracePeriod: 10,
    trialPeriod: 10,
    features: [features[0]._id],
    isDefaultPackage: true,
    addedBy: new mongoose.Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
