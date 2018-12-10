/**
 * Issue transaction processor function.
 * @param {hu.bme.mit.temalab.Issue} tx The Issue transaction instance.
 * @transaction
 */
async function issue(tx) {
  let factory = getFactory();
  let vehicleRegistry = await getParticipantRegistry('hu.bme.mit.temalab.Vehicle');
  let tokenRegistry = await getAssetRegistry('hu.bme.mit.temalab.PreemptionUtilityToken');
  try {
  // Check if the vehicle truly exists.
  let vehicleExists = await vehicleRegistry.exists(tx.vehicle.vehicleId);
  if(!vehicleExists) throw "No vehicle exists with the given ID.";
  // DateTime sanity check. 10 minutes in millis.
  if(new Date() - 10*60*1000 > tx.dateTime || new Date() < tx.dateTime) throw "Wrong date."
  let tokenArray = new Array();
  
  /* Generating unique token ids is the responsibility of the Traffic Authority. The script checks if the provided tokenId is truly unique. */
  for( let i = 0; i < tx.tokenIds.length; i++) {
    let tokenExists = await tokenRegistry.exists(tx.tokenIds[i]);
    // Check if tokenId is truly unique
    if(!tokenExists) {
  	let token = await factory.newResource('hu.bme.mit.temalab', 'PreemptionUtilityToken', tx.tokenIds[i]);
    token.owner = tx.vehicle;
    token.latestUpdateTime = tx.dateTime;
    tokenArray.push(token);
    }
  }
  await tokenRegistry.addAll(tokenArray);
  tx.vehicle.tokens = await tx.vehicle.tokens.concat(tokenArray);
  await vehicleRegistry.update(tx.vehicle);
  }
  catch(err) { console.log(err); }
}

/**
 * Burn transaction processor function.
 * @param {hu.bme.mit.temalab.Burn} tx The Burn transaction instance.
 * @transaction
 */
async function burn(tx) {  
  let vehicleRegistry = await getParticipantRegistry('hu.bme.mit.temalab.Vehicle');
  let tokenRegistry = await getAssetRegistry('hu.bme.mit.temalab.PreemptionUtilityToken');
  
  let vehicleExists = await vehicleRegistry.exists(tx.vehicle.vehicleId);
  let tokenArray = new Array();
  
  try{
    if(!vehicleExists) throw "Vehicle with the given ID does not exist!";
    // DateTime sanity check. 10 minutes in millis.
  	if(new Date() - 10*60*1000 > tx.dateTime || new Date() < tx.dateTime) throw "Wrong date."
      for( let i = 0; i < tx.tokens.length; i++ ) {
        // Check if the given token truly exists.
        let tokenExists = await tokenRegistry.exists(tx.tokens[i].tokenId);
      	// If the given token belongs to the given vehicle,
        if(tokenExists && !(tx.vehicle.tokens.indexOf(tx.tokens[i]) === -1)) {
          // it gets removed from the vehicle's array,
          tx.vehicle.tokens.splice(tx.vehicle.tokens.indexOf(tx.tokens[i]), 1);
          // and it becomes invalidated.
          tx.tokens[i].isValid = false;
          tx.tokens[i].latestUpdateTime = tx.dateTime;
          // Only those tokens will be updated, which really belong to the vehicle
          tokenArray.push(tx.tokens[i]);
        }
      }
    if(!tokenExists) throw "Token with the given ID does not exist!";
    /* Updating the appropriate registries */
    await tokenRegistry.updateAll(tokenArray);
    await vehicleRegistry.update(tx.vehicle);
  }
  catch(err) {
    console.log(err);
  }
}

/**
 * UnBurn transaction processor function.
 * @param {hu.bme.mit.temalab.UnBurn} tx The UnBurn transaction instance.
 * @transaction
 */
async function unBurn(tx) {
  let vehicleRegistry = await getParticipantRegistry('hu.bme.mit.temalab.Vehicle');
  let tokenRegistry = await getAssetRegistry('hu.bme.mit.temalab.PreemptionUtilityToken');
  let vehicles = new Array();
  try {
    // DateTime sanity check. 10 minutes in millis.
  	if(new Date() - 10*60*1000 > tx.dateTime || new Date() < tx.dateTime) throw "Wrong date."
  
    for ( let i = 0; i < tx.tokens.length; i++) {
      try{
        let tokenExists = await tokenRegistry.exists(tx.tokens[i].tokenId);
        if(!tokenExists) throw "Token with given ID does not exist.";
        // If the TrafficAuthority signed the token, and the token is missing from the vehicle's array,
        if(tx.tokens[i].trafficAuthoritySignature && tx.tokens[i].owner.tokens.indexOf(tx.tokens[i]) < 0) {
          // give it to the array,
          tx.tokens[i].owner.tokens.push(tx.tokens[i]);
          // validate it,
          tx.tokens[i].isValid = true;
          // and remove the signature of the Traffic Authority.
          tx.tokens[i].trafficAuthoritySignature = false;
          tx.tokens[i].latestUpdateTime = tx.dateTime;

          /* Register the vehicles which will need to be updated. */
          if(vehicles.indexOf(tx.tokens[i].owner) === -1)
            vehicles.push(tx.tokens[i].owner);
        }
      }
      catch(err){
        console.log(err);
      }
    }
  }
  catch(err){
    console.log(err);
  }
  
  /* Updating the appropriate registries batch-like */
  await vehicleRegistry.updateAll(vehicles);
  await tokenRegistry.updateAll(tx.tokens);
}

/**
 * Clear transaction processor function.
 * @param {hu.bme.mit.temalab.Clear} tx The Clear transaction instance.
 * @transaction
 */
async function clear(tx) {
  let tokenRegistry = await getAssetRegistry('hu.bme.mit.temalab.PreemptionUtilityToken');
  /* Getting all invalidated and expired tokens */
  let existingTokens = await tokenRegistry.getAll();
  let invalidTokens = await existingTokens.filter( token => token.isValid === false);

  /* 60 days in milliseconds */
  const EXPIRE_TIME_IN_MILLIS = 60*24*60*60*1000;
  let tokensToDelete = invalidTokens.filter( token => token.latestUpdateTime.getTime() < new Date().getTime() - EXPIRE_TIME_IN_MILLIS );

  /* Delete the invalidated and expired tokens */
  tokenRegistry.removeAll(tokensToDelete);
}

/**
 * updateVehicleID transaction processor function.
 * @param {hu.bme.mit.temalab.updateVehicleID} tx The sample transaction instance.
 * @transaction
 */
async function updateVehicleID(tx) {
  	// Update the asset with the new value.
  	let vhcl = tx.vehicle;
  	let record = tx.record;
	record.vehicle = vhcl;
  
  	// Get the asset registry for the asset.
    let assetRegistry = await getAssetRegistry('hu.bme.mit.temalab.rlrRecord');

    // Update the asset in the asset registry.
    await assetRegistry.update(record); 	
}

/**
 * contestrlrRecord transaction processor function.
 * @param {hu.bme.mit.temalab.contestrlrRecord} tx The sample transaction instance.
 * @transaction
 */
async function contestrlrRecord(tx) {
    // Set the vehicle in the record
    let recordVehicle = tx.record.vehicle;
  
  	// Set deletion flag (delete fields from evidence if left empty)
  	let deletionFlag = tx.deleteEmpty;

    // Find who called the transaction
    var currentParticipant = await getCurrentParticipant();

    // Make sure the participant is the same as the vehicle in the record
    if (currentParticipant != recordVehicle)
      // Throw an error as the current participant is not he same
      throw new Error('Current participant is not eligible for contest');   
  	
  	// Throw an error as there is no information provided
    if (!deletionFlag) {
      if (tx.record.gpsData == null && tx.record.sce == null && tx.record.evidence == null)
        throw new Error('No information is provided');
    }

    if (tx.record.evidence !== null) {
      
      // Update the asset with the new value.
      tx.record.evidence = tx.evidence;
      
      //Delete asset if it's left empty
    } else if (deletionFlag) {
      	tx.record.evidence = null;
    }

    if (tx.record.sce !== null) {
      
      // Update the asset with the new value.
      tx.record.sce = tx.sce;
      //Delete asset if it's left empty
    } else if (deletionFlag) {
      	tx.record.sce = null;
    }

    if (tx.record.gpsdata !== null) {
      
      // Update the asset with the new value.
      tx.record.gpsData = tx.gpsData;
      //Delete asset if it's left empty
    } else if (deletionFlag) {
      	tx.record.gpsData = null;
    }

    // Get the asset registry for the asset.
    let assetRegistry = await getAssetRegistry('hu.bme.mit.temalab.rlrRecord');

    // Update the asset in the asset registry.
    await assetRegistry.update(tx.record);
}

/**
 * invalidaterlrRecord transaction processor function.
 * @param {hu.bme.mit.temalab.invalidaterlrRecord} tx The sample transaction instance.
 * @transaction
 */
async function invalidaterlrRecord(tx) {
  	// Update the asset with the new value.
	tx.record.invalid = true;
  
  	// Get the asset registry for the asset.
    let assetRegistry = await getAssetRegistry('hu.bme.mit.temalab.rlrRecord');

    // Update the asset in the asset registry.
    await assetRegistry.update(tx.record); 
}



/**
 * updateEntryPoints transaction processor function.
 * @param {hu.bme.mit.temalab.updateEntryPoints} tx The sample transaction instance.
 * @transaction
 */
async function updateEntryPoints(tx) {
  	// Update the asset with the new value.
	tx.intersection.entryPoints = tx.newPoints;
  
  	// Get the asset registry for the asset.
    let assetRegistry = await getParticipantRegistry('hu.bme.mit.temalab.Intersection');

    // Update the asset in the asset registry.
    await assetRegistry.update(tx.record); 
}

/**
 * Sign transaction processor function.
 * @param {hu.bme.mit.temalab.Sign} tx The Sign transaction instance.
 * @transaction
 */
async function sign(tx) {
  let tokenRegistry = await getAssetRegistry('hu.bme.mit.temalab.PreemptionUtilityToken');
  let tokenArray = new Array();
  try {
    // DateTime sanity check. 10 minutes in millis.
  	if(new Date() - 10*60*1000 > tx.dateTime || new Date() < tx.dateTime) throw "Given date is too old."
  
    /* Signing all the given tokens. */
    for( let i = 0; i < tx.tokens.length; i++) {
      let tokenExists = tokenRegistry.exists(tx.tokens[i].tokenId);
      try {
        if(!tokenExists) throw "Token with the given ID does not exist!";
        if(!tx.tokens[i].isValid) {
          tx.tokens[i].trafficAuthoritySignature = true;
          tx.tokens[i].latestUpdateTime = tx.dateTime;
          tokenArray.push(tx.tokens[i]);
        }
      }
      catch(err) {
        console.log(err);
      }
    }

    /* Updating the appropriate AssetRegistry batch-like. */
    tokenRegistry.updateAll(tokenArray);
  }
  catch(err) { console.log(err); }
}
