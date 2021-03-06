if(top.document != document) {
  console.log("This is an iframe. Aborted.");
  return; //Stop. We only want to work in the main document, not in any embeded iframes.
}
console.log("Successfully injected");


var inGmail = false;
if (/^https:\/\/mail\.google\.com\/.*/i.test(window.location)){
  console.log("This page is Gmail");
  inGmail = true;
}

var panelCreated = false;
var panel = $();

function togglePanel(){
  console.log("Toggling Panel");
  if (panelCreated == true){
    destroyPanel();
  } else {
    createPanel();
  }
  console.log("Status: " + panelCreated);
}

function encryptObject(pwd, obj){
  console.log(obj);
  return btoa(sjcl.encrypt(pwd, JSON.stringify(obj)));
}
function decryptObject(pwd, obj){
  console.log(obj);
  return JSON.parse(sjcl.decrypt(pwd, atob(obj)));
}

//these are passed to the page every time the toggle button is pressed, regardless of the current panel state. Hopefully this will help us keep from missing when a user adds or removes any given key.
var privKeys = "";
var publKeys = "";
//these declairations have been moved out of the method. I want to do as much as possible by reference. The reason is because the more ID's and classes we have  posted to the page when we inject, the more likely someone will write a script to detect our presense.
var ecSelect; 
var dcSelect;
//These are the actual cryptography objects. They are generated when there is a change to the selected key.
var ecBinder;
var dcBinder;

function createPanel(){
  $.ajax({
    url:chrome.extension.getURL('html/panel.html'),
    success:function(data){
      $('body').append(data);
    },
    dataType:'html'
  });
  panel = $('#dpstx_pnl')
  console.log("Panel appended to document body.");
  var butt = $('#password_verify');
  butt.click(function(){console.log('hello')})
  butt.bind('click', function(){ //oh la la.
    try{
      var x = decryptObject(pass.val(), privKeys); //private keys
      var y = JSON.parse(publKeys); //public keys
      var z = pass.val(); //master password.
      passarea.remove();
      genTabs();
      $.each(x, function(key, value){ //iterate through all private keys and add them to drop-down menu.
        $('<option />').data('name', value.name).data('privateKey', value.privateKey).data('publicKey', value.publicKey).text(value.name).appendTo(dcSelect);
      });
      dcBinder = forge.pki.privateKeyFromPem($(dcSelect.children()[0]).data('privateKey'));//sets initial key to first option.
      $.each(y, function(key, value){ //iterate through all public keys and add them to drop down menu.
        console.log(value);
        $('<option />').data('name', value.name).data('publicKey', value.publicKey).text(value.name).appendTo(ecSelect);
      });
      ecBinder = forge.pki.publicKeyFromPem($(ecSelect.children()[0]).data('publicKey')); //set inital public key
      console.log(ecBinder);
    } catch(error){ //if the user entered the wrong password.
      console.log(error);
      console.log("Wrong Password (probably)");
      passarea.remove();
      destroyPanel();
    }
  });
  panel.show();
  panelCreated = true;
}

function genTabs(){
  var tbl = $('<div />').addClass('rgdpstxTabs').css('position', 'relative').css('width', '100%').css('height', '100%').appendTo(panel);
  var ecTab = $('<div />').addClass('rgdpstxTab').appendTo(tbl);
  var dcTab = $('<div />').addClass('rgdpstxTab').appendTo(tbl);
  //var xTab = $('<div />').addClass('rgdpstxTab').css('float', 'right').appendTo(tbl);

  var ecChkBx = $('<input/>', {type: 'radio', id: 'tab-1', name:'tab-group-1'}).appendTo(ecTab);
  ecChkBx[0].checked = true;
  $('<label />', {for: 'tab-1'}).text('Encrypt').appendTo(ecTab);
  var ecTabContent = $('<div/>').addClass('rgdpstxContent').appendTo(ecTab);
  var ecTxtOne = $('<textarea />').css('height', '40%').css('width', '100%').appendTo(ecTabContent);
  ecSelect = $('<select />').css('width', '100%').appendTo(ecTabContent);
  ecSelect.on('change', function(){ //when the selection changes, shifts to a new key.
    ecBinder = forge.pki.publicKeyFromPem(ecSelect.find(':selected').data('publicKey'));
    console.log(ecBinder);
  });
  
  
  //added id ecTxtTwo to capture data from this field
  var ecTxtTwo = $('<textarea />').css('height', '35%').css('width', '100%').attr('id', 'ecTxtTwo').appendTo(ecTabContent);
  ecTxtTwo[0].disabled = true;
  ecTxtOne.bind('input propertychange', function(){
    //ecTxtTwo.val(encodeURI(ecTxtOne.val()));
    ecTxtTwo.val(btoa(ecBinder.encrypt(ecTxtOne.val()))); //live encryption.
  });

  var dcChkBx = $('<input />', {type: 'radio', id: 'tab-2', name:'tab-group-1'}).appendTo(dcTab);
  $('<label />', {for: 'tab-2'}).text('Decrypt').appendTo(dcTab);
  var dcTabContent = $('<div/>').addClass('rgdpstxContent').appendTo(dcTab);
  
  //added id dcTxtOne to send data to this field
  var dcTxtOne = $('<textarea />').css('height', '40%').css('width', '100%').attr('id', 'dcTxtOne').appendTo(dcTabContent);
  dcSelect = $('<select />').css('width', '100%').appendTo(dcTabContent);
  dcSelect.on('change', function(){ //when the selection changes, shifts to a new key.
    dcBinder = forge.pki.privateKeyFromPem(dcSelect.find(':selected').data('privateKey'));
    console.log(ecBinder);
  });
  
  var dcTxtTwo = $('<textarea />').css('height', '35%').css('width', '100%').appendTo(dcTabContent);
  dcTxtTwo[0].disabled = true;
  dcTxtOne.bind('input propertychange', function(){
    //dcTxtTwo.val(encodeURI(dcTxtOne.val()));
    dcTxtTwo.val(dcBinder.decrypt(atob(dcTxtOne.val())));
  });
  
  //encrypt button
  var encryptCopyBtn = $('<button />').text('Copy to field').attr('id', 'copyToField').appendTo(ecTabContent);
  $('#copyToField').click(function() {
    console.log('clicked copyToField');
    //did encrypt button get clicked?
    addBodyListener(true);
  });
  var sendMessageBtn = $('<button />').text('Send via Email Client').appendTo(ecTabContent);
  sendMessageBtn.bind('click', function(){
    sendEmail(ecTxtTwo.val());
  });
  var sendMessageBtn = $('<button />').text('Send via Gmail').appendTo(ecTabContent);
  sendMessageBtn.bind('click', function(){
    sendGmail(ecTxtTwo.val());
  });
  
  //decrypt button
  var decryptCopyBtn = $('<button />').text('Decrypt field').attr('id', 'decryptField').appendTo(dcTabContent);
  $('#decryptField').click(function() {
    console.log('clicked decryptField');
    //did encrypt button get clicked?
    addBodyListener(false);
  });

  /*
  var xChkBx = $('<input />', {type: 'radio', id: 'tab-3', name:'tab-group-1'}).appendTo(xTab);
  $('<label />', {for: 'tab-3'}).text('X').appendTo(dcTab);
  var xTabContent = $('<div/>').addClass('rgdpstxContent').appendTo(xTab);
  $('<span />').text("you are not supposed to see this.").appendTo(xTabContent)
  */
}

function destroyPanel(){
  panel.remove();
  panelCreated = false;
}

function sendEmail(body){
  var w = window.open("mailto:?&body="+encodeURIComponent(body));
  setTimeout(function(){w.close()}, 150);
}

function sendGmail(body){
  var w = window.open("https://mail.google.com/mail/?view=cm&fs=1&body="+encodeURIComponent(body));
}

$(document).ready(function(){
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    console.log(request);/*
    console.log(request.name);
    console.log(request.publKeys);
    console.log(request.privKeys);
    console.log(sender);*/
    if (request.name == "toggle"){
      togglePanel();
      publKeys = request.publKeys;
      privKeys = request.privKeys;
    }
    sendResponse({result: "confirmed"});
  });
  console.log("Listener Initiated.");
});