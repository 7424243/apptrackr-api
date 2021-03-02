const knex = require('knex')
const app = require('../src/app')
const {makeUsersArray, makeMaliciousUser} = require('./users.fixtures')
const bcrypt = require('bcryptjs')

describe('Users Endpoints', () => {

    const testUsers = makeUsersArray()

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
    
    describe('POST /api/users', () => {
        
        //happy path
        it('create a user and responds 201 and the new user', () => {
            const newUser = {
                full_name: 'Test fullname',
                user_name: 'Test username',
                password: 'Testing123!'
            }
            return supertest(app)
                .post('/api/users')
                .send(newUser)
                .expect(201)
                .expect(res => {
                    expect(res.body.full_name).to.eql(newUser.full_name)
                    expect(res.body.user_name).to.eql(newUser.user_name)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/users/${res.body.id}`)
                    const expected = new Date().toLocaleString()
                    const actual = new Date(res.body.date_created).toLocaleString()
                    expect(actual).to.eql(expected)
                })
                .expect(res => 
                    db  
                        .from('apptrackr_users')
                        .select('*')
                        .where({id: res.body.id})
                        .first()
                        .then(row => {
                            expect(row.full_name).to.eql(newUser.full_name)
                            expect(row.user_name).to.eql(newUser.user_name)
                            const expected = new Date().toLocaleString()
                            const actual = new Date(row.date_created).toLocaleString()
                            expect(actual).to.eql(expected)
                            return bcrypt.compare(newUser.password, row.password)
                        })  
                        .then(compareMatch => {
                            expect(compareMatch).to.be.true
                        })  
                )
        })

        it('removes XSS attack content from response', () => {
            const {maliciousUser, expectedUser} = makeMaliciousUser()
            return supertest(app)
                .post('/api/users')
                .send(maliciousUser)
                .expect(201)
                .expect(res => {
                    expect(res.body.full_name).to.eql(expectedUser.full_name)
                })
        })

        context('validation for required fields, password complexity, and user_name uniqueness', () => {

            beforeEach('insert users', () => {
                return db
                    .into('apptrackr_users')
                    .insert(testUsers)
            })

            it(`responds 400 and an error message when the 'full_name' is missing`, () => {
                const newUserNoFullName = {
                    user_name: 'Test username',
                    password: 'Testing123!'
                }
                return supertest(app)
                    .post('/api/users/')
                    .send(newUserNoFullName)
                    .expect(400, {
                        error: {message: `Missing 'full_name' in request body`}
                    })
            })

            it(`responds with 400 and an error message when the 'user_name' is missing`, () => {
                const newUserNoUserName = {
                    full_name: 'Test fullname',
                    password: 'Testing123!',
                }
                return supertest(app)
                    .post('/api/users/')
                    .send(newUserNoUserName)
                    .expect(400, {
                        error: {message: `Missing 'user_name' in request body`}
                    })
            })

            it(`responds with 400 and an error message when the 'password' is missing`, () => {
                const newUserNoPassword = {
                    full_name: 'Test fullname',
                    user_name: 'Test username'
                }
                return supertest(app)
                    .post('/api/users/')
                    .send(newUserNoPassword)
                    .expect(400, {
                        error: {message: `Missing 'password' in request body`}
                    })
            })

            it(`responds with 400 'Password must be longer than 8 characters'`, () => {
                const newUserShortPassword = {
                    full_name: 'Test fullname',
                    user_name: 'Test username',
                    password: '1234567'
                }
                return supertest(app)
                    .post('/api/users/')
                    .send(newUserShortPassword)
                    .expect(400, {
                        error: {message: `Password must be longer than 8 characters`}
                    })
            })

            it(`responds with 400 'Password must be less than 72 characters'`, () => {
                const newUserLongPassword = {
                    full_name: 'Test fullname',
                    user_name: 'Test username',
                    password: '*'.repeat(73)
                }
                return supertest(app)
                    .post('/api/users/')
                    .send(newUserLongPassword)
                    .expect(400, {
                        error: {message: `Password must be less than 72 characters`}
                    })
            })

            it(`responds with 400 when password starts with spaces`, () => {
                const newUserPasswordStartsSpaces = {
                    full_name: 'Test fullname',
                    user_name: 'Test username',
                    password: ' 1234567'
                }
                return supertest(app)
                    .post('/api/users/')
                    .send(newUserPasswordStartsSpaces)
                    .expect(400, {
                        error: {message: `Password must not start or end with empty spaces`}
                    })
            })

            it(`responds with 400 when password ends with spaces`, () => {
                const newUserPasswordEndsSpaces = {
                    full_name: 'Test fullname',
                    user_name: 'Test username',
                    password: '1234567 '
                }
                return supertest(app)
                    .post('/api/users/')
                    .send(newUserPasswordEndsSpaces)
                    .expect(400, {
                        error: {message: `Password must not start or end with empty spaces`}
                    })
            })

            it(`responds with 400 when password isn't complex enough`, () => {
                const newUserPasswordNotComplex = {
                    full_name: 'Test fullname',
                    user_name: 'Test username',
                    password: 'passwords'
                }
                return supertest(app)
                    .post('/api/users/')
                    .send(newUserPasswordNotComplex)
                    .expect(400, {
                        error: {message: `Password must contain at least 1 upper case, 1 lower case, 1 number and 1 special character`}
                    })
            })

            it(`responds with 400 when the user_name already exists`, () => {
                const newDuplicateUserName = {
                    full_name: 'Test fullname',
                    user_name: testUsers[0].user_name,
                    password: 'Testing1234!'
                }
                return supertest(app)
                    .post('/api/users/')
                    .send(newDuplicateUserName)
                    .expect(400, {
                        error: {message: 'Username already exists'}
                    })
            })
        })
    })
})