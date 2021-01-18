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
var rp = require("request-promise")

const holders_url = "https://apilist.tronscan.org/api/tokenholders";
/* configuration options for request-promise library */
var holders_options = {
    uri: holders_url,
    qs: {
        address: "TDGy2M9qWBepSHDEutWWxWd1JZfmAed3BP", // -> uri + '?access_token=xxxxx%20xxxxx'
		start: 0,
		limit: 10000,
		sort: "-balance" 
    },
    headers: {
        'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
};

/**
 *  Returns holders data for a gives SR/candidate 
 *
 * @param {*} aidrop A JS object containing all the airdrop configuration
 * @returns A json containing a "data" array with all the <voters,amount> for the given @airdrop
 */
async function getHolders(airdrop){
	holders_options.qs.address = airdrop.token2_ownerAddress;

	return rp(holders_options).then(allHolders => { //= https://apilist.tronscan.org/api/tokenholders?sort=-balance&limit=100000&start=0&address=TDGy2M9qWBepSHDEutWWxWd1JZfmAed3BP 
		var holders = allHolders.data;
		var total_balance = 0;
		console.log({allHolders});

		//TODO TODO TODO TODO meter lo del THRESHOLD en el airdrop.xxxxx

		//REMOVE holders with balance <= THRESHOLD  (default: remove 0 balance holders)
		// process.stdout.write("Found " + holders.length + " wallets holding " + airdrop.token2_abbr + ". After removing wallets with balance <= " + balance_threshold );
		var remove_holders_with_THRESHOLD_balance = airdrop.remove_holders_with_THRESHOLD_balance || false; //GUI_VAR checkbox: Remove holders with <= than THRESHOLD 'balance'
		var remove_holders_with_ADDRESS = airdrop.remove_holders_with_ADDRESS || false;
		var balance_threshold = airdrop.min_thresh || 0; //GUI_VAR textbox, validate: number [0,infinite)
		var blacklist = airdrop.blacklist || [];
		console.log("Found " + holders.length + " wallets holding " + airdrop.token2_abbr + ".");
		if(remove_holders_with_ADDRESS){
			holders = holders.filter(holder => { return (!blacklist.includes(holder.address)) });
			console.log("After removing blacklisted addresses, targets where reduced to " + holders.length + " wallets." );
		}

		if(remove_holders_with_THRESHOLD_balance){
			holders = holders.filter(holder => { 
				if(holder.balance > balance_threshold) { total_balance += holder.balance; }
				return (holder.balance > balance_threshold); }); 
			console.log("After removing wallets with balance <= " + balance_threshold + ", targets where reduced to " + holders.length + " wallets." );
		}
		var num_wallets = holders.length;
		airdrop.token2_numHolders = holders.length;
		airdrop['token2_precision'] = airdrop.token2_precision || airdrop.token_precision;

		var arrTargets;
		var testing_sum = 0;
		//ADJUST rewards amount according to SUBCRITERIAS and trim out the relevant information:
		switch (airdrop.criteria){
		case airdrop.CRITERIAS.HOLDERS_PROPORTIONAL:
			console.log("\nairdrop.amount: " + airdrop.amount)
			console.log("total_holders: " + num_wallets)
			console.log("targets_balance_sum: " + total_balance);
			var reward_per_unit =  airdrop.amount / total_balance; 
			console.log("reward per unit: " + reward_per_unit)
			arrTargets = holders.map( holder => { //Adjust rewards
				var reward = holder.balance*reward_per_unit; //'reward' is the human amount (not thinking about precision)
				var amount = reward * Math.pow(10, airdrop.token2_precision);  //'amount' is the actual number that the method requires
				amount = Math.floor(amount);//discard the decimals
				//console.log(airdrop.token_precision + " >>> " + holder.address + " reward: " + reward + " amount: " + amount);
				testing_sum += amount;
				return {address: holder.address, amount: amount, balance: holder.balance}; 
			}); 
			break;
		case airdrop.CRITERIAS.HOLDERS_EQUAL:
			console.log("\nairdrop.amount: " + airdrop.amount);
			console.log("total_holders: " + num_wallets);
			console.log("total_balance: " + total_balance);
			var reward = airdrop.amount / num_wallets;
			var amount = reward * Math.pow(10, airdrop.token2_precision); 
			amount = Math.floor(amount);//discard the decimals
			arrTargets = holders.map( holder => { //Adjust rewards
				testing_sum += amount;
				return {address: holder.address, amount: amount, balance: holder.balance}; 
			});
			break;
			//case Add here new CRITERIAS: ...
		}
		//console.log(testing_sum);
		return arrTargets;
	});
}

module.exports.getHolders = getHolders;
