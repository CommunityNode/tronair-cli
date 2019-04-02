const fs = require("fs");
const prompts = require("prompts");
const time = require("./tools/time.js");

var tronWeb = undefined;
//console.log(`Thanks I got ${response} from ${prompt.name}`) ;
let onSubmit = async function (prompt, response) { 
	console.log(`DEBUG: Thanks I got ${response} from ${prompt.name}`);
};

let questions = [
	[ //0
		{
			type: 'confirm',
			name: 'yesno',
			message: 'Are you sure you want to proceed with the airdrop?',
			onRender(kleur) {
				this.msg = 'Are you sure you want to proceed with the airdrop?';
			},
			initial: true
		}
	],
	[ //1
		{
			type: 'confirm',
			name: 'yesno',
			message: 'Do you want to save failed transactions into a json file?',
			onRender(kleur) {
				this.msg = 'Are you sure you want to proceed with the airdrop?';
			},
			initial: true
		}
	]
];

async function confirmBefore(tw, airdrop){
	tronWeb = tw;
	var message = "\x1b[91mTronair is about to airdrop \x1b[97m" + airdrop.amount + " " + airdrop.token_abbr + "\'s \x1b[91mamongst \x1b[97m";
	switch( airdrop.criteria){
		case airdrop.CRITERIAS.VOTERS_PROPORTIONAL:
			message += airdrop.SR_votersCount + " \x1b[91mvoters (out of a total of " + airdrop.SR_votersCount+ " voters) of " + airdrop.SR_name + " (" + airdrop.SR_address + "), proportionally to their number of votes. \r\n";
			// THRESHOLD here: message += airdrop.remove_voters_with_THRESHOLD_votes?("After removing " + (airdrop.SR_votersCount - airdrop.num_wallets_filtered) + " voters with less than " + airdrop.votes_threshold + " votes, the "):"The ";
			message += "The total number of votes is " + airdrop.SR_total_votes_filtered + "\r\n";  
			message += "so each single vote will receive " + (airdrop.amount / airdrop.SR_total_votes_filtered) + " " + airdrop.token_abbr + "\r\n";  
			message += "The highest reward will be for wallet " + airdrop.list[0].address + " with " + (airdrop.list[0].amount / Math.pow(10, airdrop.token_precision)).toFixed(2) + " " + airdrop.token_abbr + "\r\n";  
			message += "and the wallet rewarded the lowest will be " + airdrop.list[(airdrop.list.length -1)].address  + " with only " + (airdrop.list[(airdrop.list.length -1)].amount / Math.pow(10, airdrop.token_precision)).toFixed(2) + " " + airdrop.token_abbr + "\r\n";  
			break;
			case airdrop.CRITERIAS.VOTERS_EQUAL:
			message += airdrop.SR_votersCount + " \x1b[91mvoters of " + airdrop.SR_name + " (" + airdrop.SR_address + "), equally distributed amongst all the voters. \r\n" 
			message += "Each user will receive " + (airdrop.list[0].amount / Math.pow(10, airdrop.token_precision)).toFixed(2) + " " + airdrop.token_abbr + "\r\n " 
			break;
			case airdrop.CRITERIAS.HOLDERS_PROPORTIONAL:
			message += airdrop.token2_numHolders + " \x1b[91mholders of " + airdrop.token2_name + " ("+ airdrop.token_abbr + "), proportionally to their " + airdrop.token2_name + " balance. \r\n" 
			message += "The highest reward will be for wallet " + airdrop.list[0].address + " with " + (airdrop.list[0].amount / Math.pow(10, airdrop.token_precision)).toFixed(2) + " " + airdrop.token_abbr + "\r\n";  
			message += " and the wallet rewarded the lowest will be " + airdrop.list[(airdrop.list.length -1)].address  + " with only " + (airdrop.list[(airdrop.list.length -1)].amount / Math.pow(10, airdrop.token_precision)).toFixed(2) + " " + airdrop.token_abbr + "\r\n";  
			break;
			case airdrop.CRITERIAS.HOLDERS_EQUAL:
			message += airdrop.token2_numHolders + " \x1b[91mholders of " + airdrop.token2_name + ", equally distributed amongst all the holders. " 
			message += "Each user will receive " + (airdrop.list[0].amount / Math.pow(10, airdrop.token_precision)).toFixed(2) + " " + airdrop.token_abbr + ". " 
			break;
			case airdrop.CRITERIAS.CSV:
			message += " \x1b[91maddresses provided in the CSV file "; //+ airdrop.file_name;
			// var fileManager = require("./csv.js");
			//list = await fileManager.getList(airdrop);
			break;
	}
	console.log(message);
	let response = await prompts(questions[0] ); //PROMPT: TRX or TOKEN

	return response.yesno;
}


function explainResults(airdrop, results){
	var success_filename = "SUCCESS_" + airdrop.amount + "_" + airdrop.token_abbr + "_" + time.today() + ".json";
	var failed_filename = "FAILED_" + airdrop.amount + "_" + airdrop.token_abbr + "_" + time.today() + ".json";
	var num_success = results.success.length;
	var num_failures = results.failures.length;
	var message = "------------   AIRDROP FINISHED   ---------------- \r\n";
	message += "SUCCESS: " + num_success + " FAILURES: " +  num_failures + "\r\n";
	//message += results.msg;
	//console.log(message);
	
	if(num_success > 0 ){
		message = "All succesful transactions have been saved into a file named "  + success_filename; 
		saveToFile(success_filename, message, results.success);
	}
	if(num_failures > 0 ){
		message = "All failed transactions have been saved into a file named "  + failed_filename; 
		saveToFile(failed_filename, message, results.failures);
	}
	
	//console.log("Thank you for using tronair");	
}

function saveToFile(filename, message, data){
		//var path = __dirname + "\\" + filename;
		//failures = { "data": failures }; // write contents in the appropiate format (tronvotes.format.JSON)

		fs.appendFile( filename, JSON.stringify({"data": data}), function (err) {
			if (err) { 
				console.log("Error when trying to create file " + filename);  
			}else{
				console.log(message);
			}
		});

}

module.exports.confirmBefore = confirmBefore;
module.exports.explainResults = explainResults;
