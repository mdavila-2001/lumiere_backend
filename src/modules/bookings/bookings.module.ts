import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service.js';
import { BookingsController } from './bookings.controller.js';
import { Booking } from './entities/booking.entity.js';
import { ReservedSeat } from './entities/reserved-seat.entity.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, ReservedSeat]), AuthModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
