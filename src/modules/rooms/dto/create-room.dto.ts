import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @Type(() => Number)
  @IsInt({ message: 'El número de filas debe ser un entero' })
  @IsPositive({ message: 'El número de filas debe ser positivo' })
  @IsNotEmpty({ message: 'El número de filas es obligatorio' })
  rowsCount: number;

  @Type(() => Number)
  @IsInt({ message: 'El número de columnas debe ser un entero' })
  @IsPositive({ message: 'El número de columnas debe ser positivo' })
  @IsNotEmpty({ message: 'El número de columnas es obligatorio' })
  columnsCount: number;
}
