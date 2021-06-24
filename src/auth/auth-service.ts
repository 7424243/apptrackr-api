import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {JWT_SECRET} from '../config'

const AuthService = {
    getUserWithUsername(db, user_name) {
        return db('apptrackr_users')
            .where({user_name})
            .first()
    },
    comparePasswords(password, hash) {
        return bcrypt.compare(password, hash)
    },
    createJwt(subject, payload) {
        return jwt.sign(payload, JWT_SECRET, {
            subject,
            algorithm: 'HS256'
        })
    },
    verifyJwt(token) {
        return jwt.verify(token, JWT_SECRET, {
            algorithms: ['HS256']
        })
    }
}

export default AuthService