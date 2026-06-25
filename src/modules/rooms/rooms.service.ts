import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Room } from './entities/room.entity.js';
import { Seat } from './entities/seat.entity.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const room = this.roomRepository.create(createRoomDto);
    const savedRoom = await this.roomRepository.save(room);

    const seats: Partial<Seat>[] = [];
    for (let r = 1; r <= savedRoom.rowsCount; r++) {
      for (let c = 1; c <= savedRoom.columnsCount; c++) {
        seats.push({
          roomId: savedRoom.id,
          rowNumber: r,
          columnNumber: c,
        });
      }
    }
    await this.seatRepository.save(seats);

    return savedRoom;
  }

  async findAll(search?: string): Promise<Room[]> {
    const trimmed = search?.trim();
    return this.roomRepository.find({
      where: trimmed ? { name: ILike(`%${trimmed}%`) } : undefined,
      relations: { seats: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: { seats: true },
    });
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);
    this.roomRepository.merge(room, updateRoomDto);
    return this.roomRepository.save(room);
  }

  async remove(id: string): Promise<void> {
    const room = await this.findOne(id);
    await this.roomRepository.remove(room);
  }

  async findSeats(roomId: string): Promise<Seat[]> {
    await this.findOne(roomId);
    return this.seatRepository.find({
      where: { roomId },
      order: { rowNumber: 'ASC', columnNumber: 'ASC' },
    });
  }

  async removeSeat(
    roomId: string,
    rowNumber: number,
    columnNumber: number,
  ): Promise<void> {
    await this.findOne(roomId);
    const seat = await this.seatRepository.findOneBy({
      roomId,
      rowNumber,
      columnNumber,
    });
    if (!seat) {
      throw new NotFoundException(
        `Seat at row ${rowNumber}, column ${columnNumber} not found in this room`,
      );
    }
    await this.seatRepository.remove(seat);
  }

  async addSeat(
    roomId: string,
    rowNumber: number,
    columnNumber: number,
  ): Promise<Seat> {
    const room = await this.findOne(roomId);
    if (rowNumber > room.rowsCount || columnNumber > room.columnsCount) {
      throw new BadRequestException(
        `Seat coordinates exceed room dimensions (${room.rowsCount}x${room.columnsCount})`,
      );
    }
    const existing = await this.seatRepository.findOneBy({
      roomId,
      rowNumber,
      columnNumber,
    });
    if (existing) {
      return existing;
    }
    const seat = this.seatRepository.create({
      roomId,
      rowNumber,
      columnNumber,
    });
    return this.seatRepository.save(seat);
  }
}
