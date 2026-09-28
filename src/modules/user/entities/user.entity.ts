import { BaseEntity } from 'src/common/bases/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { IUser } from '../interfaces/user.interface';
import { Branch } from 'src/modules/branch/entities/branch.entity';

@Entity()
export class User extends BaseEntity implements IUser {
  @Column({ name: 'keycloak_id', unique: true, nullable: false })
  keycloakId: string;

  @Column({ name: 'email', unique: false, nullable: true })
  email: string;

  @Column({ name: 'first_name', unique: false, nullable: false })
  firstName: string;

  @Column({ name: 'last_name', unique: false, nullable: true })
  lastName: string;

  @Column({ name: 'is_active', unique: false, nullable: false })
  isActive: boolean;

  @ManyToOne(() => Branch, (branch) => branch.users, { onDelete: 'CASCADE' })
  branch: Branch;
}
