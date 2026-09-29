import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBook1790581278650 implements MigrationInterface {
  name = 'AddBook1790581278650';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "book" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "createdBy" character varying, "updatedBy" character varying, "deletedBy" character varying, "title" character varying NOT NULL, "author" character varying NOT NULL, "isbn" character varying NOT NULL, "stock" integer NOT NULL DEFAULT 0, CONSTRAINT "UQ_book_isbn" UNIQUE ("isbn"), CONSTRAINT "PK_book_id" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "book"`);
  }
}
