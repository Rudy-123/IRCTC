require('dotenv').config();
const prisma = require('./src/config/prisma');
async function main() {
  const stations = await prisma.station.findMany({
    where: { code: { in: ['JBP', 'MML', 'RKMP', 'BPL', 'AGC', 'MTJ', 'NZM'] } }
  });
  const train = await prisma.train.findFirst({ where: { trainNumber: '12192' } });
  
  console.log('--- STATIONS ---');
  stations.forEach(s => console.log(s.code, s.id));
  console.log('--- TRAIN ---');
  if (train) console.log(train.trainName, train.id);
  else console.log('Train not found');
}
main().catch(console.error).finally(() => process.exit(0));
