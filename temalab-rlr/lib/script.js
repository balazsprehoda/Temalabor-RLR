/**
 * Issue transaction processor function.
 * @param {hu.bme.mit.temalab.Issue} tx The Issue transaction instance.
 * @transaction
 */
async function issue(tx) {
  let factory = getFactory();
  let vehicleRegistry = await getParticipantRegistry('hu.bme.mit.temalab.Vehicle');
  
  const tokenRegistry = await getAssetRegistry('hu.bme.mit.temalab.PreemptionUtilityToken');   
    let existingTokens = await tokenRegistry.getAll();
  
    let numberOfTokens = 0;
  	let tokenIds = new Array();
    await existingTokens .forEach(function (token) {
      numberOfTokens ++;
      tokenIds.push(token.tokenId);
    });

  for (let i = 0; i < tx.amount; i++) {
    let tokenId;
    let j = 0;
    while(tokenId == null) {
      if (tokenIds.indexOf("token"+j) < 0) {
        tokenId = "token"+j;
        tokenIds.push(tokenId);
      }
      j++;
    }
    let token = factory.newResource('hu.bme.mit.temalab', 'PreemptionUtilityToken', tokenId);
    await getAssetRegistry('hu.bme.mit.temalab.PreemptionUtilityToken')
      .then(function(tokenRegistry) {
      return tokenRegistry.add(token);
    });
    tx.vehicle.tokens.push(token);
  }
  
  vehicleRegistry.update(tx.vehicle);
}

/**
 * Burn transaction processor function.
 * @param {hu.bme.mit.temalab.Burn} tx The Burn transaction instance.
 * @transaction
 */
async function burn(tx) {
  let vehicleRegistry = await getParticipantRegistry('hu.bme.mit.temalab.Vehicle');
  let tokenRegistry = await getAssetRegistry('hu.bme.mit.temalab.PreemptionUtilityToken');
  await tx.tokens.forEach(function (token) {
    tx.vehicle.tokens.splice(tx.vehicle.tokens.indexOf(token), 1);
  });
  await tokenRegistry.removeAll(tx.tokens);
  await vehicleRegistry.update(tx.vehicle);
}

/**
 * Compensate transaction processor function.
 * @param {hu.bme.mit.temalab.Compensate} tx The Compensate transaction instance.
 * @transaction
 */
async function compensate(tx) {
  let factory = getFactory();
  let vehicleRegistry = await getParticipantRegistry('hu.bme.mit.temalab.Vehicle');
  
  const tokenRegistry = await getAssetRegistry('hu.bme.mit.temalab.PreemptionUtilityToken');   
    let existingTokens = await tokenRegistry.getAll();
  
    let numberOfTokens = 0;
  	let tokenIds = new Array();
    await existingTokens .forEach(function (token) {
      numberOfTokens ++;
      tokenIds.push(token.tokenId);
    });

  for (let i = 0; i < tx.amount; i++) {
    let tokenId;
    let j = 0;
    while(tokenId == null) {
      if (tokenIds.indexOf("token"+j) < 0) {
        tokenId = "token"+j;
        tokenIds.push(tokenId);
      }
      j++;
    }
    let token = factory.newResource('hu.bme.mit.temalab', 'PreemptionUtilityToken', tokenId);
    await getAssetRegistry('hu.bme.mit.temalab.PreemptionUtilityToken')
      .then(function(tokenRegistry) {
      return tokenRegistry.add(token);
    });
    tx.vehicle.tokens.push(token);
  }
  
  vehicleRegistry.update(tx.vehicle);
}

/**
 * updateVehicleID transaction processor function.
 * @param {hu.bme.mit.temalab.updateVehicleID} tx The sample transaction instance.
 * @transaction
 */
async function updateVehicleID(tx) {
  	// Update the asset with the new value.
  	let vhcl = tx.vehicle;
  	let event = tx.event;
	  event.vehicle = vhcl;
  
  	// Get the asset registry for the asset.
    let assetRegistry = await getAssetRegistry('hu.bme.mit.temalab.RLRevent');

    // Update the asset in the asset registry.
    await assetRegistry.update(event); 	
}

/**
 * contestRLREvent transaction processor function.
 * @param {hu.bme.mit.temalab.contestRLREvent} tx The sample transaction instance.
 * @transaction
 */
async function contestRLREvent(tx) {
  	// Set the vehicle in the event
	let eventVehicle = tx.event.vehicle;
  
  	// Find who called the transaction
  	var currentParticipant =await getCurrentParticipant();
  
  	// Make sure the participant is the same as the vehicle in the event
  	if (currentParticipant == eventVehicle) {
      	if (tx.event.evidence !== null) {
      		// Update the asset with the new value.
      		tx.event.evidence = tx.evidence;
        }
      
      	if (tx.event.sce !== null) {
      		// Update the asset with the new value.
      		tx.event.sce = tx.sce;
        }
      
      	if (tx.event.gpsdata !== null) {
      		// Update the asset with the new value.
      		tx.event.gpsdata = tx.gpsdata;
        }
    if (tx.event.gpsdata == null && tx.event.sce == null && tx.event.evidence == null)
              throw new Error('All fields are empty');

      	
    	// Get the asset registry for the asset.
    	let assetRegistry = await getAssetRegistry('hu.bme.mit.temalab.RLRevent');

   	 	// Update the asset in the asset registry.
    	await assetRegistry.update(tx.event);
    } else {
      // Throw an error as the current participant is not he same
      throw new Error('Current participant is not eligible for contest');
    }
}

/**
 * invalidateRLREvent transaction processor function.
 * @param {hu.bme.mit.temalab.invalidateRLREvent} tx The sample transaction instance.
 * @transaction
 */
async function invalidateRLREvent(tx) {
  	// Update the asset with the new value.
	tx.event.invalid = true;
  
  	// Get the asset registry for the asset.
    let assetRegistry = await getAssetRegistry('hu.bme.mit.temalab.RLRevent');

    // Update the asset in the asset registry.
    await assetRegistry.update(tx.event); 
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
    await assetRegistry.update(tx.event); 
}
