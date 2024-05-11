import mongoose, { Model, PaginateModel, PaginateResult } from 'mongoose';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {  TranslateEditor, TranslateEditorDocument } from './schemas/TranslateEditor.schema';

import { UpdateTranslateEditorDto, UpdateTranslateEditorDtoTwo } from './dto/update-translateEditor.dto';
import { CreateTranslateEditorDto } from './dto/create-translateEditor.dto';
import { S3Service } from 'src/core/Providers/Storage/S3.service';

@Injectable()
export class TranslateEditorService {
  constructor(
    @InjectModel(TranslateEditor.name)
    private TranslateEditorModel: Model<TranslateEditorDocument>,
    @InjectModel(TranslateEditor.name)
    private TranslateEditorModelPag: PaginateModel<TranslateEditorDocument>,
    private readonly s3Service: S3Service,
  ) {}

  async create(
    dto: CreateTranslateEditorDto,
    arFile,
    enFile,
  ): Promise<TranslateEditorDocument> {

    let dataToSave : any = {...dto}
    let isExist = this.TranslateEditorModel.findOne({moduleName : dto.moduleName})
    if(isExist) throw new BadRequestException('Module with same name already exist!');

    if(arFile?.length)
      {
        const jsonPathAr = './upload/' + arFile[0].filename;
        const s3UrlAr: any = await this.s3Service.uploadLocalFile(jsonPathAr, 'translateEditor/');
        dataToSave.arFileURL = s3UrlAr.Location
      }
    if(enFile?.length)
      {
        const jsonPathEn = './upload/' + enFile[0].filename;
        const s3UrlEn: any = await this.s3Service.uploadLocalFile(jsonPathEn, 'translateEditor/');
        dataToSave.enFileURL = s3UrlEn.Location
      }
  
      return await this.TranslateEditorModel.create({
        ...dataToSave
      });
  }

  async update(module: string,dto : UpdateTranslateEditorDto): Promise<TranslateEditorDocument> {
    const empDebt = await this.TranslateEditorModel.findOneAndUpdate({moduleName : module}, dto, { new: true, },);
    if (!empDebt) {
      throw new NotFoundException();
    }
    return empDebt;
  }

  async get(module: string): Promise<TranslateEditorDocument> {
    const exists = await this.TranslateEditorModel.findOne({ moduleName: module });

    if (!exists) {
      throw new NotFoundException();
    }

    return exists;
  }

  async updateTwo(
    dto: UpdateTranslateEditorDtoTwo,
    arFile,
    enFile,
  ): Promise<TranslateEditorDocument> {

    let translateEditor = await this.TranslateEditorModel.findOne({ moduleName: dto.moduleName });

    if (!translateEditor) throw new BadRequestException('Module NotFoundException');
    let dataToUpdate: any = {}


    if (arFile?.length) {
      const jsonPathAr = './upload/' + arFile[0].filename;
      const s3UrlAr: any = await this.s3Service.uploadLocalFile(jsonPathAr, 'translateEditor/');
      dataToUpdate.arFileURL = s3UrlAr.Location
    }
    if (enFile?.length) {
      const jsonPathEn = './upload/' + enFile[0].filename;
      const s3UrlEn: any = await this.s3Service.uploadLocalFile(jsonPathEn, 'translateEditor/');
      dataToUpdate.enFileURL = s3UrlEn.Location
    }

    translateEditor = await this.TranslateEditorModel.findOneAndUpdate({ moduleName: dto.moduleName }, dataToUpdate, { new: true })
    return translateEditor;

  }


}
