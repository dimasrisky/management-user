import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { BaseSuccessResponse } from 'src/common/bases/base.response';
import { PathParameterDto } from 'src/common/dto/path-paramater.dto';
import {
  DetailSwaggerExample,
  ListSwaggerExample,
} from 'src/common/swagger/swagger-example.response';
import { FilteringBranchDto } from './dto/filtering-branch.dto';
import { ResponseBranchDto } from './dto/response-branch.dto';
import { SyncBranchDto } from './dto/sync-branch.dto';
import { BranchService } from './branch.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('branch')
@ApiTags('Branch')
@ApiBearerAuth()
export class BranchController {
  constructor(private readonly branchService: BranchService) {}
  @Get()
  @ListSwaggerExample(ResponseBranchDto, 'Mengambil Banyak Data Branch')
  async findAndCount(
    @Query() queryParameterDto: FilteringBranchDto,
  ): Promise<BaseSuccessResponse<ResponseBranchDto>> {
    const { page = 1, limit = 10, isPaginate = true } = queryParameterDto;
    const [result, total] =
      await this.branchService.findAndCount(queryParameterDto);

    return {
      data: plainToInstance(ResponseBranchDto, result, {
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
  @DetailSwaggerExample(ResponseBranchDto, 'Mengambil Data Branch dengan ID')
  async findOne(
    @Param() pathParamater: PathParameterDto,
  ): Promise<BaseSuccessResponse<ResponseBranchDto>> {
    const result = await this.branchService.findOneByIdOrFail(pathParamater.id);

    return {
      data: plainToInstance(ResponseBranchDto, result, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Post('sync')
  @Public()
  @DetailSwaggerExample(SyncBranchDto, 'Sync Data Branch dari Keycloak')
  async sync(): Promise<BaseSuccessResponse<SyncBranchDto>> {
    const result = await this.branchService.sync();

    return {
      data: plainToInstance(SyncBranchDto, result, {
        excludeExtraneousValues: true,
      }),
    };
  }
}
