const privateKey = process.env.PK;
const pckg = require('./package.json');
const crit = require("./criterias.js");

/* const TronWeb = require('tronweb');
const tronWeb = new TronWeb(
'https://api.trongrid.io',
'https://api.trongrid.io',
'https://api.trongrid.io',
privateKey,
);
 */
const opts = { 
    'alias': { 
        'tokenID': 'i',
        'voters': 'v',
        'holders': 'o',
        'proportional':'p',
        'equal':'e',
        'amount':'a',
        'help': 'h'
    } 
}

async function collectData(tw){
    
    var argv = require('minimist')(process.argv.slice(2), opts);
    //console.log(argv);
    
    if(argv.help){
        printHelp();
        process.exit(1);
    }
    var airdrop = { CRITERIAS: crit.CRITERIAS,
        remove_voters_with_THRESHOLD_votes: true,
        votes_threshold: 0
    };

    if(Object.keys(argv).length > 1){ //user passed command line arguments
        checkArgsValidity(argv, tw);
        airdrop.human = false;
        if(argv.tokenID > 0){ //if TOKEN..
            airdrop.isToken = true;
            var token = await getRightToken(argv.tokenID, tw); 
            airdrop.token_id = "" + argv.tokenID;
            airdrop.token_name = token.name;
            airdrop.token_abbr = token.abbr;
            airdrop.token_precision = token.precision || 0;
        }else{ // if TRX..
            airdrop.isToken = false;
            airdrop.token_id = '0';
            airdrop.token_abbr = "TRX";  
            airdrop.token_precision = 6;
            airdrop.token_name = "TRX";
        }
        var balance = await getBalance(airdrop, tw);
        if(balance < argv.amount){
            console.log("Your balance (" + balance + ") is lower than the amount (" + argv.amount + ") you want to airdrop!" );
            process.exit(1);
        }
        airdrop.token_balance = balance;
        airdrop.amount = "" + argv.amount;
        if(argv.holders){
            var token = await getRightToken(argv.holders, tw); 
            airdrop.token2_ownerAddress = tw.address.fromHex(token.owner_address);
            airdrop.token2_name = token.name;
            airdrop.token2_abbr = token.abbr;
            airdrop.token2_id = token.id;
            airdrop.token2_precision = token.precision || 0;
            if(argv.equal != undefined) { airdrop.criteria = crit.CRITERIAS.HOLDERS_EQUAL; }
            else { airdrop.criteria = crit.CRITERIAS.HOLDERS_PROPORTIONAL; } //defaulting to PROPORTIONAL in case no -e nor -p provided
        } else { 
            airdrop.SR_address = "" + argv.voters;
            //console.log("airdrop.SR_address: " + airdrop.SR_address);
            airdrop = await getRightSR(airdrop, tw);
            if(argv.equal != undefined) { airdrop.criteria = crit.CRITERIAS.VOTERS_EQUAL; }
            else { airdrop.criteria = crit.CRITERIAS.VOTERS_PROPORTIONAL; } //defaulting to PROPORTIONAL in case no -e nor -p provided
        }

    }else{
        //do nothing
        //console.dir("Do nothing, ceder el paso a human interactive");
        airdrop.human = true;
    }
    return airdrop;
}

async function getRightSR(airdrop, tw){
	var sr = await tw.trx.getAccount(airdrop.SR_address); //get SR name
	if(sr.is_witness != undefined && sr.is_witness){ //..find a bit more info about this SR/candidate
        airdrop.SR_name =  tw.toUtf8(sr.account_name);
		var all_SR = await tw.trx.listSuperRepresentatives();
        var sr_extra_info = all_SR.find( SRi => {  return tw.address.fromHex(SRi.address) == airdrop.SR_address }  ); 
		airdrop.SR_url = sr_extra_info.url;
		airdrop.SR_votesCount = sr_extra_info.voteCount;
	}else{
        console.log(airdrop.SR_address + ' is NOT a valid SR/candidate (doesn\'t receive votes). ' );
        process.exit(1);
    }
    return airdrop; 
}

async function getRightToken(tokenID, tw){
    try{
        var token = await tw.trx.getTokenFromID(tokenID);
    }catch(e){
        console.log("Could not find a token with such id: " + tokenID);
        process.exit(1);
    }
    return token;
}

function checkArgsValidity(argv, tw){
    
    //proportional XOR equal
    if(argv.proportional == undefined && argv.equal == undefined){
        console.log("Please, include option -p or -e"); 
        console.log(help());
        process.exit(1);
    }
    
    //proportional XOR equal
    if(argv.proportional && argv.equal){
        console.log("Airdrop can NOT be *proporitional* AND *equal* both at the same time!");
        console.log(help());
        process.exit(1);
    }
    
    if(argv.voters && argv.holders){
        console.log("Airdrop can NOT be for voters AND holders both at the same time!");
        console.log(help());
        process.exit(1);
    }

    if(argv.voters == undefined && argv.holders == undefined){
        console.log("Please specify option --holder or option --voters!");
        console.log(help());
        process.exit(1);
    }
    
    if(argv.tokenID == undefined || isNaN(argv.tokenID)){
        console.log("Token *id* is missing or NaN!");
        console.log(help());
        process.exit(1);
    }
    
    if(argv.voters!= undefined  && !tw.isAddress(argv.voters)){
        console.log(argv.voters + " is not a valid address!");
        console.log(help());
        process.exit(1);
    }
    
    if(argv.holders!= undefined && isNaN(argv.holders)){
        console.log(argv.holders + " is not a valid token id!");
        console.log(help());
        process.exit(1);
    }
    
    if(argv.amount == undefined){
        console.log("You need to specify an amount with -a option");
        console.log(help());
        process.exit(1);
    }
    
}

/**  Get balance info of the wallet asociated to process.env.PK and stores it on the airdrop object
 * @param airdrop An airdrop object (will be modified -addition-)
 * @return An updated airdrop object
*/
async function getBalance(airdrop, tw){
	var address = tw.address.fromPrivateKey(process.env.PK);
	var balance = 0;
    
    if(airdrop.token_id > 0){  //TOKEN
        var add_info = await tw.trx.getAccount(address);
        //console.log(add_info.asset.length);
        var assets = add_info.assetV2; // [{ key: 'KrMaToken', value: 60 }, { key: 'LoveHearts', value: 0 }, ...]
        var found = assets.find( asset => { return asset.key == airdrop.token_id} );
        if(!found){ //EXIT!!
            console.log("Token with id " + airdrop.token_id + " does not exist!");
            process.exit(1);
        }else{ //do we have enough balance to match airdrop.amount ?
            balance = found.value / Math.pow(10, airdrop.token_precision);
        }
    }else{    //TRX
		balance = await tw.trx.getBalance(address) / 1000000;
    }
	return balance;
}

function printHelp(){
    var path = require('path');
    var scriptName = path.basename(__filename);
    console.log("\x1b[91m   ___     __ ");
    console.log("\x1b[91m  / __\\ /\\ \\ \\\t\x1b[97m\x1b[4mtronair-cli\x1b[0m\x1b[90m (version " + pckg.version + ") The ultimate commmand line tool for Tron blockchain airdrops"); 
    console.log("\x1b[91m / /   /  \\/ /");
    console.log("\x1b[91m/ /___/ /\\  / \t\t\x1b[93mSet up your airdrop-wallet *private key* on a environment variable named 'PK'\x1b[90m");
    console.log("\x1b[91m\\____/\\_\\ \\/\t\t\n");
    console.log("\x1b[90m\tUsage: node " + scriptName + " [options ...]");
    console.log("\tExample: Let's airdrop 750000 TRUC tokens to voters of CommunityNode, proportionally to their votes:");
    console.log("\t\x1b[36m\tnode " + scriptName + "  -i 1000322 -v TDGy2M9qWBepSHDEutWWxWd1JZfmAed3BP -a 750000 -p\x1b[90m\n");
    console.log("\tExample: Let's airdrop 999999 HELP tokens to holders of TRUC, equally splitted amongst all the wallets:");
    console.log("\t\x1b[36m\tnode " + scriptName + "  -i 1000562 -h 1000322 -a 999999 -e\x1b[90m\n");
    
    console.log("\x1b[97m\x1b[4mGolbal options\x1b[0m\x1b[90m\n");
    console.log("\x1b[97m-h, --help\x1b[90m\t\tShows this help");
    console.log("\x1b[97m-a, --amount\x1b[90m  number\tAmount to be airdropped (your wallet balance should have at least that amount) (ie: \x1b[36m1000322)");
    console.log("\x1b[97m-i, --tokenID\x1b[90m number\tThe id of the token to airdrop (ie: \x1b[36m1000322\x1b[0m)");
    console.log("\x1b[97m-v, --voters\x1b[90m  string\tAirdrop goes to wallets voting this SR/candidate address (ie: \x1b[36mTDGy2M9qWBepSHDEutWWxWd1JZfmAed3BP\x1b[0m)");
    console.log("\x1b[97m-o, --holders\x1b[90m number\tAirdrop goes to wallets holding token with this id (ie: \x1b[36m1002000\x1b[0m)");
    console.log("\x1b[97m-e, --equal\x1b[90m\t\tThe rewards will equally divided among all holders/voters");
    console.log("\x1b[97m-p, --proportional\t\x1b[90mThe rewards will be proportionally divided based on number of votes/holdings\x1b[0m");
    console.log("\n\x1b[36mSupport: https://t.me/CommunityNode \x1b[0m");
}

function help(){
    var path = require('path');
    var scriptName = path.basename(__filename);
    return "If you need help type: node " + scriptName + " --help\nor visit us in https://t.me/CommunityNode";
}

module.exports.collectData = collectData;
//collectData(tw);
