import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Showtime } from './entities/showtime.entity.js';
import { CreateShowtimeDto } from './dto/create-showtime.dto.js';
import { UpdateShowtimeDto } from './dto/update-showtime.dto.js';

interface DatabaseError extends Error {
  code?: string;
}

@Injectable()
export class ShowtimesService {
  constructor(
    @InjectRepository(Showtime)
    private readonly showtimeRepository: Repository<Showtime>,
  ) {}

  async create(createShowtimeDto: CreateShowtimeDto): Promise<Showtime> {
    try {
      const showtime = this.showtimeRepository.create(createShowtimeDto);
      return await this.showtimeRepository.save(showtime);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const dbErr = error as DatabaseError;
        if (
          dbErr.message.includes(
            'Conflict: The selected room is already occupied',
          )
        ) {
          throw new ConflictException(dbErr.message);
        }
        if (dbErr.message.includes('Validation Error: The specified movie')) {
          throw new BadRequestException(dbErr.message);
        }
      }
      throw error;
    }
  }

  async findAll(): Promise<Showtime[]> {
    return this.showtimeRepository.find({
      relations: {
        movie: true,
        room: true,
      },
    });
  }

  async findOne(id: string): Promise<Showtime> {
    const showtime = await this.showtimeRepository.findOne({
      where: { id },
      relations: {
        movie: true,
        room: true,
      },
    });
    if (!showtime) {
      throw new NotFoundException('Showtime not found');
    }
    return showtime;
  }

  async getOccupiedSeats(
    showtimeId: string,
  ): Promise<{ rowNumber: number; columnNumber: number }[]> {
    const showtime = await this.showtimeRepository.findOne({
      where: { id: showtimeId },
      relations: {
        reservedSeats: true,
      },
    });
    if (!showtime) {
      throw new NotFoundException('Showtime not found');
    }
    return showtime.reservedSeats.map((seat) => ({
      rowNumber: seat.rowNumber,
      columnNumber: seat.columnNumber,
    }));
  }

  async update(
    id: string,
    updateShowtimeDto: UpdateShowtimeDto,
  ): Promise<Showtime> {
    const showtime = await this.findOne(id);
    this.showtimeRepository.merge(showtime, updateShowtimeDto);
    try {
      return await this.showtimeRepository.save(showtime);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const dbErr = error as DatabaseError;
        if (
          dbErr.message.includes(
            'Conflict: The selected room is already occupied',
          )
        ) {
          throw new ConflictException(dbErr.message);
        }
        if (dbErr.message.includes('Validation Error: The specified movie')) {
          throw new BadRequestException(dbErr.message);
        }
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const showtime = await this.findOne(id);
    await this.showtimeRepository.remove(showtime);
  }
}
