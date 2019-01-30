/*Name: Elizabeth Emerson
Course: CS 493
Date: 3 December 2018
Assignment: Final Project
Notes: This assignment used code I wrote previously for
Assignment 4 in this course.
*/


const express = require('express');
const app = express();
const Datastore = require('@google-cloud/datastore');
const bodyParser = require('body-parser');

//JWT
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const request = require('request');

const router = express.Router();
const login = express.Router();

//Connects to Google App Engine's Datastore
const projectId = 'emerson-final';
const datastore = new Datastore({projectId:projectId});

//Defines kinds
const SHIP = "Ship";
const CARGO = "cargo";
const MERCHANT = "merchant";
const BASE_URL = "https://emerson-final.appspot.com";

app.use(bodyParser.json());

//Get ID from the object key
function fromDatastore(item){
    item.id = item[Datastore.KEY].id;

    return item;
}


/*---------------- JWT ----------------*/
const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://emerson-final.auth0.com/.well-known/jwks.json`
    }),

    // Validate the audience and the issuer.
    issuer: `https://emerson-final.auth0.com/`,
    algorithms: ['RS256']
  });


login.post('/', function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    var options = { method: 'POST',
    url: 'https://emerson-final.auth0.com/oauth/token',
    headers: { 'content-type': 'application/json' },
    body:
     { scope: 'openid',
     	grant_type: 'password',
       username: username,
       password: password,
       client_id: 'wxVoCqHedrJGd64hI5cZ4I6kR1T7630f',
       client_secret: 'JmNntenqT3A69jjJ1-TUQuRuIjPNDy302eDYdDphhMs4WYr91-9vxH-zLMiKqeUP' },
    json: true };
    request(options, (error, response, body) => {
        if (error){
            res.status(500).send(error);
        } else {
            res.send(body);
        }
    });

});

/* ------------- Begin Merchant Model Functions ------------- */

//Add a new merchant
function post_merchant(name, base, trade_region, companyName){
  var key = datastore.key(MERCHANT);

//  var create_user_body = {
//	  "user_id": "",
//	  "connection": "Database",
//	  "username": name,
//	  "password": password,
//	  "email": email,
//	  "blocked": false,
//	  "app_metadata": {}
//	};
//
//  	//https://login.auth0.com/api/v2/users
//    var options = { method: 'POST',
//	    url: 'https://emerson-final.auth0.com/api/v2/users',
//	    headers: { 'content-type': 'application/json',
//	    			"Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlJESTBORGswUXpORk9UQkZOVFUwTVVORE5UaEROemswTVVVMU5FSXpNakpCTVRnMVF6bEdRUSJ9.eyJpc3MiOiJodHRwczovL2VtZXJzb24tZmluYWwuYXV0aDAuY29tLyIsInN1YiI6InBiVzhPRDExM0JPZFd3ZDhzaDZtQVF4QVJHVTZsSzhEQGNsaWVudHMiLCJhdWQiOiJodHRwczovL2VtZXJzb24tZmluYWwuYXV0aDAuY29tL2FwaS92Mi8iLCJpYXQiOjE1NDM4OTEwMDIsImV4cCI6MTU0NjQ4MzAwMiwiYXpwIjoicGJXOE9EMTEzQk9kV3dkOHNoNm1BUXhBUkdVNmxLOEQiLCJzY29wZSI6InJlYWQ6Y2xpZW50X2dyYW50cyBjcmVhdGU6Y2xpZW50X2dyYW50cyBkZWxldGU6Y2xpZW50X2dyYW50cyB1cGRhdGU6Y2xpZW50X2dyYW50cyByZWFkOnVzZXJzIHVwZGF0ZTp1c2VycyBkZWxldGU6dXNlcnMgY3JlYXRlOnVzZXJzIHJlYWQ6dXNlcnNfYXBwX21ldGFkYXRhIHVwZGF0ZTp1c2Vyc19hcHBfbWV0YWRhdGEgZGVsZXRlOnVzZXJzX2FwcF9tZXRhZGF0YSBjcmVhdGU6dXNlcnNfYXBwX21ldGFkYXRhIGNyZWF0ZTp1c2VyX3RpY2tldHMgcmVhZDpjbGllbnRzIHVwZGF0ZTpjbGllbnRzIGRlbGV0ZTpjbGllbnRzIGNyZWF0ZTpjbGllbnRzIHJlYWQ6Y2xpZW50X2tleXMgdXBkYXRlOmNsaWVudF9rZXlzIGRlbGV0ZTpjbGllbnRfa2V5cyBjcmVhdGU6Y2xpZW50X2tleXMgcmVhZDpjb25uZWN0aW9ucyB1cGRhdGU6Y29ubmVjdGlvbnMgZGVsZXRlOmNvbm5lY3Rpb25zIGNyZWF0ZTpjb25uZWN0aW9ucyByZWFkOnJlc291cmNlX3NlcnZlcnMgdXBkYXRlOnJlc291cmNlX3NlcnZlcnMgZGVsZXRlOnJlc291cmNlX3NlcnZlcnMgY3JlYXRlOnJlc291cmNlX3NlcnZlcnMgcmVhZDpkZXZpY2VfY3JlZGVudGlhbHMgdXBkYXRlOmRldmljZV9jcmVkZW50aWFscyBkZWxldGU6ZGV2aWNlX2NyZWRlbnRpYWxzIGNyZWF0ZTpkZXZpY2VfY3JlZGVudGlhbHMgcmVhZDpydWxlcyB1cGRhdGU6cnVsZXMgZGVsZXRlOnJ1bGVzIGNyZWF0ZTpydWxlcyByZWFkOnJ1bGVzX2NvbmZpZ3MgdXBkYXRlOnJ1bGVzX2NvbmZpZ3MgZGVsZXRlOnJ1bGVzX2NvbmZpZ3MgcmVhZDplbWFpbF9wcm92aWRlciB1cGRhdGU6ZW1haWxfcHJvdmlkZXIgZGVsZXRlOmVtYWlsX3Byb3ZpZGVyIGNyZWF0ZTplbWFpbF9wcm92aWRlciBibGFja2xpc3Q6dG9rZW5zIHJlYWQ6c3RhdHMgcmVhZDp0ZW5hbnRfc2V0dGluZ3MgdXBkYXRlOnRlbmFudF9zZXR0aW5ncyByZWFkOmxvZ3MgcmVhZDpzaGllbGRzIGNyZWF0ZTpzaGllbGRzIGRlbGV0ZTpzaGllbGRzIHVwZGF0ZTp0cmlnZ2VycyByZWFkOnRyaWdnZXJzIHJlYWQ6Z3JhbnRzIGRlbGV0ZTpncmFudHMgcmVhZDpndWFyZGlhbl9mYWN0b3JzIHVwZGF0ZTpndWFyZGlhbl9mYWN0b3JzIHJlYWQ6Z3VhcmRpYW5fZW5yb2xsbWVudHMgZGVsZXRlOmd1YXJkaWFuX2Vucm9sbG1lbnRzIGNyZWF0ZTpndWFyZGlhbl9lbnJvbGxtZW50X3RpY2tldHMgcmVhZDp1c2VyX2lkcF90b2tlbnMgY3JlYXRlOnBhc3N3b3Jkc19jaGVja2luZ19qb2IgZGVsZXRlOnBhc3N3b3Jkc19jaGVja2luZ19qb2IgcmVhZDpjdXN0b21fZG9tYWlucyBkZWxldGU6Y3VzdG9tX2RvbWFpbnMgY3JlYXRlOmN1c3RvbV9kb21haW5zIHJlYWQ6ZW1haWxfdGVtcGxhdGVzIGNyZWF0ZTplbWFpbF90ZW1wbGF0ZXMgdXBkYXRlOmVtYWlsX3RlbXBsYXRlcyByZWFkOm1mYV9wb2xpY2llcyB1cGRhdGU6bWZhX3BvbGljaWVzIHJlYWQ6cm9sZXMgY3JlYXRlOnJvbGVzIGRlbGV0ZTpyb2xlcyB1cGRhdGU6cm9sZXMiLCJndHkiOiJjbGllbnQtY3JlZGVudGlhbHMifQ.eNRFLP9BQQP8GpG-1wonSd5K2ieAq5N6A0LxE7cJsJe-tyR7utdPbX9HGv9yt13PIWjStT9XlMmoX5RW227abD_2T0tskBPhLCYWg91zLCnA3xhlTG4xKNMYm6_fDq3L1BVjo79tXBy8xKNauxhEgenp0X_szKVfejdYb0XwjnC4LZ1jcQZBM8WE4ZpUZz9wf4hnSgfcEnKCNrOD_HBhluJvOms2Isu5CSHrn3Vo5Hs9deShPnMwNmQbp55q_MDMVaAbsaT92eS5yNIJTvNfUuOc2LvhqEzULPmbUSXHjnESm2yRYCXJfG4vUfa3FaI5Bn42_EuSft_gJNqYIq_gJQ"
//	    },
//	    body:create_user_body,
//	    json: true
//    };
//    request(options, (error, response, body) => {
//        if (error){
//        	console.log(error);
//            return Promise.reject(error);
//        }
//        console.log(body);
//
//    });


	const merchant = {"name": name, "base": base, "trade_region": trade_region, "companyName": companyName};
	return datastore.save({"key":key, "data":merchant}).then(() => {return key;});
}


//Get merchant by ID
function get_merchant(merchant_id, owner) {
	const key = datastore.key([MERCHANT, parseInt(merchant_id,10)]);

	const q = datastore.createQuery(CARGO)
	.filter("owner.id", '=', merchant_id);
	return datastore.runQuery(q).then( (entities) => {
		var cargo = [];
		entities[0].forEach(function(item) {
			 cargo.push({"id": item[Datastore.KEY].id, "self": BASE_URL + /cargo/ + item[Datastore.KEY].id});
		});

		return datastore.get(key).then(function(entity) {

			if (entity[0].name !== owner) {
				return Promise.reject();
			}
			entity[0] = fromDatastore(entity[0]);
			entity[0].cargo = cargo;
			entity[0].self = BASE_URL + /merchants/ + merchant_id;

			return entity[0];
		});
	});
}


//Get all merchants
function get_merchants(offset, owner){
	var new_offset;

	if (isNaN(offset)) {
		new_offset = 0;
	} else {
		new_offset = offset;
	}

	const q = datastore.createQuery(MERCHANT).offset(new_offset).limit(5);
	return datastore.runQuery(q).then( (entities) => {
			return entities[0].map(fromDatastore)
			.map(function(item) {
				item.self = BASE_URL + /merchants/ + item.id;
				return item;
			}).filter( item => item.name === owner);
		});
}


//Edit a merchant
function put_merchant(id, name, base, trade_region, companyName, owner){
	return get_merchant(id, owner).then(function(){
	    const key = datastore.key([MERCHANT, parseInt(id,10)]);
	    const merchant = {"name": name, "base": base, "trade_region": trade_region, "companyName": companyName};
	    return datastore.save({"key":key, "data":merchant});
	});
}


//Delete a merchant
function delete_merchant(merchant_id, owner){
	return get_merchant(merchant_id, owner).then(function(merc) {
		console.log(merc);
		if (merc.length === 0) {
			console.log("Rejected promise");
			return Promise.reject();
		}
		const key = datastore.key([MERCHANT, parseInt(merchant_id,10)]);

		return get_cargos_internal().then(function(cargos){
			cargos.forEach(function(cargo){
				if (cargo.owner !== null && cargo.owner.id === merchant_id) {
					const key2 = datastore.key([CARGO, parseInt(cargo.id,10)]);
	  				const new_cargo = {"weight": cargo.weight, "owner": null, "content": cargo.content, "delivery_date": cargo.delivery_date};
	  				datastore.save({"key":key2, "data":new_cargo}).then(() => {return key;});
				}
			});
			return datastore.delete(key);
		});
	});

}




/*-------------- Begin Cargo-Merchant Model Functions --------------*/
//Get cargo from a ship
function get_cargo_from_merchant(merchant_id, offset) {
	var new_offset;

	if (isNaN(offset)) {
		new_offset = 0;
	} else {
		new_offset = offset;
	}

	const q = datastore.createQuery(CARGO)
	.filter("owner.id", '=', merchant_id)
	.offset(new_offset)
	.limit(5);
	return datastore.runQuery(q).then( (entities) => {
			return entities[0].map(fromDatastore)
			.map(function(item) {
				item.self = BASE_URL + /cargo/ + item.id;
				return item;
			});
		});
}


//Add cargo to a merchant w/ owner data
function add_cargo_to_merchant(cargo_id, merchant_id) {
    const key = datastore.key([CARGO, parseInt(cargo_id,10)]);

	return get_cargo_internal(cargo_id).then(function(cargo){
		if (cargo.owner !== null) {
			console.log("here");
			return Promise.reject("cargo already belongs to merchant");
		}
		return get_cargos_internal();
	}).then(function(cargos){
		cargos.forEach(function(cargo){
			if (cargo.owner !== null && cargo.owner.id === merchant_id && cargo.id === cargo_id) {
				const key2 = datastore.key([CARGO, parseInt(cargo.id,10)]);
  				const new_cargo = {"weight": cargo.weight, "carrier": cargo.carrier, "owner": null, "content": cargo.content, "delivery_date": cargo.delivery_date};
  				return datastore.save({"key":key2, "data":new_cargo}).then(() => {return key;});
			}
		});
		const key2 = datastore.key([MERCHANT, parseInt(merchant_id,10)]);

		return datastore.get(key2);
	}).then(function(merchant) {
		console.log(merchant[0].name);

		return get_cargo_internal(cargo_id).then(function(cargo) {
    		const new_cargo = {
    			"weight": cargo.weight,
    			"carrier": cargo.carrier,
    			"owner": {
    				"name": merchant[0].name,
    				"id": merchant_id,
    				"self": BASE_URL + "/merchants/" + merchant_id
    			},
    			"content": cargo.content,
    			"delivery_date": cargo.delivery_date
    		};

    		return datastore.save({"key":key, "data":new_cargo});
    	});

    });
}


//Remove cargo from a merchant
function remove_cargo_from_merchant(cargo_id, merchant_id) {
	const key = datastore.key([CARGO, parseInt(cargo_id,10)]);

	return get_cargo_internal(cargo_id).then(function(cargo) {
		if (cargo.owner.id !== merchant_id) {
			return Promise.reject();
		}

    	const new_cargo = {
    		"weight": cargo.weight,
    		"carrier": null,
    		"owner": null,
    		"content": cargo.content,
    		"delivery_date": cargo.delivery_date
    	};
    	return datastore.save({"key":key, "data":new_cargo});
    }).catch();
}


/* ------------- Begin Cargo Model Functions ------------- */

//Add a new cargo
function post_cargo(weight, content, delivery_date){
  var key = datastore.key(CARGO);
  const new_cargo = {"weight": weight, "carrier": null, "owner": null, "content": content, "delivery_date": delivery_date};
  return datastore.save({"key":key, "data":new_cargo}).then(() => {return key;});
}


//Get cargo
function get_cargos(offset, owner) {
	var new_offset;

	if (isNaN(offset)) {
		new_offset = 0;
	} else {
		new_offset = offset;
	}

	const q = datastore.createQuery(CARGO).offset(new_offset).limit(5);
	return datastore.runQuery(q).then( (entities) => {
			return entities[0].map(fromDatastore)
			.map(function(item) {
				item.self = BASE_URL + /cargo/ + item.id;
				return item;
			}).filter( item => item.owner === null || item.owner.name === owner);
		});
}

//Get list of all cargo (as helper)
function get_cargos_internal() {
	const q = datastore.createQuery(CARGO);
	return datastore.runQuery(q).then( (entities) => {
			return entities[0].map(fromDatastore)
			.map(function(item) {
				item.self = BASE_URL + /cargo/ + item.id;
				return item;
			});
		});
}



//Get cargo by ID
function get_cargo_internal(id) {
	console.log("getting cargo");
	const key = datastore.key([CARGO, parseInt(id,10)]);
	return datastore.get(key).then(function(entity) {
		entity[0] = fromDatastore(entity[0]);
		entity[0].self = BASE_URL + /cargo/ + id;
		console.log(entity[0]);
		return entity[0];
	});
}

//Get cargo by ID
function get_cargo(id, owner) {
	console.log("getting cargo");
	const key = datastore.key([CARGO, parseInt(id,10)]);
	return datastore.get(key).then(function(entity) {
		if (entity[0].owner !== null && entity[0].owner.name !== owner) {
			return Promise.reject();
		}
		entity[0] = fromDatastore(entity[0]);
		entity[0].self = BASE_URL + /cargo/ + id;
		console.log(entity[0]);
		return entity[0];
	});
}


//Get cargo from a ship
function get_cargo_from_ship(ship_id, offset, owner) {
	var new_offset;

	if (isNaN(offset)) {
		new_offset = 0;
	} else {
		new_offset = offset;
	}

	const q = datastore.createQuery(CARGO)
	.filter("carrier.id", '=', ship_id)
	.offset(new_offset)
	.limit(5);
	return datastore.runQuery(q).then( (entities) => {
			return entities[0].map(fromDatastore)
			.map(function(item) {
				item.self = BASE_URL + /cargo/ + item.id;
				return item;
			}).filter( item => item.owner === null || item.owner.name === owner);
		});
}


//Add cargo to a ship w/ carrier and owner data
function add_cargo_to_ship(cargo_id, ship_id, owner) {
    const key = datastore.key([CARGO, parseInt(cargo_id,10)]);

	return get_cargo(cargo_id, owner).then(function(cargo){
		return get_cargos_internal();
	}).then(function(cargos){
		cargos.forEach(function(cargo){
			if (cargo.carrier !== null && cargo.carrier.id === ship_id && cargo.id === cargo_id) {
				const key2 = datastore.key([CARGO, parseInt(cargo.id,10)]);
  				const new_cargo = {"weight": cargo.weight, "carrier": null, "owner": cargo.owner, "content": cargo.content, "delivery_date": cargo.delivery_date};
  				return datastore.save({"key":key2, "data":new_cargo}).then(() => {return key;});
			}
		});
		const key2 = datastore.key([SHIP, parseInt(ship_id,10)]);

		return datastore.get(key2);
	}).then(function(ship) {
		return get_cargo_internal(cargo_id).then(function(cargo) {
    		const new_cargo = {
    			"weight": cargo.weight,
    			"carrier": {
    				"name": ship.name,
    				"id": ship_id,
    				"self": BASE_URL + "/ships/" + ship_id
    			},
    			"owner": cargo.owner,
    			"content": cargo.content,
    			"delivery_date": cargo.delivery_date
    		};

    		return datastore.save({"key":key, "data":new_cargo});
    	});
    });
}


//Remove cargo from a ship
function remove_cargo_from_ship(cargo_id, ship_id, owner) {
	const key = datastore.key([CARGO, parseInt(cargo_id,10)]);

	return get_cargo(cargo_id, owner).then(function(cargo) {
		if (cargo.carrier.id !== ship_id && cargo.owner !== null && cargo.owner.name !== owner) {
			return Promise.reject();
		}

    	const new_cargo = {
    		"weight": cargo.weight,
    		"carrier": null,
    		"owner": null,
    		"content": cargo.content,
    		"delivery_date": cargo.delivery_date
    	};
    	return datastore.save({"key":key, "data":new_cargo});
    }).catch();
}


//Edit specific cargo
function put_cargo(id, weight, content, delivery_date, owner){
    const key = datastore.key([CARGO, parseInt(id,10)]);

    return get_cargo(id, owner).then(function(cargo) {
  		const new_cargo = {"weight": weight, "carrier": cargo.carrier, "owner": cargo.owner, "content": content, "delivery_date": delivery_date};
    	return datastore.save({"key":key, "data":new_cargo});
    });
}


//Delete specific cargo
function delete_cargo(id, owner){
	return get_cargo(id, owner).then(function() {
		const key = datastore.key([CARGO, parseInt(id,10)]);
    	return datastore.delete(key);
	});
}


/* ------------- Begin Ship Model Functions ------------- */

//Add a new ship
function post_ship(name, type, length){
	if (isNaN(length)) {
  		return Promise.reject();
  	}
  	var key = datastore.key(SHIP);
	const ship = {"name": name, "type": type, "length": length};
	return datastore.save({"key":key, "data":ship}).then(() => {return key;});
}


//Get ship by ID
function get_ship(ship_id) {
	const key = datastore.key([SHIP, parseInt(ship_id,10)]);

	const q = datastore.createQuery(CARGO)
	.filter("carrier.id", '=', ship_id);
	return datastore.runQuery(q).then( (entities) => {
		var cargo = [];
		entities[0].forEach(function(item) {
			 cargo.push({"id": item[Datastore.KEY].id, "self": BASE_URL + /cargo/ + item[Datastore.KEY].id});
		});

		return datastore.get(key).then(function(entity) {
			entity[0] = fromDatastore(entity[0]);
			entity[0].cargo = cargo;
			entity[0].self = BASE_URL + /ships/ + ship_id;

			return entity[0];
		});
	});
}


//Get all ships
function get_ships(offset){
	var new_offset;

	if (isNaN(offset)) {
		new_offset = 0;
	} else {
		new_offset = offset;
	}

	const q = datastore.createQuery(SHIP).offset(new_offset).limit(5);
	return datastore.runQuery(q).then( (entities) => {
			return entities[0].map(fromDatastore)
			.map(function(item) {
				item.self = BASE_URL + /ships/ + item.id;
				return item;
			});
		});
}


//Edit a ship
function put_ship(id, name, type, length){
	if (isNaN(length)) {
  		return Promise.reject();
  	}
    const key = datastore.key([SHIP, parseInt(id,10)]);
    const ship = {"name": name, "type": type, "length": length};
    return datastore.save({"key":key, "data":ship});
}


//Delete a ship
function delete_ship(ship_id){
	const key = datastore.key([SHIP, parseInt(ship_id,10)]);

	return get_cargos_internal().then(function(cargos){
		cargos.forEach(function(cargo){
			if (cargo.carrier !== null && cargo.carrier.id === ship_id) {
				const key2 = datastore.key([CARGO, parseInt(cargo.id,10)]);
  				const new_cargo = {"weight": cargo.weight, "carrier": null, "content": cargo.content, "delivery_date": cargo.delivery_date, "owner": cargo.owner};
  				datastore.save({"key":key2, "data":new_cargo}).then(() => {return key;});
			}
		});
		return datastore.delete(key);
	});

}


/* ------------- Begin Cargo Controller Functions ------------- */

//Get all cargo
//Send 200
router.get('/cargo', checkJwt, function(req, res){
 var offset = 0;
 if (!isNaN(req.query.offset)) {
 	offset = parseInt(req.query.offset, 10);
 }
 var next_offset = offset + 5;
 get_cargos(req.query.offset, req.user.name)
	.then( function(result) {
		var cargo = {
			"result": result,
			"next": BASE_URL + "/cargo?offset=" + next_offset,
			"count": result.length
		};

        res.status(200).json(cargo);
    }).catch(function(error) {
    	console.log("Error!!!");
    	console.log(error);
    	res.status(403).end();
    });
});


//Get cargo by ID
//Send 200
//hascheck
router.get('/cargo/:id', checkJwt, function(req, res){
  get_cargo(req.params.id, req.user.name)
	.then( (cargo) => {
    	const accepts = req.accepts(['application/json']);
    	if(!accepts){
        	res.status(406).send('Not Acceptable');
   	 	} else if(accepts === 'application/json'){
          	res.status(200).json(cargo);
    	} else {
    		res.status(404).send('Not found!');
    	}
    }).catch(function() {
    	res.status(403).send('Not found!');
    });
});


//Get cargo from a specific ship
router.get('/ships/:id/cargo', checkJwt, function(req, res){
 var offset = 0;
 if (!isNaN(req.query.offset)) {
 	offset = parseInt(req.query.offset, 10);
 }
 var next_offset = offset + 5;
 get_cargo_from_ship(req.params.id, offset, req.user.name)
	.then( function(result) {
		var cargo = {
			"result": result,
			"next": BASE_URL + "/ships/" + req.params.id + "/cargo?offset=" + next_offset,
			"count": result.length
		};
        res.status(200).json(cargo);
    })    .catch(function() {
    	res.status(403).end();
    });
});


//Add new cargo
//Send 201
router.post('/cargo', checkJwt, function(req, res){
    post_cargo(req.body.weight, req.body.content, req.body.delivery_date)
    .then(function(key) {res.status(201).send('{ "id": ' + key.id + ' }');} )
    .catch(function() {
    	res.status(403).end();
    });
});


//Edit specific cargo
//Send 201
router.put('/cargo/:cargo_id', checkJwt, function(req, res){
    put_cargo(req.params.cargo_id, req.body.weight, req.body.content, req.body.delivery_date, req.user.name)
    .then(function() {res.status(201).end();} )
    .catch(function() {
    	res.status(403).end();
    });
});


//Put cargo onto a specific ship
//Send 201
router.put('/ships/:ship_id/cargo/:cargo_id', checkJwt, function(req, res){
    add_cargo_to_ship(req.params.cargo_id, req.params.ship_id, req.user.name)
    .then(function(){
    	res.status(201).end();
    }).catch(function() {
    	res.status(403).end();
    });
});


//Remove cargo from a specific ship
//Send 204
router.delete('/ships/:ship_id/cargo/:cargo_id', checkJwt, function(req, res){
    remove_cargo_from_ship(req.params.cargo_id, req.params.ship_id, req.user.name)
    .then(function(){
    	res.status(204).end();
    });
});


//Delete specific cargo
//Send 204
router.delete('/cargo/:id', checkJwt, function(req, res){
    delete_cargo(req.params.id, req.user.name)
    .then(res.status(204).end())
    .catch(function() {
    	res.status(403).end();
    });
});


//Returns 405 status code if user tries to post in wrong place
router.post('/cargo/:id', checkJwt, function (req, res){
    res.set('Accept', 'GET, PUT');
    res.status(405).end();
});


//Returns 405 status code if user tries to delete wrong items
router.delete('/cargo', checkJwt, function (req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});



/* ------------- Begin Ship Controller Functions ------------- */

//Get specific ship
//Send 200 or 406 if not JSON
router.get('/ships/:id', function(req, res){
    get_ship(req.params.id).then( (ships) => {
      const accepts = req.accepts(['application/json']);
      if(!accepts){
          res.status(406).send('Not an acceptable content type');
      } else if(accepts === 'application/json'){
          res.status(200).json(ships);
      } else { res.status(500).send('Content type got messed up!'); }
  }).catch(function(){console.log("not here");
    res.status(403).end();});
});


//Get all ships
//Send 200
router.get('/ships', function(req, res){

 	var offset = 0;
 	if (!isNaN(req.query.offset)) {
 		offset = parseInt(req.query.offset, 10);
 	}
 	var next_offset = offset + 5;

    get_ships(req.query.offset)
	.then( (result) => {
		var ships = {
			"result": result,
			"next": BASE_URL + "/cargo?offset=" + next_offset,
			"count": result.length
		};
        res.status(200).json(ships);
    })
    .catch(function() {
    	res.status(403).end();
    });
});


//Add a ship
//Send 201
router.post('/ships', function(req, res){
    post_ship(req.body.name, req.body.type, req.body.length)
    .then( key => {res.status(201).send('{ "id": ' + key.id + ' }');} )
    .catch(function() {
    	res.status(403).end();
    });
});


//Edit a specific ship
//Send 201
router.put('/ships/:id', function(req, res){
    put_ship(req.params.id, req.body.name, req.body.type, req.body.length)
    .then(res.status(201).end())
    .catch(function() {
    	res.status(403).end();
    });
});


//Delete a specific ship
//Send 204
router.delete('/ships/:id', function(req, res){
    delete_ship(req.params.id).then(res.status(204).end())
    .catch(function() {
    	res.status(403).end();
    });
});


//Returns 405 status code if user tries to post in wrong place
router.post('/ships/:id', function (req, res){
    res.set('Accept', 'GET, PUT');
    res.status(405).end();
});


//Returns 405 status code if user tries to delete wrong items
router.delete('/ships', function (req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});


/* ------------- Begin Merchant Controller Functions ------------- */

//Get specific merchant
//Send 200 or 406 if not JSON
router.get('/merchants/:id', checkJwt, function(req, res){
    get_merchant(req.params.id, req.user.name).then( (merchants) => {
      const accepts = req.accepts(['application/json']);
      if(!accepts){
          res.status(406).send('Not an acceptable content type');
      } else if(accepts === 'application/json'){
          res.status(200).json(merchants);
      } else { res.status(500).send('Content type got messed up!'); }
  }).catch(function() {
  	console.log("not here");
    res.status(403).end();});
});


//Get all merchants
//Send 200
router.get('/merchants', checkJwt, function(req, res){
 	var offset = 0;
 	if (!isNaN(req.query.offset)) {
 		offset = parseInt(req.query.offset, 10);
 	}
 	var next_offset = offset + 5;

    get_merchants(req.query.offset, req.user.name)
	.then( (result) => {
		var merchants = {
			"result": result,
			"next": BASE_URL + "/cargo?offset=" + next_offset,
			"count": result.length
		};
        res.status(200).json(merchants);
    })
    .catch(function() {
    	res.status(403).end();
    });
});


//Add a merchant
//Send 201
router.post('/merchants', checkJwt, function(req, res){
    post_merchant(req.body.name, req.body.base, req.body.trade_region, req.body.companyName)
    .then( key => {res.status(201).send('{ "id": ' + key.id + ' }');} )
    .catch(function() {
    	res.status(403).end();
    });
});


//Edit a specific merchant
//Send 201
router.put('/merchants/:id', checkJwt, function(req, res){
    put_merchant(req.params.id, req.body.name, req.body.base, req.body.trade_region, req.body.companyName, req.user.name)
    .then(res.status(201).end())
    .catch(function() {
    	res.status(403).end();
    });
});


//Delete a specific merchant
//Send 204
router.delete('/merchants/:id', checkJwt, function(req, res){
    delete_merchant(req.params.id, req.user.name)
    .then(res.status(204).end())
    .catch(function() {
    	res.status(403).end();
    });
});


//Returns 405 status code if user tries to post in wrong place
router.post('/merchants/:id', checkJwt, function (req, res){
    res.set('Accept', 'GET, PUT');
    res.status(405).end();
});


//Returns 405 status code if user tries to delete wrong items
router.delete('/merchants', checkJwt, function (req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});


/* ------------- Begin Merchant-Cargo Controller Functions ------------- */


//Put cargo onto a specific merchant
//Send 201
router.put('/merchants/:merchant_id/cargo/:cargo_id', checkJwt, function(req, res){
    add_cargo_to_merchant(req.params.cargo_id, req.params.merchant_id)
    .then(function(){
    	res.status(201).end();
    }).catch(function() {
    	res.status(403).end();
    });
});



//Get cargo from a specific merchant
router.get('/merchants/:id/cargo', checkJwt, function(req, res){
 var offset = 0;
 if (!isNaN(req.query.offset)) {
 	offset = parseInt(req.query.offset, 10);
 }
 var next_offset = offset + 5;
 get_cargo_from_merchant(req.params.id, offset)
	.then( function(result) {
		var cargo = {
			"result": result,
			"next": BASE_URL + "/merchant/" + req.params.id + "/cargo?offset=" + next_offset,
			"count": result.length
		};
        res.status(200).json(cargo);
    })    .catch(function() {
    	res.status(404).end();
    });
});


//Remove cargo from a specific merchant
//Send 204
router.delete('/merchants/:merchant_id/cargo/:cargo_id', checkJwt, function(req, res){
    remove_cargo_from_merchant(req.params.cargo_id, req.params.merchant_id)
    .then(function(){
    	res.status(204).end();
    });
});




app.use('/', router);
app.use('/login', login);



/* ------------- Error Handling Functions ------------- */

//Error handling: 404
app.use(function(req, res) {
	res.status(404);
	res.header('Access-Control-Allow-Origin', '*');
	res.send('404');

});


//Error handling: 500
app.use(function(req, res) {
	//console.error(err.stack);
	res.status(500);
	res.header('Access-Control-Allow-Origin', '*');
	res.send('500');
});


/* ------------- Start server ------------- */

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
