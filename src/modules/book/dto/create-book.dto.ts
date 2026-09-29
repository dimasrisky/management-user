import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateBookDto {
  @ApiProperty({ description: 'Judul buku', required: true, example: '' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Penulis buku', required: true, example: '' })
  @IsNotEmpty()
  @IsString()
  author: string;

  @ApiProperty({ description: 'ISBN buku', required: true, example: '' })
  @IsNotEmpty()
  @IsString()
  isbn: string;

  @ApiProperty({ description: 'Jumlah stok buku', required: true, example: 0 })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  stock: number;
}
