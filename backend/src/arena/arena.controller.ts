import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ArenaService } from './arena.service';
import { CreateArenaDto } from './dto/create-arena.dto';
import { UpdateArenaDto } from './dto/update-arena.dto';
import { Public } from '../common/decorators/public.decorator';
import { ArenaEntity } from './entities/arena.entity';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';

@Public()
@Controller('arena')
export class ArenaController {
  constructor(private readonly arenaService: ArenaService) {}

  @Post()
  @ApiCreatedResponse({ type: ArenaEntity })
  create(@Body() createArenaDto: CreateArenaDto) {
    return this.arenaService.create(createArenaDto);
  }

  @Get()
  @ApiOkResponse({ type: ArenaEntity, isArray: true })
  findAll() {
    return this.arenaService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: ArenaEntity })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.arenaService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ArenaEntity })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateArenaDto: UpdateArenaDto) {
    return this.arenaService.update(id, updateArenaDto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: Boolean })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.arenaService.remove(id);
  }
}
