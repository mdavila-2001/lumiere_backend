import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Showtime } from '../../showtimes/entities/showtime.entity.js';

@Entity({ name: 'movies' })
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  synopsis: string;

  @Column()
  genre: string;

  @Column({ type: 'int' })
  duration: number;

  @Column()
  rating: string;

  @Column({ name: 'poster_url' })
  posterUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Showtime, (showtime) => showtime.movie)
  showtimes: Showtime[];
}
