/*
AIRDROP instance example: 
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
-------------------------------
TARGET CRITERIA: Where do we get the airdrop target wallets from? So far, there are 3 sources:  
*/  

const crit = require("./criterias.js");
var CRITERIAS = crit.CRITERIAS;

const cn = require("./cn_logo.js");
const prompts = require("prompts");
var airdrop = { CRITERIAS: CRITERIAS }; //Pass on the Enumerations for others to use them
var tronWeb = undefined;
//console.log(`Thanks I got ${response} from ${prompt.name}`) ;
let onSubmit = async function (prompt, response) { 
	//console.log(`DEBUG: Thanks I got ${response} from ${prompt.name}`);
};

let questions = [
	[ //0
		{
			type: 'select',
			name: 'coin',
			message: 'Are we going to airdrop a TOKEN or TRX?',
			choices: [
				{ title: 'TOKEN', value: "TOKEN" },
				{ title: 'TRX', value: "TRX" },
			]
		}
	],
	[  //1
		{
			type: 'text',
			name: 'id',
			message: 'What is the token ID ? ',
			onRender(kleur) {
				this.msg = 'What is your token ID? ' + kleur.gray('Example: ') + kleur.cyan('1000322') + kleur.gray(' for ') + kleur.gray('TRUC ');
			},
			initial: 1000322
		}
	],
	[ //2
		{
			type: 'confirm',
			name: 'idOk',
			message: 'Are you sure ' + '\x1b[96m' + airdrop.token_abbr + '\x1b[93m' + ' ( \x1b[96m' + airdrop.token_name + '\x1b[93m ) \x1b[93mis the correct token?',
			onRender(kleur) {
				this.msg = 'Are you sure ' + '\x1b[96m' + airdrop.token_abbr + '\x1b[97m' + ' ( \x1b[96m' + airdrop.token_name + '\x1b[97m ) is the correct token?';
			},
			initial: true
		}
	],
	[  //new 3
		{
			type: 'text',
			name: 'amount',
			message: 'Please type the amount you want to airdrop:',
			validate: val => {
				val = Number(val);
				var msg = "Please type a value bigger than 0";
				if(val <= 0) { return "Please type a value bigger than 0"; }
				else if(val > airdrop.token_balance) { return "\x1b[97mCan \x1b[91mNOT\x1b[97m airdrop \x1b[96m" + val + " " + airdrop.token_abbr + '\x1b[97m\'s because your current balance is only \x1b[91m' + airdrop.token_balance + '\x1b[97m. Please write a smaller amount';}
				else { return true }
			},
			onRender(kleur) {
				this.msg = kleur.white('Please type the amount of ') + kleur.cyan(airdrop.token_abbr) + kleur.white(' you want to airdrop: ');
			},
			initial: 0
		}
	],
	[  //4
		{
			type: 'select',
			name: 'criteria',
			message: 'To which wallets do you want to air ' + airdrop.amount + ' ' + airdrop.token_abbr + '\'s?',
			choices: [
				{ title: 'To wallets \x1b[93mvoting\x1b[97m a given SR/candidate: (\x1b[93mPROPORTIONAL\x1b[97m to their number of votes) ', value: 0 },
				{ title: 'To wallets \x1b[93mvoting\x1b[97m a given SR/candidate: (rewards \x1b[93mEQUALLY\x1b[97m divided among voters) ', value: 1 },
				{ title: 'To wallets \x1b[93mholding\x1b[97m a given token (\x1b[93mPROPORTIONAL\x1b[97m to the token amount ) ', value: 2 },
				{ title: 'To wallets \x1b[93mholding\x1b[97m a given token (rewards \x1b[93mEQUALLY\x1b[97m divided among token holders) ', value: 3 },
				{ title: 'To wallets listed on a CSV file formatted as: \x1b[93maddress,amount;\x1b[97m ', value:43, disabled: true }
			],
			onRender(kleur) {
				this.msg = 'To which wallets do you want to airdrop \x1b[96m' + airdrop.amount + ' ' + airdrop.token_abbr + '\x1b[97m\'s?';
			}
		}
	],
	[	//5  SR address
		{
			type: 'text',
			name: 'SR_address',
			message: 'Please, type the address of the candidate/SR, so i cant get the list of voters:',
			validate: val => tronWeb.isAddress(val)?true:(val + " is not a valid TRON address"), 
			onRender(kleur) {
				this.msg = kleur.gray('Example: ') + kleur.cyan('TDGy2M9qWBepSHDEutWWxWd1JZfmAed3BP') + kleur.gray(' for ') + kleur.gray('CommunityNode ');
			},
			initial: "TDGy2M9qWBepSHDEutWWxWd1JZfmAed3BP"
		}
	],
	[	//6  TOKEN holders
		{
			type: 'text',
			name: 'id2',
			message: 'You want to reward holders of a given token. What is that token id?',
			onRender(kleur) {
				this.msg = 'You want to reward '+ kleur.cyan(airdrop.amount + " " + airdrop.token_abbr + '\'s') +  ' among holders of a given token. What is the id of that token?';
			},
			initial: 1000562
		}
	],
	[ //7 Are you sure?
		{
			type: 'confirm',
			name: 'idOk2',
			message: 'Are you sure ' + '\x1b[96m' + airdrop.token2_abbr + '\x1b[93m' + ' ( \x1b[96m' + airdrop.token2_name + '\x1b[93m ) \x1b[93mis the correct token?',
			onRender(kleur) {
				this.msg = 'Are you sure ' + '\x1b[96m' + airdrop.token2_abbr + '\x1b[97m' + ' (\x1b[96m' + airdrop.token2_name + '\x1b[97m) is the correct token?';
			},
			initial: true
		}
	]
];

async function collectData(tw){
	tronWeb = tw;

	cn.printTronairLogo();
	//HARDCODED: TODO: ADD TO prompt and future GUI
	airdrop.remove_voters_with_THRESHOLD_votes = true; //GUI_VAR checkbox: Remove voters with <= than THRESHOLD 'votes'
	airdrop.votes_threshold = 0; //9999 GUI_VAR textbox, validate: number [0,infinite) //Filtering-out ANYTHING BELOW OR EQUAL TO this value
	//HARDCODED\\

	let response = await prompts(questions[0] ); //PROMPT: TRX or TOKEN
	if(response.coin == "TOKEN"){ //if TOKEN..
		airdrop.isToken = true;
		var aux = await getRightToken(); //PROMPT: loop ID
	}else{ // if TRX..
		airdrop.isToken = false;
		airdrop.token_abbr = "TRX";  
		airdrop.token_precision = 6;
		airdrop.token_name = "TRX";
	}
	
	airdrop = await getBalance(airdrop);
	response = await prompts(questions[3],{ onSubmit } ); //PROMPT: amount? 
	airdrop.amount = response.amount;
	while(airdrop.amount > airdrop.token_balance){ //Force user to type an amount <= token_balance
		
		console.log('\x1b[91mNO ENOUGH BALANCE: \x1b[97mYour \x1b[96m'+ airdrop.token_abbr + '\x1b[97m balance is only \x1b[96m' + airdrop.token_balance + '\x1b[97m !!\x1b[97m Therefore you can \x1b[91mNOT\x1b[97m airdrop \x1b[96m' + airdrop.amount + '\x1b[69m ' + airdrop.token_abbr + '\x1b[97m');
		response = await prompts(questions[3],{ onSubmit } ); //PROMPT: amount? 
		airdrop.amount = response.amount;
	}
	
	response = await prompts(questions[4],{ onSubmit } ); //PROMPT: wallets? -> voters, holders, csv
	switch(response.criteria){
		case CRITERIAS.VOTERS_PROPORTIONAL: //voters proportional
			airdrop.criteria = CRITERIAS.VOTERS_PROPORTIONAL;
			console.log("Please, type the address of the candidate/SR, so i cant get the list of voters..");
			var aux = await getRightSR(); //PROMPT: loop ID
			break;
		case CRITERIAS.VOTERS_EQUAL: //voters equal
			airdrop.criteria = CRITERIAS.VOTERS_EQUAL;
			console.log("Please, type the address of the candidate/SR, so i cant get the list of voters..");
			var aux = await getRightSR(); //PROMPT: loop ID
			break;
		case CRITERIAS.HOLDERS_PROPORTIONAL: //holders proportional
			airdrop.criteria = CRITERIAS.HOLDERS_PROPORTIONAL;
			var aux = await getRightToken2(); //PROMPT: loop ID -Modifies 'airdrop' object
			break;
			case CRITERIAS.HOLDERS_EQUAL: //holders equal
			airdrop.criteria = CRITERIAS.HOLDERS_EQUAL;
			var aux = await getRightToken2(); //PROMPT: loop ID -Modifies 'airdrop' object
			break;
		case CRITERIAS.CSV: //cvs
			airdrop.criteria = CRITERIAS.CSV;
			airdrop.source = "file_name";
			break;
		}
		process.stdout.write("\x1b[91mQuerying blockchain to calculate target wallets..\x1b[97m\r");
		return airdrop;
	}
	
	async function getRightToken(){
		var response = { idOk : false};
	while(!response.idOk){ //.. are you sure is the rigth token?
		response = await prompts(questions[1],{ onSubmit } );   //PROMPT: ID
		process.stdout.write("Querying token id \x1b[91m" + response.id + "\x1b[97m ...\r");
		try{
			var token = await tronWeb.trx.getTokenFromID(response.id);
			airdrop.token_name = token.name;
			airdrop.token_abbr = token.abbr;
			airdrop.token_id = token.id;
			airdrop.token_precision = token.precision || 0;
			console.log('\x1b[32mTOKEN id \x1b[96m'+ airdrop.token_id + '\x1b[32m found: \x1b[96m' + airdrop.token_abbr + '\x1b[97m' + " (" +'\x1b[96m' + airdrop.token_name + '\x1b[97m) Info: \x1b[94m\x1b[4mhttps://tronscan.org/#/token/' + airdrop.token_id + '\x1b[0m\x1b[97m ');
			response = await prompts(questions[2],{ onSubmit } ); //PROMPT: sure?
		}catch(e){
			console.log('\x1b[91mTOKEN id \x1b[96m'+ response.id + '\x1b[91m NOT FOUND \x1b[97m Please try again');
		}
	}
}

	async function getRightToken2(){  //Refactor with getRightToken() Tip: use prompt-'name' field as property name in the 'airdrop' object 
		var response = { idOk2 : false};
	while(!response.idOk2){ //.. are you sure is the rigth token?
		response = await prompts(questions[6],{ onSubmit } );   //PROMPT: ID
		process.stdout.write("Querying token id \x1b[91m" + response.id2 + "\x1b[97m ...\r");
		try{
			var token = await tronWeb.trx.getTokenFromID(response.id2);
			airdrop.token2_ownerAddress = tronWeb.address.fromHex(token.owner_address);
			airdrop.token2_name = token.name;
			airdrop.token2_abbr = token.abbr;
			airdrop.token2_id = token.id;
			airdrop.token2_precision = token.precision || 0;
			console.log('\x1b[32mTOKEN id \x1b[96m'+ airdrop.token2_id + '\x1b[32m found: \x1b[96m' + airdrop.token2_abbr + '\x1b[97m' + " (" +'\x1b[96m' + airdrop.token2_name + '\x1b[97m) Issued by \x1b[96m' + airdrop.token2_ownerAddress + '\x1b[97m Info: \x1b[94m\x1b[4mhttps://tronscan.org/#/token/' + airdrop.token2_id + '\x1b[0m\x1b[97m ');
			response = await prompts(questions[7],{ onSubmit } ); //PROMPT: sure?
		}catch(e){
			console.log('\x1b[91mTOKEN id \x1b[96m'+ response.id2 + '\x1b[91m NOT FOUND \x1b[97m Please try again');
		}
	}
}

async function getRightSR(){
	var sr = {is_witness: false}; //trick: getAccount will return 'is_witness'field
	while(!sr.is_witness){ //.. are you sure is the rigth SR?
		response = await prompts(questions[5],{ onSubmit } );   //PROMPT: SR address
		process.stdout.write("Querying SR address \x1b[91m" + response.SR_address + "\x1b[97m ...\r");
		sr = await tronWeb.trx.getAccount(response.SR_address); //get SR name
		if(sr.is_witness != undefined && sr.is_witness){ //..find a bit more info about this SR/candidate
			airdrop.SR_address = response.SR_address;
			airdrop.SR_name =  tronWeb.toUtf8(sr.account_name);
		
			var all_SR = await tronWeb.trx.listSuperRepresentatives();
			//console.log(all_SR);
			var sr_extra_info = all_SR.find( SRi => { return tronWeb.address.fromHex(SRi.address) == airdrop.SR_address }  ); 
			airdrop.SR_url = sr_extra_info.url;
			airdrop.SR_votesCount = sr_extra_info.voteCount;
			console.log('\x1b[32mValid SR \x1b[96m'+ airdrop.SR_address + '\x1b[32m found: \x1b[96m' + airdrop.SR_name + '\x1b[97m Votes:\x1b[96m ' + airdrop.SR_votesCount +'\x1b[97m Info: \x1b[94m\x1b[4mhttps://tronscan.org/#/address/' + airdrop.SR_address + '\x1b[0m\x1b[97m ');
				

		}else{
			console.log('\x1b[91mAddress \x1b[96m'+ response.SR_address + '\x1b[97m is \x1b[91m NOT \x1b[97ma valid SR/candidate (doesn\'t receive votes). ' );
		}
		//console.log({sr});
	}
}

/**  Get balance info of the wallet asociated to process.env.PK and stores it on the airdrop object
 * @param airdrop An airdrop object (will be modified -addition-)
 * @return An updated airdrop object
*/
async function getBalance(airdrop){
	var address = tronWeb.address.fromPrivateKey(process.env.PK);
	var balance = 0;
	if(!airdrop.isToken){
		balance = await tronWeb.trx.getBalance(address) / 1000000;
	}else{
		var add_info = await tronWeb.trx.getAccount(address);
		//console.log(add_info.asset.length);
		var assets = add_info.assetV2; // [{ key: 'KrMaToken', value: 60 }, { key: 'LoveHearts', value: 0 }, ...]
		var found = assets.find( asset => { return asset.key == airdrop.token_id} );
		if(!found){
			balance = 0;
		}else{
			balance = found.value / Math.pow(10, airdrop.token_precision);  //hay que dividir entre la precision??
		}
		console.log("\x1b[93mYour current " + airdrop.token_abbr + " balance is " +  balance + "\x1b[97m");
	}
	airdrop.token_balance = balance;
	return airdrop;
}

//collectData();
module.exports.collectData = collectData;
