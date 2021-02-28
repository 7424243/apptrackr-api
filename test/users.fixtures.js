function makeUsersArray() {
    return [
        {
            id: 1,
            full_name: 'test user 1',
            user_name: 'testuser1',
            password: 'Test123!',
            date_created: '2019-01-03T00:00:00.000Z'
        },
        {
            id: 2,
            full_name: 'test user 2',
            user_name: 'user2',
            password: '123Test!',
            date_created: '2019-01-03T00:00:00.000Z'
        }
    ]
}

module.exports = {
    makeUsersArray
}