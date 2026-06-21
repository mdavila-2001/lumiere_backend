import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SeatDto {
  @Type(() => Number)
  @IsInt({ message: 'rowNumber must be an integer' })
  @IsPositive({ message: 'rowNumber must be a positive number' })
  @IsNotEmpty({ message: 'rowNumber is required' })
  rowNumber: number;

  @Type(() => Number)
  @IsInt({ message: 'columnNumber must be an integer' })
  @IsPositive({ message: 'columnNumber must be a positive number' })
  @IsNotEmpty({ message: 'columnNumber is required' })
  columnNumber: number;
}

export class CreateBookingDto {
  @IsUUID('all', { message: 'showtimeId must be a valid UUID' })
  @IsNotEmpty({ message: 'showtimeId is required' })
  showtimeId: string;

  @IsArray({ message: 'seats must be an array' })
  @ValidateNested({ each: true })
  @Type(() => SeatDto)
  seats: SeatDto[];
}
