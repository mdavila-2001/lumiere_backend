import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './entities/movie.entity.js';
import { CreateMovieDto } from './dto/create-movie.dto.js';
import { UpdateMovieDto } from './dto/update-movie.dto.js';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  async search(title?: string, genre?: string): Promise<Movie[]> {
    const queryBuilder = this.movieRepository.createQueryBuilder('movie');

    if (title) {
      queryBuilder.andWhere('movie.title ILIKE :title', {
        title: `%${title}%`,
      });
    }

    if (genre) {
      queryBuilder.andWhere('movie.genre ILIKE :genre', {
        genre: `%${genre}%`,
      });
    }

    return queryBuilder.getMany();
  }

  async create(
    createMovieDto: CreateMovieDto,
    posterUrl: string,
  ): Promise<Movie> {
    const movie = this.movieRepository.create({
      ...createMovieDto,
      posterUrl,
    });
    return this.movieRepository.save(movie);
  }

  async findAll(): Promise<Movie[]> {
    return this.movieRepository.find();
  }

  async findOne(id: string): Promise<Movie> {
    const movie = await this.movieRepository.findOneBy({ id });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  async update(
    id: string,
    updateMovieDto: UpdateMovieDto,
    posterUrl?: string,
  ): Promise<Movie> {
    const movie = await this.findOne(id);

    this.movieRepository.merge(movie, updateMovieDto);
    if (posterUrl) {
      movie.posterUrl = posterUrl;
    }

    return this.movieRepository.save(movie);
  }

  async remove(id: string): Promise<void> {
    const movie = await this.findOne(id);
    await this.movieRepository.remove(movie);
  }
}
