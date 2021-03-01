function makeResourcesArray() {
    return [
        {
            id: 1,
            resource_name: 'test 1',
            resource_url: 'https://test1.com',
            type: 'Job Resource',
            notes: 'test 1 notes', 
            user_id: 1
        },
        {
            id: 2,
            resource_name: 'test 2',
            resource_url: 'https://test2.com',
            type: 'Other Resource',
            notes: 'test 2 notes', 
            user_id: 1
        },
        {
            id: 3,
            resource_name: 'test 3',
            resource_url: 'https://test3.com',
            type: 'Job Resource',
            notes: 'test 3 notes', 
            user_id: 2
        }
    ]
}

function makeMaliciousResource() {
    const maliciousResource = {
        id: 911,
        resource_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        resource_url: 'https://test2.com',
        type: 'Other Resource',
        notes: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`, 
        user_id: 1
    }
    const expectedResource = {
        ...maliciousResource,
        resource_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        notes: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }
    return {
        maliciousResource,
        expectedResource
    }
}

module.exports = {
    makeResourcesArray,
    makeMaliciousResource,
}