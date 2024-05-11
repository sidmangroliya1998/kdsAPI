// training.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { TrainingService } from './training.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { Training } from './schema/training.schema';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';

@Controller('training')
@ApiTags('Training')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) { }

  @Post()
  create(@Body() createTrainingDto: CreateTrainingDto): Promise<Training> {
    return this.trainingService.create(createTrainingDto);
  }

  @Get()
  findAll(): Promise<Training[]> {
    return this.trainingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Training> {
    return this.trainingService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateTrainingDto: UpdateTrainingDto,
  ): Promise<Training> {
    return this.trainingService.update(id, updateTrainingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Training> {
    return this.trainingService.remove(id);
  }
}
