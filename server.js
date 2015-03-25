var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var urlsReceived = "";

var videoNumbering = 0;
var total = 0;
var current = 0;
var length = 0;
var progress= "";
var mimeTypes = {
    "html": "text/html",
    "js": "text/javascript",
    "css": "text/css"};

    var app = http.createServer(function(request, response){
        
        var uri = url.parse(request.url).pathname;
        var filename = path.join(process.cwd(), uri);

        // Get some information about the file
        fs.lstat(filename, function(err, stats) {

            // Handle errors
            if(err) {
              response.writeHead(500, {'Content-Type' : 'text/plain'});
              response.write('Error while trying to get information about file\n');
              response.end();
              return false;
            }

            if (stats.isFile()) {
                fs.exists(filename, function(exists){
                    if(!exists){
                        console.log(filename + " does not exist");
                        response.writeHead(200, {'Content-Type' : 'text/plain'});
                        response.write('404 Not found\n');
                        response.end();
                        return;
                    }

                    var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
                    response.writeHead(200, {'Content-Type' : mimeType});
                    var fileStream = fs.createReadStream(filename);
                    fileStream.pipe(response);
                });

                if (request.method == 'POST') {
                    request.on('data', function (data) {
                        urlsReceived = String(data).split(",");
                    });
                    request.on('end', function () {
                       response.end('post received');
                       downloadVideo(urlsReceived);
                    });
                }
            }
            else {
                // Tell the user what is going on.
                response.writeHead(404, {'Content-Type' : 'text/plain'});
                response.write('Request url doesn\'t correspond to a file. \n');
                response.end();
            }
        });
    }).listen(1337);
    console.log("Server created and listening on port 1337");


    var io = require('socket.io').listen(app);

function downloadVideo(urls){
    var previousFolder = "";
    var folderNumber = 0;

    for(var i = 0; i<urls.length; i++){    
        if(urls[i].split("/")[5] == previousFolder){
            videoNumbering += 1;
            download(urls[i], urls[i].split("/")[6], urls[i].split("/")[4] + "/" + folderNumber + ". " + urls[i].split("/")[5]);
        } else{
            folderNumber += 1;
            videoNumbering = 1;
            download(urls[i], urls[i].split("/")[6], urls[i].split("/")[4] + "/" + folderNumber + ". " + urls[i].split("/")[5]);    
            previousFolder = urls[i].split("/")[5];
        }        
    }    
}


function download(URL, videoName, path){
    var mkdirp = require('mkdirp');   

    // Create directories if they don't exist already
    mkdirp.sync(path, function (err) {
        if (err) console.error(err)
        else console.log('Directories created')
    });


    var file = fs.createWriteStream(path + "/" + videoNumbering + ". " + videoName + ".mp4");
    var request = http.get(URL, function(response) {

        var download = http.get(response.headers.location, function(res){
         // res.pipe(file); //Download file

           length += parseInt(res.headers['content-length'], 10); 
           total = length/1048576; //Convert the total size to MB
            // Show progress
            res.on("data", function(chunk){
                current += chunk.length;
                process.stdout.write('\033c');
                
                // Prints the progress in percentage - currentDownloadedMB/maxToDownloadMB
                console.log("Downloading: " + (100.0 * current / length).toFixed(2) + "%  - " + (current/1048576).toFixed(2)  + "/" + total.toFixed(2));
                io.sockets.emit('download', { percentage: (100.0 * current / length).toFixed(2) });
            });

          

            res.on("end", function(){
                console.log("Download completed");
            });

            res.on("error", function(e){
                console.log("Got error: " + e.message);
            });
        });
    }).on('error', function(e){
         console.log("Got error: " + e.message);
    });
}


    // io.on('connection', function (socket) {
    //     console.log("hi");
    //     socket.emit('news', { hello: (100.0 * current / length).toFixed(2) });
    //     socket.on('my other event', function (data) {
    //     console.log(data);
    //   });
    // });


