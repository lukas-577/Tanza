import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL }),
});

async function main() {
  for (const [i, name] of ["A1", "A2", "B1", "B2", "C1"].entries()) {
    await prisma.level.upsert({ where: { name }, update: {}, create: { name, position: i + 1 } });
  }
}

main().finally(() => prisma.$disconnect());
