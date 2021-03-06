const express = require('express')
const xss = require('xss')
const ApplicationsService = require('./applications-service')
const path = require('path')
const {requireAuth} = require('../middleware/jwt-auth')
const config = require('../config')
const jwt = require('jsonwebtoken')
const app = require('../app')

const applicationsRouter = express.Router()
const jsonParser = express.json()

const serializeApplication = application => ({
    id: application.id,
    job_name: xss(application.job_name),
    company_name: xss(application.company_name),
    website_url: xss(application.website_url),
    date_applied: xss(application.date_applied),
    contact_name: xss(application.contact_name),
    contact_phone: xss(application.contact_phone),
    contact_email: xss(application.contact_email),
    interview_date: xss(application.interview_date),
    status: xss(application.status),
    notes: xss(application.notes),
    user_id: application.user_id
})

applicationsRouter
    .route('/')
    .post(requireAuth, jsonParser, (req, res, next) => {
        const {job_name, company_name, website_url, date_applied, contact_name, contact_phone, contact_email, interview_date, status, notes, user_id} = req.body
        const newApplication = {job_name, company_name, status, user_id}
        //required fields: job_name, company_name, user_id
        for(const [key, value] of Object.entries(newApplication))
            if(value == null) {
                return res.status(400).json({
                    error: {message: `Missing '${key}' in request body`}
                })
            }
        //optional fields
        newApplication.website_url = website_url,
        newApplication.date_applied = date_applied,
        newApplication.contact_name = contact_name,
        newApplication.contact_phone = contact_phone,
        newApplication.contact_email = contact_email,
        newApplication.interview_date = interview_date,
        newApplication.notes = notes
        const knexInstance = req.app.get('db')
        ApplicationsService.insertApplication(knexInstance, newApplication)
            .then(application => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${application.id}`))
                    .json(serializeApplication(application))
            })
            .catch(next)
    })

applicationsRouter
    .route('/:application_id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        ApplicationsService.getById(knexInstance, req.params.application_id)
            .then(application => {
                if(!application) {
                    return res.status(404).json({
                        error: {message: `Application doesn't exist`}
                    })
                }
                res.application = application
                next()
            })
            .catch(next)
    })
    .get(requireAuth, (req, res, next) => {
        res.json(serializeApplication(res.application))
    })
    .patch(requireAuth, jsonParser, (req, res, next) => {
        const {job_name, company_name, website_url, date_applied, contact_name, contact_phone, contact_email, interview_date, status, notes} = req.body
        const applicationToUpdate = {job_name, company_name, website_url, date_applied, contact_name, contact_phone, contact_email, interview_date, status, notes}
        const numberOfValues = Object.values(applicationToUpdate).filter(Boolean).length
        if(numberOfValues === 0) {
            return res.status(400).json({
                error: {message: `Request must contain either 'job_name', 'company_name', 'website_url', 'date_applied', 'contact_name', 'contact_phone', 'contact_email', 'interview_date', 'status', or 'notes'`}
            })
        }
        const knexInstance = req.app.get('db')
        ApplicationsService.updateApplication(knexInstance, req.params.application_id, applicationToUpdate)
            .then(updatedApplication => {
                res
                    .status(200)
                    .location(path.posix.join(req.originalUrl, `/${updatedApplication.id}`))
                    .json(serializeApplication(updatedApplication))
            })
            .catch(next)
    })
    .delete(requireAuth, (req, res, next) => {
        const knexInstance = req.app.get('db')
        ApplicationsService.deleteApplication(knexInstance, req.params.application_id)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

applicationsRouter
    .route('/user/:user_id')
    .get(requireAuth, (req, res, next) => {
        const authToken = req.get('Authorization')
        const bearerToken = authToken.slice(7, authToken.length)
        const base64URL = bearerToken.split('.')[1]
        let base64 = base64URL.replace('-', '+').replace('_', '/')
        let decodedToken = JSON.parse(Buffer.from(base64, 'base64').toString('binary'))
        const user_id = decodedToken.user_id
        const knexInstance = req.app.get('db')
        ApplicationsService.getByUserId(knexInstance, user_id)
            .then(applications => {
                res.json(applications.map(serializeApplication))
            })
            .catch(next)
    })

module.exports = applicationsRouter