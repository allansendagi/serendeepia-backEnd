const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex')

const db = knex({
    client: 'pg',
    connection: {
    host : process.env.DATABASE_URL,
    ssl: true,  
  }
});

db.select('*').from('users').then(data => {
	console.log(data);
})


const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
	res.send('it os working');
})

 app.post('/signin', (req, res) => {
 	const { email, password} = req.body;
 	if (!email || !password) {
 		return res.status(400).json('incorrect form submission')
 	}
 	db.select('email', 'password').from('login')
 	.where('email', '=', email)
 	.then(data => {
 		const isValid = data[0].password===req.body.password;
 		if (isValid) {
 			return db.select('*').from('users')
 				.where('email', '=', email)
 				.then(user => {
 				 res.json(user[0])
 			})
 			.catch(err => res.status(400).json('unable to get user'))
 		} else {
 			res.status(400).json('wrong credentials')
 		}
 	})
 	.catch(err => res.status(400).json('wrong credentials'))
 })

 app.post('/register', (req, res) => {
 	const { email, name, password } = req.body;
 	if (!email || !name || !password) {
 		return res.status(400).json('incorrect form submission');
 	}
 	 db.transaction(trx => {
 	 	trx.insert({
 	 		password: password,
 	 		email: email
 	 	})
 	 	.into('login')
 	 	.returning('email')
 	 	.then(loginEmail => {
 	 		return trx('users')
	 	 	.returning('*')
	 	    .insert({
	 	 	email: loginEmail[0],
	 	 	name: name
	 	 })
	 	    .then(user => {
			res.json(user[0]);
	     })
 	 	})
 	 	.then(trx.commit)
 	 	.catch(trx.rollback)
 	 })
 	  .catch(err => res.status(400).json('unable to register'))
 })

 app.get('/profile/:id', (req,res) => {
 	const { id } = req.params;
 	db.select('*').from('users').where({id})
 	   .then(user => {
 		if(user.length) {
 		  res.json(user[0])
 		} else {
 			res.status(400).json('Not found')
 		}
 	})
 	.catch(err => res.status(400).json('error getting user'))
 
 })

app.listen(process.env.PORT || 3000, ()=>{
	console.log(`app is running on port ${process.env.PORT}`)
})