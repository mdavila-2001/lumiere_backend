import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../users/entities/user.entity.js';

export class RegisterUserDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty()
  password: string;

  @IsEnum(UserRole, { message: 'Role must be either ADMIN or CUSTOMER' })
  @IsOptional()
  role?: UserRole = UserRole.CUSTOMER;
}
