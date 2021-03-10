const ApplicationsService = {
    insertApplication(knex, newApplication) {
        return knex
            .insert(newApplication)
            .into('apptrackr_applications')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex
            .select('*')
            .from('apptrackr_applications')
            .where('id', id)
            .first()
    },
    updateApplication(knex, id, newApplicationFields) {
        return knex('apptrackr_applications')
            .where({id})
            .update(newApplicationFields)
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    deleteApplication(knex, id) {
        return knex('apptrackr_applications')
            .where({id})
            .delete()
    },
    getByUserId(knex, user_id) {
        return knex
            .select('*')
            .from('apptrackr_applications')
            .where({user_id})
    }
}

module.exports = ApplicationsService