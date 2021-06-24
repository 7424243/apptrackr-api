import express from 'express'
import AuthService from './auth-service'

const authRouter = express.Router()
const jsonParser = express.json()

authRouter
    .post('/login', jsonParser, (req, res, next) => {
        const {user_name, password} = req.body
        const loginUser = {user_name, password}
        for(const [key, value] of Object.entries(loginUser))
            if(value == null) {
                return res.status(400).json({
                    error: `Missing '${key}' in request body`
                })
            }
        const knexInstance = req.app.get('db')
        AuthService.getUserWithUsername(knexInstance, loginUser.user_name)
            .then(dbUser => {
                if(!dbUser) {
                    return res.status(400).json({
                        error: 'Incorrect username or password'
                    })
                }
                return AuthService.comparePasswords(loginUser.password, dbUser.password)
                    .then(compareMatch => {
                        if(!compareMatch) {
                            return res.status(400).json({
                                error: 'Incorrect username or password'
                            })
                        }
                        const subject = dbUser.user_name
                        const payload = {user_id: dbUser.id}
                        res.send({
                            authToken: AuthService.createJwt(subject, payload)
                        })
                    })
            })
            .catch(next)
    })

export default authRouter