$(document).ready(function(){
  chrome.runtime.sendMessage({method: "getMementosForCurrentTab"}, function(response) {
	  var dates = extraMementosDatetimesFromMementos(response.mementos);
	  var dropdownOptions = "\n\t<option value=\""+response.uri+"\">live</option>";
	  for(var m=dates.length-1; m>=0; m--){
		  dropdownOptions = dropdownOptions+"\n\t<option value=\""+response.mementos[m].uri+"\">"+dates[m].toString()+"</option>";
	  }
	  
	  
	  $('body').prepend("<div id=\"topui\"><h3>Seed URI: "+response.uri+"</h3>"+
		"<h3 id=\"activeMemento\">Displayed Memento: <span>live</span></h3>"+
		"<label for=\"availableMementos\">Available Mementos:</label><br />"+
		"<div id=\"timeControl\"><button id=\"prev\">&#8610;</button><select id=\"availableMementos\">"+dropdownOptions+"</select><button id=\"next\">&#8611;</button>"+
			"<button id=\"goToMemento\">Go!</button>"+
			"<button id=\"lock\">Lock</button>"+
		"</div></div>"
	   );
	  $("#datePickerUI, #topui").effect("fade","slow");
	  $("#loading").hide();
	  updateNextPrevButtons();
	  
	  $("#goToMemento").click(function(){
		chrome.tabs.executeScript(null,
		 {code:"window.location = \""+$("#availableMementos").val()+"\";"});
		 $("#activeMemento span").html($("#availableMementos").find(":selected").html());
	  });
	  
	  function updateNextPrevButtons(){
		if($("#availableMementos").prop("selectedIndex") == 0){$("#prev").attr("disabled","disabled");}
		else {$("#prev").removeAttr("disabled");}
		
		if($("#availableMementos").prop("selectedIndex") == ($("#availableMementos > option").length - 1)){$("#next").attr("disabled","disabled");}
		else {$("#next").removeAttr("disabled");}
	  }
	  
	  $("#availableMementos").change(updateNextPrevButtons);
	  $("#next").click(function(){
		 $("#availableMementos").prop("selectedIndex",$("#availableMementos").prop("selectedIndex") + 1);
		 updateNextPrevButtons();
		 if($("#lock").hasClass("pressed")){
			 $("#goToMemento").trigger("click");
		 }
	  });
	  $("#prev").click(function(){
		 $("#availableMementos").prop("selectedIndex",$("#availableMementos").prop("selectedIndex") - 1);
		 updateNextPrevButtons();
		 if($("#lock").hasClass("pressed")){
			 $("#goToMemento").trigger("click");
		 }
	  });
	  
	  $("#lock").click(function(){
		  if($(this).hasClass("pressed")){
			  $(this).removeClass("pressed");
			  $("#goToMemento").removeAttr("disabled");
		  }
		  else{
			$(this).addClass("pressed");
			$("#goToMemento").attr("disabled","disabled");
		  }
	  });
     
  });
 
 
  var dtp = $('#datepicker');
  dtp.datetimepicker({
    altField: "#alt_example_4_alt",
    altFieldTimeOnly: false,
    dateFormat: "D, dd M yy",
    timeFormat: "HH:mm:ss",
    separator: " ",
    altFormat: "D, dd M yy",
    altTimeFormat: "HH:mm:ss z",
    altSeparator: " ",
    changeYear: true,
    showButtonPanel: false
  });
  

  $('#set_target_time').click(function (){ 
  	var dt = dtp.val();
  	if(dt.indexOf(":") == -1){//time didn't come through from datepicker, append default
  		dt+= " 00:00:00";
  	}
  	
  	if(dt.indexOf("GMT") == -1){ //datepicker does not appear to be include timezone, temp patch
  		dt+= " GMT";
  	}

    chrome.runtime.sendMessage({method: "setDate", tt: dt });
    //self.close();
    //console.log("Setting date after");
  });
  //$('#disable_timetravel').click(function (){ 
  //  chrome.extension.sendMessage({disengageTimeGate: true});
  //  self.close();
  //});
  
  // Request the latest time:
  //chrome.extension.sendMessage({requestTargetTime: true});
  //chrome.extension.onMessage.addListener(function(msg, _, sendResponse) {
  //  if (msg.showTargetTime) {
  //    console.log("Showing date "+msg.targetTime);
  //    dtp.datetimepicker('setDate', msg.targetTime);
  //  }
  //});

});


function makeDateFromDatetime(mDateStr){
	var year = mDateStr.substr(0,4);
	var month = mDateStr.substr(4,2);
	var day = mDateStr.substr(6,2);
	var hour = mDateStr.substr(8,2);
	var minute = mDateStr.substr(10,2);
	var second = mDateStr.substr(12,2);
	return new Date(year,month,day,hour,minute,second);
}

function extraMementosDatetimesFromMementos(mementosAry){
	datetimes = [];
	for(var m=0; m<mementosAry.length; m++){
		var datetime = (mementosAry[m].uri.match(/[0-9]{14}/))[0];
		var mDate = makeDateFromDatetime(datetime);
		datetimes.push(mDate);
	}
	return datetimes;
}
