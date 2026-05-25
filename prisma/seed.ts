import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Début du seed de la base de données...');

  const adminEmail = 'admin@zangochap.in';
  const adminPassword = 'Password123!';

  // Vérifier si l'admin existe déjà
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`⚠️ Un utilisateur avec l'email ${adminEmail} existe déjà.`);
  } else {
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Créer l'administrateur
    const admin = await prisma.user.create({
      data: {
        name: 'Administrateur',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log(`✅ Administrateur créé avec succès !`);
    console.log(`📧 Email : ${adminEmail}`);
    console.log(`🔑 Mot de passe : ${adminPassword}`);
  }

  // Seed standard communes
  console.log('🌱 Seeding communes...');
  const { DELIVERY_FEES } = require('../lib/constants');
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

  const dbCommunes = await prisma.commune.findMany();
  const dbNormalizedNames = new Set(dbCommunes.map(c => normalize(c.name)));

  for (const [name, fee] of Object.entries(DELIVERY_FEES)) {
    const norm = normalize(name);
    if (!dbNormalizedNames.has(norm)) {
      console.log(`Adding missing commune: ${name} with fee ${fee} F`);
      await prisma.commune.create({
        data: {
          name,
          deliveryFee: fee as number,
          isActive: true,
        },
      });
    }
  }

  console.log('✅ Seed terminé.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

