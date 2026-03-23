const { PrismaClient } = require("@prisma/client");
const { Country, State, City } = require("country-state-city");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding started...");

  // Example: Seed only India (You can loop all countries if needed)
  const countryData = Country.getCountryByCode("IN");

  if (!countryData) {
    console.log("Country not found");
    return;
  }

  // 1️⃣ Create Country
  await prisma.country.upsert({
    where: { iso2: countryData.isoCode },
    update: {},
    create: {
      name: countryData.name,
      iso2: countryData.isoCode,
    },
  });

  console.log("✅ Country seeded");

  // 2️⃣ Seed States
  const states = State.getStatesOfCountry("IN");

  for (const state of states) {
    await prisma.state.upsert({
      where: { iso2: state.isoCode },
      update: {},
      create: {
        name: state.name,
        iso2: state.isoCode,
        countryId: countryData.isoCode, // referencing Country.iso2
      },
    });

    console.log(`✅ State added: ${state.name}`);

    // 3️⃣ Seed Cities for this State
    const cities = City.getCitiesOfState("IN", state.isoCode);

    if (cities.length > 0) {
      await prisma.city.createMany({
        data: cities.map((city) => ({
          name: city.name,
          stateId: state.isoCode,       // referencing State.iso2
          countryId: countryData.isoCode, // referencing Country.iso2
        })),
        skipDuplicates: true,
      });

      console.log(`   ↳ ${cities.length} cities added`);
    }
  }

  console.log("🎉 Seeding completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });