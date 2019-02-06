const express = require('express');
const app = express();
const Datastore = require('@google-cloud/datastore');
const bodyParser = require('body-parser');

//Connects to Google App Engine's Datastore
const projectId = 'ship-cargo-merchant-api';
const datastore = new Datastore({projectId:projectId});

//Defines kinds
const SHIP = "Ship";
const CARGO = "cargo";
const BASE_URL = "https://ship-cargo-merchant-api.appspot.com";

app.use(bodyParser.json());

//Get ID from the object key
function fromDatastore(item){
    item.id = item[Datastore.KEY].id;

    return item;
}


/* ------------- Cargo Functions ------------- */

//Add a new cargo
function post_cargo(weight, content, delivery_date){
  var key = datastore.key(CARGO);
  const new_cargo = {"weight": weight, "carrier": null, "content": content, "delivery_date": delivery_date};
  return datastore.save({"key":key, "data":new_cargo}).then(() => {return key;});
}


function get_cargos(offset) {
	var new_offset;

	if (isNaN(offset)) {
		new_offset = 0;
	} else {
		new_offset = offset;
	}

	const q = datastore.createQuery(CARGO).offset(new_offset).limit(3);
	return datastore.runQuery(q).then( (entities) => {
			return entities[0].map(fromDatastore)
			.map(function(item) {
				item.self = BASE_URL + /cargo/ + item.id;
				return item;
			});
		});
}

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


function get_cargo(id) {
	const key = datastore.key([CARGO, parseInt(id,10)]);
	return datastore.get(key).then(function(entity) {
		entity[0] = fromDatastore(entity[0]);
		entity[0].self = BASE_URL + /cargo/ + id;
		return entity[0];
	});
}


function get_cargo_from_ship(ship_id, offset) {
	var new_offset;

	if (isNaN(offset)) {
		new_offset = 0;
	} else {
		new_offset = offset;
	}

	const q = datastore.createQuery(CARGO)
	.filter("carrier.id", '=', ship_id)
	.offset(new_offset)
	.limit(3);
	return datastore.runQuery(q).then( (entities) => {
			return entities[0].map(fromDatastore)
			.map(function(item) {
				item.self = BASE_URL + /cargo/ + item.id;
				return item;
			});
		});
}


function add_cargo_to_ship(cargo_id, ship_id) {
    const key = datastore.key([CARGO, parseInt(cargo_id,10)]);

	return get_cargo(cargo_id).then(function(cargo){
		if (cargo.carrier !== null) {
			return Promise.reject();
		}
		return get_cargos_internal();
	}).then(function(cargos){
		cargos.forEach(function(cargo){
			if (cargo.carrier !== null && cargo.carrier.id === ship_id && cargo.id === cargo_id) {
				const key2 = datastore.key([CARGO, parseInt(cargo.id,10)]);
  				const new_cargo = {"weight": cargo.weight, "carrier": null, "content": cargo.content, "delivery_date": cargo.delivery_date};
  				return datastore.save({"key":key2, "data":new_cargo}).then(() => {return key;});
			}
		});
	const key2 = datastore.key([SHIP, parseInt(ship_id,10)]);

	return datastore.get(key2);
	}).then(function(ship) {
		return get_cargo(cargo_id).then(function(cargo) {
    		const new_cargo = {
    			"weight": cargo.weight,
    			"carrier": {
    				"name": ship.name,
    				"id": ship_id,
    				"self": BASE_URL + "/ships/" + ship_id
    			},
    			"content": cargo.content,
    			"delivery_date": cargo.delivery_date
    		};
    		return datastore.save({"key":key, "data":new_cargo});
    	});

    }).catch();
}


function remove_cargo_from_ship(cargo_id, ship_id) {
	const key = datastore.key([CARGO, parseInt(cargo_id,10)]);

	return get_cargo(cargo_id).then(function(cargo) {
		if (cargo.carrier.id !== ship_id) {
			return Promise.reject();
		}

    	const new_cargo = {
    		"weight": cargo.weight,
    		"carrier": null,
    		"content": cargo.content,
    		"delivery_date": cargo.delivery_date
    	};
    	return datastore.save({"key":key, "data":new_cargo});
    }).catch();
}


function put_cargo(id, weight, content, delivery_date){
    const key = datastore.key([CARGO, parseInt(id,10)]);

    return get_cargo(id).then(function(cargo) {

  const new_cargo = {"weight": weight, "carrier": cargo.carrier, "content": content, "delivery_date": delivery_date};
    	return datastore.save({"key":key, "data":new_cargo});
    }).catch();
}


//Delete specific cargo
function delete_cargo(id){
    const key = datastore.key([CARGO, parseInt(id,10)]);
    return datastore.delete(key);
}




/* ------------- Ship Functions ------------- */

//Add a new ship
function post_ship(name, type, length){
	if (isNaN(length)) {
  		return Promise.reject();
  	}
  	var key = datastore.key(SHIP);
	const ship = {"name": name, "type": type, "length": length};
	return datastore.save({"key":key, "data":ship}).then(() => {return key;});
}


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


function get_ships(offset){
	var new_offset;

	if (isNaN(offset)) {
		new_offset = 0;
	} else {
		new_offset = offset;
	}

	const q = datastore.createQuery(SHIP).offset(new_offset).limit(3);
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


function delete_ship(ship_id){
	const key = datastore.key([SHIP, parseInt(ship_id,10)]);

	return get_cargos_internal().then(function(cargos){
		cargos.forEach(function(cargo){
			if (cargo.carrier !== null && cargo.carrier.id === ship_id) {
				const key2 = datastore.key([CARGO, parseInt(cargo.id,10)]);
  				const new_cargo = {"weight": cargo.weight, "carrier": null, "content": cargo.content, "delivery_date": cargo.delivery_date};
  				datastore.save({"key":key2, "data":new_cargo}).then(() => {return key;});
			}
		});
		return datastore.delete(key);
	});

}




/* ------------- Cargo Controller Functions ------------- */

app.get('/cargo', function(req, res){
 var offset = 0;
 if (!isNaN(req.query.offset)) {
 	offset = parseInt(req.query.offset, 10);
 }
 var next_offset = offset + 3;
 get_cargos(req.query.offset)
	.then( function(result) {
		var cargo = {
			"result": result,
			"next": BASE_URL + "/cargo?offset=" + next_offset,
			"count": result.length
		};

        res.status(200).json(cargo);
    }).catch(function() {
    	res.status(403).end();
    });
});


app.get('/cargo/:id', function(req, res){
 get_cargo(req.params.id)
	.then( (cargo) => {
        res.status(200).json(cargo);
    })    .catch(function() {
    	res.status(403).end();
    });
});


//Get cargo from a specific ship
app.get('/ships/:id/cargo', function(req, res){
 var offset = 0;
 if (!isNaN(req.query.offset)) {
 	offset = parseInt(req.query.offset, 10);
 }
 var next_offset = offset + 3;
 get_cargo_from_ship(req.params.id, offset)
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


app.post('/cargo', function(req, res){
    post_cargo(req.body.weight, req.body.content, req.body.delivery_date)
    .then(function(key) {res.status(201).send('{ "id": ' + key.id + ' }');} )
    .catch(function() {
    	res.status(403).end();
    });
});

app.put('/cargo/:cargo_id', function(req, res){
    put_cargo(req.params.cargo_id, req.body.weight, req.body.content, req.body.delivery_date)
    .then(function() {res.status(200).end();} )
    .catch(function() {
    	res.status(403).end();
    });
});



//Put cargo onto a specific ship
app.put('/ships/:ship_id/cargo/:cargo_id', function(req, res){
    add_cargo_to_ship(req.params.cargo_id, req.params.ship_id)
    .then(function(){
    	res.status(200).end();
    })
    .catch(function() {
    	res.status(403).end();
    });
});


//Remove cargo from a specific ship
app.delete('/ships/:ship_id/cargo/:cargo_id', function(req, res){
    remove_cargo_from_ship(req.params.cargo_id, req.params.ship_id)
    .then(function(){
    	res.status(200).end();
    })
    .catch(function() {
    	res.status(403).end();
    });
});


app.delete('/cargo/:id', function(req, res){
    delete_cargo(req.params.id).then(res.status(204).end())
    .catch(function() {
    	res.status(403).end();
    });
});



/* ------------- Ship Controller Functions ------------- */

//Get specific ship
app.get('/ships/:id', function(req, res){
    get_ship(req.params.id).then(function(ship) {
    	res.status(200).json(ship);
    }).catch(function() {
    	res.status(403).end();
    });

});


//Get all ships
app.get('/ships', function(req, res){
 	var offset = 0;
 	if (!isNaN(req.query.offset)) {
 		offset = parseInt(req.query.offset, 10);
 	}
 	var next_offset = offset + 3;

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
app.post('/ships', function(req, res){
    post_ship(req.body.name, req.body.type, req.body.length)
    .then( key => {res.status(201).send('{ "id": ' + key.id + ' }');} )
    .catch(function() {
    	res.status(403).end();
    });
});


//Edit a specific ship
app.put('/ships/:id', function(req, res){
    put_ship(req.params.id, req.body.name, req.body.type, req.body.length)
    .then(res.status(200).end())
    .catch(function() {
    	res.status(403).end();
    });
});


//Delete a specific ship
app.delete('/ships/:id', function(req, res){
    delete_ship(req.params.id).then(res.status(204).end())
    .catch(function() {
    	res.status(403).end();
    });
});


// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
