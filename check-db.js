const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sims = await prisma.simulation.findMany({
    where: { status: 'COMPLETED' },
    include: { report: true }
  });
  console.log('COMPLETED SIMULATIONS:');
  console.log(JSON.stringify(sims, null, 2));

  const allSims = await prisma.simulation.findMany();
  console.log('ALL SIMULATIONS COUNT:', allSims.length);
  
  if (allSims.length > 0) {
    console.log('LAST SIMULATION:');
    console.log(JSON.stringify(allSims[allSims.length - 1], null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
