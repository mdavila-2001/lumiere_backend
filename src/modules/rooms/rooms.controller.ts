import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RoomsService } from './rooms.service.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';
import { Room } from './entities/room.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createRoomDto: CreateRoomDto): Promise<Room> {
    return await this.roomsService.create(createRoomDto);
  }

  @Get()
  async findAll(): Promise<Room[]> {
    return await this.roomsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Room> {
    return await this.roomsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ): Promise<Room> {
    return await this.roomsService.update(id, updateRoomDto);
  }

  @Get(':id/seats')
  async findSeats(@Param('id') id: string) {
    return await this.roomsService.findSeats(id);
  }

  @Delete(':id/seats/:row/:col')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSeat(
    @Param('id') id: string,
    @Param('row') row: string,
    @Param('col') col: string,
  ): Promise<void> {
    return await this.roomsService.removeSeat(
      id,
      Number.parseInt(row, 10),
      Number.parseInt(col, 10),
    );
  }

  @Post(':id/seats/:row/:col')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async addSeat(
    @Param('id') id: string,
    @Param('row') row: string,
    @Param('col') col: string,
  ) {
    return await this.roomsService.addSeat(
      id,
      Number.parseInt(row, 10),
      Number.parseInt(col, 10),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return await this.roomsService.remove(id);
  }
}
