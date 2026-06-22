import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Booking } from './entities/booking.entity.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

interface BookingResult {
  bookingId: string;
}

interface DatabaseError extends Error {
  code?: string;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async create(
    createBookingDto: CreateBookingDto,
    userId: string,
  ): Promise<{ bookingId: string }> {
    const { showtimeId, seats } = createBookingDto;

    const dbSeatsPayload = seats.map((s) => ({
      row: s.rowNumber,
      col: s.columnNumber,
    }));

    try {
      const result: BookingResult[] = await this.dataSource.query(
        'SELECT fn_create_booking_transaction($1, $2, $3) as "bookingId"',
        [userId, showtimeId, JSON.stringify(dbSeatsPayload)],
      );

      if (!result || result.length === 0) {
        throw new BadRequestException('Booking could not be created');
      }

      return result[0];
    } catch (error: unknown) {
      if (error instanceof Error) {
        const dbErr = error as DatabaseError;
        if (dbErr.message.includes('Seat Conflict')) {
          throw new ConflictException(dbErr.message);
        }
        if (dbErr.message.includes('Invalid Seat')) {
          throw new BadRequestException(dbErr.message);
        }
      }
      throw error;
    }
  }

  async findMyBookings(userId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { userId },
      relations: {
        showtime: {
          movie: true,
          room: true,
        },
        reservedSeats: true,
      },
    });
  }
}
