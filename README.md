# apptrackr API!

This API was originally built for [apptrackr](https://github.com/7424243/apptrackr-client) app.

## Documentation

* Base URL: 'http://localhost:8000/api'
* Response Format: JSON
* Database: apptrackr
* Owner: samsheets

### Server and Database Connection
After the Heroku plan updates, the server and database need to be running *locally* in order for the fullstack application to work as expected.

1. Start Server:
```
npm run start
```

2. Start Database in Terminal:
```
/usr/local/opt/postgresql@13/bin/postgres -D /usr/local/var/postgresql@13
```

OR,
2. Start Database in Terminal in the Background:
```
brew services restart postgresql@13
```

### Applications Endpoints

* Required Parameters: job_name (string), company_name (string), status (string), user_id (integer)
* Optional Parameters: website_url (string), date_applied (string), contact_name (string), contact_email (string), contact_phone (string), interview_date (string), notes (string)
* ```POST /applications/``` >> create a new job application entry (protected endpoint)
* ```PATCH /applications/:application_id``` >> edit a job application entry by application id (protected endpoint)
* ```DELETE /applications/:application_id``` >> delete a job application entry by application id (protected endpoint)
* ```GET /applications/:application_id``` >> get a job application entry by application id (protected endpoint)
Example Response: 
    ```
    {
        "id": 8,
        "job_name": "Software Engineer",
        "company_name": "Colorado State University",
        "website_url": "https://jobs.colostate.edu/postings/83710",
        "date_applied": "2021-03-07T19:34:41.000Z",
        "contact_name": "Boss",
        "contact_phone": "(970)682-3716",
        "contact_email": "boss@colostate.edu",
        "interview_date": "2021-03-15T19:34:41.000Z",
        "status": "Closed",
        "notes": "Followed up on 2/12/21. I turned down the offer - not a good fit.",
        "user_id": 3
    }
    ```
* ```GET /applications/user/:user_id``` >> get all job applications for a specific user by user id (protected endpoint)

### Resources Endpoints

* Required Parameters: resource_name (string), resource_url (strong), type (string), user_id (integer)
* Optional Parameters: notes (string)
* ```POST /resources/``` >> create a new resource (protected endpoint)
* ```DELETE /resources/:resource_id``` >> delete a resource by resource id (protected endpoint)
* ```GET /resources/user/user_id``` >> get all resources for a specific user by user id (protected endpoint)
Example Response: 
```
    {
        "id": 1,
        "resource_name": "Indeed",
        "resource_url": "https://www.indeed.com/",
        "type": "Job Resource",
        "notes": "a great place to look for job postings",
        "user_id": 2
    }
```

### Users Endpoint

* Required Parameters: full_name (string), user_name (string), password (string), date_created (timestamptz)
* Optional Parameters: none
* ```POST /users/``` >> create a new user

### Authorization Endpoint 
* Required Parameters: user_name (string), password (string)
* Optional Parameters: none
* ```POST /auth/login```  >> login using JWT authentication

## Summary

This server was created in order to easily organize job applications. The database is made up of 3 tables: one for users, one for job applications, and one for resources. The API allows GET, POST, DELETE and PATCH requests based on the endpoint. Protected endpoints utilize JWT Authentication.

## Built With

* Node
* Express
* PostgreSQL
* JavaScript

## Heroku Deprecated Info
Heroku plan changes went into effect 11/28/22. As of that date, the server and database are no longer actively deployed there.

* The database dump can be found in the `herokuDbDump` folder.
* Old server api: https://peaceful-dawn-10295.herokuapp.com/api