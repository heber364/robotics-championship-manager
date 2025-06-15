import { MatchStatus as PrismaMatchStatus } from '@prisma/client';

export type MatchStatus = PrismaMatchStatus;

export const MatchStatus = {
  ...PrismaMatchStatus,
} as const;
