import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { MatchService } from './match.service';
import { CreateMatchDto, UpdateMatchDto } from './dto';
import { ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { MatchEntity } from './entities/match.entity';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  @ApiCreatedResponse({ type: MatchEntity })
  create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchService.create(createMatchDto);
  }

  @Get()
  @ApiOkResponse({ type: [MatchEntity] })
  findAll() {
    return this.matchService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: MatchEntity })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matchService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: MatchEntity })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMatchDto: UpdateMatchDto) {
    return this.matchService.update(id, updateMatchDto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: Boolean })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.matchService.remove(id);
  }
}
