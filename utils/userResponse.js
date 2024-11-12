exports.userRes = (userInfo)=>({
        _id: userInfo._id,
        name: userInfo.name,
        email: userInfo.email,
    })