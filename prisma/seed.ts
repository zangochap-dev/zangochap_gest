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
