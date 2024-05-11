import {
    Controller,
    Post,
    Body,
    Req,
    UploadedFiles,
    UseInterceptors,
    Param,
    Get
} from '@nestjs/common';
import { PermissionGuard } from 'src/core/decorators/permission.decorator';
import { PermissionSubject } from 'src/core/Constants/permissions/permissions.enum';
import { Permission } from 'src/core/Constants/permission.type';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ApiBearerAuth, ApiHeader, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { NewClientManagementService } from './new-client.service';
import { CreateDeleteProcessDto } from './dto/create-delete-client.dto';
import { FilesFastifyInterceptor, diskStorage } from 'fastify-file-interceptor';
import { editFileName, importFilter } from 'src/core/Helpers/file-upload-utils';
import { ImportProcessDto } from './dto/import-process.dto';

@Controller('new-client-mgmt')
@ApiTags('New Client Management')
@ApiBearerAuth('access-token')
@ApiHeader({ name: 'lang' })
export class NewClientManagementController {
    constructor(
        private readonly newClientMgmtService: NewClientManagementService,
    ) { }

    @Post('bulk-delete')
    @PermissionGuard(
        PermissionSubject.Supplier,
        Permission.Common.DELETE,
    )
    async deleteSupplirBulk(
        @Req() req,
        @Body() dto: CreateDeleteProcessDto,
        @I18n() i18n: I18nContext,
    ) {
        return await this.newClientMgmtService.deleteProcess(req, dto);
    }


    @ApiConsumes('multipart/form-data')
    @Post('import-data')
    @UseInterceptors(
        FilesFastifyInterceptor('file', 1, {
            storage: diskStorage({
                destination: './upload/',
                filename: editFileName,
            }),
            fileFilter: importFilter,
        }),
    )
    @PermissionGuard(PermissionSubject.Import, Permission.Common.CREATE)
    async file(
        @Req() req: any,
        @UploadedFiles() file: Express.Multer.File,
        @Body() dto: ImportProcessDto,
    ) {
        return await this.newClientMgmtService.excelProcessing(req, dto, file);
    }

    @Get('master-data/:supplierId')
    @PermissionGuard(
        PermissionSubject.Supplier,
        Permission.Common.FETCH,
    )
    async getAllMasterData(
        @Req() req,
        @Param('supplierId') supplierId: string
    ) {
        return await this.newClientMgmtService.getAllMasterData(supplierId);
    }


}