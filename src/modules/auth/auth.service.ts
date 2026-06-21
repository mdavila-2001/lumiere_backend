import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from 'typeorm';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto/login.dto.js';
import { UserRole } from '../users/entities/user.entity.js';

interface AuthenticatedUserRow {
  id: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const result = (await this.entityManager.query(
      'SELECT * FROM fn_authenticate_user($1, $2)',
      [loginDto.email, loginDto.password],
    )) as unknown as AuthenticatedUserRow[];

    if (!result || result.length === 0 || !result[0]) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = result[0];
    const payload = { email: user.email, role: user.role, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
