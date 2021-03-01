const app = require('../src/app')
const knex = require('knex')
const {makeApplicationsArray, makeMaliciousApplication} = require('./applications.fixtures')
const {makeUsersArray} = require('./users.fixtures')
const {hashUserPassword, makeAuthHeader} = require('./test-helpers')
const supertest = require('supertest')
const { expect } = require('chai')
const { before } = require('mocha')

describe('Applications Endpoints', () => {

    const testUsers = makeUsersArray()
    const testApplications = makeApplicationsArray()
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

    before('clean the tables', () => db.raw('TRUNCATE apptrackr_users, apptrackr_applications RESTART IDENTITY CASCADE'))

    afterEach('cleanup', () => db.raw('TRUNCATE apptrackr_users, apptrackr_applications RESTART IDENTITY CASCADE'))

    describe('POST /api/applications/', () => {

        beforeEach('insert users', () => {
            return db
                .into('apptrackr_users')
                .insert(protectedUsers)
        })

        it('creates a new application and responds with 201 and the new application', () => {
            const newApplication = {
                job_name: 'Test Job Application',
                company_name: 'company',
                website_url: 'https://test.com',
                date_applied: '01/01/2021',
                contact_name: 'contact 3',
                contact_phone: '(970)493-4758',
                contact_email: 'contact3@contact.com',
                interview_date: '01/12/2021',
                status: 'Applied',
                notes: 'VERY interested',
                user_id: 1
            }
            return supertest(app)
                .post('/api/applications/')
                .set('Authorization', makeAuthHeader(testUsers[0]))
                .send(newApplication)
                .expect(201)
                .expect(res => {
                    expect(res.body.job_name).to.eql(newApplication.job_name)
                    expect(res.body.company_name).to.eql(newApplication.company_name)
                    expect(res.body.website_url).to.eql(newApplication.website_url)
                    expect(res.body.date_applied).to.eql(newApplication.date_applied)
                    expect(res.body.contact_name).to.eql(newApplication.contact_name)
                    expect(res.body.contact_phone).to.eql(newApplication.contact_phone)
                    expect(res.body.contact_email).to.eql(newApplication.contact_email)
                    expect(res.body.interview_date).to.eql(newApplication.interview_date)
                    expect(res.body.status).to.eql(newApplication.status)
                    expect(res.body.notes).to.eql(newApplication.notes)
                    expect(res.body.user_id).to.eql(newApplication.user_id)
                    expect(res.body).to.have.property('id')
                    expect(res.header.location).to.eql(`/api/applications/${res.body.id}`)
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/api/applications/${postRes.body.id}`)
                        .expect(postRes.body)
                })
        })

        it(`responds with 400 and an error message when job_name is missing`, () => {
            const newApplicationNoJobName = {
                    company_name: 'test company',
                    website_url: 'https://test.com',
                    date_applied: '02/02/2021',
                    contact_name: 'test contact',
                    contact_phone: '(786)463-5746',
                    contact_email: 'test@gmail.com',
                    interview_date: '',
                    status: 'Applied',
                    notes: '',
                    user_id: 1
            }
            return supertest(app)
                .post('/api/applications/')
                .set('Authorization', makeAuthHeader(testUsers[0]))
                .send(newApplicationNoJobName)
                .expect(400, {
                    error: {message: `Missing 'job_name' in request body`}
                })
        })

        it(`responds with 400 and an error message when the company_name is missing`, () => {
            const newApplicationNoCompanyName = {
                job_name: 'test job',
                website_url: 'https://test.com',
                date_applied: '02/02/2021',
                contact_name: 'test contact',
                contact_phone: '(786)463-5746',
                contact_email: 'test@gmail.com',
                interview_date: '',
                status: 'Applied',
                notes: '',
                user_id: 1
            }
            return supertest(app)
                .post('/api/applications/')
                .set('Authorization', makeAuthHeader(testUsers[0]))
                .send(newApplicationNoCompanyName)
                .expect(400, {
                    error: {message: `Missing 'company_name' in request body`}
                })
        })

        it(`responds with 400 and an error message when the user_id is missing`, () => {
            const newApplicationNoUserId = {
                job_name: 'test job',
                company_name: 'test company',
                website_url: 'https://test.com',
                date_applied: '02/02/2021',
                contact_name: 'test contact',
                contact_phone: '(786)463-5746',
                contact_email: 'test@gmail.com',
                interview_date: '',
                status: 'Applied',
                notes: ''
            }
            return supertest(app)
                .post('/api/applications/')
                .set('Authorization', makeAuthHeader(testUsers[0]))
                .send(newApplicationNoUserId)
                .expect(400, {
                    error: {message: `Missing 'user_id' in request body`}
                })
        })

        it('removes XSS attack content from response', () => {
            const {maliciousApplication, expectedApplication} = makeMaliciousApplication()
            return supertest(app)
                .post('/api/applications/')
                .set('Authorization', makeAuthHeader(testUsers[0]))
                .send(maliciousApplication)
                .expect(201)
                .expect(res => {
                    expect(res.body.job_name).to.eql(expectedApplication.job_name)
                    expect(res.body.notes).to.eql(expectedApplication.notes)
                })
        })

        context('POST endpoint is protected', () => {

            const newApplication = {
                job_name: 'Test Job Application',
                company_name: 'company',
                website_url: 'https://test.com',
                date_applied: '01/01/2021',
                contact_name: 'contact 3',
                contact_phone: '(970)493-4758',
                contact_email: 'contact3@contact.com',
                interview_date: '01/12/2021',
                status: 'Applied',
                notes: 'VERY interested',
                user_id: 1
            }

            it(`responds with 401 'Missing bearer token' when no bearer token`, () => {
                return supertest(app)
                    .post('/api/applications/')
                    .send(newApplication)
                    .expect(401, {error: `Missing bearer token`})
            })

            it(`responds 401 'Unauthorized request' when invalid JWT secret`, () => {
                const validUser = testUsers[0]
                const invalidSecret = 'bad-secret'
                return supertest(app)
                    .post('/api/applications/')
                    .set('Authorization', makeAuthHeader(validUser, invalidSecret))
                    .send(newApplication)
                    .expect(401, {error: `Unauthorized request`})
            })

            it(`responds 401 'Unauthorized request' when invalid subject in payload`, () => {
                const invalidUser = {user_name: 'no-exists', id: 1}
                return supertest(app)
                    .post('/api/applications/')
                    .set('Authorization', makeAuthHeader(invalidUser))
                    .send(newApplication)
                    .expect(401, {error: 'Unauthorized request'})
            })
        })
    })

    describe('PATCH /api/applications/:application_id', () => {

        context('Given no applications', () => {
            it('responds with 404', () => {
                const applicationId = 123456
                return supertest(app)
                    .patch(`/api/applications/${applicationId}`)
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .expect(404, {
                        error: {message: `Application doesn't exist`}
                    })
            })
        })

        context('Given there are applications in the database', () => {

            beforeEach('insert users and applications', () => {
                return db
                    .into('apptrackr_users')
                    .insert(protectedUsers)
                    .then(() => {
                        return db
                            .into('apptrackr_applications')
                            .insert(testApplications)
                    })
            })

            it('it responds with 204 and updates the application', () => {
                const idToUpdate = 1
                const updateApplication = {
                    job_name: 'Test 1',
                    company_name: 'company 1',
                    website_url: 'https://test.com',
                    date_applied: '01/01/2021',
                    contact_name: 'contact 1',
                    contact_phone: '(970)493-4758',
                    contact_email: 'contact1@contact.com',
                    interview_date: '01/12/2021',
                    status: 'Applied',
                    notes: 'updated notes - changed status',
                    user_id: 1
                }
                const expectedApplication = {
                    ...testApplications[idToUpdate - 1],
                    ...updateApplication
                }
                return supertest(app)
                    .patch(`/api/applications/${idToUpdate}`)
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(updateApplication)
                    .expect(204)
                    .then(() => {
                        supertest(app)
                            .get(`/api/applications/${idToUpdate}`)
                            .expect(expectedApplication)
                    })
            })

            it('responds with 204 when updating only a subset of fields', () => {
                const idToUpdate = 1
                const updateApplication = {
                    job_name: 'Updated job name'
                }
                const expectedApplication = {
                    ...testApplications[idToUpdate - 1],
                    ...updateApplication
                }
                return supertest(app)
                    .patch(`/api/applications/${idToUpdate}`)
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send(updateApplication)
                    .expect(204)
                    .then(() => {
                        supertest(app)
                            .get(`/api/applications/${idToUpdate}`)
                            .expect(expectedApplication)
                    })
            })

            it('responds with 400 when no required fields supplied', () => {
                const idToUpdate = 1
                return supertest(app)
                    .patch(`/api/applications/${idToUpdate}`)
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .send({irrelevantField: 'foo'})
                    .expect(400, {
                        error: {message: `Request must contain either 'job_name', 'company_name', 'website_url', 'date_applied', 'contact_name', 'contact_phone', 'contact_email', 'interview_date', 'status', or 'notes'`}
                    })
            })
        })

        context('PATCH endpoint is protected', () => {

            beforeEach('insert users and applications', () => {
                return db
                    .into('apptrackr_users')
                    .insert(protectedUsers)
                    .then(() => {
                        return db
                            .into('apptrackr_applications')
                            .insert(testApplications)
                    })
            })

            const idToUpdate = 1
            const updateApplication = {
                job_name: 'Test 1',
                company_name: 'company 1',
                website_url: 'https://test.com',
                date_applied: '01/01/2021',
                contact_name: 'contact 1',
                contact_phone: '(970)493-4758',
                contact_email: 'contact1@contact.com',
                interview_date: '01/12/2021',
                status: 'Applied',
                notes: 'updated notes - changed status',
                user_id: 1
            }

            it(`responds with 401 'Missing basic token' when no basic token`, () => {
                return supertest(app)
                    .patch(`/api/applications/${idToUpdate}`)
                    .send(updateApplication)
                    .expect(401, {error: `Missing bearer token`})
            })

            it(`responds 401 'Unauthorized request' when no credentials in token`, () => {
                const userNoCreds = {user_name: '', password: ''}
                return supertest(app)
                    .patch(`/api/applications/${idToUpdate}`)
                    .set('Authorization', makeAuthHeader(userNoCreds))
                    .send(updateApplication)
                    .expect(401, {error: `Unauthorized request`})
            })

            it(`responds 401 'Unauthorized request' when invalid subject in payload`, () => {
                const invalidUser = {user_name: 'no-exists', id: 1}
                return supertest(app)
                    .patch(`/api/applications/${idToUpdate}`)
                    .set('Authorization', makeAuthHeader(invalidUser))
                    .send(updateApplication)
                    .expect(401, {error: 'Unauthorized request'})
            })

        })

    })

    describe('DELETE /api/applications/:application_id', () => {

        context('Given no applications', () => {
            
            it('responds with 404', () => {
                const applicationId = 123456
                return supertest(app)
                    .delete(`/api/applications/${applicationId}`)
                    .expect(404, {error: {message: `Application doesn't exist`}})
            })
        })

        context('Given there are applications in the db', () => {

            beforeEach('insert users and applications', () => {
                return db
                    .into('apptrackr_users')
                    .insert(protectedUsers)
                    .then(() => {
                        return db   
                            .into('apptrackr_applications')
                            .insert(testApplications)
                    })
            })

            it('responds with 204 and removes the recipe', () => {
                const idToRemove = 2
                const expectedApplications = testApplications.filter(application => application.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/applications/${idToRemove}`)
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .expect(204)
                    .then(() => {
                        supertest(app)
                            .get('/api/applications/')
                            .expect(expectedApplications)
                    })
            })
        })

        context('DELETE endpoint is protected', () => {

            beforeEach('insert users and applications', () => {
                return db
                    .into('apptrackr_users')
                    .insert(protectedUsers)
                    .then(() => {
                        return db   
                            .into('apptrackr_applications')
                            .insert(testApplications)
                    })
            })

            const idToRemove = 2

            it(`responds with 401 'Missing bearer token' when no basic token`, () => {
                return supertest(app)
                    .delete(`/api/applications/${idToRemove}`)
                    .expect(401, {error: `Missing bearer token`})
            })

            it(`responds with 401 'Unauthorized request' when no credentials in token`, () => {
                const userNoCreds = {user_name: '', password: ''}
                return supertest(app)
                    .delete(`/api/applications/${idToRemove}`)
                    .set('Authorization', makeAuthHeader(userNoCreds))
                    .expect(401, {error: 'Unauthorized request'})
            })

            it(`responds with 401 'Unauthorized request' when invalid subject in payload`, () => {
                const invalidUser = {user_name: 'no-exists', id: 1}
                return supertest(app)
                    .delete(`/api/applications/${idToRemove}`)
                    .set('Authorization', makeAuthHeader(invalidUser))
                    .expect(401, {error: 'Unauthorized request'})
            })

        })
    })

    describe('GET /api/applications/user/:user_id', () => {

        const userId = 1
        const userApplications = testApplications.filter(application => application.user_id == userId)

        context('Given no recipes for the user', () => {

            it('responds with 200 and an empty list', () => {
                return db
                    .into('apptrackr_users')
                    .insert(protectedUsers)
                    .then(() => {
                        return supertest(app)
                            .get(`/api/applications/user/${userId}`)
                            .set('Authorization', makeAuthHeader(testUsers[0]))
                            .expect(200, [])
                    })
            })
            
        })

        context('Given there are applications for the user in the db', () => {

            beforeEach('insert users and applications', () => {
                return db
                    .into('apptrackr_users')
                    .insert(protectedUsers)
                    .then(() => {
                        return db   
                            .into('apptrackr_applications')
                            .insert(testApplications)
                    })
            })

            it(`responds with 200 and all of the user's applications`, () => {
                return supertest(app)
                    .get(`/api/applications/user/${userId}`)
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .expect(200, userApplications)
            })
        })

        context(`Given an XSS attack recipe`, () => {

            const {maliciousApplication, expectedApplication} = makeMaliciousApplication()

            beforeEach('insert malicious application', () => {
                return db
                    .into('apptrackr_users')
                    .insert(protectedUsers)
                    .then(() => {
                        return db
                            .into('apptrackr_applications')
                            .insert(maliciousApplication)
                    })
            })

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/api/applications/user/${userId}`)
                    .set('Authorization', makeAuthHeader(testUsers[0]))
                    .expect(res => {
                        expect(res.body[0].job_name).to.eql(expectedApplication.job_name)
                        expect(res.body[0].notes).to.eql(expectedApplication.notes)
                    })
            })
        })

        context('GET /api/applications/users/:user_id as a protected endpoint', () => {
            
            beforeEach('insert users and applications', () => {
                return db
                    .into('apptrackr_users')
                    .insert(protectedUsers)
                    .then(() => {
                        return db   
                            .into('apptrackr_applications')
                            .insert(testApplications)
                    })
            })

            const userId = 1

            it(`responds with 401 'Missing bearer token' when no bearer token`, () => {
                return supertest(app)
                    .get(`/api/applications/user/${userId}`)
                    .expect(401, {error: `Missing bearer token`})
            })

            it(`responds 401 'Unauthorized request' when no credentials in token`, () => {
                const userNoCreds = {user_name: '', password: ''}
                return supertest(app)
                    .get(`/api/applications/user/${userId}`)
                    .set('Authorization', makeAuthHeader(userNoCreds))
                    .expect(401, {error: `Unauthorized request`})
            })

            it(`responds 401 'Unauthorized request' when invalid subject in payload`, () => {
                const invalidUser = {user_name: 'no-exists', id: 1}
                return supertest(app)
                    .get(`/api/applications/user/${userId}`)
                    .set('Authorization', makeAuthHeader(invalidUser))
                    .expect(401, {error: 'Unauthorized request'})
            })
        })
    })

})