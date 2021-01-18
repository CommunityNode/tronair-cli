/*AIRDROP object example: (as declared in ./menu.js) 
{ trx: false,
  token_name: 'CommunityNodeToken',
  token_abbr: 'TRUC',
  token_id: '1000322',
  token_precision: 0,
  token_balance: 35000, //balance of the airdropper account (either for TRX or for TOKEN)
  amount: '3500000',
  criteria: ( CRITERIAS.VOTERS_PROPORTIONAL | CRITERIAS.VOTERS_EQUAL | CRITERIAS.HOLDERS | CRITERIAS.CSV) 
  SR_address: 'TDGy2M9qWBepSHDEutWWxWd1JZfmAed3BP',
  SR_name: 'CommunityNode' 
}

*/
var apilister = require("./apilist.js"); //download from apilist.tronscan.org


/**
 *  Returns voters data for a gives SR/candidate 
 *
 * @param {*} aidrop A JS object containing all the airdrop configuration
 * @returns A json containing a "data" array with all the <voters,amount> for the given @airdrop
 */
async function getVoters(airdrop){
	// var allPages = await apilister.getVoters(airdrop.SR_address);
	console.log(airdrop.SR_address); // 
	return apilister.getVoters(airdrop.SR_address).then(allPages => {
		var voters = allPages.data;
		// console.log(voters); // 
		airdrop.SR_votersCount = allPages.total;
		airdrop.SR_votesCount = allPages.totalVotes; 

		/* 	return rp(votes_options).catch(function (err) {//download the first page..
			console.log(" Error getting voters list from " + votes_url ) ;
		}).then(page => { //..to find out how many voters
			airdrop.SR_votersCount = page.total;
			airdrop.SR_votesCount = page.totalVotes; //we already had that value from 'menu.js' but may have changed, so better update
			var numPages = Math.floor(page.total / 40);
			var promises = [];
			console.log("El numero de paginas solicitadas es : " + numPages);
			for(var i = 1 ; i<=numPages; i++){ 
				votes_options.qs.start = i*40; // prepare paginations: 40, 80, 120, 160, ..
				promises.push(rp(votes_options)); //request paginated pages
			} 

			return Promise.all(promises).then(function(otherPages) {
				//Merge all 'otherPages' with the first 'page' (result lies in 'page') 
				otherPages.forEach(nextPage => {    Array.prototype.push.apply(page.data, nextPage.data); } );
				return page; //REMEMBER: Array.prototype.push.apply MODIFIES ¡page!
			})
			.catch(function(err) {
				console.log(" Error getting voters list from " + votes_url + " err:" + err ) ;
			})
			.then(function( allPages) {  */
		airdrop["SR_total_votes"] = allPages.totalVotes;
		//console.log({voters});

		//---------------------------- THRESHOLD VOTING -------------------------------------------------
		//Getting ready for the future THRESHOLD functionality
		airdrop["SR_total_votes_filtered"] = airdrop.SR_votesCount; //Discard airdrop.SR_votesCount, since now we may (*)REMOVE some voters depending on user desires
		var testing_sum = 0;
		
		//(*)REMOVE voters depending on their number of votes (default: remove 0 votes voters)
		//console.log("DEBUG: Remove voters with less than " + airdrop.votes_threshold + "? " +  airdrop.remove_voters_with_THRESHOLD_votes);
		//process.stdout.write("DEBUG: From number-of-voters: " + voters.length + " ... ");
		
		// FUNCIONALIDAD FUTURA: Remove voters below threshold  TODO TODO TODO
		// if(airdrop.remove_voters_with_THRESHOLD_votes){
		// 	voters = voters.filter(voter => { 
		// 		if(voter.votes > airdrop.votes_threshold) { airdrop["SR_total_votes_filtered"] += voter.votes; }
		// 		return (voter.votes > airdrop.votes_threshold); }); 
		// 	}
		// 	console.log("...to number-of-voters: " + voters.length + " after removing voters with votes > " + airdrop.votes_threshold );
		var remove_voters_with_THRESHOLD_votes = airdrop.remove_voters_with_THRESHOLD_votes || false;
		var remove_voters_with_ADDRESS = airdrop.remove_voters_with_ADDRESS || false;
		var votes_threshold = airdrop.min_thresh || 0; //GUI_VAR textbox, validate: number [0,infinite)
		var blacklist = airdrop.blacklist || [];
		var total_filtered_votes = 0
		console.log("Found " + voters.length + " wallets voting for " + airdrop.SR_name + ".");
		if(remove_voters_with_ADDRESS){
			voters = voters.filter(voter => { return (!blacklist.includes(voter.voterAddress)) });
			console.log("After removing blacklisted addresses, targets where reduced to " + voters.length + " wallets." );
		}

		if(remove_voters_with_THRESHOLD_votes){
			voters = voters.filter(voter => { 
				if(voter.votes > votes_threshold) { total_filtered_votes += voter.votes; }
				return (voter.votes > votes_threshold); }); 
			console.log("After removing wallets with balance <= " + votes_threshold + ", targets where reduced to " + voters.length + " wallets." );
			airdrop["SR_total_votes_filtered"] = total_filtered_votes;
		}
		
		airdrop["num_wallets_filtered"] = voters.length; //Getting ready for the future THRESHOLD functionality
		//---------------------------- THRESHOLD VOTING -------------------------------------------------
	 
		var arrTargets;
		//Adjust rewards amount according to SUBCRITERIAS and trim out the relevant information:
		switch (airdrop.criteria){
			case airdrop.CRITERIAS.VOTERS_PROPORTIONAL:
				//console.log("\nairdrop.amount: " + airdrop.amount)
				//console.log("SR_total_votes_filtered: " + airdrop.SR_total_votes_filtered);
				var reward_per_vote =  airdrop.amount / airdrop.SR_total_votes_filtered; 
				//console.log("reward per vote: " + reward_per_vote)
				arrTargets = voters.map( voter => {
					var reward = voter.votes*reward_per_vote;
					var amount = reward * Math.pow(10, airdrop.token_precision); 
					amount = Math.floor(amount);//discard the decimals
					//console.log(airdrop.token_precision + " >>> " + voter.voterAddress + " reward: " + reward + " amount: " + amount);
					testing_sum += amount;
					return {address: voter.voterAddress, amount: amount, votes:voter.votes}; 
				}); 
				break;
			case airdrop.CRITERIAS.VOTERS_EQUAL:
				var reward = airdrop.amount / airdrop.num_wallets_filtered;
				var amount = reward * Math.pow(10, airdrop.token_precision); 
				amount = Math.floor(amount);//discard the decimals
				arrTargets = voters.map( voter => { 
					testing_sum += amount;
					return {address: voter.voterAddress, amount: amount, votes:voter.votes}; 
				});
				break;
			//case airdrop.CRITERIAS.HOLDERS:
			//case Add here new CRITERIAS: ...
		}
		console.log(arrTargets); // 
		return arrTargets;
	});
}

module.exports.getVoters = getVoters;
