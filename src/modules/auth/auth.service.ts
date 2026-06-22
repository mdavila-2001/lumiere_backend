import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

interface PostgresError extends Error {
  code?: string;
}

interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<void> {
    const { email, password } = registerDto;
    try {
      await this.dataSource.query('CALL pr_register_user($1, $2, $3)', [
        email,
        password,
        'CUSTOMER',
      ]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const pgErr = error as PostgresError;
        if (
          pgErr.code === '23505' ||
          pgErr.message.includes('Conflict: An account with email')
        ) {
          throw new ConflictException('Email already exists');
        }
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { email, password } = loginDto;

    const result: AuthenticatedUser[] = await this.dataSource.query(
      'SELECT * FROM fn_authenticate_user($1, $2)',
      [email, password],
    );

    if (!result || result.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = result[0];
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }
}
