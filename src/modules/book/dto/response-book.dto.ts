import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseBookDto {
  @ApiProperty({ description: 'ID Buku', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'createdAt Buku' })
  @Expose()
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: '', example: null })
  title: string;

  @Expose()
  @ApiProperty({ description: '', example: null })
  author: string;

  @Expose()
  @ApiProperty({ description: '', example: null })
  isbn: string;

  @Expose()
  @ApiProperty({ description: '', example: 0 })
  stock: number;
}
