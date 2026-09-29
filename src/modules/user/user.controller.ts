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
import { PathParameterDto } from 'src/common/dto/path-paramater.dto';
import {
  CreateSwaggerExample,
  DeleteSwaggerExample,
  DetailSwaggerExample,
  ListSwaggerExample,
} from 'src/common/swagger/swagger-example.response';
import { CreateUserDto } from './dto/create-user.dto';
import { FilteringUserDto } from './dto/filtering-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { SyncUserDto } from './dto/sync-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { Public } from 'src/common/decorators/public.decorator';
import { IJwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@Controller('user')
@ApiTags('User')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @CreateSwaggerExample(
    CreateUserDto,
    ResponseUserDto,
    false,
    'Membuat Satu User',
  )
  async create(
    @Body() createDto: CreateUserDto,
    @Request() req: ExpressRequest,
  ): Promise<BaseSuccessResponse<ResponseUserDto>> {
    const result = await this.userService.create(createDto, req.user);

    return {
      data: plainToInstance(ResponseUserDto, result, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get()
  @ListSwaggerExample(ResponseUserDto, 'Mengambil Banyak Data User')
  async findAndCount(
    @Query() queryParameterDto: FilteringUserDto,
  ): Promise<BaseSuccessResponse<ResponseUserDto>> {
    const { page = 1, limit = 10, isPaginate = true } = queryParameterDto;
    const [result, total] =
      await this.userService.findAndCount(queryParameterDto);

    return {
      data: plainToInstance(ResponseUserDto, result, {
        excludeExtraneousValues: true,
      }),
      meta: {
        page: isPaginate ? page : 1,
        totalPage: isPaginate ? Math.ceil(total / limit) : 1,
        totalData: total,
      },
    };
  }

  @Get('me')
  @DetailSwaggerExample(ResponseUserDto, 'Mengambil Data User yang Login')
  async me(
    @Request() req: ExpressRequest,
  ): Promise<BaseSuccessResponse<IJwtPayload>> {
    return { data: req.user as IJwtPayload };
  }

  @Get(':id')
  @DetailSwaggerExample(ResponseUserDto, 'Mengambil Data User dengan ID')
  async findOne(
    @Param() pathParamater: PathParameterDto,
  ): Promise<BaseSuccessResponse<ResponseUserDto>> {
    const result = await this.userService.findOneByIdOrFail(pathParamater.id);

    return {
      data: plainToInstance(ResponseUserDto, result, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch(':id')
  @DetailSwaggerExample(ResponseUserDto, 'Mengupdate Data User By Id')
  async update(
    @Param() pathParamater: PathParameterDto,
    @Body() update: UpdateUserDto,
    @Request() req: ExpressRequest,
  ): Promise<BaseSuccessResponse<ResponseUserDto>> {
    const result = await this.userService.update(
      pathParamater.id,
      update,
      req.user,
    );

    return {
      data: plainToInstance(ResponseUserDto, result, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete(':id')
  @HttpCode(204)
  @DeleteSwaggerExample('Menghapus Data User dengan Id')
  async remove(
    @Param() pathParamater: PathParameterDto,
    @Request() req: ExpressRequest,
  ): Promise<void> {
    await this.userService.softRemove(pathParamater.id, req.user);
  }

  @Post('sync')
  @Public()
  @DetailSwaggerExample(SyncUserDto, 'Sync Data User dari Keycloak')
  async sync(): Promise<BaseSuccessResponse<SyncUserDto>> {
    const result = await this.userService.sync();

    return {
      data: plainToInstance(SyncUserDto, result, {
        excludeExtraneousValues: true,
      }),
    };
  }
}
