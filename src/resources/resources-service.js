const ResourcesService = {
    insertResource(knex, newResource) {
        return knex
            .insert(newResource)
            .into('apptrackr_resources')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .select('*')
            .from('apptrackr_resources')
            .where('id', id)
            .first()
    },   
    deleteResource(knex, id) {
        return knex('apptrackr_resources')
            .where({id})
            .delete()
    },
    getByUserId(knex, user_id) {
        return knex
            .select('*')
            .from('apptrackr_resources')
            .where({user_id})
    }
}

module.exports = ResourcesService