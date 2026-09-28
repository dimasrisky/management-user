import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases/base.repository';
import { DataSource } from 'typeorm';
import { Branch } from './entities/branch.entity';

@Injectable()
export class BranchRepository extends BaseRepository<Branch> {
  constructor(private readonly dataSource: DataSource) {
    super(Branch, dataSource);
  }
}
