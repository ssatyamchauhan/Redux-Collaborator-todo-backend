const express = require('express');
var app = express();
var cors = require('cors')
const config = require('./config')
const jwt = require('jsonwebtoken')


app.use(cors());

app.use(express.json())

var knex = require('knex')({client:'mysql',connection:config.key});

    knex.schema.hasTable('card').then(function(exists) {
        // console.log(exists)
        if (!exists) {
        return knex.schema.createTable('card', function(t) {
            t.increments('id').primary();
            t.string('email').notNullable();
            t.string('createdon').notNullable();
            t.string('name').notNullable();
        });
        }
    });
    knex.schema.hasTable('user').then(function(exists) {
        // console.log(exists)
        if (!exists) {
        return knex.schema.createTable('user', function(t) {
            t.increments('id').primary();
            t.string('name').notNullable();
            t.string('email').unique().notNullable()
            t.string('password').notNullable()
        });
        }
    });

    knex.schema.hasTable('todo').then(function(exists) {
        // console.log(exists)
        if (!exists) {
        return knex.schema.createTable('todo', function(t) {
            t.increments('id').primary();
            t.string('todo').notNullable();
            t.boolean('done').notNullable();
            t.string('assignedby').notNullable();
            t.string('assignedto').notNullable();
            t.integer('projectid').notNullable();
        });
        }
    });

var endpoints = express.Router();
app.use('/',endpoints);
require('./Routes')(endpoints,knex,jwt)

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

//
app.listen(2000, () => {console.log('Your app is listening port 2000')})
