import express from 'express'
import xss from 'xss'
import UsersService from './users-service'
import path from 'path'

const usersRouter = express.Router()
const jsonParser = express.json()

interface IUser {
    id: number,
    full_name: string,
    user_name: string,
    password: string,
    date_created: Date,
}

const serializeUser = (user): IUser => ({
    id: user.id,
    full_name: xss(user.full_name),
    user_name: xss(user.user_name),
    password: xss(user.password),
    date_created: new Date(user.date_created)
})

usersRouter
    .route('/')
    .post(jsonParser, (req, res, next) => {
        const {full_name, user_name, password, id, date_created} = req.body
        const newUser: IUser = {full_name, user_name, password, id, date_created}
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
                //violates UNIQUE constraint on user_name
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

export default usersRouter