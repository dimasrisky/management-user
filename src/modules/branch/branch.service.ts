import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/bases/base.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch } from './entities/branch.entity';
import { BranchRepository } from './branch.repository';
import { KeycloakAdminService } from '../keycloak-admin/keycloak-admin.service';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';

@Injectable()
export class BranchService extends BaseService<
  Branch,
  CreateBranchDto,
  UpdateBranchDto
> {
  private keycloakClient: KeycloakAdminClient;
  constructor(
    private readonly branchRepository: BranchRepository,
    private readonly keycloakAdminService: KeycloakAdminService,
  ) {
    super(branchRepository);
    this.keycloakClient = keycloakAdminService.getClient();
  }

  async sync() {
    const groups: GroupRepresentation[] = await this.keycloakClient.groups.find(
      { briefRepresentation: false },
    );

    const savedBranches: Branch[] = [];
    for (const group of groups) {
      const isExist = await this.branchRepository.findOne({
        where: {
          name: group.name,
        },
        select: {
          id: true,
        },
      });
      if (isExist) {
        isExist.name = group.name!;
        isExist.code =
          (group.attributes?.branch_code as string[] | undefined)?.[0] ?? '';
        isExist.keycloakGroupId = group.id!;
        savedBranches.push(isExist);
        continue;
      }
      const createGroup = this.branchRepository.create({
        keycloakGroupId: group.id,
        name: group.name,
        code: (group.attributes?.branch_code as string[] | undefined)?.[0],
      });
      savedBranches.push(createGroup);
    }

    if (savedBranches.length > 0)
      await this.branchRepository.save(savedBranches);

    return { message: 'berhasil sync' };
  }
}
