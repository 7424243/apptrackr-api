const express = require('express')
const xss = require('xss')
const UsersService = require('./users-service')
const path = require('path')

const usersRouter = express.Router()
const jsonParser = express.json()

const serializeUser = user => ({
    id: user.id,
    full_name: xss(user.full_name),
    user_name: xss(user.user_name),
    password: xss(user.password),
    date_created: new Date(user.date_created)
})

usersRouter
    .route('/')
    .post(jsonParser, (req, res, next) => {
        const {full_name, user_name, password} = req.body
        const newUser = {full_name, user_name, password}
        //required fields: full_name, user_name, password
        for(const [key, value] of Object.entries(newUser))
            if(value == null) {
                return res.status(400).json({
                    error: {message: `Missing '${key}' in request body`}
                })
            }
        //validate password
        const passwordError = UsersService.validatePassword(password)
        if(passwordError) {
            return res.status(400).json({
                error: {message: passwordError}
            })
        }
        const knexInstance = req.app.get('db')
        UsersService.hasUserWithUserName(knexInstance, user_name)
            .then(hasUserWithUserName => {
                if(hasUserWithUserName) {
                    return res.status(400).json({
                        error: {message: `Username already exists`}
                    })
                }
                return UsersService.hashPassword(password)
                    .then(hashedPassword => {
                        const newUser = {
                            full_name,
                            user_name,
                            password: hashedPassword,
                            date_created: 'now()'
                        }
                        return UsersService.insertUser(knexInstance, newUser)
                            .then(user => {
                                res 
                                    .status(201)
                                    .location(path.posix.join(req.originalUrl, `/${user.id}`))
                                    .json(serializeUser(user))
                            })
                    })
            })
            .catch(next)
    })

    module.exports = usersRouter