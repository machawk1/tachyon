var listenerIsActive = false; // Plugin active? 
var targetTime = "Thu, 31 May 2007 20:35:00 GMT";

var mementoPrefix = "http://mementoproxy.lanl.gov/aggr/" //"http://www.webarchive.org.uk/wayback/memento/";
var timegatePrefix = mementoPrefix + "timegate/";
var timemapPrefix = mementoPrefix + "timemap/link/";

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
        chrome.tabs.reload(tab.id);
    }
}

chrome.browserAction.onClicked.addListener(toggleActive);
var timeTravel = false;

chrome.extension.onMessage.addListener(function(msg, _, sendResponse) {
  if(msg.method == "getMementosForCurrentTab"){
	  chrome.tabs.getSelected(null, function(selectedTab) {
		  sendResponse({mementos: mementos[selectedTab.id], uri: selectedTab.url});
	  });
	  return true;
  }
  
  if(msg.method == "setDate"){
	 timeTravel = true;

	 targetTime = msg.tt;

	 chrome.tabs.getSelected(null, function(selectedTab) {
		 
	   console.log("-------------\nSTART:\n-------------");
	   //console.log("HEAD URI-Q ("+timegatePrefix+(selectedTab.url)+") with Accept-Datetime value "+msg.tt)
	   console.log("HEAD URI-Q ("+(selectedTab.url)+") with Accept-Datetime value "+msg.tt)
	   
	   //hard-coding is no way to go, as it will fail when mementos aren't from api.wayback.archive.org
	   // this was done to remedy the second query, which has the below prepended to the URI, which is prepended by timegateprefix
	   // e.g. "http://mementoproxy.lanl.gov/aggr/timegate/http://api.wayback.archive.org/memento/201301010101/http://matkelly.com"
	   var targetURL = selectedTab.url.replace(/http:\/\/api\.wayback\.archive\.org\/memento\/[0-9]+\//,"");
	   
	   //var URI_Q = timegatePrefix+(targetURL);
	   var URI_Q = targetURL;
	   mementoStart();
	   
	   function mementoStart(){
		   console.log("Go to TEST-0");	//this is out of place and should be in Ajax done() but then done loses anonymity and arguments
		   $.ajax({
			type:"HEAD",
			url:URI_Q
		   }).done(test0)
		   .fail(function(d) { console.log("error");})
		   .always(function() { console.log("complete"); });
		}
	  var TG_FLAG;
	  
	  function test0(message,text,response){
			if(redirectResponseDetails != null){ //a redirect had to be intercepted by Chrome. Ajax does not normally allow this
				test0_redirect();
				return;
			} 		  
			var containsVaryAcceptDatetime = 
				(response.getResponseHeader('Vary') != null) && 
				(response.getResponseHeader('Vary') != "null") &&
				(response.getResponseHeader('Vary').toUpperCase().indexOf("ACCEPT-DATETIME") > -1);
			console.log("-------------\nTEST-0\n-------------");
			console.log("Response from URI-Q contain Vary: accept-datetime? "+containsVaryAcceptDatetime);
			console.log(response.getAllResponseHeaders());
			if(containsVaryAcceptDatetime){
				TG_FLAG = true; console.log("TG-FLAG = TRUE");
				URI_R = URI_Q; console.log("URI-R = URI-Q");
			}
			console.log("Go to TEST-1");
			test1(response);
	}
		
	function test0_redirect(){
		//console.log(redirectResponseDetails);
		var headers = Array();
		for(var rh in redirectResponseDetails.responseHeaders){
			headers[redirectResponseDetails.responseHeaders[rh].name.toUpperCase()] = redirectResponseDetails.responseHeaders[rh].value.toUpperCase();
		}
		headers['status'] = redirectResponseDetails.statusCode; //save this for later so we don't pass around details
		headers['location'] = redirectResponseDetails.redirectUrl;
		
		var varyHeader = headers["VARY"];
		var containsVaryAcceptDatetime = varyHeader && varyHeader.indexOf("ACCEPT-DATETIME") > -1;
		
		console.log("-------------\nTEST-0\n-------------");
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
		console.log("-------------\nTEST-1\n-------------");
		var uriQIsAMemento = (headers['Memento-Datetime'] != null);
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
		else {
			console.log("Go to TEST-3");
			alert("You've ended up in a weird place in the code. This path should have only been taken with a 300 and you're saying you got something other than a 3xx.");
			test3(response); //should never get here
		}
	}
	
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
		
		var mCollection = null;
		
		function test1(response){
			console.log("-------------\nTEST-1\n-------------");
			var uriQIsAMemento = (response.getResponseHeader('Memento-Datetime') != null);
			console.log("URI-Q is a Memento? "+uriQIsAMemento+" "+response.getResponseHeader('Memento-Datetime'));
			if(uriQIsAMemento){
				mCollection = getNextPrevMementos(response.getResponseHeader("Link"));
				
				TG_FLAG = false; console.log("  Setting TG-FLAG = FALSE");
				URI_R = ""; console.log("  Setting URI-R = blank");
				var responseFromURIQA3XX = (response.status >= 300 && response.status < 400);
				console.log(" Is response from URI-Q a 3xx: "+responseFromURIQA3XX+" "+response.status);
				if(responseFromURIQA3XX){follow(response);}
				else {
					displayMemento();
				}
				
				
				console.log("URI-Q: "+URI_Q);
			}else {
				console.log("Go to TEST-2");
				test2(response);
			}
		}
		
		function test2(response){
			console.log("-------------\nTEST-2\n-------------");
			var responseFromURIQA3XX = (response.status >= 300 && response.status < 400);
			console.log("resp3xx: "+responseFromURIQA3XX);
			if(responseFromURIQA3XX){follow(response);}
			else {
				console.log("Go to TEST-3");
				test3(response);
			}
		}
		
		function test3(response){
			console.log("-------------\nTEST-3\n-------------");
		   if(TG_FLAG && response.status >= 400 && response.status < 600){
		   	alert("TimeGate or Memento error. How does the user agent handle this?");
		   }else {
		   	test4(response);
		   }
		}
		
		function test4(response){
			console.log("-------------\nTEST-4\n-------------");
			
			//get link HTTP header, parse out rel="timegate", if it exists, set boolean on next line (hard-coded for now)
			console.log(response.getResponseHeader("Link"));
			var responseHasTimegateLinkPointingAtURI_G = 
				response.getResponseHeader("Link") != null &&
				response.getResponseHeader("Link").match(/rel=(.*)timegate/) != null;
			//console.log(response.getResponseHeader("Link").match(/rel=(.*)timegate/));
			//console.log(response.getResponseHeader("Link").match(/rel=(.*)timegate/) != null);
			URI_G = "http://api.wayback.archive.org/memento/timegate/"+URI_Q;
			
			TG_FLAG = true;
			URI_R = URI_Q;
			if(responseHasTimegateLinkPointingAtURI_G){
				URI_Q = URI_G;
			}else {
				var preferredTimegate = localStorage["preferredTimegate"];
				if(!preferredTimegate){
					preferredTimegate = "http://mementoproxy.cs.odu.edu/aggr/timegate";
				}
				URI_Q = preferredTimegate;
				console.log("mementostart()ing with "+URI_Q);
				return;
				mementoStart();
			}
		}
		
		function displayMemento(){
			console.log("Success");
			chrome.tabs.update(selectedTab.id,{url: URI_Q});
			updatePopupTime();
		}
		
		function updatePopupTime(){
			dateMatch = URI_Q.match(/[0-9]{14}/);
			dateMatch = dateMatch[0];
			chrome.extension.sendMessage({method: 'updateDropDown',datetime: dateMatch, mCollection: mCollection });
			console.log(dateMatch);
		}
		
		
	   	//chrome.tabs.update(selectedTab.id,{url:URI_Q});
    })
  }
  
  
  if (msg.disengageTimeGate) {
    console.log("Disengage TimeGate...");
    chrome.tabs.getSelected(null, function(selectedTab) {
      toggleActive(selectedTab);
    });
    iconChangeTimout = null;
    chrome.browserAction.setBadgeText({text: ""});
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
});



/**
 * This takes the url of any request and redirects it to the TimeGate.
 * The actual Datetime request is handled later (see below).
 */
chrome.webRequest.onBeforeRequest.addListener(
  
  function(details){
    if( !listenerIsActive) {return {};}// Pass through if the plugin is inactive.
	//filter invalid "URIs"
	if(details.url.indexOf("chrome://") != -1){return {};}
	
	redirectUrl: timegatePrefix+(details.url.replace("?","%3F")) 
	//return {cancel: true};
	//redirectUrl: timegatePrefix+(details.url) 
  },
  {
    urls: ["http://*/*", "https://*/*"]
  },
  ["blocking"]
);

//curl -I -H "Accept-Datetime: Sat, 03 Oct 2009 10:00:00 GMT" http://mementoproxy.lanl.gov/aggr/timegate/http://www.cnn.com/

/**
 * This modifies the request headers, adding in the desire Datetime.
 */
chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details ) {
        if( !listenerIsActive) { // Pass through if the plugin is inactive.
          return {requestHeaders: details.requestHeaders};
        }
        // Push in the Accept-Datetime header:
        details.requestHeaders.push( { name: "Accept-Datetime", value: targetTime });
        return {requestHeaders: details.requestHeaders};
    },
    {
       urls: ["http://*/*", "https://*/*"]
    },
    ['requestHeaders','blocking']
 );

var redirectResponseDetails = null;

chrome.webRequest.onBeforeRedirect.addListener(
	function(details){
		redirectResponseDetails = details;
    },
    {
       urls: ["http://*/*", "https://*/*"]
    },
    ['responseHeaders']
);

var iconChangeTimout = null;
var clockState = 30;
function changeIcon(){
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
    	
  	chrome.tabs.get(activeInfo.tabId, 
  		function(t){
			if(t.url.indexOf("chrome://") != -1){return;}
  			var details = {};
  			details.url = t.url;
  			details.tabId = activeInfo.tabId;
  			queryTimegate(details);
  		}
  	);
   }
);

function queryTimegate(details){
  if(details.url.indexOf("archive.org") != -1){	//we're viewing a memento now
	  chrome.browserAction.setBadgeText({text: ""});
	  if(clockState == 0){ //start the animation
		clockState = 30;
		changeIcon();
	  }
  	  return;
  }
  
  if( listenerIsActive ){
  	 $.ajax({
  		url: timemapPrefix+details.url,
  		beforeSend: function ( xhr ) {
  			chrome.browserAction.setBadgeText({text: ""});
  			clockState = 30;
  			changeIcon();
  		}
  	 })
  	 .error(function(msg){
  	 	chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 255]});
  	 	chrome.browserAction.setBadgeText({text: "ERR"});
  	 	chrome.browserAction.setIcon({path:"mementoLogo-19px-30.png"});
  	 	clockState = 0;
  	 })
  	 .done(function( msg ) {
  		getNumberOfMementos(msg,details.tabId);
  		clearTimeout(iconChangeTimeout);
  		clockState = 0;
  		chrome.browserAction.setIcon({path:"mementoLogo-19px-30.png"});
  		iconChangeTimeout = null;
  		
  		
  		//oldTachyonCode(details);
	 });
	} //fi
}

/*chrome.webRequest.onHeadersReceived.addListener(
  function(details) {
    strh = "";
  	var isatimegate = false;
  	var tg_flag = false;
  	console.log(details);

  	for(h in details.responseHeaders){
  	  if(details.responseHeaders[h].name == "Vary" && details.responseHeaders[h].value.indexOf("accept-datetime") != -1){
  	    isatimegate = true;
  	    tg_flag = true;
  	  }else if(details.responseHeaders[h].name == "Link"){
  	    //	alert(details.responseHeaders[h].value);
  	    //	alert(details.url);
  	  }
  	}
     if(isatimegate){
     	return;// {cancel: true;}
     }
     queryTimegate(details);
   }, //noitcnuf*/
 //  {
 //    urls:["http://*/*", "https://*/*"],
 //    types:["main_frame"]
 //  },
 //  ["responseHeaders","blocking"]
//);*/



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




function oldTachyonCode(details){
    tabRels[details.tabId] = {};
    var headers = details.responseHeaders;
    var isMemento = false;
    console.log(headers.length+" headers");
   // return;
    /*for( var i = 0, l = headers.length; i < l; ++i ) {
      console.log(headers[i].name+" "+headers[i].value);
      if( headers[i].name == 'Link' ) {
        while( matches = relRegex.exec(headers[i].value) ) {
          console.log("tabRels: "+matches[2]+" -> "+matches[1]);
          tabRels[details.tabId][matches[2]] = matches[1];
        }
      }
      // According to spec, can use presence of this header as definitive indicator that this is a Memento, and therefore not a live URL.
      if( headers[i].name == 'Memento-Datetime' ) {
        console.log("Memento-Datetime: "+headers[i].value);
        isMemento = true;
        tabRels[details.tabId]["Memento-Datetime"] = headers[i].value;
      }
    } \\rof
    */
}
