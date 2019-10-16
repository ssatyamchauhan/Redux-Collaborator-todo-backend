const jwt = require('jsonwebtoken')
const config = require('./config')

module.exports = (req,res,next) => {

    var token = req.query.token || req.body.token || req.headers.Cookies;
    
    console.log('post request is called ',token)
    if(token !== undefined){
        if(token.startsWith('key=')){
            token=token.slice(4,token.length)
            jwt.verify(token, config.key.secret, (err, decode) =>{
                if(!err){
                    req.email = decode.user.email 
                    next();
                }
                else{
                    console.log(err)
                    res.json('token is expired')
                }
            })
        }
        
        else{
            token = token.slice(4,token.length)
            jwt.verify(token, config.key.secret, (err, decode) =>{
                if(!err){
                    req.email = decode.user.email 
                    next();
                }
                else{
                    console.log(err)
                    res.json('token is expired')
                }
            })
        }
    }
    else{
        res.json('please login first!')
    }
}

