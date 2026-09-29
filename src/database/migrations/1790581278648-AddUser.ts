import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUser1790581278648 implements MigrationInterface {
  name = 'AddUser1790581278648';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "createdBy" character varying, "updatedBy" character varying, "deletedBy" character varying, "keycloak_id" character varying NOT NULL, "email" character varying, "first_name" character varying NOT NULL, "last_name" character varying, "is_active" boolean NOT NULL, CONSTRAINT "UQ_7dbb864d96a41e12fe53e016f21" UNIQUE ("keycloak_id"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
