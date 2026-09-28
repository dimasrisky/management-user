import { BaseEntity } from 'src/common/bases/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { IBranch } from '../interfaces/branch.interface';
import { User } from 'src/modules/user/entities/user.entity';

@Entity()
export class Branch extends BaseEntity implements IBranch {
  @Column({ name: 'keycloak_group_id', unique: true, nullable: true })
  keycloakGroupId: string;

  @Column({ name: 'code', unique: true, nullable: false })
  code: string;

  @Column({ name: 'name', unique: true, nullable: false })
  name: string;

  @OneToMany(() => User, (user) => user.branch, { onDelete: 'CASCADE' })
  users: User[];
}
