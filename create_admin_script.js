const prisma = require("./src/config/database");
const bcrypt = require("bcrypt");

const createAdmin = async () => {
    const args = process.argv.slice(2);

    if (args.length !== 3) {
        console.log("Usage: node create_admin_script.js <email> <username> <password>");
        process.exit(1);
    }

    const [email, username, password] = args;

    try {
        console.log(`Checking if admin exists for email: ${email} or username: ${username}...`);

        const existingAdmin = await prisma.admin.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: username }
                ]
            }
        });

        if (existingAdmin) {
            console.error("Error: Admin with this email or username already exists.");
            process.exit(1);
        }

        console.log("Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log("Creating admin...");
        const newAdmin = await prisma.admin.create({
            data: {
                email,
                username,
                password: hashedPassword,
            },
        });

        console.log("Admin created successfully!");
        console.log("ID:", newAdmin.id);
        console.log("Email:", newAdmin.email);
        console.log("Username:", newAdmin.username);
    } catch (error) {
        console.error("Error creating admin:", error);
    } finally {
        await prisma.$disconnect();
    }
};

createAdmin();
