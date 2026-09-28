import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeycloakAdminService implements OnModuleInit {
  private readonly kcAdminClient: KeycloakAdminClient;

  constructor(private readonly configService: ConfigService) {
    this.kcAdminClient = new KeycloakAdminClient({
      baseUrl: this.configService.get<string>('KEYCLOAK_BASE_URL'),
      realmName: this.configService.get<string>('KEYCLOAK_REALM'),
    });
  }

  async onModuleInit() {
    await this.authenticate();
  }

  private async authenticate() {
    await this.kcAdminClient.auth({
      grantType: 'client_credentials',
      clientId: this.configService.getOrThrow<string>('ADMIN_CLIENT_ID'),
      clientSecret: this.configService.getOrThrow<string>(
        'ADMIN_CLIENT_SECRET',
      ),
    });
  }

  getClient(): KeycloakAdminClient {
    return this.kcAdminClient;
  }
}
