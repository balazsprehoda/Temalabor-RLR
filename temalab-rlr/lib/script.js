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