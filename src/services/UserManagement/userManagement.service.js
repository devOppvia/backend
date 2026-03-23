const prisma = require("../../config/database");

exports.getStudentById = async (id) => {
  return await prisma.student.findUnique({
    where: {
      id: id,
    },
  });
};

exports.studentRegistration = async (
  name,
  age,
  location,
  college,
  course,
  yearOfStudy,
  skills,
  interests,
  interesetedIn,
  resume
) => {
  return await prisma.student.create({
    data: {
      name: name,
      age: age,
      location: location,
      college: college,
      course: course,
      yearOfStudy: yearOfStudy,
      resume: resume,
      skills: skills,
      interests: interests,
      interesetedIn: interesetedIn,
      studentStatus: "PENDING",
    },
  });
};

exports.getAllStudentsByStatus = async (status) => {
  let whereClouse = {
    isDelete : false
  };
  if (status) {
    whereClouse.studentStatus = status
  }
  
  
  return await prisma.student.findMany({
    where: whereClouse,
    orderBy : {
        createdAt : "desc"
    },
    select : {
        id : true,
        name : true,
        age : true,
        location : true,
        college : true,
        course : true,
        yearOfStudy : true,
        resume : true,
        skills : true,
        interests : true,
        interesetedIn : true,
        studentStatus : true,
        createdAt : true
    }
  });
};

exports.updateStudentStatus = async (id, status)=>{
    return await prisma.student.update({
        where : {
            id : id
        },
        data : {
            studentStatus : status
        }
    })
}

exports.deleteStudentDetails = async (id)=>{
    return await prisma.student.update({
        where : {
            id : id
        },
        data : {
            isDelete : true
        }
    })
}