const bcrypt = require('bcryptjs')

const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/

const UsersService = {
    insertUser(knex, newUser) {
        return knex
            .insert(newUser)
            .into('apptrackr_users')
            .returning('*')
            .then(([user]) => user)
    },
    hashPassword(password) {
        return bcrypt.hash(password, 12)
    },
    hasUserWithUserName(knex, user_name) {
        return knex('apptrackr_users')
            .where({user_name})
            .first()
            .then(user => !!user)
    },
    validatePassword(password) {
        if(password.length < 8) {
            return 'Password must be longer than 8 characters'
        }
        if(password.length > 72) {
            return 'Password must be less than 72 characters'
        }
        if(password.startsWith(' ') || password.endsWith(' ')) {
            return 'Password must not start or end with empty spaces'
        }
        if(!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password)) {
            return 'Password must contain at least 1 upper case, 1 lower case, 1 number and 1 special character'
        }
        return null
    }
}

module.exports = UsersService