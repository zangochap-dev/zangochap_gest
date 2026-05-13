import "dotenv/config";
import prisma from "../lib/prisma";

async function main() {
  console.log("🧹 Démarrage du nettoyage des doublons...");

  // 1. Récupérer tous les produits avec leurs variantes pour être sûr
  const allProducts = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const productGroups = new Map<string, any[]>();

  // Regrouper par nom (en minuscule pour éviter les surprises)
  for (const p of allProducts) {
    const key = p.name.toLowerCase().trim();
    if (!productGroups.has(key)) {
      productGroups.set(key, []);
    }
    productGroups.get(key)?.push(p);
  }

  let deletedCount = 0;

  for (const [name, products] of productGroups.entries()) {
    if (products.length > 1) {
      // On a trouvé des doublons
      // On trie pour mettre en premier celui qu'on veut GARDER :
      // Priorité : a une Ref (Wix ID) > a une Location > le plus récent
      products.sort((a, b) => {
        if (a.ref && !b.ref) return -1;
        if (!a.ref && b.ref) return 1;
        if (a.location && !b.location) return -1;
        if (!a.location && b.location) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const toKeep = products[0];
      const toDelete = products.slice(1);

      console.log(`🔍 Doublon trouvé pour "${toKeep.name}" (${products.length} copies)`);
      console.log(`✅ On garde : ID ${toKeep.id} (Ref: ${toKeep.ref || 'N/A'}, Loc: ${toKeep.location || 'N/A'})`);

      for (const p of toDelete) {
        console.log(`🗑️  Suppression du doublon : ID ${p.id} (Ref: ${p.ref || 'N/A'}, Loc: ${p.location || 'N/A'})`);
        await prisma.product.delete({
          where: { id: p.id }
        });
        deletedCount++;
      }
    }
  }

  console.log(`\n✨ Nettoyage terminé !`);
  console.log(`📊 Résultat : ${deletedCount} doublons supprimés.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
