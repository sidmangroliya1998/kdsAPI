import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';
import * as MomentHandler from 'handlebars.moment';
import { S3Service } from 'src/core/Providers/Storage/S3.service';
import * as puppeteer from 'puppeteer';
import * as uniqid from 'uniqid';
import * as fs from 'fs';
import { CompressService } from 'src/file-uploader/compress.service';
MomentHandler.registerHelpers(Handlebars);
Handlebars.registerHelper('math', function (lvalue, operator, rvalue, options) {
  lvalue = parseFloat(lvalue);
  rvalue = parseFloat(rvalue);

  return {
    '+': lvalue + rvalue,
    '-': lvalue - rvalue,
    '*': lvalue * rvalue,
    '/': lvalue / rvalue,
    '%': lvalue % rvalue,
  }[operator];
});
Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
  return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper('ifExists', function (arg1, options) {
  return arg1 ? options.fn(this) : options.inverse(this);
});

@Injectable()
export class TemplateResolverService {
  constructor(
    private readonly s3Service: S3Service,

    private readonly compressService: CompressService,
  ) {}
  async render(templateName: string, data: any, directory, onlyImage = false) {
    const templateHtml = fs.readFileSync(templateName, 'utf8');

    const template = Handlebars.compile(templateHtml);
    console.log(data);
    const html = template(data);

    const fileUrls = await this.generateDoc(html, directory, onlyImage);
    return fileUrls;
  }

  async generateDoc(html: string, directory: string, onlyImage = false) {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disk-cache-dir=/tmp/',
        '--disable-gpu',
      ],
    });
    const page = await browser.newPage();

    //await page.goto(`data:text/html,${html}`, { waitUntil: 'networkidle0' });
    await page.setContent(html, { waitUntil: 'load' });
    const [x, y, width, height] = await page.evaluate(() => {
      const element = document.getElementById('container');
      const { x, y, width, height } = element.getBoundingClientRect();
      return [x, y, width, height];
      // return [
      //   document.getElementById('container').offsetHeight,
      //   document.getElementById('container').offsetWidth,
      // ];
    });

    const imagePath =
      './upload/' + (await uniqid.process().toUpperCase()) + '.png';
    console.log([x, y, width, height]);
    await page.screenshot({
      path: imagePath,
      clip: { x, y, width, height },
    });
    const compressedPath = await this.compressService.compressImagePng(
      imagePath,
    );
    const imageUrl: any = await this.s3Service.uploadLocalFile(
      compressedPath,
      directory,
    );
    if (onlyImage) {
      browser.close();
      return { imageUrl: imageUrl.Location };
    }
    const pdfPath =
      './upload/' + (await uniqid.process().toUpperCase()) + '.pdf';
    await page.pdf({
      format: 'A4',
      path: pdfPath,
    });
    browser.close();
    const s3Url: any = await this.s3Service.uploadLocalFile(pdfPath, directory);

    console.log("s3Url",s3Url);
    return { pdfUrl: s3Url?.Location, imageUrl: imageUrl.Location };
  }
}
