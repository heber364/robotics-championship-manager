import { Role } from '../../common/enums';

export type JwtPayload = {
  sub: number; 
  email: string;  
  roles: Role[];
}