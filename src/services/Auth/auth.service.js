const prisma = require("../../config/database")

exports.getAdminByEmail = async (email)=>{
    return await prisma.admin.findUnique({
        where : {
            email : email
        }
    })
}

exports.getAdminByUsername = async (username)=>{
    return await prisma.admin.findUnique({
        where : {
            username : username
        }
    })
}

exports.getAdminById = async (id)=>{
    return await prisma.admin.findUnique({
        where : {
            id : id
        }
    })
}

exports.getAdminByEmailAndNotId = async (email,id)=>{
    return await prisma.admin.findUnique({
        where : {
            email : email,
            NOT : {
                id : id
            }
        }
    })
}

exports.getAdminByUsernameAndNotId = async (username,id)=>{
    return await prisma.admin.findUnique({
        where : {
            username : username,
            NOT : {
                id : id
            }
        }
    })
}

exports.createAdmin = async (email,username,password)=>{
    return await prisma.admin.create({
        data : {
            email : email,
            username : username,
            password : password
        }
    })
}

exports.getAdmins = async ()=>{
    return await prisma.admin.findMany({
        orderBy : {
            createdAt : "desc"
        },
        select : {
            id : true,
            email : true,
            username : true,
            password : true,
            createdAt : true
        }
    })
}

exports.updateAdmin = async (id,email,username,password)=>{
    return await prisma.admin.update({
        where : {
            id : id
        },
        data : {
            email : email,
            username : username,
            password : password
        }
    })
}

exports.deleteAdmin = async (id)=>{
    return await prisma.admin.delete({
        where : {
            id : id
        }
    })
}

exports.adminPanelLogin = async (email)=>{
    return await prisma.admin.findUnique({
        where : {
            email : email
        }
    })
}

exports.getChangeAdminPassword = async (email)=>{
    return await prisma.admin.findUnique({
        where : {
            email : email
        }
    })
}

exports.changeAdminPassword = async (email, newPassword)=>{
    return await prisma.admin.update({
        where : {
            email : email
        },
        data : {
            password : newPassword
        }
    })
}

exports.getCompanyDetailsBasedOnId = async (id)=>{
    return await prisma.company.findFirst({
        where : {
            id : id
        }
    })
}