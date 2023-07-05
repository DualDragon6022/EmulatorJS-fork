class EmulatorJS {
    version = {
        a5200: 1,
        beetle_vb: 1,
        desmume2015: 1,
        fbalpha2012_cps1: 1,
        fbalpha2012_cps2: 1,
        fceumm: 1,
        gambatte: 1,
        mame2003: 1,
        mednafen_psx_hw: 1,
        melonds: 1,
        mgba: 1,
        mupen64plus_next: 1,
        nestopia: 1,
        snes9x: 1
    }
    getCore(generic) {
        const core = this.config.system;
        //todo: sega32x, TurboGrafs-16 (pce), Wanderswan (ws), ngp, msx
        if (generic) {
            const options = {
                'virtualjaguar': 'jaguar',
                'handy': 'lynx',
                'yabause': 'segaSaturn', //NOT WORKING
                'genesis_plus_gx': 'uh oh',//MS, MD, GG, CD... which do we return? //NOT WORKING
                'fceumm': 'nes',
                'snes9x': 'snes',
                'a5200': 'atari5200',
                'gambatte': 'gb',
                'mgba': 'gba',
                'beetle_vb': 'vb',
                'mupen64plus_next': 'n64',
                'desmume2015': 'nds',
                'mame2003': 'mame2003',
                'fbalpha2012_cps1': 'arcade',
                'fbalpha2012_cps2': 'arcade',
                'mednafen_psx': 'psx',
                'mednafen_psx_hw': 'psx',
                'melonds': 'nds',
                'nestopia': 'nes',
                'opera': '3do',
                'prosystem': 'atari7800',
                'stella2014': 'atari2600'
            }
            return options[core] || core;
        }
        const options = {
            'jaguar': 'virtualjaguar',
            'lynx': 'handy',
            'segaSaturn': 'yabause',
            'segaMS': 'genesis_plus_gx',
            'segaMD': 'genesis_plus_gx',
            'segaGG': 'genesis_plus_gx',
            'segaCD': 'genesis_plus_gx',
            'atari2600': 'stella2014',
            'atari7800': 'prosystem',
            'nes': 'fceumm',
            'snes': 'snes9x',
            'atari5200': 'a5200',
            'gb': 'gambatte',
            'gba': 'mgba',
            'vb': 'beetle_vb',
            'n64': 'mupen64plus_next',
            'nds': 'desmume2015',
            'mame2003': 'mame2003',
            'arcade': 'fbalpha2012_cps1', // I need to find a more  compatible arcade core
            'psx': 'mednafen_psx_hw',
            '3do': 'opera'
        }
        return options[core] || core;
    }
    extensions = {
        'fceumm': ['fds', 'nes', 'unif', 'unf'],
        'snes9x': ['smc', 'sfc', 'swc', 'fig', 'bs', 'st'],
        'a5200': ['a52', 'bin'],
        'gambatte': ['gb', 'gbc', 'dmg'],
        'mgba': ['gb', 'gbc', 'gba'],
        'beetle_vb': ['vb', 'vboy', 'bin'],
        'mupen64plus_next': ['n64', 'v64', 'z64', 'bin', 'u1', 'ndd', 'gb'],
        'fbalpha2012_cps1': ['zip'],
        'fbalpha2012_cps2': ['zip'],
        'mame2003': ['zip'],
        'desmume2015': ['nds', 'bin'],
        'melonds': ['nds'],
        'mednafen_psx': ['cue', 'toc', 'm3u', 'ccd', 'exe', 'pbp', 'chd'],
        'mednafen_psx_hw': ['cue', 'toc', 'm3u', 'ccd', 'exe', 'pbp', 'chd'],
        'nestopia': ['fds', 'nes', 'unif', 'unf'],
        'opera': ['iso', 'bin', 'chd', 'cue']
    }
    createElement(type) {
        return document.createElement(type);
    }
    addEventListener(element, listener, callback) {
        const listeners = listener.split(" ");
        let rv = [];
        for (let i=0; i<listeners.length; i++) {
            element.addEventListener(listeners[i], callback);
            const data = {cb:callback, elem:element, listener:listeners[i]};
            rv.push(data);
            this.listeners.push(data);
        }
        return rv;
    }
    removeEventListener(data) {
        for (let i=0; i<data.length; i++) {
            data[i].elem.removeEventListener(data[i].listener, data[i].cb);
        }
    }
    downloadFile(path, cb, progressCB, notWithPath, opts) {
        const basePath = notWithPath ? '' : this.config.dataPath;
        path = basePath + path;
        if (!notWithPath && this.config.filePaths) {
            if (typeof this.config.filePaths[path.split('/').pop()] === "string") {
                path = this.config.filePaths[path.split('/').pop()];
            }
        }
        let url;
        try {url=new URL(path)}catch(e){};
        if ((url && ['http:', 'https:'].includes(url.protocol)) || !url) {
            const xhr = new XMLHttpRequest();
            if (progressCB instanceof Function) {
                xhr.addEventListener('progress', (e) => {
                    const progress = e.total ? ' '+Math.floor(e.loaded / e.total * 100).toString()+'%' : ' '+(e.loaded/1048576).toFixed(2)+'MB';
                    progressCB(progress);
                });
            }
            xhr.onload = function() {
                if (xhr.readyState === xhr.DONE) {
                    let data = xhr.response;
                    try {data=JSON.parse(data)}catch(e){}
                    cb({
                        data: data,
                        headers: {
                            "content-length": xhr.getResponseHeader('content-length')
                        }
                    });
                }
            }
            if (opts.responseType) xhr.responseType = opts.responseType;
            xhr.onerror = () => cb(-1);
            xhr.open(opts.method, path, true);
            xhr.send();
        } else {
            (async () => {
                //Most commonly blob: urls. Not sure what else it could be
                if (opts.method === 'HEAD') {
                    cb({headers:{}});
                    return;
                }
                let res;
                try {
                    res = await fetch(path);
                    if ((opts.type && opts.type.toLowerCase() === 'arraybuffer') || !opts.type) {
                        res = await res.arrayBuffer();
                    } else {
                        res = await res.text();
                        try {res = JSON.parse(res)} catch(e) {}
                    }
                } catch(e) {
                    cb(-1);
                }
                if (path.startsWith('blob:')) URL.revokeObjectURL(path);
                cb({
                    data: res,
                    headers: {}
                });
            })();
        }
    }
    constructor(element, config) {
        this.ejs_version = "4.0";
        this.config = config;
        window.EJS_TESTING = this;
        this.currentPopup = null;
        this.touch = false;
        this.debug = (window.EJS_DEBUG_XX === true);
        this.cheats = [];
        this.started = false;
        this.volume = (typeof this.config.volume === "number") ? this.config.volume : 0.5;
        if (this.config.defaultControllers) this.defaultControllers = this.config.defaultControllers;
        this.muted = false;
        this.paused = true;
        this.listeners = [];
        this.setElements(element);
        this.setColor(this.config.color || "");
        if (this.config.adUrl) this.setupAds(this.config.adUrl);
        this.canvas = this.createElement('canvas');
        this.canvas.classList.add('ejs_canvas');
        this.bindListeners();
        this.fullscreen = false;
        this.storage = {
            rom: new window.EJS_STORAGE("EmulatorJS-roms", "rom"),
            bios: new window.EJS_STORAGE("EmulatorJS-bios", "bios"),
            core: new window.EJS_STORAGE("EmulatorJS-core", "core"),
            states: new window.EJS_STORAGE("EmulatorJS-states", "states")
        }
        
        this.game.classList.add("ejs_game");
        
        if (Array.isArray(this.config.cheats)) {
            for (let i=0; i<this.config.cheats.length; i++) {
                const cheat = this.config.cheats[i];
                if (Array.isArray(cheat) && cheat[0] && cheat[1]) {
                    this.cheats.push({
                        desc: cheat[0],
                        checked: false,
                        code: cheat[1]
                    })
                }
            }
        }
        
        this.createStartButton();
        
        console.log(this)
    }
    setColor(color) {
        if (typeof color !== "string") color = "";
        let getColor = function(color) {
            color = color.toLowerCase();
            if (color && /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/.test(color)) {
                if (color.length === 4) {
                    let rv = '#'
                    for (let i=1; i<4; i++) {
                        rv += color.slice(i, i+1)+color.slice(i, i+1);
                    }
                    color = rv;
                }
                let rv = [];
                for (let i=1; i<7; i+=2) {
                    rv.push(parseInt('0x'+color.slice(i, i+2), 16));
                }
                return rv.join(", ");
            }
            return null;
        }
        if (!color || getColor(color) === null) {
            this.elements.parent.setAttribute("style", "--ejs-primary-color: 26,175,255;");
            return;
        }
        this.elements.parent.setAttribute("style", "--ejs-primary-color:" + getColor(color) + ";");
    }
    setupAds(ads) {
        const div = this.createElement("div");
        div.classList.add("ejs_ad_iframe");
        const frame = this.createElement("iframe");
        frame.src = ads;
        frame.setAttribute("scrolling", "no");
        frame.setAttribute("frameborder", "no");
        frame.style.width = "300px";
        frame.style.height = "250px";
        
        const closeParent = this.createElement("div");
        closeParent.classList.add("ejs_ad_close");
        const closeButton = this.createElement("a");
        closeParent.appendChild(closeButton);
        closeParent.setAttribute("hidden", "");
        div.appendChild(closeParent);
        div.appendChild(frame);
        this.elements.parent.appendChild(div);
        this.addEventListener(closeButton, "click", () => {
            div.remove();
        })
        
        this.on("start", () => {
            closeParent.removeAttribute("hidden");
            const time = (typeof this.config.adTimer === "number" && this.config.adTimer > 0) ? this.config.adTimer : 10000;
            if (this.config.adTimer === 0) return;
            setTimeout(() => {
                div.remove();
            }, time);
        })
        
    }
    functions = {};
    on(event, func) {
        if (!Array.isArray(this.functions[event])) this.functions[event] = [];
        this.functions[event].push(func);
    }
    callEvent(event, data) {
        if (!Array.isArray(this.functions[event])) return 0;
        this.functions[event].forEach(e => e(data));
        return this.functions[event].length;
    }
    setElements(element) {
        const game = this.createElement("div");
        const elem = document.querySelector(element);
        elem.innerHTML = "";
        elem.appendChild(game);
        this.game = game;
        
        this.elements = {
            main: this.game,
            parent: elem
        }
        this.elements.parent.classList.add("ejs_parent");
        this.elements.parent.setAttribute("tabindex", -1);
    }
    // Start button
    createStartButton() {
        const button = this.createElement("div");
        button.classList.add("ejs_start_button");
        button.innerText = this.localization("Start Game");
        this.elements.parent.appendChild(button);
        this.addEventListener(button, "touchstart", () => {
            this.touch = true;
        })
        this.addEventListener(button, "click", this.startButtonClicked.bind(this));
        if (this.config.startOnLoad === true) {
            this.startButtonClicked(button);
        }
    }
    startButtonClicked(e) {
        if (e.preventDefault) {
            e.preventDefault();
            e.target.remove();
        } else {
            e.remove();
        }
        this.createText();
        this.downloadGameCore();
    }
    // End start button
    createText() {
        this.textElem = this.createElement("div");
        this.textElem.classList.add("ejs_loading_text");
        this.textElem.innerText = this.localization("Loading...");
        this.elements.parent.appendChild(this.textElem);
    }
    localization(text) {
        if (!isNaN(text)) return text;
        if (this.config.langJson) {
            if (!this.config.langJson[text]) {
                console.log("Translation not found for '"+text+"'. Language set to '"+this.config.language+"'");
            }
            return this.config.langJson[text] || text;
        }
        return text;
    }
    checkCompression(data, msg) {
        if (msg) {
            this.textElem.innerText = msg;
        }
        //to be put in another file
        function isCompressed(data) { //https://www.garykessler.net/library/file_sigs.html
            //todo. Use hex instead of numbers
            if ((data[0] === 80 && data[1] === 75) && ((data[2] === 3 && data[3] === 4) || (data[2] === 5 && data[3] === 6) || (data[2] === 7 && data[3] === 8))) {
                return 'zip';
            } else if (data[0] === 55 && data[1] === 122 && data[2] === 188 && data[3] === 175 && data[4] === 39 && data[5] === 28) {
                return '7z';
            } else if ((data[0] === 82 && data[1] === 97 && data[2] === 114 && data[3] === 33 && data[4] === 26 && data[5] === 7) && ((data[6] === 0) || (data[6] === 1 && data[7] == 0))) {
                return 'rar';
            }
        }
        const createWorker = (path) => {
            return new Promise((resolve, reject) => {
                this.downloadFile(path, (res) => {
                    if (res === -1) {
                        this.textElem.innerText = "Error";
                        this.textElem.style.color = "red";
                        return;
                    }
                    const blob = new Blob([res.data], {
                        'type': 'application/javascript'
                    })
                    const url = window.URL.createObjectURL(blob);
                    resolve(new Worker(url));
                }, null, false, {responseType: "arraybuffer", method: "GET"});
            })
        }
        const decompress7z = (file) => {
            return new Promise((resolve, reject) => {
                const files = {};
                const onMessage = (data) => {
                    if (!data.data) return;
                    //data.data.t/ 4=progress, 2 is file, 1 is zip done
                    if (data.data.t === 4 && msg) {
                        const pg = data.data;
                        const num = Math.floor(pg.current / pg.total * 100);
                        if (isNaN(num)) return;
                        const progress = ' '+num.toString()+'%';
                        this.textElem.innerText = msg + progress;
                    }
                    if (data.data.t === 2) {
                        files[data.data.file] = data.data.data;
                    }
                    if (data.data.t === 1) {
                        resolve(files);
                    }
                }
                
                createWorker('compression/extract7z.js').then((worker) => {
                    worker.onmessage = onMessage;
                    worker.postMessage(file);
                    //console.log(file);
                })
            })
        }
        const decompressRar = (file) => {
            return new Promise((resolve, reject) => {
                const files = {};
                const onMessage = (data) => {
                    if (!data.data) return;
                    //data.data.t/ 4=progress, 2 is file, 1 is zip done
                    if (data.data.t === 4 && msg) {
                        const pg = data.data;
                        const num = Math.floor(pg.current / pg.total * 100);
                        if (isNaN(num)) return;
                        const progress = ' '+num.toString()+'%';
                        this.textElem.innerText = msg + progress;
                    }
                    if (data.data.t === 2) {
                        files[data.data.file] = data.data.data;
                    }
                    if (data.data.t === 1) {
                        resolve(files);
                    }
                }
                
                this.downloadFile("compression/libunrar.js", (res) => {
                    if (res === -1) {
                        this.textElem.innerText = "Error";
                        this.textElem.style.color = "red";
                        return;
                    }
                    const path = origin + this.config.dataPath + 'compression/libunrar.js.mem';
                    let data = '\nlet dataToPass = [];\nModule = {\n    monitorRunDependencies: function(left)  {\n        if (left == 0) {\n            setTimeout(function() {\n                unrar(dataToPass, null);\n            }, 100);\n        }\n    },\n    onRuntimeInitialized: function() {\n    },\n    locateFile: function(file) {\n        return \''+path+'\';\n    }\n};\n'+res.data+'\nlet unrar = function(data, password) {\n    let cb = function(fileName, fileSize, progress) {\n        postMessage({"t":4,"current":progress,"total":fileSize, "name": fileName});\n    };\n\n    let rarContent = readRARContent(data.map(function(d) {\n        return {\n            name: d.name,\n            content: new Uint8Array(d.content)\n        }\n    }), password, cb)\n    let rec = function(entry) {\n        if (entry.type === \'file\') {\n            postMessage({"t":2,"file":entry.fullFileName,"size":entry.fileSize,"data":entry.fileContent});\n        } else if (entry.type === \'dir\') {\n            Object.keys(entry.ls).forEach(function(k) {\n                rec(entry.ls[k]);\n            })\n        } else {\n            throw "Unknown type";\n        }\n    }\n    rec(rarContent);\n    postMessage({"t":1});\n    return rarContent;\n};\nonmessage = function(data) {\n    dataToPass.push({name:  \'test.rar\', content: data.data});\n};\n                ';
                    const blob = new Blob([data], {
                        'type': 'application/javascript'
                    })
                    const url = window.URL.createObjectURL(blob);
                    const worker = new Worker(url);
                    worker.onmessage = onMessage;
                    worker.postMessage(file);
                }, null, false, {responseType: "text", method: "GET"});
                
            })
        }
        const decompressZip = (file) => {
            return new Promise((resolve, reject) => {
                const files = {};
                const onMessage = (data) => {
                    //console.log(data);
                    if (!data.data) return;
                    //data.data.t/ 4=progress, 2 is file, 1 is zip done
                    if (data.data.t === 4 && msg) {
                        const pg = data.data;
                        const num = Math.floor(pg.current / pg.total * 100);
                        if (isNaN(num)) return;
                        const progress = ' '+num.toString()+'%';
                        this.textElem.innerText = msg + progress;
                    }
                    if (data.data.t === 2) {
                        files[data.data.file] = data.data.data;
                    }
                    if (data.data.t === 1) {
                        resolve(files);
                    }
                }
                
                createWorker('compression/extractzip.js').then((worker) => {
                    worker.onmessage = onMessage;
                    worker.postMessage(file);
                })
            })
        }
        const compression = isCompressed(data.slice(0, 10));
        if (compression) {
            //Need to do zip and rar still
            if (compression === "7z") {
                return decompress7z(data);
            } else if (compression === "zip") {
                return decompressZip(data);
            } else if (compression === "rar") {
                return decompressRar(data);
            }
        } else {
            return new Promise(resolve => resolve({"!!notCompressedData": data}));
        }
        
    }
    downloadGameCore() {
        this.textElem.innerText = this.localization("Download Game Core");
        const gotCore = (data) => {
            this.checkCompression(new Uint8Array(data), this.localization("Decompress Game Core")).then((data) => {
                //console.log(data);
                let js, wasm;
                for (let k in data) {
                    if (k.endsWith(".wasm")) {
                        wasm = data[k];
                    } else if (k.endsWith(".js")) {
                        js = data[k];
                    }
                }
                this.initGameCore(js, wasm);
            });
        }
        this.storage.core.get(this.getCore()+'-wasm.data').then((result) => {
            if (result && result.version === this.version[this.getCore()] && !this.debug) {
                gotCore(result.data);
                return;
            }
            this.downloadFile('cores/'+this.getCore()+'-wasm.data', (res) => {
                if (res === -1) {
                    this.textElem.innerText = "Error";
                    this.textElem.style.color = "red";
                    return;
                }
                gotCore(res.data);
                this.storage.core.put(this.getCore()+'-wasm.data', {
                    version: this.version[this.getCore()],
                    data: res.data
                });
            }, (progress) => {
                this.textElem.innerText = this.localization("Download Game Core") + progress;
            }, false, {responseType: "arraybuffer", method: "GET"});
        })
    }
    initGameCore(js, wasm) {
        this.initModule(wasm);
        let script = this.createElement("script");
        script.src = URL.createObjectURL(new Blob([js], {type: "application/javascript"}));
        document.body.appendChild(script);
    }
    getBaseFileName() {
        //Only once game and core is loaded
        if (!this.started) return null;
        if (typeof this.config.gameName === "string") {
            const invalidCharacters = /[#<$+%>!`&*'|{}/\\?"=@:^\r\n]/ig;
            const name = this.config.gameName.replace(invalidCharacters, "").trim();
            if (name) return name;
        }
        let parts = this.fileName.split(".");
        parts.splice(parts.length-1, 1);
        return parts.join(".");
    }
    saveInBrowserSupported() {
        return !!window.indexedDB && (typeof this.config.gameName === "string" || !this.config.gameUrl.startsWith("blob:"));
    }
    displayMessage(message) {
        if (!this.msgElem) {
            this.msgElem = this.createElement("div");
            this.msgElem.classList.add("ejs_message");
            this.elements.parent.appendChild(this.msgElem);
        }
        clearTimeout(this.msgTimeout);
        this.msgTimeout = setTimeout(() => {
            this.msgElem.innerText = "";
        }, 3000)
        this.msgElem.innerText = message;
    }
    downloadStartState() {
        if (typeof this.config.loadState !== "string") {
            this.startGame();
            return;
        }
        this.textElem.innerText = this.localization("Download Game State");
        
        this.downloadFile(this.config.loadState, (res) => {
            if (res === -1) {
                this.textElem.innerText = "Error";
                this.textElem.style.color = "red";
                return;
            }
            this.on("start", () => {
                setTimeout(() => {
                    this.gameManager.loadState(new Uint8Array(res.data));
                }, 10);
            })
            this.startGame();
        }, (progress) => {
            this.textElem.innerText = this.localization("Download Game State") + progress;
        }, true, {responseType: "arraybuffer", method: "GET"});
    }
    downloadBios() {
        if (typeof this.config.biosUrl !== "string" || !this.config.biosUrl.trim()) {
            this.downloadStartState();
            return;
        }
        this.textElem.innerText = this.localization("Download Game BIOS");
        const gotBios = (data) => {
            this.checkCompression(new Uint8Array(data), this.localization("Decompress Game BIOS")).then((data) => {
                for (const k in data) {
                    if (k === "!!notCompressedData") {
                        FS.writeFile(this.config.biosUrl.split('/').pop().split("#")[0].split("?")[0], data[k]);
                        break;
                    }
                    if (k.endsWith('/')) continue;
                    console.log(k.split('/').pop());
                    FS.writeFile(k.split('/').pop(), data[k]);
                }
                this.downloadStartState();
            })
        }
        
        this.downloadFile(this.config.biosUrl, (res) => {
            this.storage.bios.get(this.config.biosUrl.split("/").pop()).then((result) => {
                if (result && result['content-length'] === res.headers['content-length'] && !this.debug) {
                    gotBios(result.data);
                    return;
                }
                this.downloadFile(this.config.biosUrl, (res) => {
                    if (res === -1) {
                        this.textElem.innerText = "Error";
                        this.textElem.style.color = "red";
                        return;
                    }
                    gotBios(res.data);
                    if (this.saveInBrowserSupported()) {
                        this.storage.bios.put(this.config.biosUrl.split("/").pop(), {
                            "content-length": res.headers['content-length'],
                            data: res.data
                        })
                    }
                }, (progress) => {
                    this.textElem.innerText = this.localization("Download Game BIOS") + progress;
                }, true, {responseType: "arraybuffer", method: "GET"});
            })
        }, null, true, {method: "HEAD"})
    }
    downloadRom() {
        this.gameManager = new window.EJS_GameManager(this.Module, this);
        
        this.textElem.innerText = this.localization("Download Game Data");
        const gotGameData = (data) => {
            if (['arcade', 'mame2003'].includes(this.getCore(true))) {
                this.fileName = this.config.gameUrl.split('/').pop().split("#")[0].split("?")[0];
                FS.writeFile(this.fileName, data[k]);
                this.downloadBios();
                return;
            }
            this.checkCompression(new Uint8Array(data), this.localization("Decompress Game Data")).then((data) => {
                for (const k in data) {
                    if (k === "!!notCompressedData") {
                        this.fileName = this.config.gameUrl.startsWith("blob:") ? this.config.gameName || "game" : this.config.gameUrl.split('/').pop().split("#")[0].split("?")[0];
                        FS.writeFile(this.fileName, data[k]);
                        break;
                    }
                    if (k.endsWith('/')) {
                        FS.mkdir(k);
                        continue;
                    }
                    if (!this.fileName || (this.extensions[this.getCore()].includes(k.split(".").pop()) &&
                        //always prefer m3u files for psx cores
                        !(this.getCore(true) === "psx" && this.fileName.split(".").pop() === "m3u"))) {
                        this.fileName = k;
                    }
                    console.log(k);
                    FS.writeFile(k, data[k]);
                }
                this.downloadBios();
            });
        }
        this.downloadFile(this.config.gameUrl, (res) => {
            this.storage.rom.get(this.config.gameUrl.split("/").pop()).then((result) => {
                if (result && result['content-length'] === res.headers['content-length'] && !this.debug) {
                    gotGameData(result.data);
                    return;
                }
                this.downloadFile(this.config.gameUrl, (res) => {
                    if (res === -1) {
                        this.textElem.innerText = "Error";
                        this.textElem.style.color = "red";
                        return;
                    }
                    gotGameData(res.data);
                    const limit = (typeof this.config.cacheLimit === "number") ? this.config.cacheLimit : 1073741824;
                    if (parseFloat(res.headers['content-length']) < limit && this.saveInBrowserSupported()) {
                        this.storage.rom.put(this.config.gameUrl.split("/").pop(), {
                            "content-length": res.headers['content-length'],
                            data: res.data
                        })
                    }
                }, (progress) => {
                    this.textElem.innerText = this.localization("Download Game Data") + progress;
                }, true, {responseType: "arraybuffer", method: "GET"});
            })
        }, null, true, {method: "HEAD"})
    }
    initModule(wasmData) {
        window.Module = {
            'TOTAL_MEMORY': 0x10000000,
            'noInitialRun': true,
            'onRuntimeInitialized': this.downloadRom.bind(this),
            'arguments': [],
            'preRun': [],
            'postRun': [],
            'canvas': this.canvas,
            'print': (msg) => {
                if (this.debug) {
                    console.log(msg);
                }
            },
            'printErr': (msg) => {
                if (this.debug) {
                    console.log(msg);
                }
            },
            'totalDependencies': 0,
            'monitorRunDependencies': () => {},
            'locateFile': function(fileName) {
                console.log(fileName);
                if (fileName.endsWith(".wasm")) {
                    return URL.createObjectURL(new Blob([wasmData], {type: "application/wasm"}));
                }
            }
        };
        this.Module = window.Module;
    }
    startGame() {
        try {
            this.initAudio();
            
            const args = [];
            if (this.debug) args.push('-v');
            args.push('/'+this.fileName);
            console.log(args);
            this.Module.callMain(args);
            this.Module.resumeMainLoop();
            if (this.touch) {
                this.virtualGamepad.style.display = "";
            }
            
            this.checkSupportedOpts();
            this.setupSettingsMenu();
            this.loadSettings();
            this.updateCheatUI();
            this.updateGamepadLabels();
            this.setVolume(this.volume);
            this.elements.parent.focus();
            this.textElem.remove();
            this.textElem = null;
            this.game.classList.remove("ejs_game");
            this.game.appendChild(this.canvas);
            this.handleResize();
            this.started = true;
            this.paused = false;
        } catch(e) {
            console.warn("failed to start game", e);
            this.textElem.innerText = "Failed to start game";
            this.textElem.style.color = "red";
            return;
        }
        this.callEvent("start");
    }
    bindListeners() {
        this.createContextMenu();
        this.createBottomMenuBar();
        this.createControlSettingMenu();
        this.createCheatsMenu()
        this.setVirtualGamepad();
        this.addEventListener(this.elements.parent, "keydown keyup", this.keyChange.bind(this));
        this.addEventListener(this.elements.parent, "mousedown touchstart", (e) => {
            if (document.activeElement !== this.elements.parent) this.elements.parent.focus();
        })
        this.addEventListener(window, "resize", this.handleResize.bind(this));
        //this.addEventListener(window, "blur", e => console.log(e), true); //TODO - add "click to make keyboard keys work" message?
        this.gamepad = new GamepadHandler(); //https://github.com/ethanaobrien/Gamepad
        this.gamepad.on('connected', (e) => {
            if (!this.gamepadLabels) return;
            this.updateGamepadLabels();
        })
        this.gamepad.on('disconnected', (e) => {
            setTimeout(this.updateGamepadLabels.bind(this), 10);
        })
        this.gamepad.on('axischanged', this.gamepadEvent.bind(this));
        this.gamepad.on('buttondown', this.gamepadEvent.bind(this));
        this.gamepad.on('buttonup', this.gamepadEvent.bind(this));
    }
    checkSupportedOpts() {
        if (!this.gameManager.supportsStates()) {
            this.elements.bottomBar.saveState.setAttribute("hidden", "");
            this.elements.bottomBar.loadState.setAttribute("hidden", "");
        }
    }
    updateGamepadLabels() {
        for (let i=0; i<this.gamepadLabels.length; i++) {
            if (this.gamepad.gamepads[i]) {
                this.gamepadLabels[i].innerText = this.gamepad.gamepads[i].id;
            } else {
                this.gamepadLabels[i].innerText = "n/a";
            }
        }
    }
    createContextMenu() {
        this.elements.contextmenu = this.createElement('div');
        this.elements.contextmenu.classList.add("ejs_context_menu");
        this.addEventListener(this.game, 'contextmenu', (e) => {
            if (this.started) {
                this.elements.contextmenu.style.display = "block";
                this.elements.contextmenu.style.left = e.offsetX+"px";
                this.elements.contextmenu.style.top = e.offsetY+"px";
            }
            e.preventDefault();
        })
        const hideMenu = () => {
            this.elements.contextmenu.style.display = "none";
        }
        this.addEventListener(this.elements.contextmenu, 'contextmenu', (e) => e.preventDefault());
        this.addEventListener(this.elements.parent, 'contextmenu', (e) => e.preventDefault());
        this.addEventListener(this.game, 'mousedown', hideMenu);
        const parent = this.createElement("ul");
        const addButton = (title, hidden, functi0n) => {
            //<li><a href="#" onclick="return false">'+title+'</a></li>
            const li = this.createElement("li");
            if (hidden) li.hidden = true;
            const a = this.createElement("a");
            if (functi0n instanceof Function) {
                this.addEventListener(li, 'click', (e) => {
                    e.preventDefault();
                    functi0n();
                });
            }
            a.href = "#";
            a.onclick = "return false";
            a.innerText = title;
            li.appendChild(a);
            parent.appendChild(li);
            hideMenu();
            return li;
        }
        let screenshotUrl;
        const screenshot = addButton("Take Screenshot", false, () => {
            if (screenshotUrl) URL.revokeObjectURL(screenshotUrl);
            const screenshot = this.gameManager.screenshot();
            const blob = new Blob([screenshot]);
            screenshotUrl = URL.createObjectURL(blob);
            const a = this.createElement("a");
            a.href = screenshotUrl;
            const date = new Date();
            a.download = this.getBaseFileName()+"-"+date.getMonth()+"-"+date.getDate()+"-"+date.getFullYear()+".png";
            a.click();
            hideMenu();
        });
        const qSave = addButton("Quick Save", false, () => {
            const slot = this.settings['save-state-slot'] ? this.settings['save-state-slot'] : "1";
            this.gameManager.quickSave(slot);
            this.displayMessage(this.localization("SAVED STATE TO SLOT")+" "+slot);
            hideMenu();
        });
        const qLoad = addButton("Quick Load", false, () => {
            const slot = this.settings['save-state-slot'] ? this.settings['save-state-slot'] : "1";
            this.gameManager.quickLoad(slot);
            this.displayMessage(this.localization("LOADED STATE FROM SLOT")+" "+slot);
            hideMenu();
        });
        addButton("EmulatorJS v"+this.ejs_version, false, () => {
            hideMenu();
            const body = this.createPopup("EmulatorJS", {
                "Close": () => {
                    this.closePopup();
                }
            });
            body.innerText = "EmulatorJS v"+this.ejs_version;
            body.appendChild(this.createElement("br"));
            body.appendChild(this.createElement("br"));
            const gh = this.createElement("a");
            gh.href = "https://github.com/EmulatorJS/EmulatorJS";
            gh.target = "_blank";
            gh.innerText = "View on GitHub";
            body.appendChild(gh);
            body.appendChild(this.createElement("br"));
            const dc = this.createElement("a");
            dc.href = "https://discord.gg/6akryGkETU";
            dc.target = "_blank";
            dc.innerText = "Join the discord";
            body.appendChild(dc);
            body.appendChild(this.createElement("br"));
            
            let license = this.createElement("div");
            license.style.display = "none";
            const lc = this.createElement("a");
            this.addEventListener(lc, "click", () => {
                license.style.display = (license.style.display === "none") ? "" : "none";
                lc.innerText = (lc.innerText === "Close License") ? "View the license" : "Close License";
            })
            lc.innerText = "View the license";
            lc.style.cursor = "pointer";
            body.appendChild(lc);
            body.appendChild(this.createElement("br"));
            body.appendChild(this.createElement("br"));
            body.appendChild(license);
            license.innerText = '                    GNU GENERAL PUBLIC LICENSE\n                       Version 3, 29 June 2007\n\n Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>\n Everyone is permitted to copy and distribute verbatim copies\n of this license document, but changing it is not allowed.\n\n                            Preamble\n\n  The GNU General Public License is a free, copyleft license for\nsoftware and other kinds of works.\n\n  The licenses for most software and other practical works are designed\nto take away your freedom to share and change the works.  By contrast,\nthe GNU General Public License is intended to guarantee your freedom to\nshare and change all versions of a program--to make sure it remains free\nsoftware for all its users.  We, the Free Software Foundation, use the\nGNU General Public License for most of our software; it applies also to\nany other work released this way by its authors.  You can apply it to\nyour programs, too.\n\n  When we speak of free software, we are referring to freedom, not\nprice.  Our General Public Licenses are designed to make sure that you\nhave the freedom to distribute copies of free software (and charge for\nthem if you wish), that you receive source code or can get it if you\nwant it, that you can change the software or use pieces of it in new\nfree programs, and that you know you can do these things.\n\n  To protect your rights, we need to prevent others from denying you\nthese rights or asking you to surrender the rights.  Therefore, you have\ncertain responsibilities if you distribute copies of the software, or if\nyou modify it: responsibilities to respect the freedom of others.\n\n  For example, if you distribute copies of such a program, whether\ngratis or for a fee, you must pass on to the recipients the same\nfreedoms that you received.  You must make sure that they, too, receive\nor can get the source code.  And you must show them these terms so they\nknow their rights.\n\n  Developers that use the GNU GPL protect your rights with two steps:\n(1) assert copyright on the software, and (2) offer you this License\ngiving you legal permission to copy, distribute and/or modify it.\n\n  For the developers\' and authors\' protection, the GPL clearly explains\nthat there is no warranty for this free software.  For both users\' and\nauthors\' sake, the GPL requires that modified versions be marked as\nchanged, so that their problems will not be attributed erroneously to\nauthors of previous versions.\n\n  Some devices are designed to deny users access to install or run\nmodified versions of the software inside them, although the manufacturer\ncan do so.  This is fundamentally incompatible with the aim of\nprotecting users\' freedom to change the software.  The systematic\npattern of such abuse occurs in the area of products for individuals to\nuse, which is precisely where it is most unacceptable.  Therefore, we\nhave designed this version of the GPL to prohibit the practice for those\nproducts.  If such problems arise substantially in other domains, we\nstand ready to extend this provision to those domains in future versions\nof the GPL, as needed to protect the freedom of users.\n\n  Finally, every program is threatened constantly by software patents.\nStates should not allow patents to restrict development and use of\nsoftware on general-purpose computers, but in those that do, we wish to\navoid the special danger that patents applied to a free program could\nmake it effectively proprietary.  To prevent this, the GPL assures that\npatents cannot be used to render the program non-free.\n\n  The precise terms and conditions for copying, distribution and\nmodification follow.\n\n                       TERMS AND CONDITIONS\n\n  0. Definitions.\n\n  "This License" refers to version 3 of the GNU General Public License.\n\n  "Copyright" also means copyright-like laws that apply to other kinds of\nworks, such as semiconductor masks.\n\n  "The Program" refers to any copyrightable work licensed under this\nLicense.  Each licensee is addressed as "you".  "Licensees" and\n"recipients" may be individuals or organizations.\n\n  To "modify" a work means to copy from or adapt all or part of the work\nin a fashion requiring copyright permission, other than the making of an\nexact copy.  The resulting work is called a "modified version" of the\nearlier work or a work "based on" the earlier work.\n\n  A "covered work" means either the unmodified Program or a work based\non the Program.\n\n  To "propagate" a work means to do anything with it that, without\npermission, would make you directly or secondarily liable for\ninfringement under applicable copyright law, except executing it on a\ncomputer or modifying a private copy.  Propagation includes copying,\ndistribution (with or without modification), making available to the\npublic, and in some countries other activities as well.\n\n  To "convey" a work means any kind of propagation that enables other\nparties to make or receive copies.  Mere interaction with a user through\na computer network, with no transfer of a copy, is not conveying.\n\n  An interactive user interface displays "Appropriate Legal Notices"\nto the extent that it includes a convenient and prominently visible\nfeature that (1) displays an appropriate copyright notice, and (2)\ntells the user that there is no warranty for the work (except to the\nextent that warranties are provided), that licensees may convey the\nwork under this License, and how to view a copy of this License.  If\nthe interface presents a list of user commands or options, such as a\nmenu, a prominent item in the list meets this criterion.\n\n  1. Source Code.\n\n  The "source code" for a work means the preferred form of the work\nfor making modifications to it.  "Object code" means any non-source\nform of a work.\n\n  A "Standard Interface" means an interface that either is an official\nstandard defined by a recognized standards body, or, in the case of\ninterfaces specified for a particular programming language, one that\nis widely used among developers working in that language.\n\n  The "System Libraries" of an executable work include anything, other\nthan the work as a whole, that (a) is included in the normal form of\npackaging a Major Component, but which is not part of that Major\nComponent, and (b) serves only to enable use of the work with that\nMajor Component, or to implement a Standard Interface for which an\nimplementation is available to the public in source code form.  A\n"Major Component", in this context, means a major essential component\n(kernel, window system, and so on) of the specific operating system\n(if any) on which the executable work runs, or a compiler used to\nproduce the work, or an object code interpreter used to run it.\n\n  The "Corresponding Source" for a work in object code form means all\nthe source code needed to generate, install, and (for an executable\nwork) run the object code and to modify the work, including scripts to\ncontrol those activities.  However, it does not include the work\'s\nSystem Libraries, or general-purpose tools or generally available free\nprograms which are used unmodified in performing those activities but\nwhich are not part of the work.  For example, Corresponding Source\nincludes interface definition files associated with source files for\nthe work, and the source code for shared libraries and dynamically\nlinked subprograms that the work is specifically designed to require,\nsuch as by intimate data communication or control flow between those\nsubprograms and other parts of the work.\n\n  The Corresponding Source need not include anything that users\ncan regenerate automatically from other parts of the Corresponding\nSource.\n\n  The Corresponding Source for a work in source code form is that\nsame work.\n\n  2. Basic Permissions.\n\n  All rights granted under this License are granted for the term of\ncopyright on the Program, and are irrevocable provided the stated\nconditions are met.  This License explicitly affirms your unlimited\npermission to run the unmodified Program.  The output from running a\ncovered work is covered by this License only if the output, given its\ncontent, constitutes a covered work.  This License acknowledges your\nrights of fair use or other equivalent, as provided by copyright law.\n\n  You may make, run and propagate covered works that you do not\nconvey, without conditions so long as your license otherwise remains\nin force.  You may convey covered works to others for the sole purpose\nof having them make modifications exclusively for you, or provide you\nwith facilities for running those works, provided that you comply with\nthe terms of this License in conveying all material for which you do\nnot control copyright.  Those thus making or running the covered works\nfor you must do so exclusively on your behalf, under your direction\nand control, on terms that prohibit them from making any copies of\nyour copyrighted material outside their relationship with you.\n\n  Conveying under any other circumstances is permitted solely under\nthe conditions stated below.  Sublicensing is not allowed; section 10\nmakes it unnecessary.\n\n  3. Protecting Users\' Legal Rights From Anti-Circumvention Law.\n\n  No covered work shall be deemed part of an effective technological\nmeasure under any applicable law fulfilling obligations under article\n11 of the WIPO copyright treaty adopted on 20 December 1996, or\nsimilar laws prohibiting or restricting circumvention of such\nmeasures.\n\n  When you convey a covered work, you waive any legal power to forbid\ncircumvention of technological measures to the extent such circumvention\nis effected by exercising rights under this License with respect to\nthe covered work, and you disclaim any intention to limit operation or\nmodification of the work as a means of enforcing, against the work\'s\nusers, your or third parties\' legal rights to forbid circumvention of\ntechnological measures.\n\n  4. Conveying Verbatim Copies.\n\n  You may convey verbatim copies of the Program\'s source code as you\nreceive it, in any medium, provided that you conspicuously and\nappropriately publish on each copy an appropriate copyright notice;\nkeep intact all notices stating that this License and any\nnon-permissive terms added in accord with section 7 apply to the code;\nkeep intact all notices of the absence of any warranty; and give all\nrecipients a copy of this License along with the Program.\n\n  You may charge any price or no price for each copy that you convey,\nand you may offer support or warranty protection for a fee.\n\n  5. Conveying Modified Source Versions.\n\n  You may convey a work based on the Program, or the modifications to\nproduce it from the Program, in the form of source code under the\nterms of section 4, provided that you also meet all of these conditions:\n\n    a) The work must carry prominent notices stating that you modified\n    it, and giving a relevant date.\n\n    b) The work must carry prominent notices stating that it is\n    released under this License and any conditions added under section\n    7.  This requirement modifies the requirement in section 4 to\n    "keep intact all notices".\n\n    c) You must license the entire work, as a whole, under this\n    License to anyone who comes into possession of a copy.  This\n    License will therefore apply, along with any applicable section 7\n    additional terms, to the whole of the work, and all its parts,\n    regardless of how they are packaged.  This License gives no\n    permission to license the work in any other way, but it does not\n    invalidate such permission if you have separately received it.\n\n    d) If the work has interactive user interfaces, each must display\n    Appropriate Legal Notices; however, if the Program has interactive\n    interfaces that do not display Appropriate Legal Notices, your\n    work need not make them do so.\n\n  A compilation of a covered work with other separate and independent\nworks, which are not by their nature extensions of the covered work,\nand which are not combined with it such as to form a larger program,\nin or on a volume of a storage or distribution medium, is called an\n"aggregate" if the compilation and its resulting copyright are not\nused to limit the access or legal rights of the compilation\'s users\nbeyond what the individual works permit.  Inclusion of a covered work\nin an aggregate does not cause this License to apply to the other\nparts of the aggregate.\n\n  6. Conveying Non-Source Forms.\n\n  You may convey a covered work in object code form under the terms\nof sections 4 and 5, provided that you also convey the\nmachine-readable Corresponding Source under the terms of this License,\nin one of these ways:\n\n    a) Convey the object code in, or embodied in, a physical product\n    (including a physical distribution medium), accompanied by the\n    Corresponding Source fixed on a durable physical medium\n    customarily used for software interchange.\n\n    b) Convey the object code in, or embodied in, a physical product\n    (including a physical distribution medium), accompanied by a\n    written offer, valid for at least three years and valid for as\n    long as you offer spare parts or customer support for that product\n    model, to give anyone who possesses the object code either (1) a\n    copy of the Corresponding Source for all the software in the\n    product that is covered by this License, on a durable physical\n    medium customarily used for software interchange, for a price no\n    more than your reasonable cost of physically performing this\n    conveying of source, or (2) access to copy the\n    Corresponding Source from a network server at no charge.\n\n    c) Convey individual copies of the object code with a copy of the\n    written offer to provide the Corresponding Source.  This\n    alternative is allowed only occasionally and noncommercially, and\n    only if you received the object code with such an offer, in accord\n    with subsection 6b.\n\n    d) Convey the object code by offering access from a designated\n    place (gratis or for a charge), and offer equivalent access to the\n    Corresponding Source in the same way through the same place at no\n    further charge.  You need not require recipients to copy the\n    Corresponding Source along with the object code.  If the place to\n    copy the object code is a network server, the Corresponding Source\n    may be on a different server (operated by you or a third party)\n    that supports equivalent copying facilities, provided you maintain\n    clear directions next to the object code saying where to find the\n    Corresponding Source.  Regardless of what server hosts the\n    Corresponding Source, you remain obligated to ensure that it is\n    available for as long as needed to satisfy these requirements.\n\n    e) Convey the object code using peer-to-peer transmission, provided\n    you inform other peers where the object code and Corresponding\n    Source of the work are being offered to the general public at no\n    charge under subsection 6d.\n\n  A separable portion of the object code, whose source code is excluded\nfrom the Corresponding Source as a System Library, need not be\nincluded in conveying the object code work.\n\n  A "User Product" is either (1) a "consumer product", which means any\ntangible personal property which is normally used for personal, family,\nor household purposes, or (2) anything designed or sold for incorporation\ninto a dwelling.  In determining whether a product is a consumer product,\ndoubtful cases shall be resolved in favor of coverage.  For a particular\nproduct received by a particular user, "normally used" refers to a\ntypical or common use of that class of product, regardless of the status\nof the particular user or of the way in which the particular user\nactually uses, or expects or is expected to use, the product.  A product\nis a consumer product regardless of whether the product has substantial\ncommercial, industrial or non-consumer uses, unless such uses represent\nthe only significant mode of use of the product.\n\n  "Installation Information" for a User Product means any methods,\nprocedures, authorization keys, or other information required to install\nand execute modified versions of a covered work in that User Product from\na modified version of its Corresponding Source.  The information must\nsuffice to ensure that the continued functioning of the modified object\ncode is in no case prevented or interfered with solely because\nmodification has been made.\n\n  If you convey an object code work under this section in, or with, or\nspecifically for use in, a User Product, and the conveying occurs as\npart of a transaction in which the right of possession and use of the\nUser Product is transferred to the recipient in perpetuity or for a\nfixed term (regardless of how the transaction is characterized), the\nCorresponding Source conveyed under this section must be accompanied\nby the Installation Information.  But this requirement does not apply\nif neither you nor any third party retains the ability to install\nmodified object code on the User Product (for example, the work has\nbeen installed in ROM).\n\n  The requirement to provide Installation Information does not include a\nrequirement to continue to provide support service, warranty, or updates\nfor a work that has been modified or installed by the recipient, or for\nthe User Product in which it has been modified or installed.  Access to a\nnetwork may be denied when the modification itself materially and\nadversely affects the operation of the network or violates the rules and\nprotocols for communication across the network.\n\n  Corresponding Source conveyed, and Installation Information provided,\nin accord with this section must be in a format that is publicly\ndocumented (and with an implementation available to the public in\nsource code form), and must require no special password or key for\nunpacking, reading or copying.\n\n  7. Additional Terms.\n\n  "Additional permissions" are terms that supplement the terms of this\nLicense by making exceptions from one or more of its conditions.\nAdditional permissions that are applicable to the entire Program shall\nbe treated as though they were included in this License, to the extent\nthat they are valid under applicable law.  If additional permissions\napply only to part of the Program, that part may be used separately\nunder those permissions, but the entire Program remains governed by\nthis License without regard to the additional permissions.\n\n  When you convey a copy of a covered work, you may at your option\nremove any additional permissions from that copy, or from any part of\nit.  (Additional permissions may be written to require their own\nremoval in certain cases when you modify the work.)  You may place\nadditional permissions on material, added by you to a covered work,\nfor which you have or can give appropriate copyright permission.\n\n  Notwithstanding any other provision of this License, for material you\nadd to a covered work, you may (if authorized by the copyright holders of\nthat material) supplement the terms of this License with terms:\n\n    a) Disclaiming warranty or limiting liability differently from the\n    terms of sections 15 and 16 of this License; or\n\n    b) Requiring preservation of specified reasonable legal notices or\n    author attributions in that material or in the Appropriate Legal\n    Notices displayed by works containing it; or\n\n    c) Prohibiting misrepresentation of the origin of that material, or\n    requiring that modified versions of such material be marked in\n    reasonable ways as different from the original version; or\n\n    d) Limiting the use for publicity purposes of names of licensors or\n    authors of the material; or\n\n    e) Declining to grant rights under trademark law for use of some\n    trade names, trademarks, or service marks; or\n\n    f) Requiring indemnification of licensors and authors of that\n    material by anyone who conveys the material (or modified versions of\n    it) with contractual assumptions of liability to the recipient, for\n    any liability that these contractual assumptions directly impose on\n    those licensors and authors.\n\n  All other non-permissive additional terms are considered "further\nrestrictions" within the meaning of section 10.  If the Program as you\nreceived it, or any part of it, contains a notice stating that it is\ngoverned by this License along with a term that is a further\nrestriction, you may remove that term.  If a license document contains\na further restriction but permits relicensing or conveying under this\nLicense, you may add to a covered work material governed by the terms\nof that license document, provided that the further restriction does\nnot survive such relicensing or conveying.\n\n  If you add terms to a covered work in accord with this section, you\nmust place, in the relevant source files, a statement of the\nadditional terms that apply to those files, or a notice indicating\nwhere to find the applicable terms.\n\n  Additional terms, permissive or non-permissive, may be stated in the\nform of a separately written license, or stated as exceptions;\nthe above requirements apply either way.\n\n  8. Termination.\n\n  You may not propagate or modify a covered work except as expressly\nprovided under this License.  Any attempt otherwise to propagate or\nmodify it is void, and will automatically terminate your rights under\nthis License (including any patent licenses granted under the third\nparagraph of section 11).\n\n  However, if you cease all violation of this License, then your\nlicense from a particular copyright holder is reinstated (a)\nprovisionally, unless and until the copyright holder explicitly and\nfinally terminates your license, and (b) permanently, if the copyright\nholder fails to notify you of the violation by some reasonable means\nprior to 60 days after the cessation.\n\n  Moreover, your license from a particular copyright holder is\nreinstated permanently if the copyright holder notifies you of the\nviolation by some reasonable means, this is the first time you have\nreceived notice of violation of this License (for any work) from that\ncopyright holder, and you cure the violation prior to 30 days after\nyour receipt of the notice.\n\n  Termination of your rights under this section does not terminate the\nlicenses of parties who have received copies or rights from you under\nthis License.  If your rights have been terminated and not permanently\nreinstated, you do not qualify to receive new licenses for the same\nmaterial under section 10.\n\n  9. Acceptance Not Required for Having Copies.\n\n  You are not required to accept this License in order to receive or\nrun a copy of the Program.  Ancillary propagation of a covered work\noccurring solely as a consequence of using peer-to-peer transmission\nto receive a copy likewise does not require acceptance.  However,\nnothing other than this License grants you permission to propagate or\nmodify any covered work.  These actions infringe copyright if you do\nnot accept this License.  Therefore, by modifying or propagating a\ncovered work, you indicate your acceptance of this License to do so.\n\n  10. Automatic Licensing of Downstream Recipients.\n\n  Each time you convey a covered work, the recipient automatically\nreceives a license from the original licensors, to run, modify and\npropagate that work, subject to this License.  You are not responsible\nfor enforcing compliance by third parties with this License.\n\n  An "entity transaction" is a transaction transferring control of an\norganization, or substantially all assets of one, or subdividing an\norganization, or merging organizations.  If propagation of a covered\nwork results from an entity transaction, each party to that\ntransaction who receives a copy of the work also receives whatever\nlicenses to the work the party\'s predecessor in interest had or could\ngive under the previous paragraph, plus a right to possession of the\nCorresponding Source of the work from the predecessor in interest, if\nthe predecessor has it or can get it with reasonable efforts.\n\n  You may not impose any further restrictions on the exercise of the\nrights granted or affirmed under this License.  For example, you may\nnot impose a license fee, royalty, or other charge for exercise of\nrights granted under this License, and you may not initiate litigation\n(including a cross-claim or counterclaim in a lawsuit) alleging that\nany patent claim is infringed by making, using, selling, offering for\nsale, or importing the Program or any portion of it.\n\n  11. Patents.\n\n  A "contributor" is a copyright holder who authorizes use under this\nLicense of the Program or a work on which the Program is based.  The\nwork thus licensed is called the contributor\'s "contributor version".\n\n  A contributor\'s "essential patent claims" are all patent claims\nowned or controlled by the contributor, whether already acquired or\nhereafter acquired, that would be infringed by some manner, permitted\nby this License, of making, using, or selling its contributor version,\nbut do not include claims that would be infringed only as a\nconsequence of further modification of the contributor version.  For\npurposes of this definition, "control" includes the right to grant\npatent sublicenses in a manner consistent with the requirements of\nthis License.\n\n  Each contributor grants you a non-exclusive, worldwide, royalty-free\npatent license under the contributor\'s essential patent claims, to\nmake, use, sell, offer for sale, import and otherwise run, modify and\npropagate the contents of its contributor version.\n\n  In the following three paragraphs, a "patent license" is any express\nagreement or commitment, however denominated, not to enforce a patent\n(such as an express permission to practice a patent or covenant not to\nsue for patent infringement).  To "grant" such a patent license to a\nparty means to make such an agreement or commitment not to enforce a\npatent against the party.\n\n  If you convey a covered work, knowingly relying on a patent license,\nand the Corresponding Source of the work is not available for anyone\nto copy, free of charge and under the terms of this License, through a\npublicly available network server or other readily accessible means,\nthen you must either (1) cause the Corresponding Source to be so\navailable, or (2) arrange to deprive yourself of the benefit of the\npatent license for this particular work, or (3) arrange, in a manner\nconsistent with the requirements of this License, to extend the patent\nlicense to downstream recipients.  "Knowingly relying" means you have\nactual knowledge that, but for the patent license, your conveying the\ncovered work in a country, or your recipient\'s use of the covered work\nin a country, would infringe one or more identifiable patents in that\ncountry that you have reason to believe are valid.\n\n  If, pursuant to or in connection with a single transaction or\narrangement, you convey, or propagate by procuring conveyance of, a\ncovered work, and grant a patent license to some of the parties\nreceiving the covered work authorizing them to use, propagate, modify\nor convey a specific copy of the covered work, then the patent license\nyou grant is automatically extended to all recipients of the covered\nwork and works based on it.\n\n  A patent license is "discriminatory" if it does not include within\nthe scope of its coverage, prohibits the exercise of, or is\nconditioned on the non-exercise of one or more of the rights that are\nspecifically granted under this License.  You may not convey a covered\nwork if you are a party to an arrangement with a third party that is\nin the business of distributing software, under which you make payment\nto the third party based on the extent of your activity of conveying\nthe work, and under which the third party grants, to any of the\nparties who would receive the covered work from you, a discriminatory\npatent license (a) in connection with copies of the covered work\nconveyed by you (or copies made from those copies), or (b) primarily\nfor and in connection with specific products or compilations that\ncontain the covered work, unless you entered into that arrangement,\nor that patent license was granted, prior to 28 March 2007.\n\n  Nothing in this License shall be construed as excluding or limiting\nany implied license or other defenses to infringement that may\notherwise be available to you under applicable patent law.\n\n  12. No Surrender of Others\' Freedom.\n\n  If conditions are imposed on you (whether by court order, agreement or\notherwise) that contradict the conditions of this License, they do not\nexcuse you from the conditions of this License.  If you cannot convey a\ncovered work so as to satisfy simultaneously your obligations under this\nLicense and any other pertinent obligations, then as a consequence you may\nnot convey it at all.  For example, if you agree to terms that obligate you\nto collect a royalty for further conveying from those to whom you convey\nthe Program, the only way you could satisfy both those terms and this\nLicense would be to refrain entirely from conveying the Program.\n\n  13. Use with the GNU Affero General Public License.\n\n  Notwithstanding any other provision of this License, you have\npermission to link or combine any covered work with a work licensed\nunder version 3 of the GNU Affero General Public License into a single\ncombined work, and to convey the resulting work.  The terms of this\nLicense will continue to apply to the part which is the covered work,\nbut the special requirements of the GNU Affero General Public License,\nsection 13, concerning interaction through a network will apply to the\ncombination as such.\n\n  14. Revised Versions of this License.\n\n  The Free Software Foundation may publish revised and/or new versions of\nthe GNU General Public License from time to time.  Such new versions will\nbe similar in spirit to the present version, but may differ in detail to\naddress new problems or concerns.\n\n  Each version is given a distinguishing version number.  If the\nProgram specifies that a certain numbered version of the GNU General\nPublic License "or any later version" applies to it, you have the\noption of following the terms and conditions either of that numbered\nversion or of any later version published by the Free Software\nFoundation.  If the Program does not specify a version number of the\nGNU General Public License, you may choose any version ever published\nby the Free Software Foundation.\n\n  If the Program specifies that a proxy can decide which future\nversions of the GNU General Public License can be used, that proxy\'s\npublic statement of acceptance of a version permanently authorizes you\nto choose that version for the Program.\n\n  Later license versions may give you additional or different\npermissions.  However, no additional obligations are imposed on any\nauthor or copyright holder as a result of your choosing to follow a\nlater version.\n\n  15. Disclaimer of Warranty.\n\n  THERE IS NO WARRANTY FOR THE PROGRAM, TO THE EXTENT PERMITTED BY\nAPPLICABLE LAW.  EXCEPT WHEN OTHERWISE STATED IN WRITING THE COPYRIGHT\nHOLDERS AND/OR OTHER PARTIES PROVIDE THE PROGRAM "AS IS" WITHOUT WARRANTY\nOF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,\nTHE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR\nPURPOSE.  THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE PROGRAM\nIS WITH YOU.  SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF\nALL NECESSARY SERVICING, REPAIR OR CORRECTION.\n\n  16. Limitation of Liability.\n\n  IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW OR AGREED TO IN WRITING\nWILL ANY COPYRIGHT HOLDER, OR ANY OTHER PARTY WHO MODIFIES AND/OR CONVEYS\nTHE PROGRAM AS PERMITTED ABOVE, BE LIABLE TO YOU FOR DAMAGES, INCLUDING ANY\nGENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE\nUSE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED TO LOSS OF\nDATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY YOU OR THIRD\nPARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER PROGRAMS),\nEVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF\nSUCH DAMAGES.\n\n  17. Interpretation of Sections 15 and 16.\n\n  If the disclaimer of warranty and limitation of liability provided\nabove cannot be given local legal effect according to their terms,\nreviewing courts shall apply local law that most closely approximates\nan absolute waiver of all civil liability in connection with the\nProgram, unless a warranty or assumption of liability accompanies a\ncopy of the Program in return for a fee.\n\n                     END OF TERMS AND CONDITIONS\n\n            How to Apply These Terms to Your New Programs\n\n  If you develop a new program, and you want it to be of the greatest\npossible use to the public, the best way to achieve this is to make it\nfree software which everyone can redistribute and change under these terms.\n\n  To do so, attach the following notices to the program.  It is safest\nto attach them to the start of each source file to most effectively\nstate the exclusion of warranty; and each file should have at least\nthe "copyright" line and a pointer to where the full notice is found.\n\n    EmulatorJS: RetroArch on the web\n    Copyright (C) 2023  Ethan O\'Brien\n\n    This program is free software: you can redistribute it and/or modify\n    it under the terms of the GNU General Public License as published by\n    the Free Software Foundation, either version 3 of the License, or\n    (at your option) any later version.\n\n    This program is distributed in the hope that it will be useful,\n    but WITHOUT ANY WARRANTY; without even the implied warranty of\n    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n    GNU General Public License for more details.\n\n    You should have received a copy of the GNU General Public License\n    along with this program.  If not, see <https://www.gnu.org/licenses/>.\n\nAlso add information on how to contact you by electronic and paper mail.\n\n  If the program does terminal interaction, make it output a short\nnotice like this when it starts in an interactive mode:\n\n    EmulatorJS  Copyright (C) 2023  Ethan O\'Brien\n    This program comes with ABSOLUTELY NO WARRANTY; for details type `show w\'.\n    This is free software, and you are welcome to redistribute it\n    under certain conditions; type `show c\' for details.\n\nThe hypothetical commands `show w\' and `show c\' should show the appropriate\nparts of the General Public License.  Of course, your program\'s commands\nmight be different; for a GUI interface, you would use an "about box".\n\n  You should also get your employer (if you work as a programmer) or school,\nif any, to sign a "copyright disclaimer" for the program, if necessary.\nFor more information on this, and how to apply and follow the GNU GPL, see\n<https://www.gnu.org/licenses/>.\n\n  The GNU General Public License does not permit incorporating your program\ninto proprietary programs.  If your program is a subroutine library, you\nmay consider it more useful to permit linking proprietary applications with\nthe library.  If this is what you want to do, use the GNU Lesser General\nPublic License instead of this License.  But first, please read\n<https://www.gnu.org/licenses/why-not-lgpl.html>.\n';
        });
        
        if (this.config.buttonOpts) {
            if (!this.config.buttonOpts.screenshot) screenshot.setAttribute("hidden", "");
            if (!this.config.buttonOpts.quickSave) qSave.setAttribute("hidden", "");
            if (!this.config.buttonOpts.quickLoad) qLoad.setAttribute("hidden", "");
        }
        
        this.elements.contextmenu.appendChild(parent);
        
        this.elements.parent.appendChild(this.elements.contextmenu);
    }
    closePopup() {
        if (this.currentPopup !== null) {
            try {
                this.currentPopup.remove();
            } catch(e){}
            this.currentPopup = null;
        }
    }
    //creates a full box popup.
    createPopup(popupTitle, buttons, hidden) {
        if (!hidden) this.closePopup();
        const popup = this.createElement('div');
        popup.classList.add("ejs_popup_container");
        this.elements.parent.appendChild(popup);
        const title = this.createElement("h4");
        title.innerText = this.localization(popupTitle);
        const main = this.createElement("div");
        main.classList.add("ejs_popup_body");
        
        popup.appendChild(title);
        popup.appendChild(main);
        
        for (let k in buttons) {
            const button = this.createElement("a");
            if (buttons[k] instanceof Function) {
                button.addEventListener("click", (e) => {
                    buttons[k]();
                    e.preventDefault();
                });
            }
            button.classList.add("ejs_button");
            button.innerText = this.localization(k);
            popup.appendChild(button);
        }
        if (!hidden) {
            this.currentPopup = popup;
        } else {
            popup.style.display = "none";
        }
        
        return main;
    }
    selectFile() {
        return new Promise((resolve, reject) => {
            const file = this.createElement("input");
            file.type = "file";
            this.addEventListener(file, "change", (e) => {
                resolve(e.target.files[0]);
            })
            file.click();
        })
    }
    isPopupOpen() {
        return this.cheatMenu.style.display !== "none" || this.controlMenu.style.display !== "none" || this.currentPopup !== null;
    }
    createBottomMenuBar() {
        this.elements.menu = this.createElement("div");
        this.elements.menu.classList.add("ejs_menu_bar");
        this.elements.menu.classList.add("ejs_menu_bar_hidden");
        
        let timeout = null;
        const hide = () => {
            if (this.paused || this.settingsMenuOpen) return;
            this.elements.menu.classList.add("ejs_menu_bar_hidden");
        }
        
        this.addEventListener(this.elements.parent, 'mousemove click', (e) => {
            if (!this.started) return;
            if (this.isPopupOpen()) return;
            if (timeout !== null) clearTimeout(timeout);
            timeout = setTimeout(hide, 3000);
            this.elements.menu.classList.remove("ejs_menu_bar_hidden");
        })
        this.addEventListener(this.elements.menu, 'touchstart touchend touchmove', (e) => {
            if (!this.started) return;
            if (this.isPopupOpen()) return;
            if (timeout !== null) clearTimeout(timeout);
            timeout = setTimeout(hide, 3000);
            this.elements.menu.classList.remove("ejs_menu_bar_hidden");
        })
        this.menu = {
            close: () => {
                if (!this.started) return;
                if (timeout !== null) clearTimeout(timeout);
                this.elements.menu.classList.remove("ejs_menu_bar_hidden");
            },
            open: () => {
                if (!this.started) return;
                if (timeout !== null) clearTimeout(timeout);
                timeout = setTimeout(hide, 3000);
                this.elements.menu.classList.remove("ejs_menu_bar_hidden");
            }
        }
        this.elements.parent.appendChild(this.elements.menu);
        
        //Now add buttons
        const addButton = (title, image, callback, element, both) => {
            const button = this.createElement("button");
            button.type = "button";
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute("role", "presentation");
            svg.setAttribute("focusable", "false");
            svg.innerHTML = image;
            const text = this.createElement("span");
            text.innerText = this.localization(title);
            text.classList.add("ejs_menu_text");
            
            button.classList.add("ejs_menu_button");
            button.appendChild(svg);
            button.appendChild(text);
            if (element) {
                element.appendChild(button);
            } else {
                this.elements.menu.appendChild(button);
            }
            if (callback instanceof Function) {
                this.addEventListener(button, 'click', callback);
            }
            return both ? [button, svg, text] : button;
        }
        
        //todo. Center text on not restart button
        
        const restartButton = addButton("Restart", '<svg viewBox="0 0 512 512"><path d="M496 48V192c0 17.69-14.31 32-32 32H320c-17.69 0-32-14.31-32-32s14.31-32 32-32h63.39c-29.97-39.7-77.25-63.78-127.6-63.78C167.7 96.22 96 167.9 96 256s71.69 159.8 159.8 159.8c34.88 0 68.03-11.03 95.88-31.94c14.22-10.53 34.22-7.75 44.81 6.375c10.59 14.16 7.75 34.22-6.375 44.81c-39.03 29.28-85.36 44.86-134.2 44.86C132.5 479.9 32 379.4 32 256s100.5-223.9 223.9-223.9c69.15 0 134 32.47 176.1 86.12V48c0-17.69 14.31-32 32-32S496 30.31 496 48z"/></svg>', () => {
            this.gameManager.restart();
        });
        const pauseButton = addButton("Pause", '<svg viewBox="0 0 320 512"><path d="M272 63.1l-32 0c-26.51 0-48 21.49-48 47.1v288c0 26.51 21.49 48 48 48L272 448c26.51 0 48-21.49 48-48v-288C320 85.49 298.5 63.1 272 63.1zM80 63.1l-32 0c-26.51 0-48 21.49-48 48v288C0 426.5 21.49 448 48 448l32 0c26.51 0 48-21.49 48-48v-288C128 85.49 106.5 63.1 80 63.1z"/></svg>', () => {
            this.togglePlaying();
        });
        const playButton = addButton("Play", '<svg viewBox="0 0 320 512"><path d="M361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215z"/></svg>', () => {
            this.togglePlaying();
        });
        playButton.style.display = "none";
        this.togglePlaying = () => {
            this.paused = !this.paused;
            if (this.paused) {
                pauseButton.style.display = "none";
                playButton.style.display = "";
            } else {
                pauseButton.style.display = "";
                playButton.style.display = "none";
            }
            this.gameManager.toggleMainLoop(this.paused ? 0 : 1);
            
            //I now realize its not easy to pause it while the cursor is locked, just in case I guess
            if (this.getCore(true) === "nds") {
                if (this.canvas.exitPointerLock) {
                    this.canvas.exitPointerLock();
                } else if (this.canvas.mozExitPointerLock) {
                    this.canvas.mozExitPointerLock();
                }
            }
        }
        
        
        let stateUrl;
        const saveState = addButton("Save State", '<svg viewBox="0 0 448 512"><path fill="currentColor" d="M433.941 129.941l-83.882-83.882A48 48 0 0 0 316.118 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V163.882a48 48 0 0 0-14.059-33.941zM224 416c-35.346 0-64-28.654-64-64 0-35.346 28.654-64 64-64s64 28.654 64 64c0 35.346-28.654 64-64 64zm96-304.52V212c0 6.627-5.373 12-12 12H76c-6.627 0-12-5.373-12-12V108c0-6.627 5.373-12 12-12h228.52c3.183 0 6.235 1.264 8.485 3.515l3.48 3.48A11.996 11.996 0 0 1 320 111.48z"/></svg>', async () => {
            const state = await this.gameManager.getState();
            const called = this.callEvent("save", {
                screenshot: this.gameManager.screenshot(),
                state: state
            });
            if (called > 0) return;
            if (stateUrl) URL.revokeObjectURL(stateUrl);
            if (this.settings['save-state-location'] === "browser" && this.saveInBrowserSupported()) {
                this.storage.states.put(this.getBaseFileName()+".state", state);
                this.displayMessage(this.localization("SAVED LOADED TO BROWSER"));
            } else {
                const blob = new Blob([state]);
                stateUrl = URL.createObjectURL(blob);
                const a = this.createElement("a");
                a.href = stateUrl;
                a.download = this.getBaseFileName()+".state";
                a.click();
            }
        });
        const loadState = addButton("Load State", '<svg viewBox="0 0 576 512"><path fill="currentColor" d="M572.694 292.093L500.27 416.248A63.997 63.997 0 0 1 444.989 448H45.025c-18.523 0-30.064-20.093-20.731-36.093l72.424-124.155A64 64 0 0 1 152 256h399.964c18.523 0 30.064 20.093 20.73 36.093zM152 224h328v-48c0-26.51-21.49-48-48-48H272l-64-64H48C21.49 64 0 85.49 0 112v278.046l69.077-118.418C86.214 242.25 117.989 224 152 224z"/></svg>', async () => {
            const called = this.callEvent("load");
            if (called > 0) return;
            if (this.settings['save-state-location'] === "browser" && this.saveInBrowserSupported()) {
                this.storage.states.get(this.getBaseFileName()+".state").then(e => {
                    this.gameManager.loadState(e);
                    this.displayMessage(this.localization("SAVED LOADED FROM BROWSER"));
                })
            } else {
                const file = await this.selectFile();
                const state = new Uint8Array(await file.arrayBuffer());
                this.gameManager.loadState(state);
            }
        });
        const controlMenu = addButton("Control Settings", '<svg viewBox="0 0 640 512"><path fill="currentColor" d="M480 96H160C71.6 96 0 167.6 0 256s71.6 160 160 160c44.8 0 85.2-18.4 114.2-48h91.5c29 29.6 69.5 48 114.2 48 88.4 0 160-71.6 160-160S568.4 96 480 96zM256 276c0 6.6-5.4 12-12 12h-52v52c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-52H76c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h52v-52c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v52h52c6.6 0 12 5.4 12 12v40zm184 68c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm80-80c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48z"/></svg>', () => {
            this.controlMenu.style.display = "";
        });
        const cheatMenu = addButton("Cheats", '<svg viewBox="0 0 496 512"><path fill="currentColor" d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 448c-110.3 0-200-89.7-200-200S137.7 56 248 56s200 89.7 200 200-89.7 200-200 200zm-80-216c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm4 72.6c-20.8 25-51.5 39.4-84 39.4s-63.2-14.3-84-39.4c-8.5-10.2-23.7-11.5-33.8-3.1-10.2 8.5-11.5 23.6-3.1 33.8 30 36 74.1 56.6 120.9 56.6s90.9-20.6 120.9-56.6c8.5-10.2 7.1-25.3-3.1-33.8-10.1-8.4-25.3-7.1-33.8 3.1z" class=""></path></svg>', () => {
            this.cheatMenu.style.display = "";
        });
        
        const cache = addButton("Cache Manager", '<svg viewBox="0 0 1800 1800"><path d="M896 768q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5T231 896 128 768V598q119 84 325 127t443 43zm0 768q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zm0-384q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128V982q119 84 325 127t443 43zM896 0q208 0 385 34.5t280 93.5 103 128v128q0 69-103 128t-280 93.5T896 640t-385-34.5T231 512 128 384V256q0-69 103-128t280-93.5T896 0z"/></svg>', () => {
            this.openCacheMenu();
        });
        
        const spacer = this.createElement("span");
        spacer.style = "flex:1;";
        this.elements.menu.appendChild(spacer);
        
        const volumeSettings = this.createElement("div");
        volumeSettings.classList.add("ejs_volume_parent");
        const muteButton = addButton("Mute", '<svg viewBox="0 0 640 512"><path d="M412.6 182c-10.28-8.334-25.41-6.867-33.75 3.402c-8.406 10.24-6.906 25.35 3.375 33.74C393.5 228.4 400 241.8 400 255.1c0 14.17-6.5 27.59-17.81 36.83c-10.28 8.396-11.78 23.5-3.375 33.74c4.719 5.806 11.62 8.802 18.56 8.802c5.344 0 10.75-1.779 15.19-5.399C435.1 311.5 448 284.6 448 255.1S435.1 200.4 412.6 182zM473.1 108.2c-10.22-8.334-25.34-6.898-33.78 3.34c-8.406 10.24-6.906 25.35 3.344 33.74C476.6 172.1 496 213.3 496 255.1s-19.44 82.1-53.31 110.7c-10.25 8.396-11.75 23.5-3.344 33.74c4.75 5.775 11.62 8.771 18.56 8.771c5.375 0 10.75-1.779 15.22-5.431C518.2 366.9 544 313 544 255.1S518.2 145 473.1 108.2zM534.4 33.4c-10.22-8.334-25.34-6.867-33.78 3.34c-8.406 10.24-6.906 25.35 3.344 33.74C559.9 116.3 592 183.9 592 255.1s-32.09 139.7-88.06 185.5c-10.25 8.396-11.75 23.5-3.344 33.74C505.3 481 512.2 484 519.2 484c5.375 0 10.75-1.779 15.22-5.431C601.5 423.6 640 342.5 640 255.1S601.5 88.34 534.4 33.4zM301.2 34.98c-11.5-5.181-25.01-3.076-34.43 5.29L131.8 160.1H48c-26.51 0-48 21.48-48 47.96v95.92c0 26.48 21.49 47.96 48 47.96h83.84l134.9 119.8C272.7 477 280.3 479.8 288 479.8c4.438 0 8.959-.9314 13.16-2.835C312.7 471.8 320 460.4 320 447.9V64.12C320 51.55 312.7 40.13 301.2 34.98z"/></svg>', () => {
            muteButton.style.display = "none";
            unmuteButton.style.display = "";
            this.muted = true;
            this.setVolume(0);
        }, volumeSettings);
        const unmuteButton = addButton("Unmute", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M301.2 34.85c-11.5-5.188-25.02-3.122-34.44 5.253L131.8 160H48c-26.51 0-48 21.49-48 47.1v95.1c0 26.51 21.49 47.1 48 47.1h83.84l134.9 119.9c5.984 5.312 13.58 8.094 21.26 8.094c4.438 0 8.972-.9375 13.17-2.844c11.5-5.156 18.82-16.56 18.82-29.16V64C319.1 51.41 312.7 40 301.2 34.85zM513.9 255.1l47.03-47.03c9.375-9.375 9.375-24.56 0-33.94s-24.56-9.375-33.94 0L480 222.1L432.1 175c-9.375-9.375-24.56-9.375-33.94 0s-9.375 24.56 0 33.94l47.03 47.03l-47.03 47.03c-9.375 9.375-9.375 24.56 0 33.94c9.373 9.373 24.56 9.381 33.94 0L480 289.9l47.03 47.03c9.373 9.373 24.56 9.381 33.94 0c9.375-9.375 9.375-24.56 0-33.94L513.9 255.1z"/></svg>', () => {
            if (this.volume === 0) this.volume = 0.5;
            muteButton.style.display = "";
            unmuteButton.style.display = "none";
            this.muted = false;
            this.setVolume(this.volume);
        }, volumeSettings);
        unmuteButton.style.display = "none";
        
        const volumeSlider = this.createElement("input");
        volumeSlider.setAttribute("data-range", "volume");
        volumeSlider.setAttribute("type", "range");
        volumeSlider.setAttribute("min", 0);
        volumeSlider.setAttribute("max", 1);
        volumeSlider.setAttribute("step", 0.01);
        volumeSlider.setAttribute("autocomplete", "off");
        volumeSlider.setAttribute("role", "slider");
        volumeSlider.setAttribute("aria-label", "Volume");
        volumeSlider.setAttribute("aria-valuemin", 0);
        volumeSlider.setAttribute("aria-valuemax", 100);
    
        this.setVolume = (volume) => {
            this.saveSettings();
            this.muted = (volume === 0);
            volumeSlider.value = volume;
            volumeSlider.setAttribute("aria-valuenow", volume*100);
            volumeSlider.setAttribute("aria-valuetext", (volume*100).toFixed(1) + "%");
            volumeSlider.setAttribute("style", "--value: "+volume*100+"%;margin-left: 5px;position: relative;z-index: 2;");
            if (this.gameManager) {
                //this.gameManager.setVolume(volume);
            }
            unmuteButton.style.display = (volume === 0) ? "" : "none";
            muteButton.style.display = (volume === 0) ? "none" : "";
        }
        this.initAudio = () => {
              RA.queueAudio = () => {
                 var index = RA.bufIndex;
                 let volume = this.volume;

                 var startTime;
                 if (RA.bufIndex) startTime = RA.buffers[RA.bufIndex - 1].endTime;
                 else startTime = RA.context.currentTime;
                 RA.buffers[index].endTime = startTime + RA.buffers[index].duration;

                 const bufferSource = RA.context.createBufferSource();
                 bufferSource.buffer = RA.buffers[index];
                 if (this.muted) volume = 0;
                 if (volume === 1) {
                    bufferSource.connect(RA.context.destination);
                 } else {
                     var gain = RA.context.createGain();
                     bufferSource.connect(gain);
                     gain.connect(RA.context.destination);
                     gain.gain.setValueAtTime(volume, RA.context.currentTime, 0);
                 }
                 
                 bufferSource.start(startTime);

                 RA.bufIndex++;
                 RA.bufOffset = 0;
            }
        }
        this.setVolume(this.volume);
        
        this.addEventListener(volumeSlider, "change mousemove touchmove mousedown touchstart mouseup", (e) => {
            setTimeout(() => {
                const newVal = parseFloat(volumeSlider.value);
                if (newVal === 0 && this.muted) return;
                this.volume = newVal;
                this.setVolume(this.volume);
            }, 5);
        })
        
        volumeSettings.appendChild(volumeSlider);
        
        
        
        //this.volume this.muted
        
        this.elements.menu.appendChild(volumeSettings);
        
        this.settingParent = this.createElement("div");
        this.settingsMenuOpen = false;
        const settingButton = addButton("Settings", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M495.9 166.6C499.2 175.2 496.4 184.9 489.6 191.2L446.3 230.6C447.4 238.9 448 247.4 448 256C448 264.6 447.4 273.1 446.3 281.4L489.6 320.8C496.4 327.1 499.2 336.8 495.9 345.4C491.5 357.3 486.2 368.8 480.2 379.7L475.5 387.8C468.9 398.8 461.5 409.2 453.4 419.1C447.4 426.2 437.7 428.7 428.9 425.9L373.2 408.1C359.8 418.4 344.1 427 329.2 433.6L316.7 490.7C314.7 499.7 307.7 506.1 298.5 508.5C284.7 510.8 270.5 512 255.1 512C241.5 512 227.3 510.8 213.5 508.5C204.3 506.1 197.3 499.7 195.3 490.7L182.8 433.6C167 427 152.2 418.4 138.8 408.1L83.14 425.9C74.3 428.7 64.55 426.2 58.63 419.1C50.52 409.2 43.12 398.8 36.52 387.8L31.84 379.7C25.77 368.8 20.49 357.3 16.06 345.4C12.82 336.8 15.55 327.1 22.41 320.8L65.67 281.4C64.57 273.1 64 264.6 64 256C64 247.4 64.57 238.9 65.67 230.6L22.41 191.2C15.55 184.9 12.82 175.3 16.06 166.6C20.49 154.7 25.78 143.2 31.84 132.3L36.51 124.2C43.12 113.2 50.52 102.8 58.63 92.95C64.55 85.8 74.3 83.32 83.14 86.14L138.8 103.9C152.2 93.56 167 84.96 182.8 78.43L195.3 21.33C197.3 12.25 204.3 5.04 213.5 3.51C227.3 1.201 241.5 0 256 0C270.5 0 284.7 1.201 298.5 3.51C307.7 5.04 314.7 12.25 316.7 21.33L329.2 78.43C344.1 84.96 359.8 93.56 373.2 103.9L428.9 86.14C437.7 83.32 447.4 85.8 453.4 92.95C461.5 102.8 468.9 113.2 475.5 124.2L480.2 132.3C486.2 143.2 491.5 154.7 495.9 166.6V166.6zM256 336C300.2 336 336 300.2 336 255.1C336 211.8 300.2 175.1 256 175.1C211.8 175.1 176 211.8 176 255.1C176 300.2 211.8 336 256 336z"/></svg>', () => {
            this.settingsMenuOpen = !this.settingsMenuOpen;
            settingButton[1].classList.toggle("ejs_svg_rotate", this.settingsMenuOpen);
            settingButton[2].style.display = this.settingsMenuOpen ? "none" : "";
            this.settingsMenu.style.display = this.settingsMenuOpen ? "" : "none";
        }, this.settingParent, true);
        this.elements.menu.appendChild(this.settingParent);
        this.closeSettingsMenu = () => {
            if (!this.settingsMenu) return;
            this.settingsMenuOpen = false;
            settingButton[1].classList.toggle("ejs_svg_rotate", this.settingsMenuOpen);
            settingButton[2].style.display = "";
            this.settingsMenu.style.display = "none";
        }
        this.addEventListener(this.elements.parent, "click", (e) => {
            if (e.target === settingButton[0]) return;
            setTimeout(() => {
                if (this.settingsJustClicked) {
                    this.settingsJustClicked = false;
                    return;
                }
                this.closeSettingsMenu();
            }, 10)
        })
        this.addEventListener(this.canvas, "click", (e) => {
            if (e.pointerType === "touch") return;
            if (this.getCore(true) === "nds" && !this.paused) {
                if (this.canvas.requestPointerLock) {
                    this.canvas.requestPointerLock();
                } else if (this.canvas.mozRequestPointerLock) {
                    this.canvas.mozRequestPointerLock();
                }
            }
        })
        
        const enter = addButton("Enter Fullscreen", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M208 281.4c-12.5-12.5-32.76-12.5-45.26-.002l-78.06 78.07l-30.06-30.06c-6.125-6.125-14.31-9.367-22.63-9.367c-4.125 0-8.279 .7891-12.25 2.43c-11.97 4.953-19.75 16.62-19.75 29.56v135.1C.0013 501.3 10.75 512 24 512h136c12.94 0 24.63-7.797 29.56-19.75c4.969-11.97 2.219-25.72-6.938-34.87l-30.06-30.06l78.06-78.07c12.5-12.49 12.5-32.75 .002-45.25L208 281.4zM487.1 0h-136c-12.94 0-24.63 7.797-29.56 19.75c-4.969 11.97-2.219 25.72 6.938 34.87l30.06 30.06l-78.06 78.07c-12.5 12.5-12.5 32.76 0 45.26l22.62 22.62c12.5 12.5 32.76 12.5 45.26 0l78.06-78.07l30.06 30.06c9.156 9.141 22.87 11.84 34.87 6.937C504.2 184.6 512 172.9 512 159.1V23.1C512 10.74 501.3 0 487.1 0z"/></svg>', () => {
            if (this.elements.parent.requestFullscreen) {
                this.elements.parent.requestFullscreen();
            } else if (this.elements.parent.mozRequestFullScreen) {
                this.elements.parent.mozRequestFullScreen();
            } else if (this.elements.parent.webkitRequestFullscreen) {
                this.elements.parent.webkitRequestFullscreen();
            } else if (this.elements.parent.msRequestFullscreen) {
                this.elements.parent.msRequestFullscreen();
            }
            exit.style.display = "";
            enter.style.display = "none";
        });
        const exit = addButton("Exit Fullscreen", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M215.1 272h-136c-12.94 0-24.63 7.797-29.56 19.75C45.47 303.7 48.22 317.5 57.37 326.6l30.06 30.06l-78.06 78.07c-12.5 12.5-12.5 32.75-.0012 45.25l22.62 22.62c12.5 12.5 32.76 12.5 45.26 .0013l78.06-78.07l30.06 30.06c6.125 6.125 14.31 9.367 22.63 9.367c4.125 0 8.279-.7891 12.25-2.43c11.97-4.953 19.75-16.62 19.75-29.56V296C239.1 282.7 229.3 272 215.1 272zM296 240h136c12.94 0 24.63-7.797 29.56-19.75c4.969-11.97 2.219-25.72-6.938-34.87l-30.06-30.06l78.06-78.07c12.5-12.5 12.5-32.76 .0002-45.26l-22.62-22.62c-12.5-12.5-32.76-12.5-45.26-.0003l-78.06 78.07l-30.06-30.06c-9.156-9.141-22.87-11.84-34.87-6.937c-11.97 4.953-19.75 16.62-19.75 29.56v135.1C272 229.3 282.7 240 296 240z"/></svg>', () => {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            exit.style.display = "none";
            enter.style.display = "";
        });
        exit.style.display = "none";
        
        this.addEventListener(document, "webkitfullscreenchange mozfullscreenchange fullscreenchange", (e) => {
            if (e.target !== this.elements.parent) return;
            if (document.fullscreenElement === null) {
                exit.style.display = "none";
                enter.style.display = "";
            } else {
                //not sure if this is possible, lets put it here anyways
                exit.style.display = "";
                enter.style.display = "none";
            }
        })
        
        const hasFullscreen = !!(this.elements.parent.requestFullscreen || this.elements.parent.mozRequestFullScreen || this.elements.parent.webkitRequestFullscreen || this.elements.parent.msRequestFullscreen);
        
        if (!hasFullscreen) {
            exit.style.display = "none";
            enter.style.display = "none";
        }
        
        this.elements.bottomBar = {
            playPause: [pauseButton, playButton],
            restart: [restartButton],
            settings: [settingButton],
            fullscreen: [enter, exit],
            saveState: [saveState],
            loadState: [loadState],
            gamepad: [controlMenu],
            cheat: [cheatMenu],
            cacheManager: [cache]
        }
        
        
        if (this.config.buttonOpts) {
            if (!this.config.buttonOpts.playPause) {
                pauseButton.style.display = "none";
                playButton.style.display = "none";
            }
            if (!this.config.buttonOpts.restart) restartButton.setAttribute("hidden", "");
            if (!this.config.buttonOpts.settings) settingButton[0].setAttribute("hidden", "");
            if (!this.config.buttonOpts.fullscreen) {
                enter.style.display = "none";
                exit.style.display = "none";
            }
            if (!this.config.buttonOpts.saveState) saveState.setAttribute("hidden", "");
            if (!this.config.buttonOpts.loadState) loadState.setAttribute("hidden", "");
            if (!this.config.buttonOpts.gamepad) controlMenu.setAttribute("hidden", "");
            if (!this.config.buttonOpts.cheat) cheatMenu.setAttribute("hidden", "");
            if (!this.config.buttonOpts.cacheManager) cache.setAttribute("hidden", "");
        }
    }
    openCacheMenu() {
        (async () => {
            const list = this.createElement("table");
            const tbody = this.createElement("tbody");
            const body = this.createPopup("Cache Manager", {
                "Clear All": async () => {
                    const roms = await this.storage.rom.getSizes();
                    for (const k in roms) {
                        await this.storage.rom.remove(k);
                    }
                    tbody.innerHTML = "";
                },
                "Close": () => {
                    this.closePopup();
                }
            });
            const roms = await this.storage.rom.getSizes();
            list.style.width = "100%";
            list.style["padding-left"] = "10px";
            list.style["text-align"] = "left";
            body.appendChild(list);
            list.appendChild(tbody);
            const getSize = function(size) {
                let i = -1;
                do {
                    size /= 1024, i++;
                } while (size > 1024);
                return Math.max(size, 0.1).toFixed(1) + [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'][i];
            }
            for (const k in roms) {
                const line = this.createElement("tr");
                const name = this.createElement("td");
                const size = this.createElement("td");
                const remove = this.createElement("td");
                remove.style.cursor = "pointer";
                name.innerText = k;
                size.innerText = getSize(roms[k]);
                
                const a = this.createElement("a");
                a.innerText = this.localization("Remove");
                this.addEventListener(remove, "click", () => {
                    this.storage.rom.remove(k);
                    line.remove();
                })
                remove.appendChild(a);
                
                line.appendChild(name);
                line.appendChild(size);
                line.appendChild(remove);
                tbody.appendChild(line);
            }
            
        })();
    }
    createControlSettingMenu() {
        let buttonListeners = [];
        this.checkGamepadInputs = () => buttonListeners.forEach(elem => elem());
        this.gamepadLabels = [];
        this.controls = JSON.parse(JSON.stringify(this.defaultControllers));
        const body = this.createPopup("Control Settings", {
            "Reset": () => {
                this.controls = JSON.parse(JSON.stringify(this.defaultControllers));
                this.checkGamepadInputs();
                this.saveSettings();
            },
            "Clear": () => {
                this.controls = {0:{},1:{},2:{},3:{}};
                this.checkGamepadInputs();
                this.saveSettings();
            },
            "Close": () => {
                this.controlMenu.style.display = "none";
            }
        }, true);
        this.controlMenu = body.parentElement;
        body.classList.add("ejs_control_body");
        
        const buttons = {
            0: 'B',
            1: 'Y',
            2: 'SELECT',
            3: 'START',
            4: 'UP',
            5: 'DOWN',
            6: 'LEFT',
            7: 'RIGHT',
            8: 'A',
            9: 'X',
            10: 'L',
            11: 'R',
            12: 'L2',
            13: 'R2',
            14: 'L3',
            15: 'R3',
            19: 'L STICK UP',
            18: 'L STICK DOWN',
            17: 'L STICK LEFT',
            16: 'L STICK RIGHT',
            23: 'R STICK UP',
            22: 'R STICK DOWN',
            21: 'R STICK LEFT',
            20: 'R STICK RIGHT',
            24: this.localization('QUICK SAVE STATE'),
            25: this.localization('QUICK LOAD STATE'),
            26: this.localization('CHANGE STATE SLOT')
        }
        let selectedPlayer;
        let players = [];
        let playerDivs = [];
        
        const playerSelect = this.createElement("ul");
        playerSelect.classList.add("ejs_control_player_bar");
        for (let i=1; i<5; i++) {
            const playerContainer = this.createElement("li");
            playerContainer.classList.add("tabs-title");
            playerContainer.setAttribute("role", "presentation");
            const player = this.createElement("a");
            player.innerText = this.localization("Player")+" "+i;
            player.setAttribute("role", "tab");
            player.setAttribute("aria-controls", "controls-"+(i-1));
            player.setAttribute("aria-selected", "false");
            player.id = "controls-"+(i-1)+"-label";
            this.addEventListener(player, "click", (e) => {
                e.preventDefault();
                players[selectedPlayer].classList.remove("ejs_control_selected");
                playerDivs[selectedPlayer].setAttribute("hidden", "");
                selectedPlayer = i-1;
                players[i-1].classList.add("ejs_control_selected");
                playerDivs[i-1].removeAttribute("hidden");
            })
            playerContainer.appendChild(player);
            playerSelect.appendChild(playerContainer);
            players.push(playerContainer);
        }
        body.appendChild(playerSelect);
        
        const controls = this.createElement("div");
        for (let i=0; i<4; i++) {
            if (!this.controls[i]) this.controls[i] = {};
            const player = this.createElement("div");
            const playerTitle = this.createElement("div");
            
            const gamepadTitle = this.createElement("div");
            gamepadTitle.style = "font-size:12px;";
            gamepadTitle.innerText = "Connected Gamepad: ";
            
            const gamepadName = this.createElement("span");
            this.gamepadLabels.push(gamepadName);
            gamepadName.innerText = "n/a";
            gamepadTitle.appendChild(gamepadName);
            
            const leftPadding = this.createElement("div");
            leftPadding.style = "width:25%;float:left;";
            leftPadding.innerHTML = "&nbsp;";
            
            const aboutParent = this.createElement("div");
            aboutParent.style = "font-size:12px;width:50%;float:left;";
            const gamepad = this.createElement("div");
            gamepad.style = "text-align:center;width:50%;float:left;";
            gamepad.innerText = "Gamepad";
            aboutParent.appendChild(gamepad);
            const keyboard = this.createElement("div");
            keyboard.style = "text-align:center;width:50%;float:left;";
            keyboard.innerText = "Keyboard";
            aboutParent.appendChild(keyboard);
            
            const headingPadding = this.createElement("div");
            headingPadding.style = "clear:both;";
            
            playerTitle.appendChild(gamepadTitle);
            playerTitle.appendChild(leftPadding);
            playerTitle.appendChild(aboutParent);
            playerTitle.appendChild(headingPadding);
            
            
            player.appendChild(playerTitle);
            
            for (const k in buttons) {
                const buttonText = this.createElement("div");
                buttonText.setAttribute("data-id", k);
                buttonText.setAttribute("data-index", i);
                buttonText.setAttribute("data-label", buttons[k]);
                buttonText.style = "margin-bottom:10px;";
                buttonText.classList.add("ejs_control_bar");
                
                
                const title = this.createElement("div");
                title.style = "width:25%;float:left;font-size:12px;";
                const label = this.createElement("label");
                label.innerText = buttons[k]+":";
                title.appendChild(label);
                
                const textBoxes = this.createElement("div");
                textBoxes.style = "width:50%;float:left;";
                
                const textBox1Parent = this.createElement("div");
                textBox1Parent.style = "width:50%;float:left;padding: 0 5px;";
                const textBox1 = this.createElement("input");
                textBox1.style = "text-align:center;height:25px;width: 100%;";
                textBox1.type = "text";
                textBox1.setAttribute("readonly", "");
                textBox1.setAttribute("placeholder", "");
                textBox1Parent.appendChild(textBox1);
                
                const textBox2Parent = this.createElement("div");
                textBox2Parent.style = "width:50%;float:left;padding: 0 5px;";
                const textBox2 = this.createElement("input");
                textBox2.style = "text-align:center;height:25px;width: 100%;";
                textBox2.type = "text";
                textBox2.setAttribute("readonly", "");
                textBox2.setAttribute("placeholder", "");
                textBox2Parent.appendChild(textBox2);
                
                buttonListeners.push(() => {
                    textBox2.value = "";
                    textBox1.value = "";
                    if (this.controls[i][k] && this.controls[i][k].value !== undefined) {
                        textBox2.value = this.controls[i][k].value;
                    }
                    if (this.controls[i][k] && this.controls[i][k].value2 !== undefined) {
                        textBox1.value = this.controls[i][k].value2;
                    }
                })
                
                if (this.controls[i][k] && this.controls[i][k].value) {
                    textBox2.value = this.controls[i][k].value;
                }
                if (this.controls[i][k] && this.controls[i][k].value2) {
                    textBox1.value = "button " + this.controls[i][k].value2;
                }
                
                textBoxes.appendChild(textBox1Parent);
                textBoxes.appendChild(textBox2Parent);
                
                const padding = this.createElement("div");
                padding.style = "clear:both;";
                textBoxes.appendChild(padding);
                
                const setButton = this.createElement("div");
                setButton.style = "width:25%;float:left;";
                const button = this.createElement("a");
                button.classList.add("ejs_control_set_button");
                button.innerText = this.localization("Set");
                setButton.appendChild(button);
                
                const padding2 = this.createElement("div");
                padding2.style = "clear:both;";
                
                buttonText.appendChild(title);
                buttonText.appendChild(textBoxes);
                buttonText.appendChild(setButton);
                buttonText.appendChild(padding2);
                
                player.appendChild(buttonText);
                
                this.addEventListener(buttonText, "mousedown", (e) => {
                    e.preventDefault();
                    this.controlPopup.parentElement.removeAttribute("hidden");
                    this.controlPopup.innerText = "[ " + buttons[k] + " ]\n";
                    this.controlPopup.setAttribute("button-num", k);
                    this.controlPopup.setAttribute("player-num", i);
                })
            }
            controls.appendChild(player);
            player.setAttribute("hidden", "");
            playerDivs.push(player);
        }
        body.appendChild(controls);
        
        
        selectedPlayer = 0;
        players[0].classList.add("ejs_control_selected");
        playerDivs[0].removeAttribute("hidden");
        
        
        const popup = this.createElement('div');
        popup.classList.add("ejs_popup_container");
        const popupMsg = this.createElement("div");
        popupMsg.classList.add("ejs_popup_box");
        popupMsg.innerText = "";
        popup.setAttribute("hidden", "");
        this.controlPopup = popupMsg;
        popup.appendChild(popupMsg);
        this.controlMenu.appendChild(popup);
        
    }
    defaultControllers = {
        0: {
            0: {
                'value': 'x'
            },
            1: {
                'value': 's'
            },
            2: {
                'value': 'v'
            },
            3: {
                'value': 'enter'
            },
            4: {
                'value': 'arrowup'
            },
            5: {
                'value': 'arrowdown'
            },
            6: {
                'value': 'arrowleft'
            },
            7: {
                'value': 'arrowright'
            },
            8: {
                'value': 'z'
            },
            9: {
                'value': 'a'
            },
            10: {
                'value': 'q'
            },
            11: {
                'value': 'e'
            },
            12: {
                'value': 'e'
            },
            13: {
                'value': 'w'
            },
            14: {},
            15: {},
            16: {
                'value': 'h'
            },
            17: {
                'value': 'f'
            },
            18: {
                'value': 'g'
            },
            19: {
                'value': 't'
            },
            20: {'value': 'l'},
            21: {'value': 'j'},
            22: {'value': 'k'},
            23: {'value': 'i'},
            24: {},
            25: {},
            26: {}
        },
        1: {},
        2: {},
        3: {}
    }
    controls;
    keyChange(e) {
        if (e.repeat) return;
        if (!this.started) return;
        if (this.controlPopup.parentElement.getAttribute("hidden") === null) {
            const num = this.controlPopup.getAttribute("button-num");
            const player = this.controlPopup.getAttribute("player-num");
            if (!this.controls[player][num]) {
                this.controls[player][num] = {};
            }
            this.controls[player][num].value = e.key.toLowerCase();
            this.controlPopup.parentElement.setAttribute("hidden", "");
            this.checkGamepadInputs();
            this.saveSettings();
            return;
        }
        if (this.settingsMenu.style.display !== "none" || this.isPopupOpen()) return;
        e.preventDefault();
        const special = [16, 17, 18, 19, 20, 21, 22, 23];
        for (let i=0; i<4; i++) {
            for (let j=0; j<27; j++) {
                if (this.controls[i][j] && this.controls[i][j].value === e.key.toLowerCase()) {
                    this.gameManager.simulateInput(i, j, (e.type === 'keyup' ? 0 : (special.includes(j) ? 0x7fff : 1)));
                }
            }
        }
    }
    gamepadEvent(e) {
        if (!this.started) return;
        const value = function(value) {
            if (value > 0.5 || value < -0.5) {
                return (value > 0) ? 1 : -1;
            } else {
                return 0;
            }
        }(e.value || 0);
        if (this.controlPopup.parentElement.getAttribute("hidden") === null) {
            if ('buttonup' === e.type || (e.type === "axischanged" && value === 0)) return;
            const num = this.controlPopup.getAttribute("button-num");
            const player = this.controlPopup.getAttribute("player-num");
            if (!this.controls[player][num]) {
                this.controls[player][num] = {};
            }
            this.controls[player][num].value2 = (e.type === "axischanged" ? e.axis+":"+value : e.index);
            this.controlPopup.parentElement.setAttribute("hidden", "");
            this.checkGamepadInputs();
            this.saveSettings();
            return;
        }
        if (this.settingsMenu.style.display !== "none" || this.isPopupOpen()) return;
        const special = [16, 17, 18, 19, 20, 21, 22, 23];
        for (let i=0; i<4; i++) {
            for (let j=0; j<27; j++) {
                if (['buttonup', 'buttondown'].includes(e.type) && (this.controls[i][j] && this.controls[i][j].value2 === e.index)) {
                    this.gameManager.simulateInput(i, j, (e.type === 'buttondown' ? 0 : (special.includes(j) ? 0x7fff : 1)));
                } else if (e.type === "axischanged") {
                    if (this.controls[i][j] && typeof this.controls[i][j].value2 === 'string' && this.controls[i][j].value2.split(":")[0] === e.axis) {
                        if (special.includes(j)) {
                            if (e.axis === 'LEFT_STICK_X') {
                                if (e.value > 0) {
                                    this.gameManager.simulateInput(e.gamepadIndex, 16, 0x7fff * e.value);
                                    this.gameManager.simulateInput(e.gamepadIndex, 17, 0);
                                } else {
                                    this.gameManager.simulateInput(e.gamepadIndex, 17, -0x7fff * e.value);
                                    this.gameManager.simulateInput(e.gamepadIndex, 16, 0);
                                }
                            } else if (e.axis === 'LEFT_STICK_Y') {
                                if (e.value > 0) {
                                    this.gameManager.simulateInput(e.gamepadIndex, 18, 0x7fff * e.value);
                                    this.gameManager.simulateInput(e.gamepadIndex, 19, 0);
                                } else {
                                    this.gameManager.simulateInput(e.gamepadIndex, 19, -0x7fff * e.value);
                                    this.gameManager.simulateInput(e.gamepadIndex, 18, 0);
                                }
                            } else if (e.axis === 'RIGHT_STICK_X') {
                                if (e.value > 0) {
                                    this.gameManager.simulateInput(e.gamepadIndex, 20, 0x7fff * e.value);
                                    this.gameManager.simulateInput(e.gamepadIndex, 21, 0);
                                } else {
                                    this.gameManager.simulateInput(e.gamepadIndex, 21, -0x7fff * e.value);
                                    this.gameManager.simulateInput(e.gamepadIndex, 20, 0);
                                }
                            } else if (e.axis === 'RIGHT_STICK_Y') {
                                if (e.value > 0) {
                                    this.gameManager.simulateInput(e.gamepadIndex, 22, 0x7fff * e.value);
                                    this.gameManager.simulateInput(e.gamepadIndex, 23, 0);
                                } else {
                                    this.gameManager.simulateInput(e.gamepadIndex, 23, 0x7fff * e.value);
                                    this.gameManager.simulateInput(e.gamepadIndex, 22, 0);
                                }
                            }
                        } else if (this.controls[i][j].value2 === e.axis+":"+value || value === 0) {
                            this.gameManager.simulateInput(i, j, ((value === 0) ? 0 : 1));
                        }
                    }
                }
            }
        }
    }
    setVirtualGamepad() {
        this.virtualGamepad = this.createElement("div");
        this.virtualGamepad.style.display = "none";
        this.toggleVirtualGamepad = (show) => {
            this.virtualGamepad.style.display = show ? "" : "none";
        }
        this.virtualGamepad.classList.add("ejs_virtualGamepad_parent");
        this.elements.parent.appendChild(this.virtualGamepad);
        let info;
        if (this.config.VirtualGamepadSettings && function(set) {
            if (!Array.isArray(set)) {
                console.warn("Vritual gamepad settings is not array! Using default gamepad settings");
                return false;
            }
            if (!set.length) {
                console.warn("Virtual gamepad settings is empty! Using default gamepad settings");
                return false;
            }
            for (let i=0; i<set.length; i++) {
                if (!set[i].type) continue;
                try {
                    if (set[i].type === 'zone' || set[i].type === 'dpad') {
                        if (!set[i].location) {
                            console.warn("Missing location value for "+set[i].type+"! Using default gamepad settings");
                            return false;
                        } else if (!set[i].inputValues) {
                            console.warn("Missing inputValues for "+set[i].type+"! Using default gamepad settings");
                            return false;
                        }
                        continue;
                    }
                    if (!set[i].location) {
                        console.warn("Missing location value for button "+set[i].text+"! Using default gamepad settings");
                        return false;
                    } else if (!set[i].type) {
                        console.warn("Missing type value for button "+set[i].text+"! Using default gamepad settings");
                        return false;
                    } else if (!set[i].id.toString()) {
                        console.warn("Missing id value for button "+set[i].text+"! Using default gamepad settings");
                        return false;
                    } else if (!set[i].input_value.toString()) {
                        console.warn("Missing input_value for button "+set[i].text+"! Using default gamepad settings");
                        return false;
                    }
                } catch(e) {
                    console.warn("Error checking values! Using default gamepad settings");
                    return false;
                }
            }
            return true;
        }(this.config.VirtualGamepadSettings)) {
            info = this.config.VirtualGamepadSettings;
        } else if (['gba', 'gb', 'vb', 'nes'].includes(this.getCore(true))) {
            info = [{"type":"button","text":"B","id":"b","location":"right","right":-10,"top":70,"bold":true,"input_value":0},{"type":"button","text":"A","id":"a","location":"right","right":60,"top":70,"bold":true,"input_value":8},{"type":"dpad","location":"left","left":"50%","right":"50%","joystickInput":false,"inputValues":[4,5,6,7]},{"type":"button","text":"Start","id":"start","location":"center","left":60,"fontSize":15,"block":true,"input_value":3},{"type":"button","text":"Select","id":"select","location":"center","left":-5,"fontSize":15,"block":true,"input_value":2}];
            if (this.getCore(true) === 'gba') {
                info.push({"type":"button","text":"L","id":"l","block":true,"location":"top","left":10,"top":-40,"bold":true,"input_value":10});
                info.push({"type":"button","text":"R","id":"r","block":true,"location":"top","right":10,"top":-40,"bold":true,"input_value":11});
            }
        } else if (this.getCore(true) === 'n64') {
            info = [{"type":"button","text":"B","id":"b","location":"right","left":-10,"top":95,"input_value":1,"bold":true},{"type":"button","text":"A","id":"a","location":"right","left":40,"top":150,"input_value":0,"bold":true},{"type":"zone","location":"left","left":"50%","top":"100%","joystickInput":true,"inputValues":[16, 17, 18, 19]},{"type":"zone","location":"left","left":"50%","top":"0%","joystickInput":false,"inputValues":[4,5,6,7]},{"type":"button","text":"Start","id":"start","location":"center","left":30,"top":-10,"fontSize":15,"block":true,"input_value":3},{"type":"button","text":"L","id":"l","block":true,"location":"top","left":10,"top":-40,"bold":true,"input_value":10},{"type":"button","text":"R","id":"r","block":true,"location":"top","right":10,"top":-40,"bold":true,"input_value":11},{"type":"button","text":"Z","id":"z","block":true,"location":"top","left":10,"bold":true,"input_value":12},{"fontSize":20,"type":"button","text":"CU","id":"cu","location":"right","left":25,"top":-65,"input_value":23},{"fontSize":20,"type":"button","text":"CD","id":"cd","location":"right","left":25,"top":15,"input_value":22},{"fontSize":20,"type":"button","text":"CL","id":"cl","location":"right","left":-15,"top":-25,"input_value":21},{"fontSize":20,"type":"button","text":"CR","id":"cr","location":"right","left":65,"top":-25,"input_value":20}];
        } else if (['snes', 'nds'].includes(this.getCore(true))) {
            info = [{"type":"button","text":"X","id":"x","location":"right","left":40,"bold":true,"input_value":9},{"type":"button","text":"Y","id":"y","location":"right","top":40,"bold":true,"input_value":1},{"type":"button","text":"A","id":"a","location":"right","left":81,"top":40,"bold":true,"input_value":8},{"type":"button","text":"B","id":"b","location":"right","left":40,"top":80,"bold":true,"input_value":0},{"type":"zone","location":"left","left":"50%","top":"50%","joystickInput":false,"inputValues":[4,5,6,7]},{"type":"button","text":"Start","id":"start","location":"center","left":60,"fontSize":15,"block":true,"input_value":3},{"type":"button","text":"Select","id":"select","location":"center","left":-5,"fontSize":15,"block":true,"input_value":2}];
        } else {
            info = [{"type":"button","text":"Y","id":"y","location":"right","left":40,"bold":true,"input_value":9},{"type":"button","text":"X","id":"X","location":"right","top":40,"bold":true,"input_value":1},{"type":"button","text":"B","id":"b","location":"right","left":81,"top":40,"bold":true,"input_value":8},{"type":"button","text":"A","id":"a","location":"right","left":40,"top":80,"bold":true,"input_value":0},{"type":"zone","location":"left","left":"50%","top":"50%","joystickInput":false,"inputValues":[4,5,6,7]},{"type":"button","text":"Start","id":"start","location":"center","left":60,"fontSize":15,"block":true,"input_value":3},{"type":"button","text":"Select","id":"select","location":"center","left":-5,"fontSize":15,"block":true,"input_value":2}];
        }
        info = JSON.parse(JSON.stringify(info));
        
        
        const up = this.createElement("div");
        up.classList.add("ejs_virtualGamepad_top");
        const down = this.createElement("div");
        down.classList.add("ejs_virtualGamepad_bottom");
        const left = this.createElement("div");
        left.classList.add("ejs_virtualGamepad_left");
        const right = this.createElement("div");
        right.classList.add("ejs_virtualGamepad_right");
        const elems = {top:up, center:down, left, right};
        
        this.virtualGamepad.appendChild(up);
        this.virtualGamepad.appendChild(down);
        this.virtualGamepad.appendChild(left);
        this.virtualGamepad.appendChild(right);
        
        this.toggleVirtualGamepadLeftHanded = (enabled) => {
            left.classList.toggle("ejs_virtualGamepad_left", !enabled);
            right.classList.toggle("ejs_virtualGamepad_right", !enabled);
            left.classList.toggle("ejs_virtualGamepad_right", enabled);
            right.classList.toggle("ejs_virtualGamepad_left", enabled);
        }
        
        const leftHandedMode = false;
        const blockCSS = 'height:31px;text-align:center;border:1px solid #ccc;border-radius:5px;line-height:31px;';
        
        for (let i=0; i<info.length; i++) {
            if (info[i].type !== 'button') continue;
            if (leftHandedMode && ['left', 'right'].includes(info[i].location)) {
                info[i].location = (info[i].location==='left') ? 'right' : 'left';
                const amnt = JSON.parse(JSON.stringify(info[i]));
                if (amnt.left) {
                    info[i].right = amnt.left;
                }
                if (amnt.right) {
                    info[i].left = amnt.right;
                }
            }
            let style = '';
            if (info[i].left) {
                style += 'left:'+info[i].left+(typeof info[i].left === 'number'?'px':'')+';';
            }
            if (info[i].right) {
                style += 'right:'+info[i].right+(typeof info[i].right === 'number'?'px':'')+';';
            }
            if (info[i].top) {
                style += 'top:'+info[i].top+(typeof info[i].top === 'number'?'px':'')+';';
            }
            if (!info[i].bold) {
                style += 'font-weight:normal;';
            } else if (info[i].bold) {
                style += 'font-weight:bold;';
            }
            info[i].fontSize = info[i].fontSize || 30;
            style += 'font-size:'+info[i].fontSize+'px;';
            if (info[i].block) {
                style += blockCSS;
            }
            if (['top', 'center', 'left', 'right'].includes(info[i].location)) {
                const button = this.createElement("div");
                button.style = style;
                button.innerText = info[i].text;
                button.classList.add("ejs_virtualGamepad_button");
                elems[info[i].location].appendChild(button);
                const value = info[i].input_new_cores || info[i].input_value;
                this.addEventListener(button, "touchstart touchend touchcancel", (e) => {
                    e.preventDefault();
                    if (e.type === 'touchend' || e.type === 'touchcancel') {
                        e.target.classList.remove("ejs_virtualGamepad_button_down");
                        window.setTimeout(() => {
                            this.gameManager.simulateInput(0, value, 0);
                        })
                    } else {
                        e.target.classList.add("ejs_virtualGamepad_button_down");
                        this.gameManager.simulateInput(0, value, 1);
                    }
                })
            }
        }
        
        const createDPad = (opts) => {
            const container = opts.container;
            const callback = opts.event;
            const dpadMain = this.createElement("div");
            dpadMain.classList.add("ejs_dpad_main");
            const vertical = this.createElement("div");
            vertical.classList.add("ejs_dpad_vertical");
            const horizontal = this.createElement("div");
            horizontal.classList.add("ejs_dpad_horizontal");
            const bar1 = this.createElement("div");
            bar1.classList.add("ejs_dpad_bar");
            const bar2 = this.createElement("div");
            bar2.classList.add("ejs_dpad_bar");
            
            horizontal.appendChild(bar1);
            vertical.appendChild(bar2);
            dpadMain.appendChild(vertical);
            dpadMain.appendChild(horizontal);
            
            const updateCb = (e) => {
                e.preventDefault();
                const touch = e.targetTouches[0];
                if (!touch) return;
                const rect = dpadMain.getBoundingClientRect();
                const x = touch.clientX - rect.left - dpadMain.clientWidth / 2;
                const y = touch.clientY - rect.top - dpadMain.clientHeight / 2;
                let up = 0,
                    down = 0,
                    left = 0,
                    right = 0,
                    angle = Math.atan(x / y) / (Math.PI / 180);
                
                if (y <= -10) {
                    up = 1;
                }
                if (y >= 10) {
                    down = 1;
                }
                
                if (x >= 10) {
                    right = 1;
                    left = 0;
                    if (angle < 0 && angle >= -35 || angle > 0 && angle <= 35) {
                        right = 0;
                    }
                    up = (angle < 0 && angle >= -55 ? 1 : 0);
                    down = (angle > 0 && angle <= 55 ? 1 : 0);
                }
                
                if (x <= -10) {
                    right = 0;
                    left = 1;
                    if (angle < 0 && angle >= -35 || angle > 0 && angle <= 35) {
                        left = 0;
                    }
                    up = (angle > 0 && angle <= 55 ? 1 : 0);
                    down = (angle < 0 && angle >= -55 ? 1 : 0);
                }
                
                dpadMain.classList.toggle("ejs_dpad_up_pressed", up);
                dpadMain.classList.toggle("ejs_dpad_down_pressed", down);
                dpadMain.classList.toggle("ejs_dpad_right_pressed", right);
                dpadMain.classList.toggle("ejs_dpad_left_pressed", left);
                
                callback(up, down, left, right);
            }
            const cancelCb = (e) => {
                e.preventDefault();
                dpadMain.classList.remove("ejs_dpad_up_pressed");
                dpadMain.classList.remove("ejs_dpad_down_pressed");
                dpadMain.classList.remove("ejs_dpad_right_pressed");
                dpadMain.classList.remove("ejs_dpad_left_pressed");
                
                callback(0, 0, 0, 0);
            }
            
            this.addEventListener(dpadMain, 'touchstart touchmove', updateCb);
            this.addEventListener(dpadMain, 'touchend touchcancel', cancelCb);
            
            
            container.appendChild(dpadMain);
        }
        
        info.forEach((dpad, index) => {
            if (dpad.type !== 'dpad') return;
            if (leftHandedMode && ['left', 'right'].includes(dpad.location)) {
                dpad.location = (dpad.location==='left') ? 'right' : 'left';
                const amnt = JSON.parse(JSON.stringify(dpad));
                if (amnt.left) {
                    dpad.right = amnt.left;
                }
                if (amnt.right) {
                    dpad.left = amnt.right;
                }
            }
            const elem = this.createElement("div");
            let style = '';
            if (dpad.left) {
                style += 'left:'+dpad.left+';';
            }
            if (dpad.right) {
                style += 'right:'+dpad.right+';';
            }
            if (dpad.top) {
                style += 'top:'+dpad.top+';';
            }
            elem.style = style;
            elems[dpad.location].appendChild(elem);
            createDPad({container: elem, event: (up, down, left, right) => {
                if (dpad.joystickInput) {
                    if (up === 1) up=0x7fff;
                    if (down === 1) up=0x7fff;
                    if (left === 1) up=0x7fff;
                    if (right === 1) up=0x7fff;
                }
                this.gameManager.simulateInput(0, dpad.inputValues[0], up);
                this.gameManager.simulateInput(0, dpad.inputValues[1], down);
                this.gameManager.simulateInput(0, dpad.inputValues[2], left);
                this.gameManager.simulateInput(0, dpad.inputValues[3], right);
            }});
        })
        
        
        info.forEach((zone, index) => {
            if (zone.type !== 'zone') return;
            if (leftHandedMode && ['left', 'right'].includes(zone.location)) {
                zone.location = (zone.location==='left') ? 'right' : 'left';
                const amnt = JSON.parse(JSON.stringify(zone));
                if (amnt.left) {
                    zone.right = amnt.left;
                }
                if (amnt.right) {
                    zone.left = amnt.right;
                }
            }
            const elem = this.createElement("div");
            this.addEventListener(elem, "touchstart touchmove touchend touchcancel", (e) => {
                e.preventDefault();
            });
            elems[zone.location].appendChild(elem);
            const zoneObj = nipplejs.create({
                'zone': elem,
                'mode': 'static',
                'position': {
                    'left': zone.left,
                    'top': zone.top
                },
                'color': zone.color || 'red'
            });
            zoneObj.on('end', () => {
                this.gameManager.simulateInput(0, zone.inputValues[0], 0);
                this.gameManager.simulateInput(0, zone.inputValues[1], 0);
                this.gameManager.simulateInput(0, zone.inputValues[2], 0);
                this.gameManager.simulateInput(0, zone.inputValues[3], 0);
            });
            zoneObj.on('move', (e, info) => {
                const degree = info.angle.degree;
                const distance = info.distance;
                if (zone.joystickInput === true) {
                    let x = 0, y = 0;
                    if (degree > 0 && degree <= 45) {
                        x = distance / 50;
                        y = -0.022222222222222223 * degree * distance / 50;
                    }
                    if (degree > 45 && degree <= 90) {
                        x = 0.022222222222222223 * (90 - degree) * distance / 50;
                        y = -distance / 50;
                    }
                    if (degree > 90 && degree <= 135) {
                        x = 0.022222222222222223 * (90 - degree) * distance / 50;
                        y = -distance / 50;
                    }
                    if (degree > 135 && degree <= 180) {
                        x = -distance / 50;
                        y = -0.022222222222222223 * (180 - degree) * distance / 50;
                    }
                    if (degree > 135 && degree <= 225) {
                        x = -distance / 50;
                        y = -0.022222222222222223 * (180 - degree) * distance / 50;
                    }
                    if (degree > 225 && degree <= 270) {
                        x = -0.022222222222222223 * (270 - degree) * distance / 50;
                        y = distance / 50;
                    }
                    if (degree > 270 && degree <= 315) {
                        x = -0.022222222222222223 * (270 - degree) * distance / 50;
                        y = distance / 50;
                    }
                    if (degree > 315 && degree <= 359.9) {
                        x = distance / 50;
                        y = 0.022222222222222223 * (360 - degree) * distance / 50;
                    }
                    if (x > 0) {
                        this.gameManager.simulateInput(0, zone.inputValues[0], 0x7fff * x);
                        this.gameManager.simulateInput(0, zone.inputValues[1], 0);
                    } else {
                        this.gameManager.simulateInput(0, zone.inputValues[1], 0x7fff * -x);
                        this.gameManager.simulateInput(0, zone.inputValues[0], 0);
                    }
                    if (y > 0) {
                        this.gameManager.simulateInput(0, zone.inputValues[2], 0x7fff * y);
                        this.gameManager.simulateInput(0, zone.inputValues[3], 0);
                    } else {
                        this.gameManager.simulateInput(0, zone.inputValues[3], 0x7fff * -y);
                        this.gameManager.simulateInput(0, zone.inputValues[2], 0);
                    }
                    
                } else {
                    if (degree >= 30 && degree < 150) {
                        this.gameManager.simulateInput(0, zone.inputValues[0], 1);
                    } else {
                        window.setTimeout(() => {
                            this.gameManager.simulateInput(0, zone.inputValues[0], 0);
                        }, 30);
                    }
                    if (degree >= 210 && degree < 330) {
                        this.gameManager.simulateInput(0, zone.inputValues[1], 1);
                    } else {
                        window.setTimeout(() => {
                            this.gameManager.simulateInput(0, zone.inputValues[1], 0);
                        }, 30);
                    }
                    if (degree >= 120 && degree < 240) {
                        this.gameManager.simulateInput(0, zone.inputValues[2], 1);
                    } else {
                        window.setTimeout(() => {
                            this.gameManager.simulateInput(0, zone.inputValues[2], 0);
                        }, 30);
                    }
                    if (degree >= 300 || degree >= 0 && degree < 60) {
                        this.gameManager.simulateInput(0, zone.inputValues[3], 1);
                    } else {
                        window.setTimeout(() => {
                            this.gameManager.simulateInput(0, zone.inputValues[3], 0);
                        }, 30);
                    }
                }
            });
        })
        
    }
    handleResize() {
        if (!this.Module) return;
        const dpr = window.devicePixelRatio || 1;
        const positionInfo = this.elements.parent.getBoundingClientRect();
        const width = positionInfo.width * dpr;
        const height = (positionInfo.height * dpr);
        this.Module.setCanvasSize(width, height);
    }
    getElementSize(element) {
        let elem = element.cloneNode(true);
        elem.style.position = 'absolute';
        elem.style.opacity = 0;
        elem.removeAttribute('hidden');
        element.parentNode.appendChild(elem);
        let width = elem.scrollWidth,
            height = elem.scrollHeight;
        elem.remove();
        return {
            'width': width,
            'height': height
        };
    }
    saveSettings() {
        if (!window.localStorage || !this.settingsLoaded) return;
        const coreSpecific = {
            controlSettings: this.controls,
            settings: this.settings,
            cheats: this.cheats
        }
        const ejs_settings = {
            volume: this.volume,
            muted: this.muted
        }
        localStorage.setItem("ejs-settings", JSON.stringify(ejs_settings));
        localStorage.setItem("ejs-"+this.getCore()+"-settings", JSON.stringify(coreSpecific));
    }
    loadSettings() {
        if (!window.localStorage) return;
        this.settingsLoaded = true;
        let ejs_settings = localStorage.getItem("ejs-settings");
        let coreSpecific = localStorage.getItem("ejs-"+this.getCore()+"-settings");
        if (coreSpecific) {
            try {
                coreSpecific = JSON.parse(coreSpecific);
                if (!(coreSpecific.controlSettings instanceof Object) || !(coreSpecific.settings instanceof Object) || !Array.isArray(coreSpecific.cheats)) return;
                this.controls = coreSpecific.controlSettings;
                this.checkGamepadInputs();
                for (const k in coreSpecific.settings) {
                    this.changeSettingOption(k, coreSpecific.settings[k]);
                }
                for (let i=0; i<coreSpecific.cheats.length; i++) {
                    const cheat = coreSpecific.cheats[i];
                    let includes = false;
                    for (let j=0; j<this.cheats.length; j++) {
                        if (this.cheats[j].desc === cheat.desc && this.cheats[j].code === cheat.code) {
                            this.cheats[j].checked = cheat.checked;
                            includes = true;
                            break;
                        }
                    }
                    if (includes) continue;
                    this.cheats.push(cheat);
                }
                
            } catch(e) {
                console.warn("Could not load previous settings", e);
            }
        }
        if (ejs_settings) {
            try {
                ejs_settings = JSON.parse(ejs_settings);
                if (typeof ejs_settings.volume !== "number" || typeof ejs_settings.muted !== "boolean") return;
                this.volume = ejs_settings.volume;
                this.muted = ejs_settings.muted;
                this.setVolume(this.muted ? 0 : this.volume);
            } catch(e) {
                console.warn("Could not load previous settings", e);
            }
        }
    }
    menuOptionChanged(option, value) {
        this.saveSettings();
        console.log(option, value);
        if (option === "shader") {
            try {
                this.Module.FS.unlink("/shader/shader.glslp");
            } catch(e) {}
            if (value === "disabled") {
                this.gameManager.toggleShader(0);
                return;
            }
            this.Module.FS.writeFile("/shader/shader.glslp", window.EJS_SHADERS[value]);
            this.gameManager.toggleShader(1);
            return;
        } else if (option === "disk") {
            this.gameManager.setCurrentDisk(value);
            return;
        } else if (option === "virtual-gamepad") {
            this.toggleVirtualGamepad(value !== "disabled");
        } else if (option === "virtual-gamepad-left-handed-mode") {
            this.toggleVirtualGamepadLeftHanded(value !== "disabled");
        }
        this.gameManager.setVariable(option, value);
    }
    setupSettingsMenu() {
        this.settingsMenu = this.createElement("div");
        this.addEventListener(this.settingsMenu, "click", (e) => {
            this.settingsJustClicked = true;
        })
        this.settingsMenu.classList.add("ejs_settings_parent");
        const nested = this.createElement("div");
        nested.classList.add("ejs_settings_transition");
        this.settings = {};
        
        const home = this.createElement("div");
        home.classList.add("ejs_setting_home");
        home.classList.add("ejs_setting_menu");
        nested.appendChild(home);
        let funcs = [];
        this.changeSettingOption = (title, newValue) => {
            this.settings[title] = newValue;
            funcs.forEach(e => e(title));
        }
        let allOpts = {};
        
        const addToMenu = (title, id, options, defaultOption) => {
            const menuOption = this.createElement("div");
            menuOption.classList.add("ejs_settings_main_bar");
            const span = this.createElement("span");
            span.innerText = title;
            
            const current = this.createElement("div");
            current.innerText = "";
            current.classList.add("ejs_settings_main_bar_selected");
            span.appendChild(current);
            
            menuOption.appendChild(span);
            home.appendChild(menuOption);
            
            const menu = this.createElement("div");
            menu.style["max-height"] = "300px";
            menu.style.overflow  = "auto";
            menu.setAttribute("hidden", "");
            const button = this.createElement("button");
            const goToHome = () => {
                const homeSize = this.getElementSize(home);
                nested.style.width = (homeSize.width+20) + "px";
                nested.style.height = homeSize.height + "px";
                menu.setAttribute("hidden", "");
                home.removeAttribute("hidden");
            }
            this.addEventListener(menuOption, "click", (e) => {
                const targetSize = this.getElementSize(menu);
                nested.style.width = (targetSize.width+20) + "px";
                nested.style.height = targetSize.height + "px";
                menu.removeAttribute("hidden");
                home.setAttribute("hidden", "");
            })
            this.addEventListener(button, "click", goToHome);
            
            button.type = "button";
            button.classList.add("ejs_back_button");
            menu.appendChild(button);
            const pageTitle = this.createElement("span");
            pageTitle.innerText = title;
            pageTitle.classList.add("ejs_menu_text_a");
            button.appendChild(pageTitle);
            
            const optionsMenu = this.createElement("div");
            optionsMenu.classList.add("ejs_setting_menu");
            //optionsMenu.style["max-height"] = "385px";
            //optionsMenu.style.overflow  = "auto";
            
            let buttons = [];
            let opts = options;
            if (Array.isArray(options)) {
                opts = {};
                for (let i=0; i<options.length; i++) {
                    opts[options[i]] = options[i];
                }
            }
            allOpts[id] = opts;
            
            funcs.push((title) => {
                if (id !== title) return;
                for (let j=0; j<buttons.length; j++) {
                    buttons[j].classList.toggle("ejs_option_row_selected", buttons[j].getAttribute("ejs_value") === this.settings[id]);
                }
                this.menuOptionChanged(id, this.settings[id]);
                current.innerText = opts[this.settings[id]];
            });
            
            for (const opt in opts) {
                const optionButton = this.createElement("button");
                buttons.push(optionButton);
                optionButton.setAttribute("ejs_value", opt);
                optionButton.type = "button";
                optionButton.value = opts[opt];
                optionButton.classList.add("ejs_option_row");
                optionButton.classList.add("ejs_button_style");
                
                this.addEventListener(optionButton, "click", (e) => {
                    this.settings[id] = opt;
                    for (let j=0; j<buttons.length; j++) {
                        buttons[j].classList.remove("ejs_option_row_selected");
                    }
                    optionButton.classList.add("ejs_option_row_selected");
                    this.menuOptionChanged(id, opt);
                    current.innerText = opts[opt];
                    goToHome();
                })
                if (defaultOption === opt) {
                    optionButton.classList.add("ejs_option_row_selected");
                    this.menuOptionChanged(id, opt);
                    current.innerText = opts[opt];
                }
                
                const msg = this.createElement("span");
                msg.innerText = opts[opt];
                optionButton.appendChild(msg);
                
                optionsMenu.appendChild(optionButton);
            }
            
            menu.appendChild(optionsMenu);
            
            nested.appendChild(menu);
        }
        //addToMenu("Test", 'test', {a:1, b:2, c:3}, 2);
        //addToMenu("Test2", 'test_2', [4, 5, 6]);
        //addToMenu("Testertthgfd", 'booger', [7, 8, 9]);
        
        if (this.gameManager.getDiskCount() > 1) {
            const diskLabels = {};
            for (let i=0; i<this.gameManager.getDiskCount(); i++) {
                diskLabels[i.toString()] = "Disk "+(i+1);
            }
            addToMenu(this.localization("Disk"), "disk", diskLabels, this.gameManager.getCurrentDisk().toString());
        }
        
        if (window.EJS_SHADERS) {
            addToMenu(this.localization('Shaders'), 'shader', {
                'disabled': this.localization("Disabled"),
                '2xScaleHQ.glslp': this.localization("2xScaleHQ"),
                '4xScaleHQ.glslp': this.localization("4xScaleHQ"),
                'crt-easymode.glslp': this.localization('CRT easymode'),
                'crt-aperture.glslp': this.localization('CRT aperture'),
                'crt-geom.glslp': this.localization('CRT geom'),
                'crt-mattias.glslp': this.localization('CRT mattias')
            }, 'disabled');
        }
        
        addToMenu(this.localization('FPS'), 'fps', {
            'show': this.localization("show"),
            'hide': this.localization("hide")
        }, 'hide');
        
        if (this.saveInBrowserSupported()) {
            addToMenu(this.localization('Save State Slot'), 'save-state-slot', ["1", "2", "3", "4", "5", "6", "7", "8", "9"], "1");
            addToMenu(this.localization('Save State Location'), 'save-state-location', {
                'download': this.localization("Download"),
                'browser': this.localization("Keep in Browser")
            }, 'download');
        }
        
        if (this.touch) {
            addToMenu(this.localization('Virtual Gamepad'), 'virtual-gamepad', {
                'enabled': this.localization("Enabled"),
                'disabled': this.localization("Disabled")
            }, 'enabled');
            addToMenu(this.localization('Left Handed Mode'), 'virtual-gamepad-left-handed-mode', {
                'enabled': this.localization("Enabled"),
                'disabled': this.localization("Disabled")
            }, 'disabled');
        }
        
        this.gameManager.getCoreOptions().split('\n').forEach((line, index) => {
            let option = line.split('; ');
            let name = option[0];
            let options = option[1].split('|'),
                optionName = name.split("|")[0].replace(/_/g, ' ').replace(/.+\-(.+)/, '$1');
            options.slice(1, -1);
            if (options.length === 1) return;
            let availableOptions = {};
            for (let i=0; i<options.length; i++) {
                availableOptions[options[i]] = this.localization(options[i]);
            }
            addToMenu(this.localization(optionName),
                      name.split("|")[0], availableOptions,
                      (name.split("|").length > 1) ? name.split("|")[1] : options[0].replace('(Default) ', ''));
        })
        
        this.settingsMenu.appendChild(nested);
        
        this.settingParent.appendChild(this.settingsMenu);
        this.settingParent.style.position = "relative";
        
        const homeSize = this.getElementSize(home);
        nested.style.width = (homeSize.width+20) + "px";
        nested.style.height = homeSize.height + "px";
        
        this.settingsMenu.style.display = "none";
        
        if (this.debug) {
            console.log("Available core options", allOpts);
        }
        
        if (this.config.defaultOptions) {
            for (const k in this.config.defaultOptions) {
                this.changeSettingOption(k, this.config.defaultOptions[k]);
            }
        }
    }
    createSubPopup(hidden) {
        const popup = this.createElement('div');
        popup.classList.add("ejs_popup_container");
        popup.classList.add("ejs_popup_container_box");
        const popupMsg = this.createElement("div");
        popupMsg.innerText = "";
        if (hidden) popup.setAttribute("hidden", "");
        popup.appendChild(popupMsg);
        return [popup, popupMsg];
    }
    createCheatsMenu() {
        const body = this.createPopup("Cheats", {
            "Add Cheat": () => {
                const popups = this.createSubPopup();
                this.cheatMenu.appendChild(popups[0]);
                popups[1].classList.add("ejs_cheat_parent");
                popups[1].style.width = "100%";
                const popup = popups[1];
                const header = this.createElement("div");
                header.classList.add("ejs_cheat_header");
                const title = this.createElement("h2");
                title.innerText = this.localization("Add Cheat Code");
                title.classList.add("ejs_cheat_heading");
                const close = this.createElement("button");
                close.classList.add("ejs_cheat_close");
                header.appendChild(title);
                header.appendChild(close);
                popup.appendChild(header);
                this.addEventListener(close, "click", (e) => {
                    popups[0].remove();
                })
                
                const main = this.createElement("div");
                main.classList.add("ejs_cheat_main");
                const header3 = this.createElement("strong");
                header3.innerText = this.localization("Code");
                main.appendChild(header3);
                main.appendChild(this.createElement("br"));
                const mainText = this.createElement("textarea");
                mainText.classList.add("ejs_cheat_code");
                mainText.style.width = "100%";
                mainText.style.height = "80px";
                main.appendChild(mainText);
                main.appendChild(this.createElement("br"));
                const header2 = this.createElement("strong");
                header2.innerText = this.localization("Description");
                main.appendChild(header2);
                main.appendChild(this.createElement("br"));
                const mainText2 = this.createElement("input");
                mainText2.type = "text";
                mainText2.classList.add("ejs_cheat_code");
                main.appendChild(mainText2);
                main.appendChild(this.createElement("br"));
                popup.appendChild(main);
                
                const footer = this.createElement("footer");
                const submit = this.createElement("button");
                const closeButton = this.createElement("button");
                submit.innerText = this.localization("Submit");
                closeButton.innerText = this.localization("Close");
                submit.classList.add("ejs_button_button");
                closeButton.classList.add("ejs_button_button");
                submit.classList.add("ejs_popup_submit");
                closeButton.classList.add("ejs_popup_submit");
                submit.style["background-color"] = "rgba(var(--ejs-primary-color),1)";
                footer.appendChild(submit);
                const span = this.createElement("span");
                span.innerText = " ";
                footer.appendChild(span);
                footer.appendChild(closeButton);
                popup.appendChild(footer);
                
                this.addEventListener(submit, "click", (e) => {
                    if (!mainText.value.trim() || !mainText2.value.trim()) return;
                    popups[0].remove();
                    this.cheats.push({
                        code: mainText.value,
                        desc: mainText2.value,
                        checked: false
                    });
                    this.updateCheatUI();
                    this.saveSettings();
                })
                this.addEventListener(closeButton, "click", (e) => {
                    popups[0].remove();
                })
                
            },
            "Close": () => {
                this.cheatMenu.style.display = "none";
            }
        }, true);
        this.cheatMenu = body.parentElement;
        const rows = this.createElement("div");
        body.appendChild(rows);
        rows.classList.add("ejs_cheat_rows");
        this.elements.cheatRows = rows;
    }
    updateCheatUI() {
        this.elements.cheatRows.innerHTML = "";
        
        const addToMenu = (desc, checked, code, i) => {
            const row = this.createElement("div");
            row.classList.add("ejs_cheat_row");
            const input = this.createElement("input");
            input.type = "checkbox";
            input.checked = checked;
            input.value = i;
            input.id = "ejs_cheat_switch_"+i;
            row.appendChild(input);
            const label = this.createElement("label");
            label.for = "ejs_cheat_switch_"+i;
            label.innerText = desc;
            row.appendChild(label);
            label.addEventListener("click", (e) => {
                input.checked = !input.checked;
                this.cheats[i].checked = input.checked;
                this.cheatChanged(input.checked, code, i);
                this.saveSettings();
            })
            const close = this.createElement("a");
            close.classList.add("ejs_cheat_row_button");
            close.innerText = "×";
            row.appendChild(close);
            
            this.elements.cheatRows.appendChild(row);
            this.cheatChanged(checked, code, i);
            
        }
        this.gameManager.resetCheat();
        for (let i=0; i<this.cheats.length; i++) {
            addToMenu(this.cheats[i].desc, this.cheats[i].checked, this.cheats[i].code, i);
        }
    }
    cheatChanged(checked, code, index) {
        this.gameManager.setCheat(index, checked, code);
    }
}