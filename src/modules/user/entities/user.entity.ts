import { BaseEntity } from 'src/common/bases/base.entity';
import { Column, Entity } from 'typeorm';
import { IUser } from '../interfaces/user.interface';

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
}
