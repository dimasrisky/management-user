import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SyncUserDto {
  @ApiProperty({ description: 'Pesan hasil sync', example: 'Berhasil Sync' })
  @Expose()
  message: string;
}
