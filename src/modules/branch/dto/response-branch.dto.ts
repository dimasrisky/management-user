import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseBranchDto {
  @ApiProperty({ description: 'ID Branch', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'createdAt Branch' })
  @Expose()
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: '', example: null })
  code: string;

  @Expose()
  @ApiProperty({ description: '', example: null })
  name: string;
}
