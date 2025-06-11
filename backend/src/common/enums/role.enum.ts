import { Role as PrismaRole } from '@prisma/client';

export type Role = PrismaRole;

export const Role = {
  ...PrismaRole
} as const; 