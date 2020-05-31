const webfontsGenerator = require('webfonts-generator');
const chokidar = require('chokidar');
const Atomizer = require('atomizer');
const config   = require('./atomic.css.config');
const http = require('http').createServer(requestListener);
const open = require('open');
const io = require('socket.io')(http);
const fs = require('fs');

const host = 'localhost';
const port = 8000;
http.listen(port, host,()=> {
    console.log('Server started at http://'+host+':'+port);
    open('http://'+host+':'+port);
});

const watchPath = '.'
var atomizer = new Atomizer({ verbose: true });

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
                writeFiles: false,
                dest: basePath+'assets'
            }, (err, result) => {
                iconFile = result;
                res.writeHead(200,{ "Content-Type": "text/css" });
                res.end(result.generateCss());
            })
        })

    }else if(req.url.match('woff2')){
        res.writeHead(200,{ "Content-Type": "font/woff2" });
        res.end(iconFile.woff2,'binary');
    }else if(req.url.match('woff')){
        res.writeHead(200,{ "Content-Type": "font/woff" });
        res.end(iconFile.woff,'binary');
    }else if(req.url.match(/\.(jpeg|png|jpg)$/)){
        fs.readFile(basePath.replace(/.$/,'')+req.url,(err,data)=>{
            if (data) {
                res.writeHead(200, {'Content-Type': 'image/jpeg'});
                res.end(data)
            }
        })
    }
    
};

// Atomizer for css and out put html
// const config = {
//     "breakPoints": {
//         'xm': '@media(min-width:0)',
//         'sm': '@media(min-width:576px)',
//         'md': '@media(min-width:768px)',
//         'lg': '@media(min-width:992px)',
//         'xl': '@media(min-width:1200px)',
//         'Msm': '@media(max-width:576px)',
//         'Mmd': '@media(max-width:768px)',
//         'Mlg': '@media(max-width:992px)',
//         'Mxl': '@media(max-width:1200px)',
//     }

// }



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

            let helper_class = data.match(/\$[A-Za-z]+\(([a-z0-9\,\[\]\s\:\'\"]+\)|\))/g);
            with(config.helpers){
                if (helper_class) {
                    helper_class.forEach(element => {
                        data = data.replace(element, eval(element).join(' '));
                    });
                }
            }

            // Parse text to find Atomic CSS classes
            let found_class = atomizer.findClassNames(data);
            // Generate Atomizer configuration from an array of Atomic classnames
            var finalConfig = atomizer.getConfig(found_class, config.configs);
            // Generate Atomic CSS from configuration


            html = data.replace('</body>', `
            <script src="socket.js"></script>
            <script>
            let socket = io('http://${host}:${port}');
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

watcher.on('change', (path) => {
    if (path.includes('index.html')) {
        handleEvent(path)
    }
});
watcher.on('add', (path) => {
    if (path.includes('index.html')) {
        handleEvent(path)
    }
})


