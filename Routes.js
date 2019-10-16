
// console.log('Routes is running')
const _ = require('underscore')
const jwtVerify = require('./jwtVerify')
const config = require('./config')
const forget = require('./forget')

module.exports = (endpoints,knex,jwt) => {

    endpoints.post('/login', (req,res) => {
        console.log('login endpoint is called')
        knex('user')
        .where('user.email',req.body.email)
        .andWhere('user.password', req.body.password)
            .then(data => {
                if(data.length>0){
                    jwt.sign({user:data[0]}, config.key.secret, {expiresIn: '1hr'}, function(err, token) {
                    if(!err){
                        console.log(token,'generated successfully!')
                        return res.send('key='+token)
                    }
                    else{
                      console.log('here is the error',err)
                    }
               });
              }
              else{
                res.json('This user does not exists!')
              }
            })
            .catch(err => {
                console.log(err)
                res.json(err)
            })
    })

    endpoints.post('/signup', (req,res) => {
        knex('user')
        .where('user.email',req.body.email)
            .then(data => {
                if(data.length === 0){
                    knex('user')
                    .insert(req.body)
                        .then(data => {
                            res.json('you have successfully signup!')
                        })
                        .catch(err => {
                            console.log(err)
                        })
                }
                else{
                    res.json('Error')
                }
            })
    })

    endpoints.post('/project', jwtVerify, (req,res) => {
        // console.log('project is called ')
        console.log(req.email)
        var cardDetails = {
            email:req.email,
            createdon: new Date(),
            name:req.body.name
        }
        knex('card')
        .insert(cardDetails)
            .then(data => {
                knex('card')
                .where('card.email',req.email)
                    .then(data => {
                        res.json(data)
                        console.log(data)
                    })
                    .catch(err => {
                        console.log(err)
                    })
            })
    })

    endpoints.get('/project', jwtVerify, (req,res) => {
        console.log('hey there it is workignx')
        knex('card')
        .select('id')
        .where('card.email', req.email)
            .then(data => {
                knex('todo')
                .where('todo.assignedby',req.email)
                .orWhere('todo.assignedto', req.email)
                .select('projectid as id')   
                    .then(tododata => {
                        var totalPojects = data.concat(tododata)
                        var list = _.uniq(totalPojects, false, function(i){
                            return i.id
                        })
                        Promise.all(list.map((i) => {
                            return knex('card')
                                    .where('card.id',i.id)
                                        .then(data => {
                                            console.log('inside promiseall',data)
                                            return (data[0])
                                        })
                                        .catch(err => {
                                            console.log(err)
                                        })
                        }))
                        .then(finallist =>{
                            console.log('Finallist is here',finallist[0])
                            return res.json(finallist)
                        })
                        .catch(err => {
                            console.log(err)
                        })
                        
                    })
                        
            })
            .catch(err => {
                console.log(err)
            })
    })

    endpoints.post('/todo', jwtVerify, (req,res) => {
            delete req.body["token"];
            req.body["assignedby"] = req.email;
            console.log(req.body)
            knex('user')
            .where('user.email',req.body.assignedto)
                .then(data => {
                    console.log('user emails are here ', data)
                    if(data.length > 0){
                        knex('todo')
                        .insert(req.body)
                            .then(() => {
                                knex('todo')
                                .where('todo.projectid', req.body.projectid)
                                    .then(data =>{
                                        var finalData =  data.filter((i) => {
                                            if(i.done){
                                                return i.done = true;
                                            }
                                            else{
                                                return i.done = false;
                                            }
                                        })
                                        console.log('post method data',data)
                                        res.json(data)
                                    })
                                    .catch(err => {
                                        res.json(err)
                                    })
                        
                                })
                                .catch(err => {
                                    console.log(err)
                                })
                            }
                            else{
                                res.json('invalid')
                            }
                        })
                    
            
    })

    endpoints.put('/todo',jwtVerify, (req,res) => {
        
        knex('todo')
        .where('todo.id',req.body.id)
        .update({todo:req.body.todo})
            .then(() => {
                knex('todo')
                .where('todo.projectid', req.body.projectid)
                    .then(data => {
                        res.json(data)
                    })
                    .catch(err => {
                        console.log(err)
                    })
            })
    })

    endpoints.get('/todo',jwtVerify,(req,res) => {
        console.log(req.query.projectid)
        console.log(req.email)

        knex('todo')
        .where('todo.projectid', req.query.projectid)
            .then(data =>{
                var finalData =  data.filter((i) => {
                    // console.log(i)
                    if(i.done){
                        return i.done = true;
                    }
                    else{
                        return i.done = false;
                     }
                })
                console.log('here is that',data)
                // console.log('get method data',finalData)
                res.json(data)
            })
            .catch(err => {
                res.json(err)
            })
    })

    endpoints.post('/done/:id',jwtVerify, (req,res) => {
        console.log(req.params.id)
        knex('todo')
        .where('todo.id',req.params.id)
        .update({done:req.body.done})
            .then(data =>{
                knex('todo')
                .where('todo.projectid',req.body.projectid)
                    .then(data =>{
                        var finalData =  data.filter((i) => {
                            if(i.done){
                                return i.done = true
                            }
                            else{
                                return i.done = false
                             }
                        })
                        console.log(data)
                        res.json(data)
                    })
                    .catch(err => {
                        console.log(err)
                    })
                
            })
            .catch(err => {
                console.log(err)
            })
    })

    endpoints.post('/delete/:id',jwtVerify, (req,res) => {
        
        knex('todo')
        .where('todo.id',req.params.id)
        .del()
            .then(() => {
                knex('todo')
                .where('todo.projectid',req.body.projectid)
                    .then(data =>{
                        console.log(data)
                        res.json(data)
                    })
                    .catch(err => {
                        console.log(err)
                    })
            })
    })

    endpoints.get('/profile',jwtVerify, (req,res) => {
        
        knex('user')
        .where('user.email',req.email)
            .then(data => {
                console.log(data)
                res.json(data)
            })
            .catch(err => {
                console.log(err)
            })
    })

    endpoints.post('/forget',(req,res) => {
        console.log('forget is called')
        console.log(req.body)
          knex('user').where('user.email',req.body.email)
          .then(data => {
            console.log(data)
            if(data.length === 1){
                jwt.sign({user:data[0]}, process.env.secret, {expiresIn: '5m'}, function(err, token) {
                  if(!err){
                    console.log(token)
                    forget(req,res,token)
                  }
                  else{
                    console.log('here is the error',err)
                  }
                })
                  
            }
            else{
              res.json('not a user')
            }
          })
      })

      endpoints.post('/reset', jwtVerify , (req,res) =>{
        console.log('it is in process.......')
        knex('user').where('user.email',req.email).update({password:req.body.password})
        .then(data => res.json(data))
        .catch(err => res.json(err))
      })

}

