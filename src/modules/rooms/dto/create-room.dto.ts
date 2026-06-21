import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @Type(() => Number)
  @IsInt({ message: 'rowsCount must be an integer' })
  @IsPositive({ message: 'rowsCount must be a positive number' })
  @IsNotEmpty({ message: 'rowsCount is required' })
  rowsCount: number;

  @Type(() => Number)
  @IsInt({ message: 'columnsCount must be an integer' })
  @IsPositive({ message: 'columnsCount must be a positive number' })
  @IsNotEmpty({ message: 'columnsCount is required' })
  columnsCount: number;
}
