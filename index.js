const webfontsGenerator = require('webfonts-generator');
const chokidar = require('chokidar');
const Atomizer = require('atomizer');
const write = require('write');
const http = require('http').createServer(requestListener);
const io = require('socket.io')(http);
const fs = require('fs');

const host = 'localhost';
const port = 8000;
http.listen(port, host)

let filePath;
let basePath;
let iconFile;
let html;
let css;






function requestListener(req, res) {
    if (req.url == '/') {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
    } else if (req.url == '/style.css') {
        res.writeHead(200, { "Content-Type": "text/css" });
        res.end(css);
    } else if (req.url == '/socket.js') {
        res.writeHead(200, { "Content-Type": "application/javascript" });
        res.end(fs.readFileSync('socket.js', 'utf8'));
    } else if (req.url == '/icon.css') {
        // console.log(basePath + 'assets/icon');

        fs.readdir(basePath + 'assets/icon', (err, files) => {
            let filesArr = files.map(item => {
                if (item.match(/\.svg$/)) {
                    return basePath + 'assets/icon/' + item;
                }
            })
            // console.log(filesArr);

            webfontsGenerator({
                files: filesArr,
                writeFiles: true,
                dest: basePath+'assets'
            }, (err, result) => {
                iconFile = result;
                res.writeHead(200,{ "Content-Type": "text/css" });
                res.end(result.generateCss());
            })
        })
        // console.log(files);

        // fs.readFile(basePath+'assets/iconfont.css','utf8',(err,data)=>{
        //     res.writeHead(200);
        //     res.end(data);
        // })


    }else if(req.url.match('woff2')){
        // res.writeHead(200,{ "Content-Type": "text/css" });
        res.end(iconFile.woff2,'binary');
    }
    console.log(req.url);
};













// Atomizer for css and out put html
const config = {
    "breakPoints": {
        'xm': '@media(min-width:0)',
        'sm': '@media(min-width:576px)',
        'md': '@media(min-width:768px)',
        'lg': '@media(min-width:992px)',
        'xl': '@media(min-width:1200px)',
    }

}




const watchPath = '.'
var atomizer = new Atomizer({ verbose: true });

const watcher = chokidar.watch(watchPath, {
    ignored: ['node_modules'],
    persistent: true,
    // ignoreInitial: false,
});

const handleEvent = (path) => {
    filePath = path;
    basePath = filePath.replace('index.html', '');
    const dest = path.replace(/src.+/, '');
    // console.log(dest);

    fs.readFile(path, 'utf8', (err, data) => {
        if (data && dest) {
            // Parse text to find Atomic CSS classes
            let found_class = atomizer.findClassNames(data);
            // Generate Atomizer configuration from an array of Atomic classnames
            var finalConfig = atomizer.getConfig(found_class, config);
            // Generate Atomic CSS from configuration
            html = data.replace('</body>', `
            <script src="socket.js"></script>
            <script>
            const socket = io('http://${host}:${port}');
            socket.on('save',(data)=>{
                location.reload();
            })
            </script>
            </body>`)
            css = atomizer.getCss(finalConfig);
            io.emit('save', 'File changed');
        }
    });
}

watcher.on('change', handleEvent);
watcher.on('add', (path) => {
    if (path.includes('index.html')) {
        handleEvent(path)
    }
})


