/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../types';
import { Socket } from 'socket.io';

const a_custom_ws_jwt_extractor = (client: Socket): string | null => {
  let token: string | null = null;

  if (client.handshake.auth?.token) {
    token = client.handshake.auth.token.split(' ')[1];
  }

  if (!token && client.handshake.headers?.authorization) {
    token = client.handshake.headers.authorization.split(' ')[1];
  }
  return token;
};

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy, 'jwt-ws') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: a_custom_ws_jwt_extractor,
      secretOrKey: config.get<string>('AT_SECRET') || 'AT_SECRET',
    });
  }

  validate(payload: JwtPayload) {
    return payload;
  }
}
