var rq = require("request-promise");
var PromisePool = require('es6-promise-pool');

var concurrency =1;
var url_pool = [];
var i = 0;
const votes_url = "https://apilist.tronscan.org/api/vote";
var total_is_kown = false;
var found = false;
var total = undefined;
var totalVotes = undefined;
var _address;

var promiseProducer = function () {
    var retval = null;
    if(url_pool.length > 0 && !found ){
        var req_opts = url_pool.shift(); //when array becomes empty, retval is 'undefined'
        retval = rq(req_opts).catch(function (err) {
            var aux= err.options;
            console.log(">>FAIL: vamos a reintroducir la query"); 
            //url_pool.push(composeRequestConfig(0, _address));
            retval = Promise.resolve({data: []});;
            retval._postizo = "repeat";
            return retval;
        });
        retval._postizo = url_pool.length;
        //console.log("Produced promise : " + url_pool.length );
    }
    return retval;
}

// PROMISE POOL
var pool = new PromisePool(promiseProducer, concurrency);
var pages = [];

//Being fulfilled doesnt mean we got the voters json. HTTP errors will also be fulfilled 
pool.addEventListener('fulfilled', function (event) { //{ target: thispool, data: { promise: X, result: X}}
    //As soon as we receive a real response (voters-json) then calculate all the to-be-queried URLs

    if(event.data.result == undefined){ //First 'data' field belongs to es6-promise-pool, and second one belongs to tronair format
        var error = event.data.error; //?? o solo event.data ?
        console.log("\t\t------------------------apilist_populateUrl.js Some sort of network error happened");
        console.log({error});
        console.log("\t\t------------------------");
    } else { //array, with or without data, doesnt matter
        //console.log("event.data.promise._postizo " + event.data.promise._postizo);
        if (event.data.promise._postizo != "repeat"){
            found = true;
            //console.log("FOUND " + event.data.promise._postizo +  " votes: " + event.data.result.total);
            total = event.data.result.total;
            totalVotes = event.data.result.totalVotes;

        }else{
            //console.log("Empty array detected: \t\t\t\t\t postizo: " +event.data.promise._postizo);

        }

    }
});

pool.addEventListener('rejected', function (event) {
  var e = event.data.error
  console.log('Rejected : #######################' + event.data.error.message);
  //console.log({e});
})

/**
 * Use a Promises pool to donwload the first page of voters and extract num_voters
 * @param address Tron address of SR/candidate from whom we want to know the number of voters
 * @returns The number of voters for the given SR
 */
function getNumberOfVoters(address){

  for(i = 0 ; i<=9; i++){ //request the same URL for maximun 10 times (concurrency = 1)
    url_pool.push(composeRequestConfig(0, address)); //&start=0   
  } 

  var poolPromise = pool.start(); // Start the pool

  return poolPromise.then(function () {
      //console.log('----------------------All promises fulfilled-----------------------');
      //console.log(num_voters);
      return total;
    }
  );

}

/**
 *
 * Creates the 'config' object required by 'request-promise' library
 * @param {*} start A ULR dinamic parameter that tells apilist.tronscan.io where to start pagination 
 * @param {*} address A URL dinamic parameter that tells apilist.tronscan.io which SR we want the votes from
 * @returns string A URL with all dinamic and static parameters embeded (uses )
 */
function composeRequestConfig(start, address){
    return { 
        uri: votes_url,
        qs: {
            //candidate: "TGzz8gjYiYRqpfmDwnLxfgPuLVNmpCswVp", // -> uri + '?access_token=xxxxx%20xxxxx'
            candidate: address, // -> uri + '?access_token=xxxxx%20xxxxx'
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
 * Use a Promises pool to donwload the first page of voters and extract num_voters
 * @param address Tron address of SR/candidate from whom we want to know the number of voters
 * @returns Array of URLs, paginated 40 by 40 (that's the maximum pagination apilist.tronscan.org allows)
 */
async function getUrlConfigsArray(address){
    _address = address;
    //online query..
    var numVoters = await getNumberOfVoters(address);
    
    var numPages = Math.floor(numVoters / 40); //Also 'result.page.totalVotes'
    var url_configs = [];
    for(var i=0 ; i<=numPages; i++){  
        url_configs.push(composeRequestConfig(i*40, address)); //will be added as url parameter: ...&start=i*40...
    } 
    //console.log(JSON.stringify(url_configs));
    return { "_url_configs": url_configs, "total": numVoters, "totalVotes": totalVotes};
}

//getPaginatedUrls("TDGy2M9qWBepSHDEutWWxWd1JZfmAed3BP");

module.exports.getUrlConfigsArray = getUrlConfigsArray;