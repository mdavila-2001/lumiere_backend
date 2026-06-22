import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMovieDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @IsString({ message: 'Synopsis must be a string' })
  @IsOptional()
  synopsis?: string;

  @IsString({ message: 'Genre must be a string' })
  @IsNotEmpty({ message: 'Genre is required' })
  genre: string;

  @Type(() => Number)
  @IsInt({ message: 'Duration must be an integer' })
  @IsPositive({ message: 'Duration must be a positive number' })
  @IsNotEmpty({ message: 'Duration is required' })
  duration: number;

  @IsString({ message: 'Rating must be a string' })
  @IsNotEmpty({ message: 'Rating is required' })
  rating: string;
}
