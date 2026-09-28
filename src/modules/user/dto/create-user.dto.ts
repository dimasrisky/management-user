import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '', required: false, example: '' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: '', required: true, example: '' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ description: '', required: false, example: '' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: '', required: true, example: true })
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: '', required: true, example: '' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
