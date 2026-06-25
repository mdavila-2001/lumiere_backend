import {
  Injectable,
  OnApplicationBootstrap,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

interface DatabaseError extends Error {
  code: string;
}

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedAdminUser();
  }

  async seedAdminUser(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@lumiere.com';
    const adminPassword = process.env.ADMIN_PASSWORD ?? '12345678';

    try {
      const existingAdmin = await this.userRepository.findOneBy({
        email: adminEmail,
      });
      if (!existingAdmin) {
        await this.userRepository.query('CALL pr_register_user($1, $2, $3)', [
          adminEmail,
          adminPassword,
          'ADMIN',
        ]);
        console.log(
          `[Seeder] Admin user successfully seeded with email: ${adminEmail}`,
        );
      }
    } catch (error) {
      console.error('[Seeder] Failed to seed admin user:', error);
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, role } = createUserDto;
    try {
      await this.userRepository.query('CALL pr_register_user($1, $2, $3)', [
        email,
        password,
        role,
      ]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const dbErr = error as DatabaseError;
        if (dbErr.message.includes('Conflict: An account with email')) {
          throw new ConflictException('Email already exists');
        }
      }
      throw error;
    }

    const createdUser = await this.findByEmail(email);
    if (!createdUser) {
      throw new BadRequestException('User creation failed');
    }
    return createdUser;
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }

  async findById(id: string): Promise<User | null> {
    return await this.findOne(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ email });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const user = await this.findOne(id);
    if (!user) return null;
    this.userRepository.merge(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    if (user) {
      await this.userRepository.remove(user);
    }
  }
}
