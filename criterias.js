const CRITERIAS = {
    VOTERS_PROPORTIONAL: 0,  //PROPORTIONAL: Voters are rewarded proportionally to their number of votes
    VOTERS_EQUAL: 1,         //EQUAL: Rewards equally divided among all voters
    HOLDERS_PROPORTIONAL: 2, //PROPORTIONAL: Holders are rewarded proportionally to their token balance (holdings)
    HOLDERS_EQUAL: 3,		 //EQUAL: Rewards equally divided among all holders
    CSV: 4           	     //Comma-separated-value fine (provided by the user)
};

module.exports.CRITERIAS = CRITERIAS;