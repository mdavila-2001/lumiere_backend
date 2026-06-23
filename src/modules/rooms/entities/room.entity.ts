import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Showtime } from '../../showtimes/entities/showtime.entity.js';
import { Seat } from './seat.entity.js';

@Entity({ name: 'rooms' })
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'rows_count', type: 'int' })
  rowsCount: number;

  @Column({ name: 'columns_count', type: 'int' })
  columnsCount: number;

  @Column({ type: 'int', insert: false, update: false })
  capacity: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Showtime, (showtime) => showtime.room)
  showtimes: Showtime[];

  @OneToMany(() => Seat, (seat) => seat.room, { cascade: true })
  seats: Seat[];
}
