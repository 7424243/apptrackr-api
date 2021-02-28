const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

function hashUserPassword(users) {
    const protectedUsers = users.map(user => ({
        ...user,
        password: bcrypt.hashSync(user.password, 1)
    }))
    return protectedUsers
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({user_id: user.id}, secret, {
        subject: user.user_name,
        algorithm: 'HS256'
    })
    return `Bearer ${token}`
}

module.exports = {
    hashUserPassword,
    makeAuthHeader
}