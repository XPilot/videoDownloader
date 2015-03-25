function getURLs(){
	var moduleURL = document.getElementById("url").value;
	var urls = [];
	console.log(moduleURL);

	xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange=function(){
	  if (xmlhttp.readyState==4 && xmlhttp.status==200){
	    	var xml = xmlhttp.responseXML;
			var items = xml.children[0].children[0].children;

			for(var i = 13; i<items.length; i++){
				urls.push(items[i].children[1].getAttribute("url")+"&hd=yes");
			}

			//console.log(urls);
			sendDataToServer(urls);
	    }
	  }
	xmlhttp.open("GET", moduleURL, true); 
	xmlhttp.send();

}

function sendDataToServer(urls){
	var http = new XMLHttpRequest();
	http.open("POST", "http://127.0.0.1:1337/index.html", true);
	http.send(urls);

	var socket = io.connect('localhost:1337');
  		socket.on('download', function (data) {
    	//console.log(data['percentage']);
    	document.getElementById("progress").style.width = data['percentage'] + "%";
    	document.getElementById("download").value = data['percentage'] + "%";
  	});
}



//http://teamtreehouse.com/library/how-to-make-a-website.rss?feed_token=cb938f04-9486-4526-b516-4de52020c41f