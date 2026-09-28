import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBranch1790577020607 implements MigrationInterface {
  name = 'AddBranch1790577020607';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "branch" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "createdBy" character varying, "updatedBy" character varying, "deletedBy" character varying, "code" character varying NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_638479fc29fab932b7ab0aea912" UNIQUE ("code"), CONSTRAINT "UQ_d6d14945d4352867ecc62bcf85c" UNIQUE ("name"), CONSTRAINT "PK_2e39f426e2faefdaa93c5961976" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "branch"`);
  }
}
