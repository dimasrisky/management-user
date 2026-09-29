import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases/base.repository';
import { DataSource } from 'typeorm';
import { Book } from './entities/book.entity';

@Injectable()
export class BookRepository extends BaseRepository<Book> {
  constructor(private readonly dataSource: DataSource) {
    super(Book, dataSource);
  }
}
