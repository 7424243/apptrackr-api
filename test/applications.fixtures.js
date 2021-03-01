function makeApplicationsArray() {
    return [
        {
            id: 1,
            job_name: 'Test 1',
            company_name: 'company 1',
            website_url: 'https://test.com',
            date_applied: '01/01/2021',
            contact_name: 'contact 1',
            contact_phone: '(970)493-4758',
            contact_email: 'contact1@contact.com',
            interview_date: '01/12/2021',
            status: 'Interested',
            notes: 'cool job description',
            user_id: 1
        },
        {
            id: 2,
            job_name: 'Test 2',
            company_name: 'company 2',
            website_url: 'https://test2.com',
            date_applied: '01/01/2021',
            contact_name: 'contact 2',
            contact_phone: '(970)493-4758',
            contact_email: 'contact2@contact.com',
            interview_date: '01/12/2021',
            status: 'Applied',
            notes: 'Followed up on 01/10/2021',
            user_id: 1
        }, 
        {
            id: 3,
            job_name: 'Test 3',
            company_name: 'company 3',
            website_url: 'https://test3.com',
            date_applied: '01/01/2021',
            contact_name: 'contact 3',
            contact_phone: '(970)493-4758',
            contact_email: 'contact3@contact.com',
            interview_date: '01/12/2021',
            status: 'Closed',
            notes: 'not a good fit',
            user_id: 2
        }
    ]
}

function makeMaliciousApplication() {
    const maliciousApplication = {
        id: 911,
        job_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        company_name: 'company',
        website_url: 'https://doesthiswork.com',
        date_applied: '01/01/2021',
        contact_name: 'contact 4',
        contact_phone: '(970)493-4758',
        contact_email: 'contact4@contact.com',
        interview_date: '01/12/2021',
        status: 'Closed',
        notes: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        user_id: 2
    }
    const expectedApplication = {
        ...maliciousApplication,
        job_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        notes: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }
    return {
        maliciousApplication,
        expectedApplication
    }
}

module.exports = {
    makeApplicationsArray,
    makeMaliciousApplication
}