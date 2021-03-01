const ResourcesService = {
    insertResource(knex, newResource) {
        return knex
            .insert(newResource)
            .into('apptrackr_resources')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    }   
}

module.exports = ResourcesService