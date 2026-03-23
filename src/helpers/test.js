// const axios = require("axios");
// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

// const apiKey = "WHFzcWFiNndVUUtEYkJZVm5rQzhuVVZXZjI1RnVxeHN4RkFWbWdRZQ==";

// async function fetchAndStore() {
//   try {
//     const { data: countries } = await axios.get(
//       "https://api.countrystatecity.in/v1/countries",
//       {
//         headers: { "X-CSCAPI-KEY": apiKey },
//       }
//     );

//     for (const country of countries) {
//       await prisma.country.upsert({
//         where: { iso2: country.iso2 },
//         update: {},
//         create: { name: country.name, iso2: country.iso2 },
//       });

//       const { data: states } = await axios.get(
//         `https://api.countrystatecity.in/v1/countries/${country.iso2}/states`,
//         { headers: { "X-CSCAPI-KEY": apiKey } }
//       );

//       for (const state of states) {
//         await prisma.state.upsert({
//           where: { iso2: state.iso2 },
//           update: {},
//           create: {
//             name: state.name,
//             iso2: state.iso2,
//             countryId: country.iso2,
//           },
//         });

//         const { data: cities } = await axios.get(
//           `https://api.countrystatecity.in/v1/countries/${country.iso2}/states/${state.iso2}/cities`,
//           { headers: { "X-CSCAPI-KEY": apiKey } }
//         );

//         if (cities.length) {
//           const cityData = cities.map((city) => ({
//             name: city.name,
//             stateId: state.iso2,
//             countryId: country.iso2,
//           }));

//           await prisma.city.createMany({
//             data: cityData,
//             skipDuplicates: true,
//           });
//         }
//       }
//     }
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// async function generateUniqueField(field, value) {
//   let uniqueValue = value;
//   let count = 0;

//   while (true) {
//     const existing = await prisma.company.findFirst({
//       where: { [field]: uniqueValue },
//     });

//     if (!existing) break;

//     count += 1;
//     if (field === "email") {
//       const parts = value.split("@");
//       uniqueValue = `${parts[0]}${count}@${parts[1]}`;
//     } else if (field === "phoneNumber") {
//       uniqueValue = `${value}${count}`;
//     }
//   }

//   return uniqueValue;
// }

// async function removeDuplicates() {
//   try {
//     const companies = await prisma.company.findMany({
//       orderBy: { createdAt: "asc" }, 
//     });

//     const seenEmails = new Set();
//     const seenPhones = new Set();

//     for (let company of companies) {
//       if (company.email) {
//         if (seenEmails.has(company.email)) {
//           const newEmail = await generateUniqueField("email", company.email);
//           await prisma.company.update({
//             where: { id: company.id },
//             data: { email: newEmail },
//           });
//           console.warn(
//             `Updated duplicate email: ${company.email} → ${newEmail}`
//           );
//         } else {
//           seenEmails.add(company.email);
//         }
//       }

//       if (company.phoneNumber) {
//         if (seenPhones.has(company.phoneNumber)) {
//           const newPhone = await generateUniqueField(
//             "phoneNumber",
//             company.phoneNumber
//           );
//           await prisma.company.update({
//             where: { id: company.id },
//             data: { phoneNumber: newPhone },
//           });
//           console.warn(
//             `Updated duplicate phone: ${company.phoneNumber} → ${newPhone}`
//           );
//         } else {
//           seenPhones.add(company.phoneNumber);
//         }
//       }
//     }

//     console.warn("Duplicate cleanup completed.");
//   } catch (err) {
//     console.error("Error removing duplicates:", err);
//   }
// }

// removeDuplicates();

// // fetchAndStore();
const HF_TOKEN = "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";
const axios = require('axios');

// Replace with your Hugging Face API token
const HF_API_TOKEN = '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';
const API_URL = 'https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.2';

/**
 * Generate a job description using Hugging Face API
 * @param {string} jobTitle - The job title
 * @param {string} company - Company name
 * @param {string} requirements - Key requirements (optional)
 * @returns {Promise<string>} Generated job description
 */
async function generateJobDescription(jobTitle, company, requirements = '') {
  try {
    const prompt = `Write a professional job description for the following position:

Job Title: ${jobTitle}
Company: ${company}
${requirements ? `Key Requirements: ${requirements}` : ''}

Job Description:`;

    const response = await axios.post(
      API_URL,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data[0].generated_text.trim();
  } catch (error) {
    console.error('Error generating job description:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
async function main() {
  try {
    const jobDescription = await generateJobDescription(
      'Senior Software Engineer',
      'Tech Corp Inc.',
      'Node.js, React, 5+ years experience'
    );
    
  } catch (error) {
    console.error('Failed to generate job description');
  }
}

// Run the example
main();

// Export for use in other modules
// module.exports = { generateJobDescription };