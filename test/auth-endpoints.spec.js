const knex = require('knex')
const app = require('../src/app')
const {hashUserPassword} = require('./test-helpers')
const {makeUsersArray} = require('./users.fixtures')
const jwt = require('jsonwebtoken')
const supertest = require('supertest')

describe('Auth Endpoints', () => {

    const testUsers = makeUsersArray()
    const testUser = testUsers[0]
    const protectedUsers = hashUserPassword(testUsers)

    let db
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db.raw('TRUNCATE apptrackr_users RESTART IDENTITY CASCADE'))

    afterEach('cleanup', () => db.raw('TRUNCATE apptrackr_users RESTART IDENTITY CASCADE'))

    describe('POST /api/auth/login', () => {
        
        beforeEach('insert users', () => {
            return db   
                .into('apptrackr_users')
                .insert(protectedUsers)
        })

        //testing for required fields
        const requiredFields = ['user_name', 'password']
        requiredFields.forEach(field => {
            const loginAttemptBody = {
                user_name: testUser.user_name,
                password: testUser.password
            }
            it(`responds with 400 required error when '${field}' is missing`, () => {
                delete loginAttemptBody[field]
                return supertest(app)
                    .post('/api/auth/login')
                    .send(loginAttemptBody)
                    .expect(400, {
                        error: `Missing '${field}' in request body`
                    })
            })
        })

        it(`responds 400 'invalid user_name or password' when bad user_name`, () => {
            const userInvalidUsername = {user_name: 'user-not', password: testUser.password}
            return supertest(app)
                .post('/api/auth/login')
                .send(userInvalidUsername)
                .expect(400, {
                    error: `Incorrect username or password`
                })
        })

        it(`responds 400 'invalid user_name or password' when bad password`, () => {
            const userInvalidPassword = {user_name: testUser.user_name, password: 'wrong'}
            return supertest(app)
                .post('/api/auth/login')
                .send(userInvalidPassword)
                .expect(400, {
                    error: `Incorrect username or password`
                })
        })

        it('responds 200 and JWT auth token using secret when valid credentials', () => {
            const userValidCreds = {user_name: testUser.user_name, password: testUser.password}
            const expectedToken = jwt.sign(
                {user_id: testUser.id},
                process.env.JWT_SECRET, {
                    subject: testUser.user_name,
                    algorithm: 'HS256'
                }
            )
            return supertest(app)
                .post('/api/auth/login')
                .send(userValidCreds)
                .expect(200, {
                    authToken: expectedToken
                })
        })
    })
})