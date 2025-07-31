// src/task-management/task.controller.ts

import { Controller, Get, Post, Put, Delete, Param, Body, Req, Query, Patch } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskManagementService } from './task-mgmt.service';
import { TaskManagement, TaskManagementDocument } from './schema/task-mgmt.schema';
import { PaginationDto } from 'src/core/Constants/pagination';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateBulkApprovalDto, CreateBulkTaskDto } from './dto/create-bulk-task.dto';

@Controller('task-management')
@ApiTags('Task Management')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class TaskManagementController {
    constructor(private readonly taskService: TaskManagementService) { }

    @Post()
    async create(@Req() req, @Body() createTaskDto: CreateTaskDto): Promise<TaskManagementDocument> {
        return this.taskService.create(req, createTaskDto);
    }

    @Post('bulk')
    async createBulk(@Req() req, @Body() dto: CreateBulkTaskDto): Promise<any> {
        return this.taskService.createBulk(req, dto);
    }

    @Get()
    async findAll(@Req() req,
        @Query() paginateOptions: PaginationDto,
    ): Promise<any> {
        return this.taskService.findAll(req, paginateOptions);
    }

    @Get(':id')
    async findById(@Param('id') id: string): Promise<TaskManagementDocument> {
        return this.taskService.findById(id);
    }

    @Patch(':id')
    async update(@Req() req, @Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto): Promise<TaskManagementDocument> {
        return this.taskService.update(req, id, updateTaskDto);
    }

    @Post('bulk-approval')
    async createBulkApproval(@Req() req, @Body() dto: CreateBulkApprovalDto): Promise<any> {
        return this.taskService.bulkApproval(req, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string): Promise<TaskManagementDocument> {
        return this.taskService.delete(id);
    }

    @Get('bulk-script')
    async bulkScript() {
        return this.taskService.bulkProcess();
    }
}
