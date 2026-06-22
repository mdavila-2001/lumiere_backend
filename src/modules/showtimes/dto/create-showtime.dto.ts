import { IsISO8601, IsNotEmpty, IsPositive, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShowtimeDto {
  @IsUUID('all', { message: 'movieId must be a valid UUID' })
  @IsNotEmpty({ message: 'movieId is required' })
  movieId: string;

  @IsUUID('all', { message: 'roomId must be a valid UUID' })
  @IsNotEmpty({ message: 'roomId is required' })
  roomId: string;

  @Type(() => Date)
  @IsISO8601({}, { message: 'startTime must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'startTime is required' })
  startTime: Date;

  @Type(() => Number)
  @IsPositive({ message: 'price must be a positive number' })
  @IsNotEmpty({ message: 'price is required' })
  price: number;
}
