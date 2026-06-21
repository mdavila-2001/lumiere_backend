import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { RegisterUserDto } from '../auth/dto/register.dto/register.dto.js';
import { User, UserRole } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  private readonly userRepository: Repository<User>;

  constructor(private readonly dataSource: DataSource) {
    this.userRepository = this.dataSource.getRepository(User);
  }

  async create(registerDto: RegisterUserDto): Promise<void>;
  async create(registerDto: CreateUserDto): Promise<void>;
  async create(registerDto: RegisterUserDto | CreateUserDto): Promise<void> {
    const data = registerDto as Partial<RegisterUserDto>;
    try {
      await this.dataSource.query('CALL pr_register_user($1, $2, $3)', [
        data.email,
        data.password,
        data.role || UserRole.CUSTOMER,
      ]);
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      if (err.message?.includes('Conflict:') || err.code === '23505') {
        throw new ConflictException(err.message || 'Email already exists');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  findAll(): string {
    return 'This action returns all users';
  }

  findOne(id: number): string {
    return `This action returns a #${id} user`;
  }

  update(id: number, _updateUserDto: UpdateUserDto): string {
    return `This action updates a #${id} user`;
  }

  remove(id: number): string {
    return `This action removes a #${id} user`;
  }
}
