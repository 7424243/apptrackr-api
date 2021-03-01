const app = require('../src/app')
const knex = require('knex')
const {makeResourcesArray, makeMaliciousResource} = require('./resources.fixtures')
const {makeUsersArray} = require('./users.fixtures')
const {hashUserPassword, makeAuthHeader} = require('./test-helpers')
const supertest = require('supertest')
const { expect } = require('chai')

describe.only('Resources Endpoints', () => {

    const testUsers = makeUsersArray()
    const testResources = makeResourcesArray()
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

    before('clean the tables', () => db.raw('TRUNCATE apptrackr_users, apptrackr_resources RESTART IDENTITY CASCADE'))

    afterEach('cleanup', () => db.raw('TRUNCATE apptrackr_users, apptrackr_resources RESTART IDENTITY CASCADE'))

    describe('POST /api/resources', () => {

        beforeEach('insert users', () => {
            return db
                .into('apptrackr_users')
                .insert(protectedUsers)
        })

        it('creates a new resource and responds with 201 and the new resource', () => {
            const newResource = {
                resource_name: 'new resource',
                resource_url: 'https://newresource.com',
                type: 'Other Resource',
                notes: 'notes',
                user_id: 1
            }
            return supertest(app)
                .post('/api/resources/')
                .set('Authorization', makeAuthHeader(testUsers[0]))
                .send(newResource)
                .expect(201)
                .expect(res => {
                    expect(res.body.resource_name).to.eql(newResource.resource_name)
                    expect(res.body.resource_url).to.eql(newResource.resource_url)
                    expect(res.body.type).to.eql(newResource.type)
                    expect(res.body.notes).to.eql(newResource.notes)
                    expect(res.body.user_id).to.eql(newResource.user_id)
                    expect(res.body).to.have.property('id')
                    expect(res.header.location).to.eql(`/api/resources/${res.body.id}`)
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/api/resources/${postRes.body.id}`)
                        .expect(postRes.body)
                })
        })

        it(`responds with 400 and an error message when the resource_name is missing`, () => {
            const newResourceNoName = {
                resource_url: 'https://newresource.com',
                type: 'Other Resource',
                notes: 'notes',
                user_id: 1
            }
            return supertest(app)
                .post('/api/resources/')
                .set('Authorization', makeAuthHeader(testUsers[0]))
                .send(newResourceNoName)
                .expect(400, {
                    error: {message: `Missing 'resource_name' in request body`}
                })
        })

        it(`responds with 400 and an error message when the resource_url is missing`, () => {
            const newResourceNoUrl = {
                resource_name: 'new resource',
                type: 'Other Resource',
                notes: 'notes',
                user_id: 1
            }
            return supertest(app)
                .post('/api/resources/')
                .set('Authorization', makeAuthHeader(testUsers[0]))
                .send(newResourceNoUrl)
                .expect(400, {
                    error: {message: `Missing 'resource_url' in request body`}
                })
        })

        it(`responds with 400 and an error message when the type is missing`, () => {
            const newResourceNoType = {
                resource_name: 'new resource',
                resource_url: 'https://newresource.com',
                notes: 'notes',
                user_id: 1
            }
            return supertest(app)
                .post('/api/resources/')
                .set('Authorization', makeAuthHeader(testUsers[0]))
                .send(newResourceNoType)
                .expect(400, {
                    error: {message: `Missing 'type' in request body`}
                })
        })

        it(`responds with 400 and an error message when the user_id is missing`, () => {
            const newResourceNoUserId = {
                resource_name: 'new resource',
                resource_url: 'https://newresource.com',
                type: 'Other Resource',
                notes: 'notes'
            }
            return supertest(app)
                .post('/api/resources/')
                .set('Authorization', makeAuthHeader(testUsers[0]))
                .send(newResourceNoUserId)
                .expect(400, {
                    error: {message: `Missing 'user_id' in request body`}
                })
        })

        it('removes XSS attack content from response', () => {
            const {maliciousResource, expectedResource} = makeMaliciousResource()
            return supertest(app)
                .post('/api/resources/')
                .set('Authorization', makeAuthHeader(testUsers[0]))
                .send(maliciousResource)
                .expect(201)
                .expect(res => {
                    expect(res.body.resource_name).to.eql(expectedResource.resource_name)
                    expect(res.body.notes).to.eql(expectedResource.notes)
                })
        })

        context('POST endpoint is protected', () => {

            const newResource = {
                resource_name: 'new resource',
                resource_url: 'https://newresource.com',
                type: 'Other Resource',
                notes: 'notes',
                user_id: 1
            }

            it(`responds with 401 'Missing bearer token' when no bearer token`, () => {
                return supertest(app)
                    .post('/api/resources/')
                    .send(newResource)
                    .expect(401, {error: `Missing bearer token`})
            })

            it(`responds 401 'Unauthorized request' when invalid JWT secret`, () => {
                const validUser = testUsers[0]
                const invalidSecret = 'bad-secret'
                return supertest(app)
                    .post('/api/resources/')
                    .set('Authorization', makeAuthHeader(validUser, invalidSecret))
                    .send(newResource)
                    .expect(401, {error: `Unauthorized request`})
            })

            it(`responds 401 'Unauthorized request' when invalid subject in payload`, () => {
                const invalidUser = {user_name: 'no-exists', id: 1}
                return supertest(app)
                    .post('/api/resources/')
                    .set('Authorization', makeAuthHeader(invalidUser))
                    .send(newResource)
                    .expect(401, {error: 'Unauthorized request'})
            })            
        })
    })

    describe.only('DELETE /api/resources/:resource_id', () => {

        context('Given no resources', () => {

            it('responds with 404', () => {
                const resourceId = 123456
                return supertest(app)
                    .delete(`/api/resources/${resourceId}`)
                    .expect(404, {error: {message: `Resource doesn't exist`}})
            })
        })

        context('Given there are resources in the db', () => {

            beforeEach('insert users and applications', () => {
                return db
                    .into('apptrackr_users')
                    .insert(protectedUsers)
                    .then(() => {
                        return db   
                            .into('apptrackr_resources')
                            .insert(testResources)
                    })
            })

            it('responds with 204 and removes the resource', () => {
                const idToRemove = 2
                const expectedResources = testResources.filter(resource => resource.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/resources/${idToRemove}`)
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .expect(204)
                    .then(() => {
                        supertest(app)
                            .get('/api/resources')
                            .expect(expectedResources)
                    })
            })
        })

        context('DELETE endpoint is protected', () => {

            beforeEach('insert users and resources', () => {
                return db
                    .into('apptrackr_users')
                    .insert(protectedUsers)
                    .then(() => {
                        return db   
                            .into('apptrackr_resources')
                            .insert(testResources)
                    })
            })

            const idToRemove = 2

            it(`responds with 401 'Missing bearer token' when no basic token`, () => {
                return supertest(app)
                    .delete(`/api/resources/${idToRemove}`)
                    .expect(401, {error: `Missing bearer token`})
            })

            it(`responds with 401 'Unauthorized request' when no credentials in token`, () => {
                const userNoCreds = {user_name: '', password: ''}
                return supertest(app)
                    .delete(`/api/resources/${idToRemove}`)
                    .set('Authorization', makeAuthHeader(userNoCreds))
                    .expect(401, {error: 'Unauthorized request'})
            })

            it(`responds with 401 'Unauthorized request' when invalid subject in payload`, () => {
                const invalidUser = {user_name: 'no-exists', id: 1}
                return supertest(app)
                    .delete(`/api/resources/${idToRemove}`)
                    .set('Authorization', makeAuthHeader(invalidUser))
                    .expect(401, {error: 'Unauthorized request'})
            })        
        })
    })

})



