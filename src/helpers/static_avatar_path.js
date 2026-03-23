function getAvatarPath(gender){
    if(gender == "MALE"){
        return "male_user.png"
    }else{
        return "woman-avatar.png"
    }
}

module.exports = getAvatarPath