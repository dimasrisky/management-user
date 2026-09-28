import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseUserDto {
  @ApiProperty({ description: 'ID User', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'createdAt User' })
  @Expose()
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: '', example: null })
  keycloakId: string;

  @Expose()
  @ApiProperty({ description: '', example: null })
  email: string;

  @Expose()
  @ApiProperty({ description: '', example: null })
  firstName: string;

  @Expose()
  @ApiProperty({ description: '', example: null })
  lastName: string;

  @Expose()
  @ApiProperty({ description: '', example: null })
  isActive: boolean;
}
