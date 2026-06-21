import { PartialType } from '@nestjs/mapped-types';
import { CreateShowtimeDto } from './create-showtime.dto.js';

export class UpdateShowtimeDto extends PartialType(CreateShowtimeDto) {}
