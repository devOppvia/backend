const prisma = require("../config/database");

async function seed() {
  const jobData = [
    {
      categoryName: "Information Technology (IT) & Software Development",
      subCategories: [
        {
          subCategoryName: "Web Development",
          skills: [
            "HTML",
            "CSS",
            "JavaScript",
            "React.js",
            "Node.js",
            "PHP",
            "Laravel",
            "Django",
          ],
        },
        {
          subCategoryName: "Mobile App Development",
          skills: [
            "Java",
            "Kotlin",
            "Swift",
            "Flutter",
            "React Native",
            "Android SDK",
            "iOS SDK",
          ],
        },
        {
          subCategoryName: "Software Testing & QA",
          skills: [
            "Manual Testing",
            "Selenium",
            "Jest",
            "Cypress",
            "Postman",
            "Automation Testing",
          ],
        },
        {
          subCategoryName: "Cybersecurity",
          skills: [
            "Network Security",
            "Penetration Testing",
            "Ethical Hacking",
            "Wireshark",
            "Kali Linux",
          ],
        },
        {
          subCategoryName: "Cloud Computing",
          skills: [
            "AWS",
            "Azure",
            "Google Cloud",
            "DevOps",
            "Docker",
            "Kubernetes",
            "Terraform",
          ],
        },
        {
          subCategoryName: "Artificial Intelligence",
          skills: [
            "Python",
            "TensorFlow",
            "PyTorch",
            "Machine Learning",
            "Deep Learning",
            "NLP",
          ],
        },
        {
          subCategoryName: "Data Engineering",
          skills: [
            "SQL",
            "ETL",
            "Apache Spark",
            "Kafka",
            "Snowflake",
            "Hadoop",
          ],
        },
        {
          subCategoryName: "Blockchain Development",
          skills: [
            "Solidity",
            "Ethereum",
            "Smart Contracts",
            "Web3.js",
            "DeFi",
            "NFT Development",
          ],
        },
        {
          subCategoryName: "Game Development",
          skills: [
            "Unity",
            "C#",
            "Unreal Engine",
            "Game Physics",
            "3D Modeling",
            "VR/AR",
          ],
        },
        {
          subCategoryName: "Embedded Systems",
          skills: [
            "C",
            "C++",
            "Arduino",
            "Raspberry Pi",
            "IoT",
            "Microcontrollers",
          ],
        },
        {
          subCategoryName: "UI/UX Development",
          skills: [
            "Figma",
            "Adobe XD",
            "Wireframing",
            "Prototyping",
            "Usability Testing",
          ],
        },
        {
          subCategoryName: "DevOps & Automation",
          skills: [
            "Jenkins",
            "CI/CD",
            "Docker",
            "Kubernetes",
            "GitHub Actions",
          ],
        },
        {
          subCategoryName: "Big Data",
          skills: [
            "Hadoop",
            "Spark",
            "Hive",
            "Pig",
            "Cloudera",
            "NoSQL Databases",
          ],
        },
        {
          subCategoryName: "Networking",
          skills: [
            "CCNA",
            "Routing & Switching",
            "TCP/IP",
            "Firewalls",
            "VPN",
            "Network Security",
          ],
        },
        {
          subCategoryName: "IT Support",
          skills: [
            "Troubleshooting",
            "Windows Server",
            "Linux Admin",
            "Help Desk",
            "System Monitoring",
          ],
        },
        {
          subCategoryName: "ERP & CRM Systems",
          skills: [
            "SAP",
            "Oracle",
            "Salesforce",
            "Microsoft Dynamics",
            "Zoho CRM",
          ],
        },
      ],
    },
    {
      categoryName: "Design & Creative",
      subCategories: [
        {
          subCategoryName: "Graphic Design",
          skills: ["Photoshop", "Illustrator", "Canva", "CorelDRAW", "Figma"],
        },
        {
          subCategoryName: "UI/UX Design",
          skills: ["Figma", "Adobe XD", "Sketch", "Wireframing", "Prototyping"],
        },
        {
          subCategoryName: "3D Modeling & Animation",
          skills: ["Blender", "Maya", "Cinema4D", "After Effects", "3ds Max"],
        },
        {
          subCategoryName: "Video Editing",
          skills: [
            "Premiere Pro",
            "Final Cut Pro",
            "DaVinci Resolve",
            "CapCut",
          ],
        },
        {
          subCategoryName: "Illustration",
          skills: [
            "Procreate",
            "Adobe Illustrator",
            "Sketching",
            "Digital Art",
          ],
        },
        {
          subCategoryName: "Motion Graphics",
          skills: ["After Effects", "Cinema 4D", "Moho", "Animation"],
        },
        {
          subCategoryName: "Photography",
          skills: ["DSLR", "Lightroom", "Photoshop", "Photo Retouching"],
        },
        {
          subCategoryName: "Interior Design",
          skills: ["AutoCAD", "SketchUp", "3ds Max", "V-Ray", "Revit"],
        },
        {
          subCategoryName: "Fashion Design",
          skills: [
            "Illustrator",
            "Pattern Making",
            "Stitching",
            "Fashion Sketching",
          ],
        },
        {
          subCategoryName: "Architecture Design",
          skills: ["AutoCAD", "Revit", "3ds Max", "Lumion"],
        },
        {
          subCategoryName: "Product Design",
          skills: ["SolidWorks", "Fusion 360", "Prototyping", "CAD"],
        },
        {
          subCategoryName: "Web Design",
          skills: ["HTML", "CSS", "Figma", "Bootstrap", "WordPress"],
        },
        {
          subCategoryName: "Game Design",
          skills: ["Unity", "C#", "Character Design", "Level Design"],
        },
        {
          subCategoryName: "Logo & Branding",
          skills: ["Brand Identity", "Illustrator", "Photoshop", "Figma"],
        },
        {
          subCategoryName: "Creative Writing",
          skills: ["Storytelling", "Copywriting", "Editing", "Content Writing"],
        },
        {
          subCategoryName: "Animation",
          skills: ["Toon Boom", "After Effects", "Flash", "2D/3D Animation"],
        },
      ],
    },
    {
      categoryName: "Business, Management & Consulting",
      subCategories: [
        {
          subCategoryName: "Business Strategy",
          skills: [
            "Business Analysis",
            "Market Research",
            "Competitive Strategy",
          ],
        },
        {
          subCategoryName: "Project Management",
          skills: ["Agile", "Scrum", "JIRA", "MS Project"],
        },
        {
          subCategoryName: "Entrepreneurship",
          skills: ["Startup Planning", "Pitch Decks", "Fundraising"],
        },
        {
          subCategoryName: "Operations Management",
          skills: ["Lean Management", "Six Sigma", "Process Optimization"],
        },
        {
          subCategoryName: "Consulting",
          skills: [
            "Business Consulting",
            "Data Analysis",
            "Presentation Skills",
          ],
        },
        {
          subCategoryName: "Risk Management",
          skills: ["Risk Assessment", "Compliance", "Crisis Management"],
        },
        {
          subCategoryName: "Supply Chain Consulting",
          skills: ["Inventory Management", "Demand Planning", "Logistics"],
        },
        {
          subCategoryName: "Change Management",
          skills: ["Leadership", "Stakeholder Management", "Communication"],
        },
        {
          subCategoryName: "Corporate Governance",
          skills: ["Policy Development", "Ethics", "Board Relations"],
        },
        {
          subCategoryName: "Management Information Systems",
          skills: ["ERP Systems", "MIS Reporting", "Database Basics"],
        },
        {
          subCategoryName: "Organizational Development",
          skills: ["Training", "HR Strategy", "Culture Development"],
        },
        {
          subCategoryName: "Quality Management",
          skills: ["ISO Standards", "Auditing", "Kaizen"],
        },
        {
          subCategoryName: "Financial Consulting",
          skills: ["Valuation", "Mergers & Acquisitions", "Forecasting"],
        },
        {
          subCategoryName: "Business Analytics",
          skills: ["Excel", "Power BI", "Tableau", "SQL"],
        },
        {
          subCategoryName: "Process Consulting",
          skills: ["Workflow Design", "Automation", "BPM Tools"],
        },
        {
          subCategoryName: "Market Expansion",
          skills: [
            "International Business",
            "Export-Import",
            "Cross-Cultural Management",
          ],
        },
      ],
    },
    {
      categoryName: "Engineering (Core & Specialized)",
      subCategories: [
        {
          subCategoryName: "Mechanical Engineering",
          skills: ["AutoCAD", "SolidWorks", "Thermodynamics", "MATLAB"],
        },
        {
          subCategoryName: "Electrical Engineering",
          skills: ["Circuit Design", "MATLAB", "Power Systems", "PLC"],
        },
        {
          subCategoryName: "Civil Engineering",
          skills: ["AutoCAD", "Revit", "STAAD Pro", "Surveying"],
        },
        {
          subCategoryName: "Electronics Engineering",
          skills: ["VLSI", "Embedded Systems", "PCB Design"],
        },
        {
          subCategoryName: "Chemical Engineering",
          skills: ["Process Design", "Aspen Plus", "Safety Engineering"],
        },
        {
          subCategoryName: "Industrial Engineering",
          skills: ["Lean Manufacturing", "Operations Research", "Supply Chain"],
        },
        {
          subCategoryName: "Aerospace Engineering",
          skills: ["CATIA", "CFD", "Aerodynamics", "Propulsion"],
        },
        {
          subCategoryName: "Automobile Engineering",
          skills: ["AutoCAD", "Engine Design", "Hybrid Vehicles"],
        },
        {
          subCategoryName: "Marine Engineering",
          skills: ["Ship Design", "Hydrodynamics", "Marine Engines"],
        },
        {
          subCategoryName: "Petroleum Engineering",
          skills: ["Reservoir Simulation", "Drilling Engineering"],
        },
        {
          subCategoryName: "Mining Engineering",
          skills: ["Mine Planning", "Rock Mechanics", "Safety Engineering"],
        },
        {
          subCategoryName: "Structural Engineering",
          skills: ["ETABS", "SAFE", "Bridge Design"],
        },
        {
          subCategoryName: "Environmental Engineering",
          skills: ["Waste Management", "Water Treatment"],
        },
        {
          subCategoryName: "Metallurgical Engineering",
          skills: ["Material Testing", "Metallurgy", "Welding Technology"],
        },
        {
          subCategoryName: "Robotics",
          skills: ["ROS", "MATLAB", "Python", "Control Systems"],
        },
        {
          subCategoryName: "Mechatronics",
          skills: ["Arduino", "PLC", "Sensors", "Automation"],
        },
      ],
    },
  ];
  for (let category of jobData) {
    let jobCategory = await prisma.jobCategory.create({
      data: {
        categoryName: category.categoryName,
      },
    });
    let jobSubCategories = category.subCategories;
    for (let subCategory of jobSubCategories) {
      let jobSubCategory = await prisma.jobSubCategory.create({
        data: {
          subCategoryName: subCategory.subCategoryName,
          jobCategoryId: jobCategory.id,
        },
      });
      let skills = subCategory.skills;
      for (let skill of skills) {
        await prisma.skills.create({
          data: {
            skillName: skill,
            jobCategoryId: jobCategory.id,
            jobSubCategoryId: jobSubCategory.id,
          },
        });
      }
    }
  }
}

seed()
  .then(async () => {
    console.warn("SEEDED SUCCESSFULLY");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("ERROR ::", e);
    await prisma.$disconnect();
    process.exit(1);
  });
