/* ------------- Begin Merchant Model Functions ------------- */

//Add a new merchant
function post_merchant(name, base, trade_region){
  var key = datastore.key(MERCHANT);
	const merchant = {"name": name, "operating base": base, "trade region": trade_region};
	return datastore.save({"key":key, "data":merchant}).then(() => {return key;});
}


//Get merchant by ID
function get_merchant(merchant_id) {
	const key = datastore.key([MERCHANT, parseInt(merchant_id,10)]);

	const q = datastore.createQuery(CARGO)
	.filter("owner.id", '=', merchant_id);
	return datastore.runQuery(q).then( (entities) => {
		var cargo = [];
		entities[0].forEach(function(item) {
			 cargo.push({"id": item[Datastore.KEY].id, "self": BASE_URL + /cargo/ + item[Datastore.KEY].id});
		});

		return datastore.get(key).then(function(entity) {
			entity[0] = fromDatastore(entity[0]);
			entity[0].cargo = cargo;
			entity[0].self = BASE_URL + /merchants/ + merchant_id;

			return entity[0];
		});
	});
}


//Get all merchants
function get_merchants(offset){
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
			});
		});
}


//Edit a merchant
function put_merchant(id, name, base, trade_region){
    const key = datastore.key([MERCHANT, parseInt(id,10)]);
    const merchant = {"name": name, "operating base": base, "trade region": trade_region};
    return datastore.save({"key":key, "data":merchant});
}


//Delete a merchant
function delete_merchant(merchant_id){
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

}









/* ------------- Begin Merchant Controller Functions ------------- */

//Get specific merchant
//Send 200 or 406 if not JSON
app.get('/merchants/:id', function(req, res){
    get_merchant(req.params.id).then( (merchants) => {
      const accepts = req.accepts(['application/json']);
      if(!accepts){
          res.status(406).send('Not an acceptable content type');
      } else if(accepts === 'application/json'){
          res.status(200).json(merchants);
      } else { res.status(500).send('Content type got messed up!'); }
  }).catch(function(){console.log("not here");
    res.status(403).end();});
});


//Get all merchants
//Send 200
app.get('/merchants', function(req, res){
 	var offset = 0;
 	if (!isNaN(req.query.offset)) {
 		offset = parseInt(req.query.offset, 10);
 	}
 	var next_offset = offset + 3;

    get_merchants(req.query.offset)
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
app.post('/merchants', function(req, res){
    post_merchant(req.body.name, req.body.base, req.body.trade_region)
    .then( key => {res.status(201).send('{ "id": ' + key.id + ' }');} )
    .catch(function() {
    	res.status(403).end();
    });
});


//Edit a specific merchant
//Send 201
app.put('/merchants/:id', function(req, res){
    put_merchant(req.params.id, req.body.name, req.body.base, req.body.trade_region)
    .then(res.status(201).end())
    .catch(function() {
    	res.status(403).end();
    });
});


//Delete a specific merchant
//Send 204
app.delete('/merchants/:id', function(req, res){
    delete_merchant(req.params.id).then(res.status(204).end())
    .catch(function() {
    	res.status(403).end();
    });
});


//Returns 405 status code if user tries to post in wrong place
app.post('/merchants/:id', function (req, res){
    res.set('Accept', 'GET, PUT');
    res.status(405).end();
});


//Returns 405 status code if user tries to delete wrong items
app.delete('/merchants', function (req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});


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
