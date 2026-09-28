import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUser1790581278648 implements MigrationInterface {
  name = 'AddUser1790581278648';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "createdBy" character varying, "updatedBy" character varying, "deletedBy" character varying, "keycloak_id" character varying NOT NULL, "email" character varying, "first_name" character varying NOT NULL, "last_name" character varying, "is_active" boolean NOT NULL, "branchId" integer, CONSTRAINT "UQ_7dbb864d96a41e12fe53e016f21" UNIQUE ("keycloak_id"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_8b17d5d91bf27d0a33fb80ade8f" FOREIGN KEY ("branchId") REFERENCES "branch"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_8b17d5d91bf27d0a33fb80ade8f"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
