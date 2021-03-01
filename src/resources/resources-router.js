const express = require('express')
const xss = require('xss')
const ResourcesService = require('./resources-service')
const path = require('path')
const {requireAuth} = require('../middleware/jwt-auth')
const config = require('../config')
const jwt = require('jsonwebtoken')
const app = require('../app')

const resourcesRouter = express.Router()
const jsonParser = express.json()

const serializeResource = resource => ({
    id: resource.id,
    resource_name: xss(resource.resource_name),
    resource_url: xss(resource.resource_url),
    type: xss(resource.type),
    notes: xss(resource.notes),
    user_id: resource.user_id
})

resourcesRouter
    .route('/')
    .post(requireAuth, jsonParser, (req, res, next) => {
        const {resource_name, resource_url, type, notes, user_id} = req.body
        const newResource = {resource_name, resource_url, type, user_id}
        //required fields: resource_name, resource_url, type, user_id
        for(const [key, value] of Object.entries(newResource))
            if(value == null) {
                return res.status(400).json({
                    error: {message: `Missing '${key}' in request body`}
                })
            }
        //optional field
        newResource.notes = notes
        const knexInstance = req.app.get('db')
        ResourcesService.insertResource(knexInstance, newResource)
            .then(resource => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${resource.id}`))
                    .json(serializeResource(resource))
            })
            .catch(next)
    })

resourcesRouter
    .route('/:resource_id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db')
        ResourcesService.getById(knexInstance, req.params.resource_id)
            .then(resource => {
                if(!resource) {
                    return res.status(404).json({
                        error: {message: `Resource doesn't exist`}
                    })
                }
                res.resource = resource
                next()
            })
            .catch(next)
    })
    .delete(requireAuth, (req, res, next) => {
        const knexInstance = req.app.get('db')
        ResourcesService.deleteResource(knexInstance, req.params.resource_id)
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = resourcesRouter