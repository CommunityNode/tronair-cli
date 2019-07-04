
async function doAirdrop(tronWeb, airdrop){
	//After dividing rewards by targets, some targets may have ended up receiving a few cents , dropped by Math.floor()
	//TODO: store this into SQLite	For now, remove them from the final list to avoid invoking API with 0 amount
	//airdrop.list = sqliteZeroAmounts(airdrop.list);
	//TENER EN CUENTA LA PRECISION para decidir si se ha de quitar o no

	//if(airdrop.list.length >= 1){ //i.d: airdropping to little tokens (ie:500) amongst 1000 wallets would generate list.length = 0 !!
	//	air_test.msg = "";

	var air_result = {};
	if (airdrop.isToken) {
		air_result = await doAirdropToken(tronWeb, airdrop); //TRX
	} else {
		air_result = await doAirdropTRX(tronWeb, airdrop); //TOKENS
	}

	var success = [];
	var failures = [];
	air_result.forEach(tx => {
		try {
			if (tx.msg == "SUCCESS") {
				success.push(tx);
			} else {
				failures.push(tx);
			}
		} catch (err) {
			console.log('Error sorting transactions: ' + err);
			failures.push(tx);
		}
	});

	return {success: success, failures: failures};
}

//For TRX
async function doAirdropTRX(tronWeb, airdrop){ 

	console.log("* * * tronair-cli  * *  * COMMUNITY NODE aidrop tool * * *");
	console.log("* * * Airdropping \x1b[96m" + airdrop.token_name + "\x1b[97m (\x1b[96m" + airdrop.token_abbr + "\x1b[97m) to " + airdrop.list.length + " wallets");
	
	return Promise.all(airdrop.list.map(wallet =>
		tronWeb.trx.sendTrx(wallet.address, wallet.amount, function (xnul, res) {
			if (xnul != null) {
				wallet.msg = "Error: " + xnul;
				wallet.ok = false;
				wallet.tx = "";
			} else {
				wallet.ok = res.result;
				if (res.result) {
					wallet.msg = "SUCCESS";
					wallet.tx = res.transaction.txID;
				} else {
					wallet.msg = "FAILURE"
					wallet.tx = JSON.stringify(res);
				}
			}
			return wallet;
		})
	));
}

//TOKENS
async function doAirdropToken(tronWeb, airdrop) {
	
	console.log("* * * tronair-cli  * *  * COMMUNITY	 NODE aidrop tool * * *");
	console.log("* * * Airdropping \x1b[96m" + airdrop.token_name + "\x1b[97m (\x1b[96m" + airdrop.token_abbr + "\x1b[97m) to " + airdrop.list.length + " wallets");

	return Promise.all(airdrop.list.map(wallet => 
		tronWeb.trx.sendToken(wallet.address, wallet.amount, airdrop.token_id, function (xnul, res) {
			if (xnul != null) { 
				wallet.msg = "Error: " + xnul;
				wallet.ok = false;
				wallet.tx = "";
			} else {
				wallet.ok = res.result;
				if (res.result) { 
					wallet.msg = "SUCCESS";
					wallet.tx = res.transaction.txID;
				} else {
					wallet.msg = "FAILURE"
					wallet.tx = JSON.stringify(res);
				}
			}
			return wallet;
		})
	));
}


//TODO TODO
function sqliteZeroAmounts(arr){
	console.log("Removing targets with infinitesimal amounts..");
	var counter = 0;
	var aux = arr.filter(x => {
		if(x.amount <1) process.stdout.write("\x1b[96m\r" + (counter++) + ": Removing " + x.address + "\x1b[97m\r");
		return x.amount > 1;
	})
	console.log("");

	return aux;
}

module.exports.doAirdrop = doAirdrop;
module.exports.sqliteZeroAmounts = sqliteZeroAmounts;

