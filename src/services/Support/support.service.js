const { contains } = require("validator");
const prisma = require("../../config/database");

exports.fetcheSupportById = async (supportId) => {
  return await prisma.support.findUnique({
    where: {
      id: supportId,
    },
  });
};

exports.createSupport = async (data, attachment) => {
  let {
    email,
    fullName,
    companyId,
    ticketType,
    phoneNumber,
    countryCode,
    subject,
    message,
  } = data || {};

  const support = await prisma.support.create({
    data: {
      email: email,
      fullName: fullName,
      companyId: companyId,
      phoneNumber: phoneNumber,
      countryCode: countryCode,
      ticketType: ticketType,
      subject: subject,
      message: message,
      attachment: attachment,
    },
  });
  await prisma.supportMessages.create({
    data: {
      supportId: support.id,
      message: message,
      attachment: attachment,
    },
  });
  return support;
};

exports.getAllCompanySupport = async (companyId, search = "",selectedDate) => {
  
  const supports = await prisma.support.findMany({
    where: {
      companyId,
      ...(search
        ? {
            OR: [
              {
                subject: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                ticketType: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      ...(selectedDate
        ? {
            createdAt: {
              gte: new Date(selectedDate),
              lte: new Date(selectedDate),
            },
          }
        : {}),
    },
    select: {
      id: true,
      companyId: true,
      subject: true,
      ticketType: true,
      status: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      countryCode: true,
      isRepliedByAdmin: true,
      message: true,
      attachment: true,
      createdAt: true,
      updatedAt: true,
      support_messages: {
        select: {
          id: true,
          message: true,
          createAt: true,
          isRepliedByAdmin: true,
          attachment: true,
        },
        orderBy: {
          createAt: "desc",
        },
        take: 1,
      },
    },
  });

  supports.sort((a, b) => {
    const aDate = a.support_messages[0]?.createAt
      ? new Date(a.support_messages[0].createAt)
      : new Date(a.createdAt);
    const bDate = b.support_messages[0]?.createAt
      ? new Date(b.support_messages[0].createAt)
      : new Date(b.createdAt);
    return bDate - aDate;
  });

  return supports;
};

exports.getAllCompanySupportForAdmin = async (search = "",selectedDate) => {
  
  const supports = await prisma.support.findMany({
    where: {
      OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
      ...(selectedDate
       ? {
            createdAt: {
              gte: new Date(selectedDate),
              lte: new Date(selectedDate),
            },
          }
        : {}),
    },
    select: {
      companyId: true,
      countryCode: true,
      createdAt: true,
      email: true,
      fullName: true,
      id: true,
      isRepliedByAdmin: true,
      message: true,
      phoneNumber: true,
      attachment: true,
      ticketType: true,
      status: true,
      subject: true,
      company: {
        select: {
          companyName: true,
          logo: true,
        },
      },
      support_messages: {
        select: {
          id: true,
          message: true,
          createAt: true,
          isRepliedByAdmin: true,
          attachment: true,
        },
        orderBy: {
          createAt: "desc",
        },
        take: 1,
      },
    },
  });

  supports.sort((a, b) => {
    const aDate = a.support_messages[0]?.createAt
      ? new Date(a.support_messages[0].createAt)
      : new Date(a.createdAt);
    const bDate = b.support_messages[0]?.createAt
      ? new Date(b.support_messages[0].createAt)
      : new Date(b.createdAt);
    return bDate - aDate;
  });

  return supports;
};

exports.getAllCompanySupportMessages = async (supportId) => {
  const supportMessages = await prisma.supportMessages.findMany({
    where: {
      supportId: supportId,
    },
  });
  const customer_support = await prisma.support.findUnique({
    where: {
      id: supportId,
    },
  });
  return { supportMessages, customer_support };
};

exports.addMessageToSupport = async (
  supportId,
  message,
  isRepliedByAdmin,
  attachment
) => {
  return await prisma.supportMessages.create({
    data: {
      message: message,
      supportId: supportId,
      isRepliedByAdmin: isRepliedByAdmin,
      attachment: attachment,
    },
  });
};

exports.closeSupport = async (supportId) => {
  return await prisma.support.update({
    where: {
      id: supportId,
    },
    data: {
      status: "CLOSED",
    },
  });
};
