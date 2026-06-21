import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Booking } from './entities/booking.entity.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

interface BookingResult {
  bookingId: string;
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
      rowNumber: s.rowNumber,
      columnNumber: s.columnNumber,
      row_number: s.rowNumber,
      column_number: s.columnNumber,
    }));

    const result: BookingResult[] = await this.dataSource.query(
      'SELECT fn_create_booking_transaction($1, $2, $3) as "bookingId"',
      [userId, showtimeId, JSON.stringify(dbSeatsPayload)],
    );

    return result[0];
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
