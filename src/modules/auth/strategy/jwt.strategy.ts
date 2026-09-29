// auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { IJwtPayload } from 'src/common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        jwksUri: config.getOrThrow<string>('JWKS_URI'),
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 10 * 60 * 1000,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: config.getOrThrow<string>('JWT_ISSUER'),
      algorithms: ['RS256'],
      jsonWebTokenOptions: { clockTolerance: 30 }, // seconds
    });
  }

  validate(payload): IJwtPayload {
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.resource_access.account?.roles ?? [],
      groups: payload.groups ?? [],
    };
  }
}
