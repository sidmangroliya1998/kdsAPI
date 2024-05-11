import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Req,
    Query,
} from '@nestjs/common';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult } from 'mongoose';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CreateEmpDto } from '../dto/create-emp.dto';
import { EmpDocument } from '../schemas/emp.schema';
import { UpdateEmpDto } from '../dto/update-emp-dto';
import { CreateEmpHourlyTimeSheetDto } from '../dto/create-emp-hourly-timesheet.dto';
import { UpdateEmpHourlyTimeSheetDto } from '../dto/update-emp-hourly-timesheet.dto';
import { EmpTimeSheetDocument } from '../schemas/emp-hourly-timesheet.schema';
import { QueryPayRollDto } from '../dto/query-payroll-dto';
import { CreateEmpMealDto } from '../dto/create-emp-meal.dto';
import { UpdateEmpMealDto } from '../dto/update-emp-meal.dto';
import { EmpTimeSheetService } from '../service/emphourlytimesheet.service';
import { EmpService } from '../service/emp.service';

@Controller('employee')
@ApiTags('Employee Management')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class EmpController {
    constructor(private readonly empService: EmpService,
        private readonly empTimeSheetService: EmpTimeSheetService) { }

    @Post()
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.CREATE)
    async create(@Req() req, @Body() dto: CreateEmpDto) {
        return await this.empService.create(req, dto);
    }

    @Get()
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.LIST)
    async findAll(
        @Req() req,
        @Query() paginateOptions: PaginationDto,
    ): Promise<PaginateResult<EmpDocument>> {
        return await this.empService.findAll(req, paginateOptions);
    }

    @Get(':empId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.FETCH)
    async findOne(@Param('empId') empId: string) {
        return await this.empService.findOne(empId);
    }

    @Patch(':empId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.UPDATE)
    async update(
        @Param('empId') empId: string,
        @Body() dto: UpdateEmpDto,
    ) {
        return await this.empService.update(empId, dto);
    }

    @Delete(':empId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.DELETE)
    async remove(@Param('empId') empId: string) {
        return await this.empService.remove(empId);
    }

    /* Hourly Time Sheet Service */


    @Post('hourly-timesheet')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.CREATE)
    async createHourlyTimeSheet(@Req() req, @Body() dto: CreateEmpHourlyTimeSheetDto) {
        return await this.empTimeSheetService.create(req, dto);
    }

    @Get('hourly-timesheet')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.LIST)
    async findAllHourlyTimeSheet(
        @Req() req,
        @Query() paginateOptions: PaginationDto,
    ): Promise<PaginateResult<EmpTimeSheetDocument>> {
        return await this.empTimeSheetService.findAll(req, paginateOptions);
    }

    @Get('hourly-timesheet/:sheetId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.FETCH)
    async findOneHourlyTimeSheet(@Param('sheetId') sheetId: string) {
        return await this.empTimeSheetService.findOne(sheetId);
    }

    @Patch('hourly-timesheet/:sheetId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.UPDATE)
    async updateHourlyTimeSheet(
        @Param('sheetId') sheetId: string,
        @Body() dto: UpdateEmpHourlyTimeSheetDto,
    ) {
        return await this.empTimeSheetService.update(sheetId, dto);
    }

    @Delete('hourly-timesheet/:sheetId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.DELETE)
    async removeHourlyTimeSheet(@Param('sheetId') sheetId: string) {
        return await this.empTimeSheetService.remove(sheetId);
    }

    @Get('payroll-detail/:restaurantId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.LIST)
    async getMonthlySalaryDetail(
        @Req() req,
        @Param('restaurantId') restaurantId: string
    ): Promise<any> {
        return await this.empTimeSheetService.getPayRollAmount(req, restaurantId);
    }

    @Post('monthly-payroll')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.CREATE)
    async createMonthlyPayRoll(@Req() req, @Body() dto: QueryPayRollDto) {
        return await this.empTimeSheetService.submitPayRoll(req, dto);
    }

    @Get('monthly-salary')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.LIST)
    async getAllMonthlySalary(
        @Req() req,
        @Query() paginateOptions: PaginationDto,
    ): Promise<any> {
        return await this.empTimeSheetService.findAllMonthlyPayRoll(req, paginateOptions);
    }


    /** EMPLOYEE MEAL */
    @Post('emp/employee-meal')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.CREATE)
    async createEmpMeal(@Req() req, @Body() dto: CreateEmpMealDto) {
        return await this.empService.createEmployeeMeal(req, dto);
    }

    @Get('emp/employee-meal')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.LIST)
    async getAllEmployeeMeal(
        @Req() req,
        @Query() paginateOptions: PaginationDto,
    ): Promise<any> {
        return await this.empService.findAllEmployeeMeal(req, paginateOptions);
    }

    @Get('emp/employee-meal/:empMealId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.LIST)
    async getEmployeeMealById(
        @Req() req,
        @Param('empMealId') empMealId: string
    ): Promise<any> {
        return await this.empService.findOneEmployeeMeal(empMealId);
    }

    @Patch('emp/employee-meal/:empMealId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.UPDATE)
    async updateEmployeeMeal(
        @Param('empMealId') empMealId: string,
        @Body() dto: UpdateEmpMealDto,
    ) {
        return await this.empService.updateEmployeeMeal(empMealId, dto);
    }
    @Patch('emp/employee-meal-approval/:empMealId')
    @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.UPDATE)
    async approveEmployeeMeal(
        @Req() req,
        @Param('empMealId') empMealId: string,
    ) {
        return await this.empService.approveEmployeeMeal(req, empMealId);
    }

}
