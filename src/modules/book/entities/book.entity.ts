import { BaseEntity } from 'src/common/bases/base.entity';
import { Column, Entity } from 'typeorm';
import { IBook } from '../interfaces/book.interface';

@Entity()
export class Book extends BaseEntity implements IBook {
  @Column({ name: 'title', unique: false, nullable: false })
  title: string;

  @Column({ name: 'author', unique: false, nullable: false })
  author: string;

  @Column({ name: 'isbn', unique: true, nullable: false })
  isbn: string;

  @Column({ name: 'stock', unique: false, nullable: false, default: 0 })
  stock: number;
}
