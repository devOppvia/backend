const prisma = require("../../config/database")


exports.getCountries = async ()=>{
    return await prisma.country.findMany({
        orderBy : {
            name : "asc"
        }
    })
}

exports.getStatesByCountry = async (countryCode)=>{
    return await prisma.state.findMany({
        where : {
            countryId : countryCode.toUpperCase()
        },
        select : {
            id : true,
            name : true,
            iso2 : true
        },
        orderBy : {
            name : "asc"
        }
    })
}

exports.getCitiesByState = async (countryCode, stateCode) =>{

    const Code = await prisma.state.findUnique({
        where : {
            id : stateCode
        }
    })
    return await prisma.city.findMany({
        where : {
            stateId : Code.iso2.toUpperCase(),
            countryId : countryCode.toUpperCase()
        },
        select : {
            id : true,
            name : true
        },
        orderBy : {
            name : "asc"
        }
    })
}


exports.getPreferredLocation = async (countryCode, stateCode) => {
    const state = await prisma.state.findMany({
        where : {
            id : {
                in : stateCode
            }
        }
    }).then((res)=>{
        return res.map((item)=>item.iso2)
    })

    
    return await prisma.city.findMany( {
        where : {
            stateId : {
                in : state
            },
            countryId : countryCode.toUpperCase()
        },
        select : {
            id : true,
            name : true
        },
        orderBy : {
            name : "asc"
        }
    })
}