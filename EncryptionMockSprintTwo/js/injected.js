if(top.document != document) { //Stop. We only want to work in the main document, not in any embeded iframes.
  console.log("This is an iframe. Aborted.");
  return;
} else {
  console.log("Environment safe to continue.");
}

var panelCreated = false; //obvious boolean is obvious.
var panel = false; //Initialize to empty JQuery object. This is where the panel will be housed
var personal_rsa_object; //set and access this object for our own personal RSA keys
var friend_rsa_object; //set and access this for our friends

//Moving the ajax request lines to the part of the file that waits for the DOM to be ready.

function togglePanel(){
  console.log("Toggling Panel");
  if (panelCreated == true){
    destroyPanel();
  } else {
    createPanel();
  }
  console.log("Status: " + panelCreated);
}

function createPanel(){
  //assign the resulting panel to the semi-global variable "panel" so it is accesible to the rest of the extension if need be (EG destruction)
  //panel = ;
  
  //These two lines add the html and launch the popup dialogs.
  //They can be deleted at a later time.
  //The javascript for these functions are located in js/dialog.js
  //addBasicDialogHtml();
  //addBasicPopDialog();

  //add button listeners
  $('#addFriend').bind('click', addNewFriendDialog);
  $('#rdsSelectFriend').bind('click', addSelectFriendDialog);
  $('#setPass').bind('click', addSetPasswordDialog);

  

  console.log("inside create panel")
  
  //panel.slideDown();
  /*panel.slideDown(2, function(){
    $('#panelDummy').height(panel.height()).slideDown();
  });*/
  $('#dummyEncryptionPanel').slideDown(4, function(){
    panel.slideDown();
  });
  panelCreated = true;
  
  console.log('added friend listener');
}

function destroyPanel(){
  
  //panel = undefined;
  //$(panel).hide();

  //panel.slideUp();
  panel.slideUp(2, function(){
    $('#dummyEncryptionPanel').slideUp();
  });
  panelCreated = false;
}

function encryptDecrypt()
{
  var textInput = $('#textInput').val();
  if(/!!/i.test(textInput))
  {
    $('#transformed').text("Decrypting somehow");
  }
  else
  {
    $('#transformed').text(textInput)
  }
}

function sendEmail(body){
  var w = window.open("mailto:?&body="+encodeURIComponent(body));
  setTimeout(function(){w.close()}, 150);
}

function fillInitializer(){
  fillUpdate()
  window.addEventListener("hashchange", function() {
    fillUpdate();
  }, false);
  $('#fillButton').bind('click', function(){
    switch (fillCheckUrl)
    {
      case "gmail":
        var msgBody = $('div[aria-label="Message Body"]');
        msgBody.text($('#transformed').test());
        break;
      case "facebook":
        break;
      case "hotmail":
        break;
      case "yahoo":
        break;
      case "guerrilla":
        break;
      case "privnote":
        break;
      case "sms4tor":
        break;
      case "hushmail":
        break;
      case "tormail":
        break;
      default:
        break;
    }
  });
}

function fillUpdate(){
  var check = fillCheckUrl();
  if (check){
    $('#fillButton')[0].disabled = false;
  } else {
    $('#fillButton')[0].disabled = true;
  }
  return check;
}

function fillCheckUrl(){
  if (/^https:\/\/mail\.google\.com\/.*compose=new$/i.test(window.location)) {
    return "gmail";
  } else if (/^https:\/\/www\.facebook\.com\/messages\/.+(?!\/.*)/i.test(window.location)){
    return "facebook";
  } else if (/^https:\/\/blu\d+.mail.live.com\/.+n=\d+&view=1$/i.test(window.location)){
    return "hotmail";
  } else if (/^http:\/\/\w{2}-\w{3}\.mail\.yahoo\.com\/.*$/i.test(window.location)){
    return "yahoo";
  } else if (/^https:\/\/www\.guerrillamail\.com\/compose\/$/i.test(window.location)){
    return "guerrilla";
  } else if (/^https:\/\/privnote\.com\/?$/i.test(window.location)){
    return "privnote";
  } else if (/^http:\/\/sms4tor3vcr2geip\.onion\/?/i.test(window.location)){
    return "sms4tor";
  } else if (/^https:\/\/www\.hushmail\.com\/.*#compose$/i.test(window.location)){
    return "hushmail";
  } else if (/^http:\/\/jhiwjjlqpyawmpjx\.onion\/$/i.test(window.location)) { //This is only here for memorial purposes.
    return "tormail"; 
  } else {
    return false;
  }
}

// The injected script's message listener. I am unsure if this will have to be edited to
// accomodate different messages being passed to/from the background page or if there can
// multiple instances thereof. EG see commended else-if case below.
$(document).ready(function(){

  //Moved ajax call to w/i DOM ready function. Was hopping that it would fix some of the screen issues I have seen but no progress so
  $.ajax({
    url:chrome.extension.getURL('injection.html'),
    success:function(data){
      panel = $(data);//relative
      //$('body').append(panel);
      panel.insertBefore($('body').children().first());
      $('<div>&nbsp;</div>').attr('id', 'dummyEncryptionPanel').attr('position', 'relative').css('display', 'none').height(panel.height()).insertBefore($('body').children().first());
      $('#textInput').keyup(encryptDecrypt);
      fillInitializer();
    },
    dataType:'html'
  });
  /*
  $.ajax({
    url:chrome.extension.getURL('injection.html'),
    success:function(data){
      $('<div />').attr('id', 'dipsticksBodyPlaceholder').appendTo($('html'));
      
      //$('body').attr('position', 'absolute').children().appendTo($('#dipsticksBodyPlaceholder'));
      var elements = $('body').attr('position', 'absolute').children().detach(); //.appendTo($('#dipsticksBodyPlaceholder'));
      $('#dipsticksBodyPlaceholder').append(elements);

      $('#dipsticksBodyPlaceholder').css('position', 'relative').css('width', '100%').appendTo($('body'));

      $('<div>&nbsp;</div>').css('display', 'none').css('position', 'relative').attr('id', 'panelDummy').insertBefore($('#dipsticksBodyPlaceholder'));
      panel = $(data);
      panel.insertBefore($('#dipsticksBodyPlaceholder'));
      //$('body').append(panel);
      $('#textInput').keyup(encryptDecrypt);
      fillInitializer();
    },
    dataType:'html'
  });
  */

  
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    console.log(request);
    if (request.name == "toggle"){
      togglePanel();
    } /*else if (request.name == "load_friends"){
    
    }*/
    
    console.log("recieved response: " + request.name);
    sendResponse({result: "confirmed"});
  });
  console.log("Listener Initiated.");
});