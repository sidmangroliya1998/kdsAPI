import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Training, TrainingDocument } from './schema/training.schema';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';

@Injectable()
export class TrainingService {
    constructor(
        @InjectModel(Training.name) private trainingModel: Model<TrainingDocument>,
    ) { }

    async create(createTrainingDto: CreateTrainingDto): Promise<Training> {
        const createdTraining = await this.trainingModel.create(createTrainingDto);
        return createdTraining;
    }

    async findAll(): Promise<Training[]> {
        return await this.trainingModel.find().lean();
    }

    async findOne(id: string): Promise<Training> {
        return await this.trainingModel.findById(id);
    }

    async update(id: string, updateTrainingDto: UpdateTrainingDto): Promise<Training> {
        return await this.trainingModel.findByIdAndUpdate(id, updateTrainingDto, { new: true });
    }

    async remove(id: string): Promise<Training> {
        return this.trainingModel.findByIdAndRemove(id)
    }
}
