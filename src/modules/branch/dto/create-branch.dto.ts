import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ description: '', required: true, example: '' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: '', required: true, example: '' })
  @IsNotEmpty()
  @IsString()
  name: string;
}
