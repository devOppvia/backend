const prisma = require("../config/database");

async function seed() {
  // const jobData = [
  //   {
  //     categoryName: "Information Technology (IT) & Software Development",
  //     subCategories: [
  //       {
  //         subCategoryName: "Web Development",
  //         skills: [
  //           "HTML",
  //           "CSS",
  //           "JavaScript",
  //           "React.js",
  //           "Node.js",
  //           "PHP",
  //           "Laravel",
  //           "Django",
  //         ],
  //       },
  //       {
  //         subCategoryName: "Mobile App Development",
  //         skills: [
  //           "Java",
  //           "Kotlin",
  //           "Swift",
  //           "Flutter",
  //           "React Native",
  //           "Android SDK",
  //           "iOS SDK",
  //         ],
  //       },
  //       {
  //         subCategoryName: "Software Testing & QA",
  //         skills: [
  //           "Manual Testing",
  //           "Selenium",
  //           "Jest",
  //           "Cypress",
  //           "Postman",
  //           "Automation Testing",
  //         ],
  //       },
  //       {
  //         subCategoryName: "Cybersecurity",
  //         skills: [
  //           "Network Security",
  //           "Penetration Testing",
  //           "Ethical Hacking",
  //           "Wireshark",
  //           "Kali Linux",
  //         ],
  //       },
  //       {
  //         subCategoryName: "Cloud Computing",
  //         skills: [
  //           "AWS",
  //           "Azure",
  //           "Google Cloud",
  //           "DevOps",
  //           "Docker",
  //           "Kubernetes",
  //           "Terraform",
  //         ],
  //       },
  //       {
  //         subCategoryName: "Artificial Intelligence",
  //         skills: [
  //           "Python",
  //           "TensorFlow",
  //           "PyTorch",
  //           "Machine Learning",
  //           "Deep Learning",
  //           "NLP",
  //         ],
  //       },
  //       {
  //         subCategoryName: "Data Engineering",
  //         skills: [
  //           "SQL",
  //           "ETL",
  //           "Apache Spark",
  //           "Kafka",
  //           "Snowflake",
  //           "Hadoop",
  //         ],
  //       },
  //       {
  //         subCategoryName: "Blockchain Development",
  //         skills: [
  //           "Solidity",
  //           "Ethereum",
  //           "Smart Contracts",
  //           "Web3.js",
  //           "DeFi",
  //           "NFT Development",
  //         ],
  //       },
  //       {
  //         subCategoryName: "Game Development",
  //         skills: [
  //           "Unity",
  //           "C#",
  //           "Unreal Engine",
  //           "Game Physics",
  //           "3D Modeling",
  //           "VR/AR",
  //         ],
  //       },
  //       {
  //         subCategoryName: "Embedded Systems",
  //         skills: [
  //           "C",
  //           "C++",
  //           "Arduino",
  //           "Raspberry Pi",
  //           "IoT",
  //           "Microcontrollers",
  //         ],
  //       },
  //       {
  //         subCategoryName: "UI/UX Development",
  //         skills: [
  //           "Figma",
  //           "Adobe XD",
  //           "Wireframing",
  //           "Prototyping",
  //           "Usability Testing",
  //         ],
  //       },
  //       {
  //         subCategoryName: "DevOps & Automation",
  //         skills: [
  //           "Jenkins",
  //           "CI/CD",
  //           "Docker",
  //           "Kubernetes",
  //           "GitHub Actions",
  //         ],
  //       },
  //       {
  //         subCategoryName: "Big Data",
  //         skills: [
  //           "Hadoop",
  //           "Spark",
  //           "Hive",
  //           "Pig",
  //           "Cloudera",
  //           "NoSQL Databases",
  //         ],
  //       },
  //       {
  //         subCategoryName: "Networking",
  //         skills: [
  //           "CCNA",
  //           "Routing & Switching",
  //           "TCP/IP",
  //           "Firewalls",
  //           "VPN",
  //           "Network Security",
  //         ],
  //       },
  //       {
  //         subCategoryName: "IT Support",
  //         skills: [
  //           "Troubleshooting",
  //           "Windows Server",
  //           "Linux Admin",
  //           "Help Desk",
  //           "System Monitoring",
  //         ],
  //       },
  //       {
  //         subCategoryName: "ERP & CRM Systems",
  //         skills: [
  //           "SAP",
  //           "Oracle",
  //           "Salesforce",
  //           "Microsoft Dynamics",
  //           "Zoho CRM",
  //         ],
  //       },
  //     ],
  //   },
  //   {
  //     categoryName: "Design & Creative",
  //     subCategories: [
  //       {
  //         subCategoryName: "Graphic Design",
  //         skills: ["Photoshop", "Illustrator", "Canva", "CorelDRAW", "Figma"],
  //       },
  //       {
  //         subCategoryName: "UI/UX Design",
  //         skills: ["Figma", "Adobe XD", "Sketch", "Wireframing", "Prototyping"],
  //       },
  //       {
  //         subCategoryName: "3D Modeling & Animation",
  //         skills: ["Blender", "Maya", "Cinema4D", "After Effects", "3ds Max"],
  //       },
  //       {
  //         subCategoryName: "Video Editing",
  //         skills: [
  //           "Premiere Pro",
  //           "Final Cut Pro",
  //           "DaVinci Resolve",
  //           "CapCut",
  //         ],
  //       },
  //       {
  //         subCategoryName: "Illustration",
  //         skills: [
  //           "Procreate",
  //           "Adobe Illustrator",
  //           "Sketching",
  //           "Digital Art",
  //         ],
  //       },
  //       {
  //         subCategoryName: "Motion Graphics",
  //         skills: ["After Effects", "Cinema 4D", "Moho", "Animation"],
  //       },
  //       {
  //         subCategoryName: "Photography",
  //         skills: ["DSLR", "Lightroom", "Photoshop", "Photo Retouching"],
  //       },
  //       {
  //         subCategoryName: "Interior Design",
  //         skills: ["AutoCAD", "SketchUp", "3ds Max", "V-Ray", "Revit"],
  //       },
  //       {
  //         subCategoryName: "Fashion Design",
  //         skills: [
  //           "Illustrator",
  //           "Pattern Making",
  //           "Stitching",
  //           "Fashion Sketching",
  //         ],
  //       },
  //       {
  //         subCategoryName: "Architecture Design",
  //         skills: ["AutoCAD", "Revit", "3ds Max", "Lumion"],
  //       },
  //       {
  //         subCategoryName: "Product Design",
  //         skills: ["SolidWorks", "Fusion 360", "Prototyping", "CAD"],
  //       },
  //       {
  //         subCategoryName: "Web Design",
  //         skills: ["HTML", "CSS", "Figma", "Bootstrap", "WordPress"],
  //       },
  //       {
  //         subCategoryName: "Game Design",
  //         skills: ["Unity", "C#", "Character Design", "Level Design"],
  //       },
  //       {
  //         subCategoryName: "Logo & Branding",
  //         skills: ["Brand Identity", "Illustrator", "Photoshop", "Figma"],
  //       },
  //       {
  //         subCategoryName: "Creative Writing",
  //         skills: ["Storytelling", "Copywriting", "Editing", "Content Writing"],
  //       },
  //       {
  //         subCategoryName: "Animation",
  //         skills: ["Toon Boom", "After Effects", "Flash", "2D/3D Animation"],
  //       },
  //     ],
  //   },
  //   {
  //     categoryName: "Business, Management & Consulting",
  //     subCategories: [
  //       {
  //         subCategoryName: "Business Strategy",
  //         skills: [
  //           "Business Analysis",
  //           "Market Research",
  //           "Competitive Strategy",
  //         ],
  //       },
  //       {
  //         subCategoryName: "Project Management",
  //         skills: ["Agile", "Scrum", "JIRA", "MS Project"],
  //       },
  //       {
  //         subCategoryName: "Entrepreneurship",
  //         skills: ["Startup Planning", "Pitch Decks", "Fundraising"],
  //       },
  //       {
  //         subCategoryName: "Operations Management",
  //         skills: ["Lean Management", "Six Sigma", "Process Optimization"],
  //       },
  //       {
  //         subCategoryName: "Consulting",
  //         skills: [
  //           "Business Consulting",
  //           "Data Analysis",
  //           "Presentation Skills",
  //         ],
  //       },
  //       {
  //         subCategoryName: "Risk Management",
  //         skills: ["Risk Assessment", "Compliance", "Crisis Management"],
  //       },
  //       {
  //         subCategoryName: "Supply Chain Consulting",
  //         skills: ["Inventory Management", "Demand Planning", "Logistics"],
  //       },
  //       {
  //         subCategoryName: "Change Management",
  //         skills: ["Leadership", "Stakeholder Management", "Communication"],
  //       },
  //       {
  //         subCategoryName: "Corporate Governance",
  //         skills: ["Policy Development", "Ethics", "Board Relations"],
  //       },
  //       {
  //         subCategoryName: "Management Information Systems",
  //         skills: ["ERP Systems", "MIS Reporting", "Database Basics"],
  //       },
  //       {
  //         subCategoryName: "Organizational Development",
  //         skills: ["Training", "HR Strategy", "Culture Development"],
  //       },
  //       {
  //         subCategoryName: "Quality Management",
  //         skills: ["ISO Standards", "Auditing", "Kaizen"],
  //       },
  //       {
  //         subCategoryName: "Financial Consulting",
  //         skills: ["Valuation", "Mergers & Acquisitions", "Forecasting"],
  //       },
  //       {
  //         subCategoryName: "Business Analytics",
  //         skills: ["Excel", "Power BI", "Tableau", "SQL"],
  //       },
  //       {
  //         subCategoryName: "Process Consulting",
  //         skills: ["Workflow Design", "Automation", "BPM Tools"],
  //       },
  //       {
  //         subCategoryName: "Market Expansion",
  //         skills: [
  //           "International Business",
  //           "Export-Import",
  //           "Cross-Cultural Management",
  //         ],
  //       },
  //     ],
  //   },
  //   {
  //     categoryName: "Engineering (Core & Specialized)",
  //     subCategories: [
  //       {
  //         subCategoryName: "Mechanical Engineering",
  //         skills: ["AutoCAD", "SolidWorks", "Thermodynamics", "MATLAB"],
  //       },
  //       {
  //         subCategoryName: "Electrical Engineering",
  //         skills: ["Circuit Design", "MATLAB", "Power Systems", "PLC"],
  //       },
  //       {
  //         subCategoryName: "Civil Engineering",
  //         skills: ["AutoCAD", "Revit", "STAAD Pro", "Surveying"],
  //       },
  //       {
  //         subCategoryName: "Electronics Engineering",
  //         skills: ["VLSI", "Embedded Systems", "PCB Design"],
  //       },
  //       {
  //         subCategoryName: "Chemical Engineering",
  //         skills: ["Process Design", "Aspen Plus", "Safety Engineering"],
  //       },
  //       {
  //         subCategoryName: "Industrial Engineering",
  //         skills: ["Lean Manufacturing", "Operations Research", "Supply Chain"],
  //       },
  //       {
  //         subCategoryName: "Aerospace Engineering",
  //         skills: ["CATIA", "CFD", "Aerodynamics", "Propulsion"],
  //       },
  //       {
  //         subCategoryName: "Automobile Engineering",
  //         skills: ["AutoCAD", "Engine Design", "Hybrid Vehicles"],
  //       },
  //       {
  //         subCategoryName: "Marine Engineering",
  //         skills: ["Ship Design", "Hydrodynamics", "Marine Engines"],
  //       },
  //       {
  //         subCategoryName: "Petroleum Engineering",
  //         skills: ["Reservoir Simulation", "Drilling Engineering"],
  //       },
  //       {
  //         subCategoryName: "Mining Engineering",
  //         skills: ["Mine Planning", "Rock Mechanics", "Safety Engineering"],
  //       },
  //       {
  //         subCategoryName: "Structural Engineering",
  //         skills: ["ETABS", "SAFE", "Bridge Design"],
  //       },
  //       {
  //         subCategoryName: "Environmental Engineering",
  //         skills: ["Waste Management", "Water Treatment"],
  //       },
  //       {
  //         subCategoryName: "Metallurgical Engineering",
  //         skills: ["Material Testing", "Metallurgy", "Welding Technology"],
  //       },
  //       {
  //         subCategoryName: "Robotics",
  //         skills: ["ROS", "MATLAB", "Python", "Control Systems"],
  //       },
  //       {
  //         subCategoryName: "Mechatronics",
  //         skills: ["Arduino", "PLC", "Sensors", "Automation"],
  //       },
  //     ],
  //   },
  // ];

const jobData = [
  {
    categoryName: "Software Development",
    subCategories: [
      {
        subCategoryName: "Frontend Dev",
        skills: ["React", "Next.js", "Vue.js", "Angular", "TypeScript"],
      },
      {
        subCategoryName: "Backend Dev",
        skills: ["Node.js", "Python", "Java", "Go", "REST API"],
      },
      {
        subCategoryName: "Full Stack Dev",
        skills: ["React", "Node.js", "MongoDB", "PostgreSQL", "GraphQL"],
      },
      {
        subCategoryName: "Mobile (iOS)",
        skills: ["Swift", "iOS SDK", "Xcode", "UIKit", "Firebase"],
      },
      {
        subCategoryName: "Mobile (Android)",
        skills: [
          "Kotlin",
          "Java",
          "Android SDK",
          "Jetpack Compose",
          "Firebase",
        ],
      },
      {
        subCategoryName: "React Native / Flutter",
        skills: ["React Native", "Flutter", "Dart", "Expo", "Firebase"],
      },
      {
        subCategoryName: "WordPress / CMS",
        skills: ["WordPress", "PHP", "Elementor", "WooCommerce", "MySQL"],
      },
      {
        subCategoryName: "Shopify Dev",
        skills: ["Shopify", "Liquid", "JavaScript", "HTML", "CSS"],
      },
      {
        subCategoryName: "Game Dev",
        skills: ["Unity", "C#", "Unreal Engine", "Game Physics", "Blender"],
      },
      {
        subCategoryName: "Embedded / IoT",
        skills: ["C", "C++", "Arduino", "Raspberry Pi", "IoT"],
      },
      {
        subCategoryName: "Desktop App Dev",
        skills: ["Electron", "C#", ".NET", "JavaFX", "Qt"],
      },
    ],
  },

  {
    categoryName: "AI & ML",
    subCategories: [
      {
        subCategoryName: "ML Engineer",
        skills: ["Python", "Scikit-learn", "TensorFlow", "PyTorch", "Pandas"],
      },
      {
        subCategoryName: "Deep Learning Eng.",
        skills: ["PyTorch", "TensorFlow", "Keras", "CUDA", "CNN"],
      },
      {
        subCategoryName: "NLP Engineer",
        skills: ["SpaCy", "NLTK", "Transformers", "Hugging Face", "Python"],
      },
      {
        subCategoryName: "Computer Vision Eng.",
        skills: ["OpenCV", "YOLO", "PyTorch", "TensorFlow", "Image Processing"],
      },
      {
        subCategoryName: "AI Prompt Engineer",
        skills: [
          "OpenAI API",
          "Prompt Engineering",
          "LangChain",
          "LLMs",
          "RAG",
        ],
      },
      {
        subCategoryName: "LLM Fine-tuning",
        skills: ["LoRA", "Transformers", "Hugging Face", "PyTorch", "PEFT"],
      },
      {
        subCategoryName: "Generative AI Dev",
        skills: ["LangChain", "OpenAI API", "Vector DB", "LLMs", "RAG"],
      },
      {
        subCategoryName: "AI Research Scientist",
        skills: ["Python", "Research", "Deep Learning", "Math", "PyTorch"],
      },
      {
        subCategoryName: "Chatbot / Conv. AI",
        skills: ["Dialogflow", "Rasa", "OpenAI API", "LangChain", "NLP"],
      },
    ],
  },

  {
    categoryName: "Data Science",
    subCategories: [
      {
        subCategoryName: "Data Scientist",
        skills: ["Python", "Pandas", "NumPy", "Machine Learning", "SQL"],
      },
      {
        subCategoryName: "Data Analyst",
        skills: ["Excel", "SQL", "Power BI", "Tableau", "Data Visualization"],
      },
      {
        subCategoryName: "BI Analyst",
        skills: ["Power BI", "Tableau", "Looker", "SQL", "Excel"],
      },
      {
        subCategoryName: "Data Engineer",
        skills: ["Spark", "Airflow", "Kafka", "dbt", "Python"],
      },
      {
        subCategoryName: "Big Data Engineer",
        skills: ["Hadoop", "Spark", "Hive", "Kafka", "Scala"],
      },
      {
        subCategoryName: "DBA",
        skills: [
          "PostgreSQL",
          "MySQL",
          "Backup",
          "Performance Tuning",
          "Replication",
        ],
      },
      {
        subCategoryName: "ETL Developer",
        skills: ["ETL", "SSIS", "Talend", "dbt", "SQL"],
      },
      {
        subCategoryName: "Power BI / Tableau",
        skills: ["Power BI", "Tableau", "DAX", "Data Modeling", "SQL"],
      },
      {
        subCategoryName: "Quantitative Analyst",
        skills: ["Python", "R", "Statistics", "Excel", "Machine Learning"],
      },
    ],
  },

  {
    categoryName: "Cybersecurity",
    subCategories: [
      {
        subCategoryName: "Penetration Tester",
        skills: ["Kali Linux", "Metasploit", "Burp Suite", "Nmap", "OWASP"],
      },
      {
        subCategoryName: "SOC Analyst",
        skills: ["SIEM", "Splunk", "Incident Response", "Log Analysis", "SOC"],
      },
      {
        subCategoryName: "Security Engineer",
        skills: [
          "Firewall",
          "IDS/IPS",
          "Network Security",
          "IAM",
          "Encryption",
        ],
      },
      {
        subCategoryName: "Cloud Security Arch.",
        skills: [
          "AWS Security",
          "Azure Security",
          "IAM",
          "Cloud Security",
          "DevSecOps",
        ],
      },
      {
        subCategoryName: "Network Security Eng.",
        skills: ["VPN", "Firewalls", "Cisco", "Wireshark", "TCP/IP"],
      },
      {
        subCategoryName: "AppSec Engineer",
        skills: ["OWASP", "SAST", "DAST", "Secure Coding", "Burp Suite"],
      },
      {
        subCategoryName: "Incident Response",
        skills: [
          "Forensics",
          "Threat Hunting",
          "SIEM",
          "Malware Analysis",
          "Splunk",
        ],
      },
      {
        subCategoryName: "Digital Forensics",
        skills: ["Autopsy", "FTK", "Wireshark", "Memory Analysis", "Forensics"],
      },
      {
        subCategoryName: "GRC Analyst",
        skills: ["ISO 27001", "Risk Assessment", "Compliance", "Audit", "NIST"],
      },
      {
        subCategoryName: "IAM Specialist",
        skills: ["Okta", "Azure AD", "SSO", "RBAC", "Identity Management"],
      },
    ],
  },

  {
    categoryName: "Cloud & DevOps",
    subCategories: [
      {
        subCategoryName: "DevOps Engineer",
        skills: ["Docker", "Kubernetes", "Jenkins", "CI/CD", "Linux"],
      },
      {
        subCategoryName: "Cloud Architect",
        skills: ["AWS", "Azure", "GCP", "Terraform", "Networking"],
      },
      {
        subCategoryName: "SRE",
        skills: ["Monitoring", "Grafana", "Prometheus", "Linux", "Kubernetes"],
      },
      {
        subCategoryName: "Platform Engineer",
        skills: ["Terraform", "Kubernetes", "AWS", "CI/CD", "Docker"],
      },
      {
        subCategoryName: "Kubernetes / Docker",
        skills: ["Docker", "Kubernetes", "Helm", "Containerization", "Linux"],
      },
      {
        subCategoryName: "CI/CD Engineer",
        skills: [
          "GitHub Actions",
          "Jenkins",
          "GitLab CI",
          "Docker",
          "Automation",
        ],
      },
      {
        subCategoryName: "Linux Sysadmin",
        skills: ["Linux", "Shell Scripting", "Nginx", "Apache", "System Admin"],
      },
      {
        subCategoryName: "Cloud Migration",
        skills: ["AWS", "Azure", "Migration", "Terraform", "Cloud Strategy"],
      },
      {
        subCategoryName: "IaC (Terraform)",
        skills: ["Terraform", "Ansible", "AWS", "IaC", "Automation"],
      },
      {
        subCategoryName: "Monitoring Eng.",
        skills: [
          "Grafana",
          "Prometheus",
          "ELK Stack",
          "Monitoring",
          "Alerting",
        ],
      },
    ],
  },

  {
    categoryName: "UI/UX & Design",
    subCategories: [
      {
        subCategoryName: "UI Designer",
        skills: [
          "Figma",
          "Adobe XD",
          "Design Systems",
          "Wireframing",
          "UI Design",
        ],
      },
      {
        subCategoryName: "UX Designer",
        skills: [
          "User Research",
          "Prototyping",
          "Figma",
          "UX Design",
          "Usability Testing",
        ],
      },
      {
        subCategoryName: "Product Designer",
        skills: [
          "Figma",
          "Product Thinking",
          "Design Systems",
          "UX",
          "Prototyping",
        ],
      },
      {
        subCategoryName: "Motion Designer",
        skills: [
          "After Effects",
          "Animation",
          "Premiere Pro",
          "Motion Graphics",
          "Video Editing",
        ],
      },
      {
        subCategoryName: "Graphic Designer",
        skills: ["Photoshop", "Illustrator", "Canva", "Branding", "Typography"],
      },
      {
        subCategoryName: "Design System",
        skills: [
          "Figma",
          "Tokens",
          "Components",
          "Design Systems",
          "Accessibility",
        ],
      },
      {
        subCategoryName: "Figma Expert",
        skills: [
          "Figma",
          "Auto Layout",
          "Components",
          "Prototyping",
          "Design Systems",
        ],
      },
      {
        subCategoryName: "User Researcher",
        skills: ["User Interviews", "Research", "Analytics", "Personas", "UX"],
      },
      {
        subCategoryName: "Accessibility Designer",
        skills: [
          "WCAG",
          "Accessibility",
          "Color Contrast",
          "Screen Readers",
          "Inclusive Design",
        ],
      },
    ],
  },

  {
    categoryName: "Digital Marketing",
    subCategories: [
      {
        subCategoryName: "SEO Specialist",
        skills: [
          "SEO",
          "Ahrefs",
          "SEMrush",
          "Keyword Research",
          "Google Search Console",
        ],
      },
      {
        subCategoryName: "Google Ads / SEM",
        skills: [
          "Google Ads",
          "PPC",
          "Keyword Planner",
          "GA4",
          "Conversion Tracking",
        ],
      },
      {
        subCategoryName: "Social Media Mgr",
        skills: [
          "Instagram",
          "Facebook",
          "LinkedIn",
          "Canva",
          "Content Strategy",
        ],
      },
      {
        subCategoryName: "Content Marketer",
        skills: ["Content Writing", "SEO", "Blogging", "Copywriting", "CMS"],
      },
      {
        subCategoryName: "Email Marketing",
        skills: [
          "Mailchimp",
          "Klaviyo",
          "Campaigns",
          "Automation",
          "Segmentation",
        ],
      },
      {
        subCategoryName: "Performance Mktg",
        skills: ["Meta Ads", "Google Ads", "Analytics", "Funnels", "CRO"],
      },
      {
        subCategoryName: "Affiliate Marketing",
        skills: [
          "Affiliate Networks",
          "Tracking",
          "SEO",
          "Content Marketing",
          "Analytics",
        ],
      },
      {
        subCategoryName: "CRO Specialist",
        skills: [
          "A/B Testing",
          "Heatmaps",
          "Analytics",
          "Funnels",
          "Optimization",
        ],
      },
      {
        subCategoryName: "Marketing Analytics",
        skills: ["GA4", "Looker Studio", "Power BI", "Data Analytics", "Excel"],
      },
    ],
  },

  {
    categoryName: "QA & Testing",
    subCategories: [
      {
        subCategoryName: "Manual QA",
        skills: [
          "Manual Testing",
          "Bug Tracking",
          "Test Cases",
          "Jira",
          "Regression Testing",
        ],
      },
      {
        subCategoryName: "Automation QA",
        skills: [
          "Selenium",
          "Cypress",
          "Playwright",
          "Automation",
          "JavaScript",
        ],
      },
      {
        subCategoryName: "Performance Testing",
        skills: [
          "JMeter",
          "K6",
          "Load Testing",
          "Performance",
          "Stress Testing",
        ],
      },
      {
        subCategoryName: "Mobile Testing",
        skills: [
          "Appium",
          "Android Testing",
          "iOS Testing",
          "Automation",
          "QA",
        ],
      },
      {
        subCategoryName: "API Testing",
        skills: ["Postman", "REST API", "GraphQL", "Automation", "Swagger"],
      },
      {
        subCategoryName: "QA Lead",
        skills: [
          "Leadership",
          "QA Strategy",
          "Automation",
          "Test Planning",
          "Agile",
        ],
      },
      {
        subCategoryName: "Test Analyst",
        skills: [
          "Test Cases",
          "Manual Testing",
          "Analysis",
          "Regression",
          "Documentation",
        ],
      },
      {
        subCategoryName: "Selenium / Cypress",
        skills: ["Selenium", "Cypress", "JavaScript", "Automation", "Testing"],
      },
      {
        subCategoryName: "UAT Coordinator",
        skills: [
          "UAT",
          "Stakeholder Management",
          "Testing",
          "Documentation",
          "Communication",
        ],
      },
    ],
  },

  {
    categoryName: "Database & Backend",
    subCategories: [
      {
        subCategoryName: "PostgreSQL Dev",
        skills: [
          "PostgreSQL",
          "SQL",
          "Database Design",
          "Optimization",
          "Indexing",
        ],
      },
      {
        subCategoryName: "MySQL Dev",
        skills: [
          "MySQL",
          "Stored Procedures",
          "Replication",
          "Optimization",
          "SQL",
        ],
      },
      {
        subCategoryName: "MongoDB Dev",
        skills: ["MongoDB", "NoSQL", "Aggregation", "Mongoose", "Node.js"],
      },
      {
        subCategoryName: "Redis Specialist",
        skills: ["Redis", "Caching", "Pub/Sub", "Performance", "Node.js"],
      },
      {
        subCategoryName: "DB Architect",
        skills: [
          "Data Modeling",
          "Architecture",
          "SQL",
          "Scalability",
          "Optimization",
        ],
      },
      {
        subCategoryName: "REST / GraphQL API",
        skills: ["REST API", "GraphQL", "Node.js", "Apollo", "Express.js"],
      },
      {
        subCategoryName: "Microservices Eng.",
        skills: ["Docker", "Kafka", "Microservices", "Node.js", "Kubernetes"],
      },
      {
        subCategoryName: "Kafka / RabbitMQ",
        skills: [
          "Kafka",
          "RabbitMQ",
          "Event Driven",
          "Messaging",
          "Distributed Systems",
        ],
      },
      {
        subCategoryName: "Firebase / Supabase",
        skills: [
          "Firebase",
          "Supabase",
          "Authentication",
          "Realtime DB",
          "Cloud Functions",
        ],
      },
    ],
  },

  {
    categoryName: "Networking & Infra",
    subCategories: [
      {
        subCategoryName: "Network Engineer",
        skills: ["Cisco", "Routing", "Switching", "TCP/IP", "Wireshark"],
      },
      {
        subCategoryName: "Network Architect",
        skills: [
          "Network Design",
          "Cisco",
          "Juniper",
          "Infrastructure",
          "Security",
        ],
      },
      {
        subCategoryName: "VoIP Engineer",
        skills: ["VoIP", "SIP", "Asterisk", "Networking", "PBX"],
      },
      {
        subCategoryName: "Wireless Specialist",
        skills: ["WiFi", "Cisco Wireless", "RF", "Networking", "Access Points"],
      },
      {
        subCategoryName: "Firewall / VPN",
        skills: ["Fortinet", "Palo Alto", "VPN", "Firewall", "Security"],
      },
      {
        subCategoryName: "IT Support L1/L2/L3",
        skills: [
          "Windows",
          "Linux",
          "Troubleshooting",
          "Helpdesk",
          "Networking",
        ],
      },
      {
        subCategoryName: "IT Infra Manager",
        skills: [
          "Infrastructure",
          "Servers",
          "Networking",
          "Cloud",
          "Management",
        ],
      },
      {
        subCategoryName: "Helpdesk Tech",
        skills: [
          "Ticketing",
          "Support",
          "Windows",
          "Troubleshooting",
          "Active Directory",
        ],
      },
    ],
  },

  {
    categoryName: "Product & PM",
    subCategories: [
      {
        subCategoryName: "Product Manager",
        skills: [
          "Roadmaps",
          "Agile",
          "Jira",
          "Stakeholder Management",
          "Analytics",
        ],
      },
      {
        subCategoryName: "Technical PM",
        skills: [
          "Technical Planning",
          "Agile",
          "Scrum",
          "Jira",
          "Architecture",
        ],
      },
      {
        subCategoryName: "Scrum Master",
        skills: [
          "Scrum",
          "Agile",
          "Sprint Planning",
          "Jira",
          "Team Management",
        ],
      },
      {
        subCategoryName: "Agile Coach",
        skills: ["Agile", "Scrum", "Kanban", "Coaching", "Leadership"],
      },
      {
        subCategoryName: "Business Analyst",
        skills: [
          "Requirements Gathering",
          "Documentation",
          "SQL",
          "Jira",
          "Analysis",
        ],
      },
      {
        subCategoryName: "IT Consultant",
        skills: [
          "Consulting",
          "IT Strategy",
          "Cloud",
          "Architecture",
          "Business",
        ],
      },
      {
        subCategoryName: "Program Manager",
        skills: [
          "Leadership",
          "Planning",
          "Roadmaps",
          "Communication",
          "Agile",
        ],
      },
      {
        subCategoryName: "Release Manager",
        skills: ["Release Planning", "CI/CD", "Jira", "DevOps", "Coordination"],
      },
    ],
  },

  {
    categoryName: "Blockchain & Web3",
    subCategories: [
      {
        subCategoryName: "Solidity Dev",
        skills: [
          "Solidity",
          "Smart Contracts",
          "Ethereum",
          "Hardhat",
          "Web3.js",
        ],
      },
      {
        subCategoryName: "Blockchain Architect",
        skills: [
          "Blockchain",
          "Ethereum",
          "Architecture",
          "Security",
          "Solidity",
        ],
      },
      {
        subCategoryName: "DeFi Developer",
        skills: ["DeFi", "Smart Contracts", "Solidity", "Chainlink", "Web3"],
      },
      {
        subCategoryName: "NFT Dev",
        skills: ["NFT", "IPFS", "Solidity", "OpenZeppelin", "Ethereum"],
      },
      {
        subCategoryName: "Web3 Frontend",
        skills: ["React", "Ethers.js", "Web3.js", "MetaMask", "Next.js"],
      },
      {
        subCategoryName: "Smart Contract Auditor",
        skills: ["Auditing", "Solidity", "Security", "Slither", "MythX"],
      },
      {
        subCategoryName: "Layer 2 Engineer",
        skills: ["Polygon", "Optimism", "zkSync", "Ethereum", "Scaling"],
      },
      {
        subCategoryName: "Metaverse Dev",
        skills: ["Unity", "Web3", "VR", "Blockchain", "3D"],
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
