import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/bases/base.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRepository } from './user.repository';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { KeycloakAdminService } from '../keycloak-admin/keycloak-admin.service';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { BranchRepository } from '../branch/branch.repository';
import { IJwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@Injectable()
export class UserService extends BaseService<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  private readonly keycloakClient: KeycloakAdminClient;
  constructor(
    private readonly userRepository: UserRepository,
    private readonly branchRepository: BranchRepository,
    keycloakAdminService: KeycloakAdminService,
  ) {
    super(userRepository);
    this.keycloakClient = keycloakAdminService.getClient();
  }

  async create(createDto: CreateUserDto, user?: IJwtPayload): Promise<User> {
    const { id: keycloakId } = await this.keycloakClient.users.create({
      username: createDto.email,
      email: createDto.email,
      firstName: createDto.firstName,
      lastName: createDto.lastName,
      enabled: createDto.isActive,
      credentials: [
        { type: 'password', value: createDto.password, temporary: false },
      ],
    });

    try {
      return await super.create(
        { ...createDto, keycloakId } as unknown as CreateUserDto,
        user,
      );
    } catch (error) {
      await this.keycloakClient.users.del({ id: keycloakId });
      throw error;
    }
  }

  async update(
    id: number | string,
    updateDto: UpdateUserDto,
    user?: IJwtPayload,
  ): Promise<User> {
    const entity = await this.findOneByIdOrFail(id);

    await this.keycloakClient.users.update(
      { id: entity.keycloakId },
      {
        email: updateDto.email,
        firstName: updateDto.firstName,
        lastName: updateDto.lastName,
        enabled: updateDto.isActive,
      },
    );

    return super.update(id, updateDto, user);
  }

  async softRemove(id: number | string, user?: IJwtPayload): Promise<User> {
    const entity = await this.findOneByIdOrFail(id);

    await this.keycloakClient.users.del({ id: entity.keycloakId });

    return super.softRemove(id, user);
  }

  async sync() {
    const users: UserRepresentation[] = await this.keycloakClient.users.find();
    const branches = await this.branchRepository.find();
    const savedUsers: User[] = [];
    const existingUsers = await this.userRepository.find({
      where: {},
      relations: { branch: true },
    });

    for (const user of users) {
      const userGroups = await this.keycloakClient.users.listGroups({
        id: user.id!,
      });
      const branch = branches.find((b) => b.name === userGroups[0]?.name);

      const isExist = existingUsers.find((us) => us.keycloakId === user.id);
      if (isExist) {
        isExist.firstName = user.firstName!;
        isExist.lastName = user.lastName!;
        isExist.isActive = user.enabled!;
        isExist.email = user.email!;
        if (branch) isExist.branch = branch;
        savedUsers.push(isExist);
        continue;
      }

      const createUser = this.userRepository.create({
        keycloakId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.enabled,
        email: user.email,
        branch,
      });
      savedUsers.push(createUser);
    }

    if (savedUsers.length > 0) await this.userRepository.save(savedUsers);

    return { message: 'Berhasil Sync' };
  }
}
