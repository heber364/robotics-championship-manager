import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ArenaService } from './arena.service';
import { CreateArenaDto, UpdateArenaDto } from './dto';
import { ArenaEntity } from './entities/arena.entity';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators';
import { Role } from 'src/common/enums';

@ApiBearerAuth()
@Controller('arena')
export class ArenaController {
  constructor(private readonly arenaService: ArenaService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
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
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: ArenaEntity })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateArenaDto: UpdateArenaDto) {
    return this.arenaService.update(id, updateArenaDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: Boolean })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.arenaService.remove(id);
  }
}
