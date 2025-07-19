import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';

@Injectable()
export class StorageService {
  private s3: AWS.S3;

  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3({
      endpoint: this.configService.get<string>('S3_ENDPOINT_URL'),
      accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('S3_SECRET_ACCESS_KEY'),
      s3ForcePathStyle: true,
      region: this.configService.get<string>('S3_REGION'),
    });
  }

  async upload(file: Express.Multer.File, bucket: string) {
    const { originalname, buffer, mimetype } = file;
    const extension = originalname.split('.').pop();
    const uniqueFileName = `${uuid()}.${extension}`;

    const params = {
      Bucket: bucket,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'public-read',
    };

    const result = await this.s3.upload(params).promise();
    return { path: result.Key };
  }

  async remove(key: string, bucket: string) {
    const params = {
      Bucket: bucket,
      Key: key,
    };

    await this.s3.deleteObject(params).promise();
  }

  getPublicUrl(key: string, bucket: string) {
    return `${this.configService.get<string>('S3_ENDPOINT_URL')}/${bucket}/${key}`;
  }
}

