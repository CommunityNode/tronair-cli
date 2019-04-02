var rp = require("request-promise");
var PromisePool = require('es6-promise-pool');
var apilister = require("./apilist_prepareURL");

var _address = ""; //global 
var concurrency =25;
var url_configs = [];
var i = 0;
const votes_url = "https://apilist.tronscan.org/api/vote";
var total_is_kown = false;
var prom_counter = 0; //Keeps track of active promises. When 0, all promises returned an pool is over
var downloaded = 5;


var DEBUG = false;
var old_console = console.log;
// ENABLE/DISABLE Console Logs


var promiseProducer = function () {
    var retval = null;
    if(url_configs.length > 0 ){
        var req_opt = url_configs.shift(); //when array becomes empty, retval is 'undefined'
        retval = rp(req_opt).catch(function (err) {
            var aux= err.options;
            console.log(">>FAIL: vamos a reintroducir la query *start*: " + aux.qs.start ); 
            url_configs.push(getOptionsInstance(aux.qs.start));
            retval = Promise.resolve({data: []});;
            retval._postizo = "repeat";
            //prom_counter--;
            return retval;
        });
        retval._postizo = req_opt.qs.start;
        prom_counter++;
        console.log("Produced promise *start*: " + req_opt.qs.start + " prom_counter: " + prom_counter );
    }else{
        if(prom_counter > 0){
            console.log("Produced promise *fake*: " +  " prom_counter: " + prom_counter );
            retval = Promise.resolve({data: []});
            retval = new Promise((resolve, reject) => {
                setTimeout(function(){
                    resolve({data: []}); 
                }, 350);
            });
            
            retval._postizo = "fake";
        }
    }
    return retval;
}

// PROMISE POOL
var pool = new PromisePool(promiseProducer, concurrency);
var pages = [];

//Being fulfilled doesnt mean we got the voters json. HTTP errors will also be fulfilled 
pool.addEventListener('fulfilled', function (event) { //{ target: thispool, data: { promise: X, result: X}}
    //As soon as we receive a real response (voters-json) then calculate all the to-be-queried URLs
    
    if(event.data.result == undefined){ //this branch should never happen //First 'data' field belongs to es6-promise-pool, and second one belongs to tronair format
        var error = event.data.error; //?? o solo event.data ?
        console.log("\t\t------------------------Algun tipo de error de red,  maybe 503?");
        console.log({error});
        console.log("\t\tAlgun tipo de error de red,  maybe 503? ------------------------");
    } else { //array, with or without data, doesnt matter
        if (event.data.promise._postizo != "fake"){ //Real data comming in
            prom_counter--;
            console.log("++DOWNLOADED page (postizo)" + event.data.promise._postizo + " prom_counter: " + prom_counter + " array.length: " + event.data.result.data.length);
            Array.prototype.push.apply(pages, event.data.result.data); //Merge the two arrays
        }else{ //In order to wait real promises travelling through the internet to come back, we cheat by sending fake setTimeout-promises
            console.log("Empty array detected: \t\t\t\t\t postizo: " +event.data.promise._postizo+  " prom_counter: " + prom_counter);

        }

    }
});

pool.addEventListener('rejected', function (event) {
  var e = event.data.error
  console.log('Rejected : #######################' + event.data.error.message);
  //console.log({e});
})


/**
 * Creates new instances of request_options objects
*/
function getOptionsInstance(start){
    return { 
        uri: votes_url,
        qs: {
            //candidate: "TGzz8gjYiYRqpfmDwnLxfgPuLVNmpCswVp", // -> uri + '?access_token=xxxxx%20xxxxx'
            candidate: _address, // -> uri + '?access_token=xxxxx%20xxxxx'
            start: start,
            limit: 40,
            sort: "-votes" 
        },
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
      };
}


/**
 * Downloads all the voters for a given SR/candidate (@param address) and returns packed on an object, along with the number
 * of voters (@total) and total number of votes (@totalVotes)
 * @param address Used to conform the final download URL
 * @return  { "total": total, "totalVotes": totalVotes, "data": url_configs}
 */
async function getVoters(address){
    if(!DEBUG){   console.log = function() {}      }

   _address = address;

   var {_url_configs, total, totalVotes} = await apilister.getUrlConfigsArray(address);
  url_configs = _url_configs;
console.log({_url_configs});
  // Start the pool
  var poolPromise = pool.start();

  return poolPromise.then(function () {
      console.log = old_console; //return the console
      var x =  { "total": total, "totalVotes": totalVotes, "data": pages};
      //console.log( JSON.stringify(pages));
      return x;
    }
  );

}

module.exports.getVoters = getVoters;
//getVoters("TGzz8gjYiYRqpfmDwnLxfgPuLVNmpCswVp").then(x => { /*checkVoters(x); */ });
//getVoters("TDGy2M9qWBepSHDEutWWxWd1JZfmAed3BP").then(x => { /*checkVoters(x); */ });
//getVoters("TAD78uBWAveGNg3nDN8Ku18MSDeHmTRpbB").then(x => { /*checkVoters(x); */ });


/* 
function checkVoters(arr){
    console.log(arr.length);
    //console.log({arr});
}

 */
