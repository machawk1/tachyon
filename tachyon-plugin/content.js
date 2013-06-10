chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if(request.method == "getText"){
            sendResponse({data: document.all[0].innerText, method: "getText"}); //same as innerText
        }
        
        if(request.method == "forwardTo"){
        	window.location = request.forwardToUrl;
        }
    }
);