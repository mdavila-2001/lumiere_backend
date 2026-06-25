import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsService } from './rooms.service.js';
import { RoomsController } from './rooms.controller.js';
import { Room } from './entities/room.entity.js';
import { Seat } from './entities/seat.entity.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Seat]), AuthModule],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
