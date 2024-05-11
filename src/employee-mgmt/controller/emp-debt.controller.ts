import {
    Controller,
    Post,
    Body,
    Req,
    Patch,
    Get,
    Param,
    Query
} from '@nestjs/common';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { PaginationDto } from 'src/core/Constants/pagination';
import { PaginateResult, AggregatePaginateResult } from 'mongoose';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { CreateDebtEmpDto } from '../dto/create-emp-debt.dto';
import { EmpDebtService } from '../service/emp-debt.service';
import { UpdateEmpDebtDto } from '../dto/update-emp-debt.dto';
import { EmpDebtDocument } from '../schemas/emp-debt.schema';
import { EmpDebtFindAllDto, EmpDebtSummaryDto } from '../dto/query-emp-debt-summary.dto';

@Controller('employee-debt')
@ApiTags('Employee Debt')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class EmpDebtController {
    constructor(
        // private readonly empService: EmpService,
        // private readonly empTimeSheetService: EmpTimeSheetService,
        private readonly empDebtService: EmpDebtService
    ) { }

    @Post()
    // @PermissionGuard(PermissionSubject.GlMaterialCode, Permission.Common.CREATE)
    async create(@Req() req, @Body() dto: CreateDebtEmpDto) {
        return await this.empDebtService.create(req, dto);
    }

    @Patch(':empDebtId')
    // @PermissionGuard(PermissionSubject.EmpDebt, Permission.Common.UPDATE)
    async update(
        @Param('empDebtId') empDebtId: string,
        @Body() dto: UpdateEmpDebtDto,
    ) {
        return await this.empDebtService.update(empDebtId, dto);
    }

    @Patch('/approve/:empDebtId')
    // @PermissionGuard(PermissionSubject.EmpDebt, Permission.Common.UPDATE)
    async approveEmpDebt(
        @Param('empDebtId') empDebtId: string,
        // @Body() dto: UpdateEmpDebtDto,
    ) {
        return await this.empDebtService.approve(empDebtId);
    }

    @Get()
    // @PermissionGuard(PermissionSubject.EmpDebt, Permission.Common.LIST)
    async findAll(
        @Req() req,
        @Query() query: EmpDebtFindAllDto,
        @Query() paginateOptions: PaginationDto,
    ): Promise<PaginateResult<EmpDebtDocument>> {
        return await this.empDebtService.findAll(req,query, paginateOptions);
    }

    @Get('summary')
    // @PermissionGuard(PermissionSubject.EmpDebt, Permission.Common.LIST)
    async summary(
        @Req() req,
        @Query() query: EmpDebtSummaryDto,
        @Query() paginateOptions: PaginationDto,
    ): Promise<[AggregatePaginateResult<EmpDebtDocument>]> {
        return await this.empDebtService.summary(req, query, paginateOptions);
    }

    @Get(':empDebtId')
    // @PermissionGuard(PermissionSubject.EmpDebt, Permission.Common.FETCH)
    async findOne(@Param('empDebtId') empDebtId: string) {
        return await this.empDebtService.findOne(empDebtId);
    }

}