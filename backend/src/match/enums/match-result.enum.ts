import { MatchResult as PrismaMatchResult } from '@prisma/client';

export type MatchResult = PrismaMatchResult;

export const MatchResult = {
  ...PrismaMatchResult
} as const; 