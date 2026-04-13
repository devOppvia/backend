const prisma = require("../src/config/database");

async function seedAIInterviewData() {
  console.log("🌱 Starting AI Interview seeding...");

  try {
    // 1. Seed Intern Subscription Plans
    console.log("📦 Seeding Subscription Plans...");
    const plans = [
      {
        planName: "Basic Starter",
        description: "Perfect for students getting started",
        price: 499,
        discountedPrice: 199,
        interviewCredits: 2,
        duration: 30,
        features: ["2 AI Interviews", "Basic Behavioral Feedback", "PDF Report", "Email Support"],
        isPopular: false,
      },
      {
        planName: "Pro Ready",
        description: "Most popular for intensive preparation",
        price: 1499,
        discountedPrice: 599,
        interviewCredits: 8,
        duration: 60,
        features: ["8 AI Interviews", "Behavioral & Technical Insights", "Detailed Expression Analysis", "Priority Support", "Interview History"],
        isPopular: true,
      },
      {
        planName: "Elite Performance",
        description: "Complete mastery for top-tier companies",
        price: 2999,
        discountedPrice: 1299,
        interviewCredits: 20,
        duration: 90,
        features: ["20 AI Interviews", "Full Behavioral & Technical Mastery", "Mock Interviews for 10+ Niches", "Expert AI Insights", "Lifetime Record Access"],
        isPopular: false,
      },
    ];

    for (const plan of plans) {
      const existing = await prisma.internSubscriptionPlan.findFirst({
        where: { planName: plan.planName }
      });
      if (!existing) {
        await prisma.internSubscriptionPlan.create({ data: plan });
      }
    }
    console.log("✅ Subscription Plans seeded.");

    // 2. Try to find the first intern to seed mock interviews for
    const intern = await prisma.interns.findFirst();
    if (intern) {
      console.log(`👤 Found intern: ${intern.fullName}. Seeding mock interviews...`);

      // Mock Subscription
      const plan = await prisma.internSubscriptionPlan.findFirst();
      await prisma.internSubscription.create({
        data: {
          internId: intern.id,
          planId: plan.id,
          interviewCreditsTotal: plan.interviewCredits,
          interviewCreditsRemaining: plan.interviewCredits - 2,
          subscriptionStart: new Date(),
          subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          amountPaid: plan.discountedPrice,
        }
      });

      // Mock Completed Interviews
      const mockInterviews = [
        {
          internId: intern.id,
          type: "PRACTICE",
          duration: 15,
          resumeSnapshot: "Sample resume text for AI context...",
          interviewerPreference: "MALE",
          interviewCategory: "MIXED",
          status: "COMPLETED",
          overallScore: 85,
          avgAnswerScore: 8.5,
          confidenceScore: 92,
          dominantEmotion: "CONFIDENT",
          behaviorSummary: { confident: 80, nervous: 10, neutral: 10, confused: 0 },
          topSkill: "React.js",
          durationActual: 18,
          aiInsights: ["Great technical depth", "Improve eye contact", "Structure answer better"],
        },
        {
          internId: intern.id,
          type: "PRACTICE",
          duration: 30,
          resumeSnapshot: "Sample resume text for UI/UX candidate...",
          interviewerPreference: "FEMALE",
          interviewCategory: "BEHAVIORAL",
          status: "COMPLETED",
          overallScore: 72,
          avgAnswerScore: 7.2,
          confidenceScore: 78,
          dominantEmotion: "NEUTRAL",
          behaviorSummary: { confident: 50, nervous: 20, neutral: 30, confused: 0 },
          topSkill: "Figma",
          durationActual: 22,
          aiInsights: ["Strong visual examples", "Simplify explanations", "Speak with more energy"],
        }
      ];

      for (const interviewData of mockInterviews) {
        const interview = await prisma.aIInterview.create({
          data: interviewData
        });

        // Seed some mock questions for these interviews
        await prisma.aIInterviewQuestion.createMany({
          data: [
            {
              aiInterviewId: interview.id,
              questionNumber: 1,
              questionText: "Tell me about your most challenging project.",
              answerText: "I built a real-time chat app using socket.io which was difficult at first...",
              answerScore: 8,
              starUsed: true,
              skillTested: "Technical Knowledge",
              aiFeedback: "Good structure, mention specific scaling challenges next time.",
            },
            {
              aiInterviewId: interview.id,
              questionNumber: 2,
              questionText: "How do you handle conflict in a team?",
              answerText: "I usually listen to both sides and try to find a common ground...",
              answerScore: 9,
              starUsed: false,
              skillTested: "Behavioral",
              aiFeedback: "Excellent diplomatic approach.",
            }
          ]
        });
      }
      console.log("✅ Mock Interview data seeded.");
    } else {
      console.log("⚠️ No intern found in database. Skipping mock interview seeding. Only plans seeded.");
    }

    console.log("✨ Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAIInterviewData();
