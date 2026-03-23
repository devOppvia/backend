const prisma = require("../src/config/database")

async function deleteScheduledInterview(){
    try {
        await prisma.interview.deleteMany()
    } catch (error) {
        console.error(error);
        
    }
}

deleteScheduledInterview()