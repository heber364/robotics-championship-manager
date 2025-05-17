import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable } from "@nestjs/common";
import { JwtPayload } from "../types";

@Injectable()
export class AtJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('AT_SECRET') || 'AT_SECRET'
    })
  }

  validate(payload: JwtPayload) {
    return payload;
  }
}