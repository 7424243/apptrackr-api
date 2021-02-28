require('dotenv').config()
process.env.JWT_SECRET = 'test-jwt-secret'

const expect = require('chai').expect
const supertest = require('supertest')

global.expect = expect
global.supertest = supertest