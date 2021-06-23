require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const {NODE_ENV} = require('./config')
const authRouter = require('./auth/auth-router')
const usersRouter = require('./users/users-router')
const applicationsRouter = require('./applications/applications-router')
const resourcesRouter = require('./resources/resources-router')


export const app = express()

const morganOption = (NODE_ENV === 'production') ? 'tiny' : 'common'

app.use(morgan(morganOption))
app.use(helmet())

//allow CORS for dynamic origins
const whitelist = ['http://localhost:3000', 'https://apptrackr-client.vercel.app']
const corsOptions = {
    origin: function(origin, callback) {
        let originWhitelisted = whitelist.indexOf(origin) !== -1
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
        console.error(error)
        response = {message: error.message, error}
    }
    res.status(500).json(response)
})