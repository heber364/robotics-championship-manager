/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaClient, Role, MatchStatus, MatchResult, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  await prisma.usersOnTeams.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.arena.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  const hashedPassword = await argon2.hash('123456');
  const now = new Date();

  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@example.com',
      hash: hashedPassword,
      role: Role.SUPER_ADMIN,
      emailVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      name: faker.person.fullName({ sex: 'male' }),
      email: 'juiz@example.com',
      hash: hashedPassword,
      role: Role.JUDGE,
      emailVerified: true,
    },
  });

  const usersData = Array.from({ length: 20 }).map(() => {
    const firstName = faker.person.firstName().toLowerCase();
    const lastName = faker.person.lastName().toLowerCase();
    return {
      name: `${firstName.charAt(0).toUpperCase() + firstName.slice(1)} ${lastName.charAt(0).toUpperCase() + lastName.slice(1)}`,
      email: faker.internet.email({ firstName, lastName }),
      hash: hashedPassword,
      role: Role.USER,
      emailVerified: true,
    };
  });
  await prisma.user.createMany({ data: usersData });

  const allUsers = await prisma.user.findMany();

  const [catSumo, catSeguidor, catHockey] = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Sumô 3kg Autônomo',
        description: faker.lorem.sentence(),
        scoreRules: '{"vitoria": 3, "yuko": 1}',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Seguidor de Linha Pro',
        description: faker.lorem.sentence(),
        scoreRules: '{"tempo_ms": -1}',
      },
    }),
    prisma.category.create({
      data: { name: 'Hóquei 2x2', description: faker.lorem.sentence(), scoreRules: '{"gol": 1}' },
    }),
  ]);

  const [arenaSumo1, arenaLinha1, arenaHockey1] = await Promise.all([
    prisma.arena.create({
      data: {
        name: 'Dohyo Principal',
        youtubeLink: 'https://www.youtube.com/ansonthedeveloper/join',
        idCategory: catSumo.id,
      },
    }),
    prisma.arena.create({
      data: {
        name: 'Pista de Percurso A',
        youtubeLink: 'https://www.youtube.com/watch?v=4_i77MS3-yI',
        idCategory: catSeguidor.id,
      },
    }),
    prisma.arena.create({
      data: {
        name: 'Campo de Hóquei',
        youtubeLink: 'https://www.youtube.com/watch?v=1MuttczIyx0',
        idCategory: catHockey.id,
      },
    }),
  ]);

  const teamsData = [
    {
      name: faker.company.name(),
      robotName: `SumôBot ${faker.system.semver()}`,
      idCategory: catSumo.id,
    },
    {
      name: faker.company.name(),
      robotName: `Titan ${faker.system.semver()}`,
      idCategory: catSumo.id,
    },
    {
      name: faker.company.name(),
      robotName: `Brutus ${faker.system.semver()}`,
      idCategory: catSumo.id,
    },
    {
      name: faker.company.name(),
      robotName: `Flash ${faker.system.semver()}`,
      idCategory: catSeguidor.id,
    },
    {
      name: faker.company.name(),
      robotName: `Vector ${faker.system.semver()}`,
      idCategory: catSeguidor.id,
    },
    {
      name: faker.company.name(),
      robotName: `Artilheiro ${faker.system.semver()}`,
      idCategory: catHockey.id,
    },
    {
      name: faker.company.name(),
      robotName: `Muralha ${faker.system.semver()}`,
      idCategory: catHockey.id,
    },
  ];
  await prisma.team.createMany({ data: teamsData });

  const allTeams = await prisma.team.findMany();

  const usersOnTeamsData = allTeams.map((team) => {
    const user = faker.helpers.arrayElement(
      allUsers.filter((u) => u.role === Role.USER && u.id > 3),
    );
    return { idUser: user.id, idTeam: team.id };
  });
  await prisma.usersOnTeams.createMany({ data: usersOnTeamsData, skipDuplicates: true });

  const matchesData: Prisma.MatchCreateInput[] = [];

  const teamsSumo = allTeams.filter((t) => t.idCategory === catSumo.id);
  const teamsSeguidor = allTeams.filter((t) => t.idCategory === catSeguidor.id);
  const teamsHockey = allTeams.filter((t) => t.idCategory === catHockey.id);

  for (let i = 0; i < 5; i++) {
    const [teamA, teamB] = faker.helpers.shuffle(teamsSumo).slice(0, 2);
    if (teamA && teamB) {
      matchesData.push({
        teamA: { connect: { id: teamA.id } },
        teamB: { connect: { id: teamB.id } },
        arena: { connect: { id: arenaSumo1.id } },
        date: faker.date.future({ refDate: now }),
        status: MatchStatus.SCHEDULED,
        observation: faker.lorem.sentence(),
      });
    }
  }

  for (let i = 0; i < 3; i++) {
    const [teamA, teamB] = faker.helpers.shuffle(teamsSeguidor).slice(0, 2);
    if (teamA && teamB) {
      const date = faker.date.past({ refDate: now });
      matchesData.push({
        teamA: { connect: { id: teamA.id } },
        teamB: { connect: { id: teamB.id } },
        arena: { connect: { id: arenaLinha1.id } },
        date: date,
        status: MatchStatus.FINISHED,
        startTime: date,
        endTime: new Date(date.getTime() + 300000),
        matchResult: faker.helpers.arrayElement([MatchResult.TEAM_A, MatchResult.TEAM_B]),
      });
    }
  }

  const [hockeyA, hockeyB] = faker.helpers.shuffle(teamsHockey).slice(0, 2);
  if (hockeyA && hockeyB) {
    const startTime = new Date(now.getTime() - 15 * 60000);
    matchesData.push({
      teamA: { connect: { id: hockeyA.id } },
      teamB: { connect: { id: hockeyB.id } },
      arena: { connect: { id: arenaHockey1.id } },
      date: startTime,
      status: MatchStatus.IN_PROGRESS,
      startTime: startTime,
    });
  }

  await prisma.match.createMany({
    data: matchesData.map((match) => ({
      idTeamA: match.teamA.connect!.id!,
      idTeamB: match.teamB.connect!.id!,
      idArena: match.arena.connect!.id!,
      date: match.date,
      status: match.status,
      observation: match.observation,
      startTime: match.startTime,
      endTime: match.endTime,
      matchResult: match.matchResult,
    })),
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
