"use strict"; // Hang on, we're in for some chop!

var listenerIsActive = false; // Plugin active? 
var targetTime_default = "Thu, 31 May 1901 20:35:00 GMT";
var targetTime = targetTime_default; // means to checks to determine if setdate has been executed

var mementoPrefix = "http://mementoproxy.cs.odu.edu/aggr/"; //"http://www.webarchive.org.uk/wayback/memento/";
var timegatePrefix = mementoPrefix + "timegate/";
var timemapPrefix = mementoPrefix + "timemap/link/";

var iconChangeTimout = null; //used to control the clock animation

var originalURIQ = "";
var xhr;
var resourceMementos = [];//new Array();


var debug = false; // toggle for debug mode

/* This is used to record any useful information about each tab, 
 * determined from the headers during download.
 */
function toggleActive(tab) {
    if (listenerIsActive) {
        listenerIsActive = false;
        chrome.browserAction.setPopup({popup: ""});
        chrome.browserAction.setIcon({path: "icon.png"});
        iconChangeTimout = null;
    } else {
        listenerIsActive = true;
        chrome.webRequest.handlerBehaviorChanged(); //clear the cache for handlers
        chrome.browserAction.setIcon({path: "icon-on-19.png"});
        chrome.browserAction.setPopup({popup: "popup.html"});
        //chrome.tabs.reload(tab.id, {'bypassCache': true});
    }
}

chrome.browserAction.onClicked.addListener(toggleActive);
var timeTravel = false;


var ou = ""; //dev test to see if it's the original URI being queried;

chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
    //console.log("*** EXECUTING LISTENER");
    //console.log(msg);
    if (msg.method === "getMementosForCurrentTab") {
        chrome.tabs.getSelected(null, function (selectedTab) {
            sendResponse({mementos: mementos[selectedTab.id], uri: selectedTab.url});
        });
        return true;
    }
    if (msg.method === "setDate") {
        localStorage["targetTime"] = msg.tt;
        targetTime = msg.tt;
         ////console.log("reloading page");
        //chrome.tabs.reload({'bypassCache': true});
   //chrome.tabs.getSelected(null, function(selectedTab) {
   //  beginContentNegotiation(timegatePrefix + selectedTab.url);
   //});
        return true;
    }
    if (msg.disengageTimeGate) {
        //console.log("Disengage TimeGate...");
        chrome.tabs.getSelected(null, function (selectedTab) {
            toggleActive(selectedTab);
        });
        clearTimeout(iconChangeTimeout);
        iconChangeTimout = null;
        chrome.browserAction.setBadgeText({text: ""});
    }
    //console.log("not caught by listener");
});
function mementoStart(details){
    //console.log("-------------\nSTART:\n-------------");
    //console.log("HEAD URI-Q ("+details.url+") with Accept-Datetime value "+targetTime);
    if(debug){console.log("Negotiating for "+details.url);}
    var test0Result;
    xhr = $.ajax({
        type:"HEAD",
        url:details.url,
        headers: {'Accept-Datetime':targetTime},//,'Access-Control-Expose-Headers': 'Location'
        async: false//,
        //timeout: 3000
    }).done( //test0)
      function(d,t,x){
        ////console.log(x.getAllResponseHeaders());
        //console.log("Ajax request done, proceeding with HVDS processing");
        //console.log(d);
        //console.log(t);
        //console.log(x);
        //console.log(x.getAllResponseHeaders());
        x.url = details.url;
        test0Result = test0(x);
    })
    .fail(function(d) { 
    	console.log("Ajax failed for:");
    	console.log(d);
        //console.log("Ajax Request error"); 
        //console.log(d);
        //console.log(d.getAllResponseHeaders());
    })
    .always(function(a,b,c) { 
        //console.log("Ajax request complete for "+details.url); 
        //console.log(a);
        //console.log(b);
        //console.log(c);
        if (a!=="error"){
        	//console.log(c.getAllResponseHeaders());
        }
        xhr = null;
    });
    return test0Result;
}


var TG_FLAG;
      
function test0(details){
    if(debug){console.log("Go to TEST-0");}
    
    var containsVaryAcceptDatetime = false;
    
    for(var h in details.responseHeaders){
        if (details.responseHeaders[h].name == "Vary"){containsVaryAcceptDatetime = true; break;}
    }
    
    if(debug){
    	console.log("-------------\nTEST-0\n-------------");
    	console.log("Response from URI-Q contain Vary: accept-datetime? "+containsVaryAcceptDatetime);
    	//console.log(response.getAllResponseHeaders());
    }
    
    if (containsVaryAcceptDatetime){
        TG_FLAG = true; //console.log("TG-FLAG = TRUE");
        URI_R = details.url; //console.log("URI-R = URI-Q");
    }
    if(debug){console.log("Go to TEST-1");}
    var ret = test1(details);
    if(debug){console.log("Bubbled up to test 0, returning!");}
    return ret;
}
        
var mCollection = null;
    
function follow(details){
    if(debug){
    	console.log("-------------\nFOLLOW\n-------------");
    	//URI_Q = loc;
    	console.log("URI_Q = Location (value of HTTP header) = "+details.url);
    }
    
    //var fauxDetails = {url: loc};
	return details.url;
    //console.log("Going to START");
    //let the original request die, as the browser will automatically follow 3XXs
    //return mementoStart(details);
}

function getNextPrevMementos(linkHeader){
    var temporalMarkings = linkHeader.match(/<(.*?)[0-9]{14}(.*?)>;rel=(.*?)datetime="(.*?)"/g);
    var mCollection = new MementoCollection();
    for(var m=1; m<temporalMarkings.length; m++){
        var uri = temporalMarkings[m].match(/<(.*)>/);
        uri = uri[1];
        
        var rel = temporalMarkings[m].match(/rel="(.*)";/);
        rel = rel[1];

        var memento = new Memento(uri);
        if (rel.indexOf("last") > -1){mCollection.last = memento;}
        else if (rel.indexOf("first") > -1){mCollection.first = memento;}
        else if (rel.indexOf("prev") > -1){mCollection.prev = memento;}
        else if (rel.indexOf("next") > -1){mCollection.next = memento;}
    }
    return mCollection;
}



function test1(details){
	if(debug){console.log("-------------\nTEST-1\n-------------");}
    
    var uriQIsAMemento = false;
    for(var h in details.responseHeaders){
        if (details.responseHeaders[h].name == "Memento-Datetime"){uriQIsAMemento = true;}
    }
    
    //this is probably wrong but how does one determine if a URI-Q is a memento?
    //  relying on memento-datetime being present is not enough, as there are archives that will not return the header
    if (details.status == 200 && details.url.match(/[0-9]{14}/g)){uriQIsAMemento = true;}
    

    if(debug){console.log("URI-Q is a Memento? "+uriQIsAMemento);}
    
    if (uriQIsAMemento){
        //console.log("We found the memento! : "+details.url);
        return details.url;
        /*try{
            mCollection = getNextPrevMementos(response.getResponseHeader("Link"));
        }catch(err){}*/
        
        TG_FLAG = false; 
        if(debug){console.log("  Setting TG-FLAG = FALSE");}
        URI_R = ""; 
        if(debug){console.log("  Setting URI-R = blank");}
        var responseFromURIQA3XX = (response.status >= 300 && response.status < 400);
        if(debug){console.log(" Is response from URI-Q a 3xx: "+responseFromURIQA3XX+" "+response.status);}
        if (responseFromURIQA3XX){follow(response);}
        else {
            displayMemento();
        }
        
        
        //console.log("URI-Q: "+details.url);
    }else {
        if(debug){console.log("Go to TEST-2");}
        var ret = test2(details);
        if(debug){console.log("Bubbled up to test 1, returning!");}
        return ret;
    }
}

     
function test2(details){
    if(debug){
    	console.log("-------------\nTEST-2\n-------------");
    	console.log(details);
    }
    
    //var responseCode = parseInt((details.statusLine.match(/[0-9]{3}/g))[0],10);
    var responseCode = details.status;
    if(debug){console.log(responseCode);}
    var responseFromURIQA3XX = (responseCode >= 300 && response.status < responseCode);
    //console.log("Is response a 3xx?: "+responseFromURIQA3XX + "   code: "+responseCode);
    //console.log("Iterating through all urls that were 3xxs, l="+test2_300.length);
    for(var i in test2_300){
    	if(debug){console.log("Checking if "+test2_300[i]+" is "+details.url);}
    	if(details.url == test2_300[i]){
    		if(debug){console.log(":: A REDIRECT HAS OCCURED!");}
    		responseFromURIQA3XX = true;
    	}
    }
    //console.log("iterating done");
    
    if (responseFromURIQA3XX){
    	if(debug){
    		console.log("FOLLOWING!!!!");
    		
    	}
    	return follow(details);
    }else {
        if(debug){console.log("Go to TEST-3");}
        var ret = test3(details,responseCode);
        //console.log("Bubbled up to test 2, returning!");
        return ret;
    }
}
        
function test3(details,responseCode){
   if(debug){console.log("-------------\nTEST-3\n-------------");}
   if (TG_FLAG && responseCode >= 400 && responseCode < 600){
    alert("TimeGate or Memento error. How does the user agent handle this?");
   }else {
    if(debug){
    	console.log("TG_FLAG && responseCode >= 400 && responseCode < 600: NO, respCode: "+responseCode);
    	console.log("Go to TEST-4");
    }
    
    var ret = test4(details);
    //console.log("Bubbled up to test 3, returning!");
    return ret;
   }
}



function test4(details){
    if(debug){console.log("-------------\nTEST-4\n-------------");}
    var responseTimegateLinkValue = details.getResponseHeader("Link");
    
    //get link HTTP header, parse out rel="timegate", if it exists, set boolean on next line (hard-coded for now)
    //console.log("Response Timegate Link Value for "+details.url+" : "+responseTimegateLinkValue);
    var responseHasTimegateLinkPointingAtURI_G;
    if (responseTimegateLinkValue){
    	//console.log("ResponseTimegate has a link value!");
    	//console.log(responseTimegateLinkValue.match(/rel=(.*)timegate/));
        responseHasTimegateLinkPointingAtURI_G = responseTimegateLinkValue.match(/rel=(.*)timegate/) != null;
   		//console.log("XXXX");
    }else {
    	//console.log("Response timegate did not have a link value. :(");
    }
    	//console.log("Y");
    	//console.log(details);
	//is this problematic that it is resolving the API URI after recent Wayback changes
    //URI_G = "http://api.wayback.archive.org/memento/timegate/"+details.url;

    TG_FLAG = true;
    var URI_R = details.url;
    var URI_G, URI_Q;
	//console.log("154");
    if (responseHasTimegateLinkPointingAtURI_G){
        var timegateRegExResult = responseTimegateLinkValue.match("<(.*)>");
        var mementoInLinkHeaderValue = responseTimegateLinkValue.match(/[^\s|^,^<]+;rel=\"memento\";/g);
        
        //just a test to see if we can extract the memento URI from the aggregate link header
        if (mementoInLinkHeaderValue){
            //console.log("Test: "+mementoInLinkHeaderValue[0]);
            ////console.log(mementoInLinkHeaderValue[0]);
            ////console.log(mementoInLinkHeaderValue[0].replace(">;rel=\"memento\";",""));
            var mURI = mementoInLinkHeaderValue[0].replace(">;rel=\"memento\";","");
            //console.log("Memento URI embedded in Link header: "+mURI);
            return mURI;
        } else {
            //console.log("Test: no memento URI in the link header");
            //console.log(responseTimegateLinkValue);
            URI_G = timegateRegExResult[1];
            //console.log("URI-Q ("+details.url+") = URI-G ("+URI_G+")");
            //console.log("Details.url: "+details.url);
            //console.log(details);
            URI_Q = URI_G;
        }
        
        
        
        
        return URI_Q;
        //mementoStart(); //should this be here?
    }else {
        var preferredTimegate = localStorage["preferredTimegate"];
        //if (!preferredTimegate){    //this value hasn't been set by the user. Set it here.
        //var    preferredTimegate = "http://mementoproxy.cs.odu.edu/aggr/timegate/";
        var    preferredTimegate = "http://mementoproxy.lanl.gov/aggr/timegate/";
        //    localStorage["preferredTimegate"] = preferredTimegate;
        //}
        //console.log("Preferred timegate is "+preferredTimegate);
        //console.log("Current URI-Q is "+details.url);
        //URI_Q = (preferredTimegate + "" + details.url);
        //console.log("Go to (return) mementoStart() with URI-Q="+preferredTimegate+details.url);
        return preferredTimegate+details.url;
        //mementoStart();
    }
}

function displayMemento(URI_Q){
    //console.log("SUCCESS");
    //console.log("MEMENTO: "+URI_Q);
    
    if ((URI_Q.search(originalURIQ) + originalURIQ.length) == URI_Q.length){    //check if current URIQ is originalURIQ
        //chrome.tabs.update(selectedTab.id,{url: URI_Q});
    }else { //otherwise, just return the new resource location
        
        //add the memento URI to an associative array with the key being the original URI
        var originalURI = URI_Q.substr(URI_Q.indexOf("http",5));
        resourceMementos[originalURI] = URI_Q;
        //console.log("Got to displayMemento for "+URI_Q+",\n\t  original URI = "+originalURI);
    }
    //    function(tab){} //potentially use this callback in the future
    //);
    //updatePopupTime();
}

function updatePopupTime(){
    dateMatch = URI_Q.match(/[0-9]{14}/);
    dateMatch = dateMatch[0];
    chrome.extension.sendMessage({method: 'updateDropDown',datetime: dateMatch, mCollection: mCollection });
    //console.log(dateMatch);
}


/* ****************************
   HEADER HANDLERS AND MANIPULATION
   VVVVVVVVVVVVVVVVVVVVVVVVVVVVV */
chrome.webRequest.onBeforeRequest.addListener(
  function(details){
  	if(debug){console.log("X"+details.url);}
      if (!listenerIsActive){console.log(" * Listener is not active"); return;}
      if(targetTime == targetTime_default){console.log(" * targettime == targettime_default"); return;}
      
      if (details.url.indexOf("chrome-extension://") != -1){return {};}
      
      //console.log("A URL is attempting to be accessed: "+details.url);
      if (
       details.url.match(/http(.*)[0-9]{14}(.*)http(.*)/g) ||
       details.url.match(/webcitation/g)
      ){ //memento URI successfully obtained, let pass through
          //console.log("SUCCESSX in getting memento: "+details.url);
          return {};
      }else {
          //console.log("STILLPROCESSINGX memento: "+details.url);
      }
      try {
        var newURI = mementoStart(details);
        //console.log("New URI: "+newURI);
        if (newURI != details.url){
            var mementoURI = newURI.match(/http(.*)[0-9]{14}(.*)http/g);
            if (newURI.indexOf(timegatePrefix) != -1 &&
                mementoURI && mementoURI.length >= 1
                ){
                    //console.log("Replacing timegate in URI: "+newURI);
                    return {redirectUrl: newURI.replace(timegatePrefix,"")};}
            //console.log("REDIRECTX: "+details.url+" --> "+newURI);
            return {redirectUrl: newURI};
        }else {
        	if(debug){console.log("NEW URI");}
            ////console.log("SAMEX: "+details.url+" === "+newURI);
        }
    	if(debug){console.log("DONE with "+details.url);}
        //return {};
    
        if (details.url.indexOf("chrome://") != -1){return {};}
    }catch(err){
        //console.log("An error happened! It was likely the result of the Ajax Request failing, error contents next line:");
        //console.log(err.message);
        //console.log("Line "+err.lineNumber);
        return {};    
    }
  },
  {
     urls:["<all_urls>"],
     types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
   },
   ["blocking","requestBody"]
);

chrome.webRequest.onErrorOccurred.addListener(
	function onErrorOccurred(details){
		console.log(" --------- an error occured ----------");
		console.log(details);	
	},
   {urls:["<all_urls>"]}
);

//curl -I -H "Accept-Datetime: Sat, 03 Oct 2009 10:00:00 GMT" http://mementoproxy.lanl.gov/aggr/timegate/http://www.cnn.com/

/**
 * This modifies the request headers, adding in the desire Datetime.
 */
chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        if (!listenerIsActive || targetTime == targetTime_default) {return {};}
        
        if (details.url.indexOf(".ico") > -1){return {cancel: true};}
                
        //console.log("target time: "+targetTime);
        
        details.requestHeaders.push({name: "Accept-Datetime", value: targetTime});
        details.requestHeaders.push({name: "Cache-Control", value: "no-cache"});
        
        
        
        ////console.log("request details (next line): ");
        ////console.log(details);
        ////console.log("About to run procedure in onbeforesendheaders");
        
        ////console.log("new URI = "+newURI);
        //return;
        
        
        
        //console.log("About to send request with Accept-Datetime headers for "+details.url+" headers: ");
        //console.log(details.requestHeaders);
        return {requestHeaders:details.requestHeaders};
  
        //prevent tabs that are not the currently active one from polluting the header array
          /*var requestIsFromCurrentTab = false;
          
        chrome.tabs.getSelected(null, function(selectedTab) {
            requestIsFromCurrentTab = (details.tabId==selectedTab.id);
            //console.log("details.tabId-->"+fff+" "+selectedTab.id+"<--selectedTab.id");
        });
        if (!requestIsFromCurrentTab){return;}
        */
    },
   {
     urls:["http://*/*", "https://*/*"]
   },
   ["requestHeaders","blocking"]
 );

var redirectResponseDetails = [];//new Array();
var test2_300 = [];

chrome.webRequest.onBeforeRedirect.addListener(
    function(details){    
        //console.log("*** REDIRECT");
        test2_300.push(details.redirectUrl);
        //console.log(details);
        /*return;
        
        if (details.url != details.redirectUrl){ //for some reason the enclosing handler is fired even when there is no true 3XX redirect, see http://odusource.cs.odu.edu/hello
            if (details.method == "HEAD"){ //only the extension's HEAD requests will count, not the subsequent GETs
                redirectResponseDetails = details;
                //console.log("***** onbeforeredirect");
                //console.log(details);
            }
        }*/
    },
    {
     urls:["http://*/*", "https://*/*"],
     types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
   },
   ["responseHeaders"]
);

chrome.webRequest.onResponseStarted.addListener(
    function(details){
         if (!listenerIsActive || targetTime == targetTime_default){return {};}
         
         if(details.fromCache){
         	if(debug){console.log(details.url+" pulled from cache!");}
         }else {
         	if(debug){console.log(details.url+" NOT pulled from cache");}
         }
         //console.log("Response started for "+details.url);
         ////console.log("RESPONSE STARTED");
         ////console.log(details);

         return;
    },
    {
        urls: ["http://*/*", "https://*/*"]
    },
    ['responseHeaders']
);


chrome.webRequest.onCompleted.addListener(
    function(details){
        ////console.log("request completed! "+details.url);
//        //console.log(details.url);    
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
    if (arguments.length == 1){ //clear any previous animation
      try{
       clearTimeout(iconChangeTimeout); 
       iconChangeTimout = null;
      }catch(e){} //clear the animation timeout if instructed by parameter, otherwise continue normally
    }

    if (clockState == 45){
        chrome.browserAction.setIcon({path:"mementoLogo-19px-30.png"});    
        clockState = 30;    
    }
    else if (clockState == 30){
        chrome.browserAction.setIcon({path:"mementoLogo-19px-37_5.png"});
        clockState = 375;
    }
    else if (clockState == 375){
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
            if (t.url.indexOf("chrome://") != -1){return;}
              var details = {};
              details.url = t.url;
              details.tabId = activeInfo.tabId;
              //queryTimegate(details);
          }
      );*/
   }
);

/*function queryTimegate(details){
  if (details.url.indexOf("archive.org") != -1){    //we're viewing a memento now
      chrome.browserAction.setBadgeText({text: ""});
      if (clockState == 0){ //start the animation
        clockState = 30;
        changeIcon();
      }
        return;
  }
  
  if ( listenerIsActive ){
     //console.log("queryingtmegate");
     if (details.url.indexOf("chrome://") > -1 || details.url.indexOf("chrome-devtools://") > -1){return;}
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
          //console.log("error");
           chrome.browserAction.setBadgeBackgroundColor({color: [255, 0, 0, 255]});
           chrome.browserAction.setBadgeText({text: "ERR"});
           chrome.browserAction.setIcon({path:"mementoLogo-19px-30.png"});
           clockState = 0;
       })
       .done(function( msg ) {
          //console.log("done");
          getNumberOfMementos(msg,details.tabId);
          clearTimeout(iconChangeTimeout);
          clockState = 0;
          chrome.browserAction.setIcon({path:"mementoLogo-19px-30.png"});
          iconChangeTimeout = null;
          
          
          //oldTachyonCode(details);
     });
    } //fi
}*/
var redirectURL = "";
chrome.webRequest.onHeadersReceived.addListener(
    function(details){        
         if (listenerIsActive && targetTime != targetTime_default) {
             //console.log("Received headers for "+details.url+"! :");
             //console.log(details.responseHeaders);
            ////console.log("Headers received, response details (next line):");
            ////console.log(details);
            ////console.log("Other side");
            //var newURI = mementoStart(details);
            //details.url = newURI;
            ////console.log("New URI is "+newURI);
            //return {responseHeaders: details.responseHeaders };
            ////console.log(newURI+ " --- "+ details.url);
            //if (newURI != details.url){
                    //chrome.tabs.update({url: newURI});
            //        //console.log("Updating uri to "+newURI);
                //}
                
                //details.statusLine = "HTTP/1.1 302 Found";
               // details.url = newURI;
               
               
               /* Experimental impl from SO.com */
               /*if (redirectURL == ""){
                   redirectURL = newURI;
                   chrome.tabs.reload();
                   
               }
                var isHTML = false;          
             for(var h in details.responseHeaders){
                if (details.responseHeaders[h].name == "Content-Type" && details.responseHeaders[h].value == "text/html"){isHTML = true; break;}
             }*/
             
             
                //if (isHTML){
                //    chrome.runtime.sendMessage({method: "forwardTo", forwardToUrl: newURI });
                //}
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
    ////console.log(mementos.length);
    return;
    m2 = timemap.match(/<(.*)>;rel="(.*)memento"/gm);
    mementos[tabId] = [];
    for(var m in m2){
        mementos[tabId].push(new Memento(m2[m].substring(1,m2[m].indexOf(">")-1)));
    }
//    //console.log(m2);
//    http://api.wayback.archive.org/memento/20060514123511/http://www.matkelly.com/>;rel="first memento"
    
    
    var numberOfMementos = mementos[tabId].length;
    if (numberOfMementos >= 10000){numberOfMementos = ">10k";}
    else {numberOfMementos = ""+numberOfMementos;}
    chrome.browserAction.setBadgeBackgroundColor({color: [0, 200, 0, 255]});
    chrome.browserAction.setBadgeText({text: numberOfMementos});
}


