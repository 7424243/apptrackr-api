import knex from 'knex'
import {app} from './app'
import {PORT, DATABASE_URL} from './config'

const db = knex({
    client: 'pg',
    connection: DATABASE_URL,
})

app.set('db', db)

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`)
})