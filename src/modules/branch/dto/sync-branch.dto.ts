import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SyncBranchDto {
  @ApiProperty({ description: 'Pesan hasil sync', example: 'berhasil sync' })
  @Expose()
  message: string;
}
