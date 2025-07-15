import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { PhotosService } from './photos.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageFileValidationPipe } from '../common/validators';
import { Roles } from '../common/decorators';
import { Role } from '../common/enums';
import { ApiCreatedResponse } from '@nestjs/swagger';
import { PhotoEntity } from './entities';

@Controller('matches/:matchId/photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post()
  @Roles(Role.ASSISTANT)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiCreatedResponse({ type: PhotoEntity })
  create(
    @Param('matchId', ParseIntPipe) matchId: number,
    @UploadedFile(
      new ImageFileValidationPipe({
        maxSize: 1024 * 1024 * 5,
        fileType: ['image/jpeg', 'image/png'],
      }),
    )
    file: Express.Multer.File,
    @Body() createPhotoDto: CreatePhotoDto,
  ) {
    return this.photosService.create(matchId, file, createPhotoDto);
  }

  @Get()
  @ApiCreatedResponse({ type: [PhotoEntity] })
  findAll(@Param('matchId', ParseIntPipe) matchId: number){
    return this.photosService.findAllByMatch(matchId);
  }

  @Roles(Role.ASSISTANT)
  @Delete(':photoId')
  @ApiCreatedResponse({ type: Boolean })
  remove(@Param('photoId', ParseIntPipe) photoId: number){
    return this.photosService.remove(photoId);
  }
}
