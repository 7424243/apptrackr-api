import dotenv from 'dotenv-safe'
dotenv.config()
import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import helmet from 'helmet'
import {NODE_ENV} from './config'
import authRouter from './auth/auth-router'
import usersRouter from './users/users-router'
import applicationsRouter from './applications/applications-router'
import resourcesRouter from './resources/resources-router'


export const app = express()

const morganOption = (NODE_ENV === 'production') ? 'tiny' : 'common'

app.use(morgan(morganOption))
app.use(helmet())

// allow CORS for dynamic origins
const whitelist = ['http://localhost:3000', 'https://apptrackr-client.vercel.app']
const corsOptions = {
    origin(origin, callback) {
        const originWhitelisted = whitelist.indexOf(origin) !== -1
        callback(null, originWhitelisted)
    }
}
app.use(cors(corsOptions))

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/applications', applicationsRouter)
app.use('/api/resources', resourcesRouter)

app.use(function errorHandler(error, req, res, next) {
    let response
    if(NODE_ENV === 'production') {
        response={error: {message: 'server error'}}
    } else {
        // tslint:disable-next-line:no-console
        console.error(error)
        response = {message: error.message, error}
    }
    res.status(500).json(response)
})