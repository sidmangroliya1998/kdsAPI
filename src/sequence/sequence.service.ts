import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sequence, SequenceDocument } from './schemas/sequence.schema';
@Injectable()
export class SequenceService {
    constructor(

        @InjectModel(Sequence.name)
        private readonly sequencelModel: Model<SequenceDocument>,
    ) { }
    async createAndUpdate(objectType: string, supplierId: string, prefix: string): Promise<SequenceDocument> {

        let sequence = await this.sequencelModel.findOne({
            objectType: objectType,
            supplierId: supplierId
        })

        let nextSequenceValue = `${prefix}1`;
        if (sequence) {
            const lastSequenceValue = sequence.sequenceValue;
            const lastSequenceNumber = parseInt(lastSequenceValue.slice(1), 10);
            nextSequenceValue = prefix + (lastSequenceNumber + 1);
        }
        return await this.sequencelModel.findOneAndUpdate(
            { objectType: objectType, supplierId: supplierId },
            {
                $set: { sequenceValue: nextSequenceValue },
                $setOnInsert: {
                    supplierId: supplierId,
                    objectType: objectType
                }
            },
            {
                upsert: true,
                new: true
            }
        );
    }
}