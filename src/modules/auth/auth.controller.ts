import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<void> {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<{ accessToken: string }> {
    return await this.authService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<{ message: string }> {
    return { message: 'Sesión cerrada exitosamente' };
  }
}
