import express from 'express'
import xss from 'xss'
import ResourcesService from './resources-service'
import path from 'path'
import {requireAuth} from '../middleware/jwt-auth'

const resourcesRouter = express.Router()
const jsonParser = express.json()

interface IResource {
    id?: number,
    resource_name: string,
    resource_url: string,
    type: string,
    notes?: string,
    user_id: string,
}

const serializeResource = (resource): IResource => ({
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
        const newResource: IResource = {resource_name, resource_url, type, user_id}
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

resourcesRouter
    .route('/user/:user_id')
    .get(requireAuth, (req, res, next) => {
        const authToken = req.get('Authorization')
        const bearerToken = authToken.slice(7, authToken.length)
        const base64URL = bearerToken.split('.')[1]
        let base64 = base64URL.replace('-', '+').replace('_', '/')
        //decode token in order to obtain user_id
        let decodedToken = JSON.parse(Buffer.from(base64, 'base64').toString('binary'))
        const user_id = decodedToken.user_id
        const knexInstance = req.app.get('db')
        ResourcesService.getByUserId(knexInstance, user_id)
            .then(resources => {
                res.json(resources.map(serializeResource))
            })
            .catch(next)
    })

export default resourcesRouter