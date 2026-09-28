import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases/base.repository';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(private readonly dataSource: DataSource) {
    super(User, dataSource);
  }
}
