import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity.js';
import { Showtime } from '../../showtimes/entities/showtime.entity.js';

@Entity({ name: 'reserved_seats' })
export class ReservedSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @Column({ name: 'showtime_id', type: 'uuid' })
  showtimeId: string;

  @Column({ name: 'row_number', type: 'int' })
  rowNumber: number;

  @Column({ name: 'column_number', type: 'int' })
  columnNumber: number;

  @ManyToOne(() => Booking, (booking) => booking.reservedSeats)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => Showtime, (showtime) => showtime.reservedSeats)
  @JoinColumn({ name: 'showtime_id' })
  showtime: Showtime;
}
