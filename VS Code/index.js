const $ = jQuery = require('jquery');
require('jstree');
require('jquery-ui-dist/jquery-ui')
const nodepath = require('path');
const fs = require('fs');
var os = require('os');
var pty = require('node-pty');
var Terminal = require('xterm').Terminal;
const { FitAddon } = require("xterm-addon-fit");

// Initialize node-pty with an appropriate shell
const shell = process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL'];
const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.cwd(),
    env: process.env
});


let tabs = $('#tabs').tabs();
let editor;

// Initialize xterm.js and attach it to the DOM
const xterm = new Terminal({
    fontSize: 12
});

xterm.setOption('theme', {
    background: "#764ba2",
    foreground: "white",
});
const fitAddon = new FitAddon();
xterm.loadAddon(fitAddon);
xterm.open(document.getElementById('terminal'));
fitAddon.fit();
// Setup communication between xterm.js and node-pty
xterm.onData(data => ptyProcess.write(data));
ptyProcess.on('data', function (data) {
    xterm.write(data);
});

$(document).ready(async function () {

    editor = await createEditor();
    let currpath = process.cwd();
    let data = [];
    let baseobj = {
        id: currpath,
        parent: '#',
        text: getNameFormat(currpath)
    }

    $('#explorer').resize();

    data.push(baseobj);
    let currChildren = getCurrDirectories(currpath);
    data = data.concat(currChildren);

    $('#jstree').jstree({
        "core": {
            "check_callback": true,
            "data": data,
            "themes": {
                "icons": false
            }
        }
    }).on('open_node.jstree', function (e, data) {
        data.node.children.forEach(function (child) {

            let childDirectries = getCurrDirectories(child);
            childDirectries.forEach(function (directory) {
                if (($('#jstree').jstree(true).get_node(directory.id)) == false) {
                    $('#jstree').jstree().create_node(child, directory, "last");
                }
            })
        })
    }).on("select_node.jstree", function (e, data) {
        updateEditor(data.node.id);
        addTab(data.node.id);
    });
    tabs.on("click", "span.ui-icon-close", function () {
        deleteTab(this);
    });
    tabs.on('click','.ui-tabs-tab a',function(){
        let path=$(this).attr('href');
        clicked(path);
    })
})

function clicked(path) {
    updateEditor(path.substring(1));
}

function addTab(path) {
    if (fs.lstatSync(path).isDirectory()) return;
    let allpath = $('#tabs ul li a');
    for (let i = 0; i < allpath.length; i++) {
        if ($(allpath[i]).attr('unique') === path) {
            $("#tabs").tabs('option', 'active', i);
            return;
        }
    }

    let label = getNameFormat(path);
    let id = label;
    let tabTemplate = "<li><a href='#{href}'  unique='#{qwerty}'>#{label}</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>";
    let li = $(tabTemplate.replace(/#\{href\}/g, "#" + id).replace(/#\{label\}/g, label).replace(/#\{qwerty\}/g, path));
    // let obj ={"id" : li};
    tabs.find(".ui-tabs-nav").append(li);
    tabs.append("<div id='" + id + "'></div>");
    tabs.tabs("refresh");
    let x = $('#tabs li').length - 1;
    $("#tabs").tabs('option', 'active', x);
}

function updateEditor(path) {
    if (fs.lstatSync(path).isDirectory()) return;

    let fileName = getNameFormat(path);
    let fileExtension = fileName.split('.')[1];

    if (fileExtension === "js")
        fileExtension = 'javascript';

    let data = fs.readFileSync(path).toString();
    monaco.editor.setModelLanguage(editor.getModel(), fileExtension);
    editor.setValue(data);

}

function deleteTab(obj) {
    var panelId = $(obj).closest("li").remove();
    tabs.tabs("refresh");
    if ($('#tabs ul li a').length == 0) {
        editor.setValue("");
        return;

    } else {
        $("#tabs").tabs('option', 'active', 0);
        updateEditor($('#tabs ul li a').attr('unique'));
    }
}

function getCurrDirectories(path) {
    if (fs.lstatSync(path).isFile()) {
        return [];
    }

    let files = fs.readdirSync(path);

    let rv = [];
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        rv.push({
            id: nodepath.join(path, file),
            parent: path,
            text: file
        })
    }
    return rv;
}

function getNameFormat(path) {
    return nodepath.basename(path);
}

function createEditor() {
    return new Promise(function (resolve, reject) {
        let monacoLoader = require("./node_modules/monaco-editor/min/vs/loader.js");
        monacoLoader.require.config({ paths: { 'vs': './node_modules/monaco-editor/min/vs' } });
        monacoLoader.require(['vs/editor/editor.main'], function () {
            monaco.editor.defineTheme('myTheme', {
                base: 'vs-dark',
                inherit: true,
                rules: [{ background: '#1e2024' }],
                "colors": {
                    "editor.foreground": "#F8F8F8",
                    "editor.background": "#1e2024",
                    "editor.selectionBackground": "#DDF0FF33",
                    "editor.lineHighlightBackground": "#FFFFFF08",
                    "editorCursor.foreground": "#A7A7A7",
                    "editorWhitespace.foreground": "#FFFFFF40"
                }
            });
            monaco.editor.setTheme('myTheme');
            var editor = monaco.editor.create(document.getElementById('editor'), {
                value: [
                    'function x() {',
                    '\tconsole.log("Hello world!");',
                    '}'
                ].join('\n'),
                language: 'javascript',
                theme: "myTheme"
            });
            monEditor.onDidChangeModelContent(function (e) {
                let idx = 
                render();
            });
            resolve(editor);
        });
    });
}

function render() {

}