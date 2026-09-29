import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import type { Request as ExpressRequest } from 'express';
import { BaseSuccessResponse } from 'src/common/bases/base.response';
import { Groups } from 'src/common/decorators/groups.decorator';
import { PathParameterDto } from 'src/common/dto/path-paramater.dto';
import {
  CreateSwaggerExample,
  DeleteSwaggerExample,
  DetailSwaggerExample,
  ListSwaggerExample,
} from 'src/common/swagger/swagger-example.response';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { FilteringBookDto } from './dto/filtering-book.dto';
import { ResponseBookDto } from './dto/response-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Controller('book')
@ApiTags('Book')
@ApiBearerAuth()
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post()
  @Groups('admin')
  @CreateSwaggerExample(
    CreateBookDto,
    ResponseBookDto,
    false,
    'Membuat Satu Buku',
  )
  async create(
    @Body() createDto: CreateBookDto,
    @Request() req: ExpressRequest,
  ): Promise<BaseSuccessResponse<ResponseBookDto>> {
    const result = await this.bookService.create(createDto, req.user);

    return {
      data: plainToInstance(ResponseBookDto, result, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get()
  @Groups('admin', 'visitor')
  @ListSwaggerExample(ResponseBookDto, 'Mengambil Banyak Data Buku')
  async findAndCount(
    @Query() queryParameterDto: FilteringBookDto,
  ): Promise<BaseSuccessResponse<ResponseBookDto>> {
    const { page = 1, limit = 10, isPaginate = true } = queryParameterDto;
    const [result, total] =
      await this.bookService.findAndCount(queryParameterDto);

    return {
      data: plainToInstance(ResponseBookDto, result, {
        excludeExtraneousValues: true,
      }),
      meta: {
        page: isPaginate ? page : 1,
        totalPage: isPaginate ? Math.ceil(total / limit) : 1,
        totalData: total,
      },
    };
  }

  @Get(':id')
  @Groups('admin', 'visitor')
  @DetailSwaggerExample(ResponseBookDto, 'Mengambil Data Buku dengan ID')
  async findOne(
    @Param() pathParamater: PathParameterDto,
  ): Promise<BaseSuccessResponse<ResponseBookDto>> {
    const result = await this.bookService.findOneByIdOrFail(pathParamater.id);

    return {
      data: plainToInstance(ResponseBookDto, result, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch(':id')
  @Groups('admin')
  @DetailSwaggerExample(ResponseBookDto, 'Mengupdate Data Buku By Id')
  async update(
    @Param() pathParamater: PathParameterDto,
    @Body() update: UpdateBookDto,
    @Request() req: ExpressRequest,
  ): Promise<BaseSuccessResponse<ResponseBookDto>> {
    const result = await this.bookService.update(
      pathParamater.id,
      update,
      req.user,
    );

    return {
      data: plainToInstance(ResponseBookDto, result, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete(':id')
  @Groups('admin')
  @HttpCode(204)
  @DeleteSwaggerExample('Menghapus Data Buku dengan Id')
  async remove(
    @Param() pathParamater: PathParameterDto,
    @Request() req: ExpressRequest,
  ): Promise<void> {
    await this.bookService.softRemove(pathParamater.id, req.user);
  }
}
