import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Movie } from '../../movies/entities/movie.entity.js';
import { Room } from '../../rooms/entities/room.entity.js';
import { Booking } from '../../bookings/entities/booking.entity.js';
import { ReservedSeat } from '../../bookings/entities/reserved-seat.entity.js';

@Entity({ name: 'showtimes' })
export class Showtime {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @Column({ name: 'start_time', type: 'timestamp with time zone' })
  startTime: Date;

  @Column({
    name: 'end_time',
    type: 'timestamp with time zone',
    insert: false,
    update: false,
  })
  endTime: Date;

  @Column({ type: 'numeric' })
  price: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Movie, (movie) => movie.showtimes)
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @ManyToOne(() => Room, (room) => room.showtimes)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @OneToMany(() => Booking, (booking) => booking.showtime)
  bookings: Booking[];

  @OneToMany(() => ReservedSeat, (reservedSeat) => reservedSeat.showtime)
  reservedSeats: ReservedSeat[];
}
