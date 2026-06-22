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
import { ShowtimesService } from './showtimes.service.js';
import { CreateShowtimeDto } from './dto/create-showtime.dto.js';
import { UpdateShowtimeDto } from './dto/update-showtime.dto.js';
import { Showtime } from './entities/showtime.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';

@Controller('showtimes')
export class ShowtimesController {
  constructor(private readonly showtimesService: ShowtimesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(
    @Body() createShowtimeDto: CreateShowtimeDto,
  ): Promise<Showtime> {
    return await this.showtimesService.create(createShowtimeDto);
  }

  @Get()
  async findAll(): Promise<Showtime[]> {
    return await this.showtimesService.findAll();
  }

  @Get(':id/seats')
  async getOccupiedSeats(
    @Param('id') id: string,
  ): Promise<{ rowNumber: number; columnNumber: number }[]> {
    return await this.showtimesService.getOccupiedSeats(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Showtime> {
    return await this.showtimesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateShowtimeDto: UpdateShowtimeDto,
  ): Promise<Showtime> {
    return await this.showtimesService.update(id, updateShowtimeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return await this.showtimesService.remove(id);
  }
}
