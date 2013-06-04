var listenerIsActive = false; // Plugin active? 
var targetTime_default = "Thu, 31 May 1901 20:35:00 GMT";
var targetTime = targetTime_default; // means to checks to determine if setdate has been executed

var mementoPrefix = "http://mementoproxy.cs.odu.edu/aggr/" //"http://www.webarchive.org.uk/wayback/memento/";
var timegatePrefix = mementoPrefix + "timegate/";
var timemapPrefix = mementoPrefix + "timemap/link/";

var iconChangeTimout = null; //used to control the clock animation

var originalURIQ = "";
var xhr;
var resourceMementos = new Array();

/* This is used to record any useful information about each tab, 
 * determined from the headers during download.
 */
function toggleActive(tab) {
    if( listenerIsActive ) {
        listenerIsActive = false;
        chrome.browserAction.setPopup({popup: ""});
        chrome.browserAction.setIcon({path:"icon.png"});
		iconChangeTimout = null;
    } else {
        listenerIsActive = true;
        chrome.browserAction.setIcon({path:"icon-on-19.png"});
        chrome.browserAction.setPopup({popup: "popup.html"});
        chrome.tabs.reload(tab.id,{'bypassCache': true});
    }
}

chrome.browserAction.onClicked.addListener(toggleActive);
var timeTravel = false;

/*
function getResourceMemento(uri){
	if(!resourceMementos[uri]){
		setTimeout(function(){getResourceMemento(uri);},1000);
	}else {
		console.log("Found resourceMemento: "+resourceMementos[uri]);
		console.log(uri+" needs to be changed to "+resourceMementos[uri]+" in the main page DOM");

		//chrome.tabs.executeScript(null,{code:"console.log(document);console.log(uri);"});
		chrome.tabs.getSelected(null, function(tab) {
		  console.log("** * "+uri+" | "+resourceMementos[uri]);
		  chrome.tabs.sendRequest(tab.id, {method: "modHTML",src: uri, dest: resourceMementos[uri]}, function(response) {
		  	console.log("* * * ");
			console.log(response.data);
		  });
		});
		
		
		return resourceMementos[uri];
	}
}
*/
    	

var ou = ""; //dev test to see if it's the original URI being queried;

chrome.extension.onMessage.addListener(function(msg, _, sendResponse) {
  console.log("*** EXECUTING LISTENER");
  console.log(msg);
  if(msg.method == "getMementosForCurrentTab"){
	  chrome.tabs.getSelected(null, function(selectedTab) {
		  sendResponse({mementos: mementos[selectedTab.id], uri: selectedTab.url});
	  });
	  return true;
  }
  
  if(msg.method == "setDate"){
   localStorage["targetTime"] = msg.tt;
   targetTime = msg.tt;
   //console.log("reloading page");
   //chrome.tabs.reload({'bypassCache': true});
   
   //chrome.tabs.getSelected(null, function(selectedTab) {
	//  beginContentNegotiation(timegatePrefix + selectedTab.url);
   //});
   return true;
  }
  
  if (msg.disengageTimeGate) {
    console.log("Disengage TimeGate...");
    chrome.tabs.getSelected(null, function(selectedTab) {
      toggleActive(selectedTab);
    });
    clearTimeout(iconChangeTimeout);
    iconChangeTimout = null;
    chrome.browserAction.setBadgeText({text: ""});
  }
  console.log("not caught by listener");
});



/*function beginContentNegotiation(URI_Q){
		//if(ou != ""){console.log(URI_Q+" blocked for testing"); return "";}else {ou = URI_Q;}
		console.log("*** BEGINNING CONTENT NEGOTIATION");
		targetTime = localStorage["targetTime"];
		timeTravel = true;
		console.log("URI-Q : "+URI_Q);
	   
		return mementoStart(URI_Q);
}*/
	   
function mementoStart(details){
	//redirectResponseDetails = null;
	/*if(originalURIQ == ""){
	console.log("Setting originalURIQ to "+URI_Q);
	originalURIQ = URI_Q;}*/

	console.log("-------------\nSTART:\n-------------");
	console.log("HEAD URI-Q ("+details.url+") with Accept-Datetime value "+targetTime);
	return test0(details);
	/*xhr = $.ajax({
	type:"HEAD",
	url:URI_Q,
	headers: {'Accept-Datetime':targetTime}//,'Access-Control-Expose-Headers': 'Location'
	//,
	//async: false
	}).done(//test0)
	function(d,t,x){
		console.log(x.getAllResponseHeaders());
		test0(URI_Q,d,t,x);
	})
	.fail(function(d) { 
		console.log("Ajax Request error"); 
		console.log(d);
		console.log(d.getAllResponseHeaders());
	})
	.always(function() { 
		console.log("Ajax request complete"); 
	});*/
}


var TG_FLAG;
	  
function test0(details){
	console.log("Go to TEST-0");
	console.log(details);
	console.log(details.url);
	/*console.log(redirectResponseDetails);
	if(redirectResponseDetails && redirectResponseDetails[details.url]){ //a redirect had to be intercepted by Chrome. Ajax does not normally allow this
		console.log("Going the redirect code path");
		console.log(redirectResponseDetails);
		test0_redirect();
		return;
	} */
	
	var containsVaryAcceptDatetime = false;		  
	for(var h in details.responseHeaders){
		if(details.responseHeaders[h].name == "Vary"){containsVaryAcceptDatetime = true; break;}
	}
	/*var containsVaryAcceptDatetime = 
		(response.getResponseHeader('Vary') != null) && 
		(response.getResponseHeader('Vary') != "null") &&
		(response.getResponseHeader('Vary').toUpperCase().indexOf("ACCEPT-DATETIME") > -1);*/
	console.log("-------------\nTEST-0\n-------------");
	console.log("Response from URI-Q contain Vary: accept-datetime? "+containsVaryAcceptDatetime);
	//console.log(response.getAllResponseHeaders());
	if(containsVaryAcceptDatetime){
		TG_FLAG = true; console.log("TG-FLAG = TRUE");
		URI_R = details.url; console.log("URI-R = URI-Q");
	}
	console.log("Go to TEST-1");
	return test1(details);
}
		
	/*function test0_redirect(){
		console.log("-------------\nTEST-0 R\n-------------");
		console.log(redirectResponseDetails);
		var headers = Array();
		for(var rh in redirectResponseDetails.responseHeaders){
			headers[redirectResponseDetails.responseHeaders[rh].name.toUpperCase()] = redirectResponseDetails.responseHeaders[rh].value.toUpperCase();
		}
		headers['status'] = redirectResponseDetails.statusCode; //save this for later so we don't pass around details
		headers['location'] = redirectResponseDetails.redirectUrl;
		
		var varyHeader = headers["VARY"];
		var containsVaryAcceptDatetime = varyHeader && varyHeader.indexOf("ACCEPT-DATETIME") > -1;
		
		
		console.log("Response from URI-Q contain Vary: accept-datetime? "+containsVaryAcceptDatetime);
		if(containsVaryAcceptDatetime){
			TG_FLAG = true; console.log("TG-FLAG = TRUE");
			URI_R = URI_Q; console.log("URI-R = URI-Q");
		}
		console.log("Go to TEST-1");
		redirectResponseDetails = null;
		test1_redirect(headers);	
	}
	
	function test1_redirect(headers){
		console.log("-------------\nTEST-1 R\n-------------");
		var uriQIsAMemento = (headers['Memento-Datetime'] != null);
		console.log(headers);
		console.log("URI-Q is a Memento? "+uriQIsAMemento+" "+headers['Memento-Datetime']);

		if(uriQIsAMemento){
			TG_FLAG = false; console.log("  Setting TG-FLAG = FALSE");
			URI_R = ""; console.log("  Setting URI-R = blank");
			var responseFromURIQA3XX = (response.status >= 300 && response.status < 400);
			console.log(" Is response from URI-Q a 3xx: "+responseFromURIQA3XX+" "+response.status);
			if(responseFromURIQA3XX){follow(response);}
			else {displayMemento();}
			console.log("URI-Q: "+URI_Q);
		}else {
			console.log("Go to TEST-2");
			test2_redirect(headers);
		}	
	}
	
	function test2_redirect(headers){
		console.log("-------------\nTEST-2 R\n-------------");
		var responseFromURIQA3XX = (headers["status"] >= 300 && headers["status"] < 400);
		console.log("Is the response from URI-Q a 300?: "+responseFromURIQA3XX);
		if(responseFromURIQA3XX){
			console.log("  TG_FLAG = "+TG_FLAG);
			if(TG_FLAG){
				console.log("Going to FOLLOW")
				follow(headers['location']);
			}else {
				console.log("CASE 01 302 O2 How does the user agent handle this? UNIMPLEMENTED!");
			}
		}
		else {	//getting here when hitting the back button after clicking on a link in the memento
			//console.log("Go to TEST-3");
			console.log("You've ended up in a weird place in the code. This path should have only been taken with a 300 and you're saying you got something other than a 3xx.");

			//alert("You've ended up in a weird place in the code. This path should have only been taken with a 300 and you're saying you got something other than a 3xx.");
			//test3(response); //should never get here
			return;
		}
	}*/
var mCollection = null;
	
function follow(loc){
	console.log("-------------\nFOLLOW\n-------------");
	URI_Q = loc;console.log("URI_Q = Location (value of HTTP header) = "+loc);
	console.log("Going to START");
	mementoStart();
}

function getNextPrevMementos(linkHeader){
	var temporalMarkings = linkHeader.match(/<(.*?)[0-9]{14}(.*?)>;rel=(.*?)datetime="(.*?)"/g);
	var mCollection = new MementoCollection();
	for(var m=1; m<temporalMarkings.length; m++){
		var uri = temporalMarkings[m].match(/<(.*)>/);
		uri = uri[1];
		//console.log(uri);
		var rel = temporalMarkings[m].match(/rel="(.*)";/);
		rel = rel[1];
		//console.log(rel);
		var memento = new Memento(uri);
		if(rel.indexOf("last") > -1){mCollection.last = memento;}
		else if(rel.indexOf("first") > -1){mCollection.first = memento;}
		else if(rel.indexOf("prev") > -1){mCollection.prev = memento;}
		else if(rel.indexOf("next") > -1){mCollection.next = memento;}
	}
	return mCollection;
}



function test1(details){
	console.log("-------------\nTEST-1\n-------------");
	
	var uriQIsAMemento = false;
	for(var h in details.responseHeaders){
		if(details.responseHeaders[h].name == "Memento-Datetime"){uriQIsAMemento = true; break;}
	}

	console.log("URI-Q is a Memento? "+uriQIsAMemento);
	if(uriQIsAMemento){
		try{
			mCollection = getNextPrevMementos(response.getResponseHeader("Link"));
		}catch(err){}
		TG_FLAG = false; console.log("  Setting TG-FLAG = FALSE");
		URI_R = ""; console.log("  Setting URI-R = blank");
		var responseFromURIQA3XX = (response.status >= 300 && response.status < 400);
		console.log(" Is response from URI-Q a 3xx: "+responseFromURIQA3XX+" "+response.status);
		if(responseFromURIQA3XX){follow(response);}
		else {
			displayMemento();
		}
		
		
		console.log("URI-Q: "+details.url);
	}else {
		console.log("Go to TEST-2");
		return test2(details);
	}
}
		
function test2(details){
	console.log("-------------\nTEST-2\n-------------");
	console.log(details);
	var responseCode = parseInt((details.statusLine.match(/[0-9]{3}/g))[0],10);
	console.log(responseCode);
	var responseFromURIQA3XX = (responseCode >= 300 && response.status < responseCode);
	console.log("resp3xx: "+responseFromURIQA3XX);
	if(responseFromURIQA3XX){follow(details);}
	else {
		console.log("Go to TEST-3");
		return test3(details,responseCode);
	}
}
		
function test3(details,responseCode){
   console.log("-------------\nTEST-3\n-------------");
   if(TG_FLAG && responseCode >= 400 && responseCode < 600){
	alert("TimeGate or Memento error. How does the user agent handle this?");
   }else {
    console.log("TG_FLAG && responseCode >= 400 && responseCode < 600: NO, respCode: "+responseCode);
    console.log("Go to TEST-4");
	return test4(details);
   }
}

function test4(details){
	console.log("-------------\nTEST-4\n-------------");
	var responseHasTimegateLink = false;
	var responseTimegateLinkValue = "";
	for(var h in details.responseHeaders){
		if(details.responseHeaders[h].name == "Link"){
			responseHasTimegateLink = true; 
			responseTimegateLinkValue = details.responseHeaders[h].value;
			break;
		}
	}
	
	
	//get link HTTP header, parse out rel="timegate", if it exists, set boolean on next line (hard-coded for now)
	console.log("Response Timegate Link Value: "+responseTimegateLinkValue);
	var responseHasTimegateLinkPointingAtURI_G = 
		responseHasTimegateLink &&
		responseTimegateLinkValue.match(/rel=(.*)timegate/) != null;

	URI_G = "http://api.wayback.archive.org/memento/timegate/"+details.url;
	
	TG_FLAG = true;
	URI_R = details.url;
	//return;
	if(responseHasTimegateLinkPointingAtURI_G){
		var timegateRegExResult = responseTimegateLinkValue.match("<(.*)>");
		URI_G = timegateRegExResult[1];
		console.log("URI-Q ("+details.url+") = URI-G ("+URI_G+")");
		URI_Q = URI_G;
		mementoStart(); //should this be here?
	}else {
		var preferredTimegate = localStorage["preferredTimegate"];
		//if(!preferredTimegate){	//this value hasn't been set by the user. Set it here.
		var	preferredTimegate = "http://mementoproxy.cs.odu.edu/aggr/timegate/";
		//	localStorage["preferredTimegate"] = preferredTimegate;
		//}
		console.log("Preferred timegate is "+preferredTimegate);
		console.log("Current URI-Q is "+details.url);
		//URI_Q = (preferredTimegate + "" + details.url);
		console.log("Go to (return) mementoStart() with URI-Q="+preferredTimegate+details.url);
		return preferredTimegate+details.url;
		//mementoStart();
	}
}

function displayMemento(URI_Q){
	console.log("SUCCESS");
	console.log("MEMENTO: "+URI_Q);
	
	if((URI_Q.search(originalURIQ) + originalURIQ.length) == URI_Q.length){	//check if current URIQ is originalURIQ
		//chrome.tabs.update(selectedTab.id,{url: URI_Q});
	}else { //otherwise, just return the new resource location
		
		//add the memento URI to an associative array with the key being the original URI
		var originalURI = URI_Q.substr(URI_Q.indexOf("http",5));
		resourceMementos[originalURI] = URI_Q;
		console.log("Got to displayMemento for "+URI_Q+",\n\t  original URI = "+originalURI);
	}
	//	function(tab){} //potentially use this callback in the future
	//);
	//updatePopupTime();
}

function updatePopupTime(){
	dateMatch = URI_Q.match(/[0-9]{14}/);
	dateMatch = dateMatch[0];
	chrome.extension.sendMessage({method: 'updateDropDown',datetime: dateMatch, mCollection: mCollection });
	console.log(dateMatch);
}

  
  
  
  
  
  /*if( msg.setTargetTime ) {
    console.log("Setting date "+msg.targetTime);
    targetTime = msg.targetTime;
    chrome.tabs.getSelected(null, function(selectedTab) {
      // Update by sending back to the TimeGate with the new Target Time:
 //     chrome.tabs.update(selectedTab.id, {url: 
  //      timegatePrefix+(tabRels[selectedTab.id]["original"].replace("?","%3F")) });
    });
  } else if( msg.requestTargetTime ) {
    console.log("Sending current targetTime...");
    chrome.extension.sendMessage({showTargetTime: true, targetTime: targetTime });
  }*/




/* ****************************
   HEADER HANDLERS AND MANIPULATION
   VVVVVVVVVVVVVVVVVVVVVVVVVVVVV */
chrome.webRequest.onBeforeRequest.addListener(
  function(details){
  	if( !listenerIsActive || targetTime == targetTime_default){return;}
    console.log("in onbeforerequest");

  	if(ou != details.url){return;}
  	console.log("in onbeforerequest"+details.url);
  	console.log(details);
	//console.log("Changing "+details.url+" to "+(timegatePrefix + details.url));
    x = beginContentNegotiation(details.url); //testing);
    console.log(details.url+" resolved to "+x);
    
    if(x == ""){return;}
    return;
	//prevent tabs that are not the currently active one from polluting the header array
  	/*var requestIsFromCurrentTab = false;
    chrome.tabs.getSelected(null, function(selectedTab) {
  	  requestIsFromCurrentTab = (details.tabId==selectedTab.id);
    });
    if(!requestIsFromCurrentTab){return;}
    */
	return; //  Not confident that this function is doing anything useful or conducive to the procedure at the moment.
	
    if( !listenerIsActive || targetTime == targetTime_default) {return {};}// Pass through if the plugin is inactive.
	if(details.url.indexOf("chrome://") != -1){return {};}
	
	var uriQwithTimegate = details.url.replace("?","%3F");
	//console.log("rduri: "+uriQwithTimegate+ " time:"+targetTime);
	return {redirectUrl: uriQwithTimegate};
  },
  
  {
     urls:["<all_urls>"],
     types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
   },
   ["blocking"]
);

//curl -I -H "Accept-Datetime: Sat, 03 Oct 2009 10:00:00 GMT" http://mementoproxy.lanl.gov/aggr/timegate/http://www.cnn.com/

/**
 * This modifies the request headers, adding in the desire Datetime.
 */
chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
    	if( !listenerIsActive || targetTime == targetTime_default) {return {};}
    	
    	if(details.url.indexOf(".ico") > -1){return {cancel: true};}
    	
    	console.log("target time: "+targetTime);
    	
    	details.requestHeaders.push({name: "Accept-Datetime", value: targetTime});
    	console.log("request details (next line): ");
    	console.log(details);
    	return {requestHeaders:details.requestHeaders};
  
    	//prevent tabs that are not the currently active one from polluting the header array
  	    /*var requestIsFromCurrentTab = false;
  	    
        chrome.tabs.getSelected(null, function(selectedTab) {
  	      requestIsFromCurrentTab = (details.tabId==selectedTab.id);
  	      console.log("details.tabId-->"+fff+" "+selectedTab.id+"<--selectedTab.id");
        });
        if(!requestIsFromCurrentTab){return;}
    	*/
    },
   {
     urls:["http://*/*", "https://*/*"]
   },
   ["requestHeaders","blocking"]
 );

var redirectResponseDetails = new Array();

chrome.webRequest.onBeforeRedirect.addListener(
	function(details){	
		console.log("* **Redirecting");
		console.log(details);
		//return;
		
		if(details.url != details.redirectUrl){ //for some reason the enclosing handler is fired even when there is no true 3XX redirect, see http://odusource.cs.odu.edu/hello
			if(details.method == "HEAD"){ //only the extension's HEAD requests will count, not the subsequent GETs
				redirectResponseDetails = details;
				console.log("***** onbeforeredirect");
				console.log(details);
    		}
    	}
    },
    {
     urls:["http://*/*", "https://*/*"],
     types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
   },
   ["responseHeaders"]
);

chrome.webRequest.onResponseStarted.addListener(
	function(details){
		 if( !listenerIsActive || targetTime == targetTime_default){return {};}
		 console.log("RESPONSE STARTED");
		 console.log(details);

		 return;
	},
	{
		urls: ["http://*/*", "https://*/*"]
	},
	['responseHeaders']
);


chrome.webRequest.onCompleted.addListener(
	function(details){
		//console.log("request completed! "+details.url);
//		console.log(details.url);	
	},
	{
		urls: ["http://*/*", "https://*/*"]
	},
	['responseHeaders']
);



/* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   END HEADER HANDLERS AND MANIPULATION
   **************************** */


var clockState = 30;
function changeIcon(){
    if(arguments.length == 1){ //clear any previous animation
      try{
       clearTimeout(iconChangeTimeout); 
	   iconChangeTimout = null;
	  }catch(e){} //clear the animation timeout if instructed by parameter, otherwise continue normally
    }

	if(clockState == 45){
		chrome.browserAction.setIcon({path:"mementoLogo-19px-30.png"});	
		clockState = 30;	
	}
	else if(clockState == 30){
		chrome.browserAction.setIcon({path:"mementoLogo-19px-37_5.png"});
		clockState = 375;
	}
	else if(clockState == 375){
		chrome.browserAction.setIcon({path:"mementoLogo-19px-45.png"});
		clockState = 45;
	}
	else {return;}
	iconChangeTimeout = setTimeout(function(){changeIcon();},1000);
}

chrome.tabs.onActivated.addListener(
  function(activeInfo) {
	//exclude invalid URIs from entering the TimeGate fetching procedure
    /*	
  	chrome.tabs.get(activeInfo.tabId, 
  		function(t){
			if(t.url.indexOf("chrome://") != -1){return;}
  			var details = {};
  			details.url = t.url;
  			details.tabId = activeInfo.tabId;
  			//queryTimegate(details);
  		}
  	);*/
   }
);

/*function queryTimegate(details){
  if(details.url.indexOf("archive.org") != -1){	//we're viewing a memento now
	  chrome.browserAction.setBadgeText({text: ""});
	  if(clockState == 0){ //start the animation
		clockState = 30;
		changeIcon();
	  }
  	  return;
  }
  
  if( listenerIsActive ){
     console.log("queryingtmegate");
     if(details.url.indexOf("chrome://") > -1 || details.url.indexOf("chrome-devtools://") > -1){return;}
  	 $.ajax({
  		url: timemapPrefix+details.url,
  		beforeSend: function ( xhr ) {
  			chrome.browserAction.setBadgeText({text: ""});
  			xhr.setRequestHeader("Cache-Control", "no-cache");
  			xhr.setRequestHeader("Accept-Datetime", localStorage["targetTime"]);
  				

  			clockState = 30;
  			changeIcon();
  		}
  	 })
  	 .error(function(msg){
  	    console.log("error");
  	 	chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 255]});
  	 	chrome.browserAction.setBadgeText({text: "ERR"});
  	 	chrome.browserAction.setIcon({path:"mementoLogo-19px-30.png"});
  	 	clockState = 0;
  	 })
  	 .done(function( msg ) {
  	    console.log("done");
  		getNumberOfMementos(msg,details.tabId);
  		clearTimeout(iconChangeTimeout);
  		clockState = 0;
  		chrome.browserAction.setIcon({path:"mementoLogo-19px-30.png"});
  		iconChangeTimeout = null;
  		
  		
  		//oldTachyonCode(details);
	 });
	} //fi
}*/

chrome.webRequest.onHeadersReceived.addListener(
	function(details){		
		 if( listenerIsActive && targetTime != targetTime_default) {
			console.log("Headers received, response details (next line):");
			console.log(details);
			console.log("Other side");
			var newURI = mementoStart(details);
			details.url = newURI;
			console.log("New URI is "+newURI);
			//return {responseHeaders: details.responseHeaders };
			console.log(newURI+ " --- "+ details.url);
			//if(newURI != details.url){
					//chrome.tabs.update({url: newURI});
					console.log("Updating uri to "+newURI);
   			 //}
   			 details.statusLine = "HTTP/1.1 302 Found";
   			 details.url = newURI;
   
   			 var isHTML = false;		  
			 for(var h in details.responseHeaders){
				if(details.responseHeaders[h].name == "Content-Type" && details.responseHeaders[h].value == "text/html"){isHTML = true; break;}
			 }
   			 if(isHTML){
   			 	chrome.runtime.sendMessage({method: "forwardTo", forwardToUrl: newURI });
   			 }
   			 //return {redirectUrl: newURI}; //this doesn't work
   			 //return {responseHeaders:details.responseHeaders};  
   			 //return {cancel: true,redirectUrl: newURI};
			//return {cancel: true};
		}
	}, 
    {
     urls:["http://*/*", "https://*/*"]
   },
   ["blocking","responseHeaders"]
);



//var relRegex = /<([^>]+)>;rel="([^"]+)"/g;
var mementos = []; //array of memento objects
function Memento(uriIn){
	this.uri = uriIn;
}

function MementoCollection(){
	this.next = null;
	this.prev = null;
	this.first = null;
	this.last = null;
}




//chrome.tabs.prototype here to remember the mementos array or just use message passing like a sane person

function getNumberOfMementos(timemap,tabId){
	//mementos = timemap.match(/rel="(.*?)memento"/g);
	//console.log(mementos.length);
	return;
	m2 = timemap.match(/<(.*)>;rel="(.*)memento"/gm);
	mementos[tabId] = [];
	for(var m in m2){
		mementos[tabId].push(new Memento(m2[m].substring(1,m2[m].indexOf(">")-1)));
	}
//	console.log(m2);
//	http://api.wayback.archive.org/memento/20060514123511/http://www.matkelly.com/>;rel="first memento"
	
	
	var numberOfMementos = mementos[tabId].length;
	if(numberOfMementos >= 10000){numberOfMementos = ">10k";}
	else {numberOfMementos = ""+numberOfMementos;}
	chrome.browserAction.setBadgeBackgroundColor({color: [0, 200, 0, 255]});
	chrome.browserAction.setBadgeText({text: numberOfMementos});
}


