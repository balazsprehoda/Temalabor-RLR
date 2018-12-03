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
      if (tokenIds.indexOf("tkn"+j) < 0) {
        tokenId = "tkn"+j;
        tokenIds.push(tokenId);
      }
      j++;
    }
    let token = await factory.newResource('hu.bme.mit.temalab', 'PreemptionUtilityToken', tokenId);
    token.owner = tx.vehicle;
    token.latestUpdateTime = new Date();
    await getAssetRegistry('hu.bme.mit.temalab.PreemptionUtilityToken')
      .then(function(tokenRegistry) {
      return tokenRegistry.add(token);
    });
    tx.vehicle.tokens.push(token);
  }
  
  await vehicleRegistry.update(tx.vehicle);
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
    token.isValid = false;
    token.trafficAuthoritySignature = false;
    token.latestUpdateTime = new Date();
  });
   await tokenRegistry.updateAll(tx.tokens);
   await vehicleRegistry.update(tx.vehicle);
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
  await tx.tokens.forEach(function (token) {
    if(token.trafficAuthoritySignature && token.owner.tokens.indexOf(token) < 0) {
      token.owner.tokens.push(token);
      token.isValid = true;
      token.latestUpdateTime = new Date();
      vehicleRegistry.update(token.owner);
    }
  });
  await tokenRegistry.updateAll(tx.tokens);
}

/**
 * Clear transaction processor function.
 * @param {hu.bme.mit.temalab.Clear} tx The Clear transaction instance.
 * @transaction
 */
async function clear(tx) {
  return getAssetRegistry('hu.bme.mit.temalab.PreemptionUtilityToken').then( function(tokenRegistry) {
    return tokenRegistry.getAll().then( function(tokens) {
      let tokensToDelete = new Array();
      tokens.forEach( function(token) {
        if(!token.isValid && token.latestUpdateTime.getTime() < new Date().getTime() - 60*24*60*60*1000) {
          tokensToDelete.push(token);
        }
      });
      tokenRegistry.removeAll(tokensToDelete);
    });
  });
}

/**
 * Sign transaction processor function.
 * @param {hu.bme.mit.temalab.Sign} tx The Sign transaction instance.
 * @transaction
 */
async function sign(tx) {
  await tx.tokens.forEach( function(token) {
    token.trafficAuthoritySignature = true;
  });
  await getAssetRegistry('hu.bme.mit.temalab.PreemptionUtilityToken').then( function(tokenRegistry) {
    return tokenRegistry.updateAll(tx.tokens);
  });
}