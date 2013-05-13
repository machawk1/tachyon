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
	   console.log("START:");
	   console.log("GET URI-Q ("+timegatePrefix+(selectedTab.url)+") with Accept-Datetime value "+msg.tt)
	   var URI_Q = timegatePrefix+(selectedTab.url);
	   mementoStart(URI_Q);
	   
	   function mementoStart(URI_Q){
		   $.ajax({
			type:"HEAD",
			url:URI_Q
		   }).done(test0)
		   .fail(function() { console.log("error"); })
		   .always(function() { console.log("complete"); });
		}
	  var TG_FLAG;
	  function test0(message,text,response){
			console.log("Vary: "+response.getResponseHeader('Vary'));		
			var containsVaryAcceptDatetime = (response.getResponseHeader('Vary') != null);

			console.log("TEST-0");
			console.log("Response from URI-Q contain Vary: accept-datetime?"+containsVaryAcceptDatetime);
			if(containsVaryAcceptDatetime){
				TG_FLAG = true; console.log("TG-FLAG = TRUE");
				URI_R = URI_Q; console.log("URI-R = URI-Q");
			}
			test1(response);
		}
		
		function test1(response){
			console.log("TEST-1");
			var uriQIsAMemento = (response.getResponseHeader('Memento-Datetime') != null);
			console.log("URI-Q is a Memento?"+uriQIsAMemento);
			if(uriQIsAMemento){
				TG_FLAG = false; console.log("TG-FLAG = FALSE");
				URI_R = ""; console.log("URI-R = blank");
				var responseFromURIQA3XX = (response.status >= 300 && response.status < 400);
				console.log("resp3xx: "+responseFromURIQA3XX);
				if(responseFromURIQA3XX){follow();}
				else {alert("Success!");}
			}else {
				test2(response);
			}
		}
		
		function test2(response){
			var responseFromURIQA3XX = (response.status >= 300 && response.status < 400);
			console.log("resp3xx: "+responseFromURIQA3XX);
			if(responseFromURIQA3XX){follow();}
			else {test3(response);}
		}
		
		function test3(response){
		   if(TG_FLAG && response.status >= 400 && response.status < 600){
		   	alert("TimeGate or Memento error. How does the user agent handle this?");
		   }else {
		   	test4(response);
		   }
		}
		
		function test4(response){
			console.log("test4 unimplemented");
			var responseHasTimegateLinkPointingAtURI_G = false;
			if(responseHasTimegateLinkPointingAtURI_G){
				TG_FLAG = true;
				URI_R = URI_Q;
		
			}
		}
		
	   chrome.tabs.update(selectedTab.id,{url:timegatePrefix+(selectedTab.url)});
    })
  }
  
  /*
  if (msg.disengageTimeGate) {
    console.log("Disengage TimeGate...");
    chrome.tabs.getSelected(null, function(selectedTab) {
      toggleActive(selectedTab);
    });
  }if( msg.setTargetTime ) {
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
	console.log("webrequest");
	
	//redirectUrl: timegatePrefix+(details.url.replace("?","%3F")) 
	//console.log(timegatePrefix+(details.url) );
	//alert(timegatePrefix+(details.url) );
	//return {cancel: true};
	//alert(JSON.stringify(details));
	//return {cancel: true};
	redirectUrl: timegatePrefix+(details.url) 

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
  	
  	chrome.tabs.get(activeInfo.tabId, 
  		function(t){
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

chrome.webRequest.onHeadersReceived.addListener(
  function(details) {
    strh = "";
  	var isatimegate = false;
  	var tg_flag = false;
  	var uri_r;
  	console.log(details);

  	for(h in details.responseHeaders){
  	 if(details.responseHeaders[h].name == "Vary" && details.responseHeaders[h].value.indexOf("accept-datetime") != -1){

  	  isatimegate = true;
  	  tg_flag = true;
  	  //uri-r = 
  	 }else if(details.responseHeaders[h].name == "Link"){
  	 //	alert(details.responseHeaders[h].value);
  	 //	alert(details.url);
  	 }
  	}
     if(isatimegate){
     	return;// {cancel: true;}
     }
     queryTimegate(details);
   }, //noitcnuf
   {
     urls:["http://*/*", "https://*/*"],
     types:["main_frame"]
   },
   ["responseHeaders","blocking"]
);



//var relRegex = /<([^>]+)>;rel="([^"]+)"/g;
var mementos = []; //array of memento objects
function Memento(uriIn){
	this.uri = uriIn;
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
