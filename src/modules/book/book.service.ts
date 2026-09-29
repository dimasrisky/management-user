import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/bases/base.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './entities/book.entity';
import { BookRepository } from './book.repository';

@Injectable()
export class BookService extends BaseService<
  Book,
  CreateBookDto,
  UpdateBookDto
> {
  constructor(private readonly bookRepository: BookRepository) {
    super(bookRepository);
  }
}
