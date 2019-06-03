var tw; //tronWeb

async function doAirdrop(tronWeb, airdrop) {
  var air_result = {};
  //After dividing rewards by targets, some targets may have ended up receiving a few cents , dropped by Math.floor()
  //TODO: store this into SQLite    For now, remove them from the final list to avoid invoking API with 0 amount
  //airdrop.list = sqliteZeroAmounts(airdrop.list);
//TENER EN CUENTA LA PRECISION para decidir si se ha de quitar o no

  //if(airdrop.list.length >= 1){ //i.d: airdropping to little tokens (ie:500) amongst 1000 wallets would generate list.length = 0 !!
  //	air_test.msg = "";
  if (airdrop.isToken) {
    air_result = await doAirdropToken(tronWeb, airdrop); //TRX
  } else {
    air_result = await doAirdropTRX(tronWeb, airdrop); //TOKENS
  }
  //}else{
  //	var msg = "Trying to EQUALLY airdrop too little tokens amongst too many wallets causes all wallets receive 0.xxx";
  //	air_test = {success: [], failures: [], msg: msg};
  //}
  return air_result;
}

//For TRX
async function doAirdropTRX(tronWeb, airdrop) {  //WARNING: test not implemented!!
  tw = tronWeb;
  console.log("* * * tronair-cli  * *  * COMMUNITY NODE aidrop tool * * *");
  console.log("* * * Airdropping \x1b[96m" + airdrop.token_name + "\x1b[97m (\x1b[96m" + airdrop.token_abbr + "\x1b[97m) to " + airdrop.list.length + " wallets");

  var success = [];
  var failures = [];
  var all = Promise.all(airdrop.list.map(wallet => //sendTrx callback behaviour: https://github.com/tronprotocol/tron-web/blob/2.1.5/src/lib/trx.js#L686
      tronWeb.trx.sendTrx(wallet.address, wallet.amount, function (xnul, res) {     //closures mantain 'target' value
        if (xnul != null) { //err
          wallet.msg = xnul;
          wallet.ok = false;
          wallet.tx = "";
          failures.push(wallet);
        } else {
          wallet.ok = res.result; //some kind of error may also have happen
          if (res.result) { //all ok
            wallet.msg = "SUCCESS";
            wallet.tx = res.transaction.txID;
          } else {
            wallet.msg = "Something happened: " + JSON.stringify(res);
            wallet.tx = ""; //no succesful tx
          }
          success.push(wallet);
        }
        //console.log((wallet.ok?"true ":"false") + " " + wallet.address + " " + wallet.amount + " reason: " + (wallet.ok?wallet.tx:wallet.msg));
        return wallet;
      }) //closure
    )//map
  ).then(data => {  //separate into SUCCESS and others
    var success = [];
    var failures = [];
    data.forEach(tx => {
      if (tx.msg == "SUCCESS") {
        success.push(tx);
      } else {
        failures.push(tx);
      }
    });
    return {success: success, failures: failures};
  });
  return all;
}

async function doAirdropToken(tronWeb, airdrop) {//TOKENS
  tw = tronWeb;

  console.log("* * * tronair-cli  * *  * COMMUNITY	 NODE aidrop tool * * *");
  console.log("* * * Airdropping \x1b[96m" + airdrop.token_name + "\x1b[97m (\x1b[96m" + airdrop.token_abbr + "\x1b[97m) to " + airdrop.list.length + " wallets");

  var success = [];
  var failures = [];
  var all = Promise.all(airdrop.list.map(wallet => //sendTrx callback behaviour: https://github.com/tronprotocol/tron-web/blob/2.1.5/src/lib/trx.js#L686
      tronWeb.trx.sendToken(wallet.address, wallet.amount, airdrop.token_id, function (xnul, res) {     //closures mantain 'target' value
        if (xnul != null) { //err
          wallet.msg = xnul;
          wallet.ok = false;
          wallet.tx = "";
          failures.push(wallet);
        } else {
          wallet.ok = res.result; //some kind of error may also have happen
          if (res.result) { //all ok
            wallet.msg = "SUCCESS";
            wallet.tx = res.transaction.txID;
          } else {
            wallet.msg = "Something happened: " + JSON.stringify(res);
            wallet.tx = ""; //no succesful tx
          }
          success.push(wallet);
        }
        //console.log((wallet.ok?"true ":"false") + " " + wallet.address + " " + wallet.amount + " reason: " + (wallet.ok?wallet.tx:wallet.msg));
        return wallet;
      }) //closure
    )//map
  ).then(data => {  //separate into SUCCESS and others
    var success = [];
    var failures = [];
    data.forEach(tx => {
      if (tx.msg == "SUCCESS") {
        success.push(tx);
      } else {
        failures.push(tx);
      }
    });
    return {success: success, failures: failures};
  });
  return all;
}


//TODO TODO
function sqliteZeroAmounts(arr) {
  console.log("Removing targets with infinitesimal amounts..");
  var counter = 0;
  var aux = arr.filter(x => {
    if (x.amount < 1) process.stdout.write("\x1b[96m\r" + (counter++) + ": Removing " + x.address + "\x1b[97m\r");
    return x.amount > 1;
  })
  console.log("");

  return aux;
}

module.exports.doAirdrop = doAirdrop;
module.exports.sqliteZeroAmounts = sqliteZeroAmounts;

