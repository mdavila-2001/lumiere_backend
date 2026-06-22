import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { Booking } from './entities/booking.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @Req() req: RequestWithUser,
  ): Promise<{ bookingId: string }> {
    const userId = req.user?.id;
    return await this.bookingsService.create(createBookingDto, userId!);
  }

  @Get('me')
  async findMyBookings(@Req() req: RequestWithUser): Promise<Booking[]> {
    const userId = req.user?.id;
    return await this.bookingsService.findMyBookings(userId!);
  }
}
