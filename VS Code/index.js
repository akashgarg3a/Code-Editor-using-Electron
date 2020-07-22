const $ = jQuery = require('jquery');
require('jstree');
require('jquery-ui-dist/jquery-ui')
const nodepath = require('path');
const fs = require('fs');
let tabs = $('#tabs').tabs();
let editor;

var os = require('os');
var pty = require('node-pty');
var Terminal = require('xterm').Terminal;

// Initialize node-pty with an appropriate shell
const shell = process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL'];
const ptyProcess = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.cwd(),
  env: process.env
});

// Initialize xterm.js and attach it to the DOM
const xterm = new Terminal();
xterm.open(document.getElementById('terminal'));

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
            "data": data
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
        // alert("node_id: " + data.node.id);
        updateEditor(data.node.id);
    });
})

function addTab(path) {
    let label = getNameFormat(path);
    let id = path;
    let tabTemplate =  "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>";
    let li = $(tabTemplate.replace(/#\{href\}/g, "#" + id).replace(/#\{label\}/g, label));

    tabs.find(".ui-tabs-nav").append(li);
    tabs.append("<div id='" + id + "'></div>");
    tabs.tabs("refresh");
}

function updateEditor(path) {
    if (fs.lstatSync(path).isDirectory()) return;
    let fileName = getNameFormat(path);
    addTab(path);
    let fileExtension = fileName.split('.')[1];

    if (fileExtension === "js")
        fileExtension = 'javascript';

    let data = fs.readFileSync(path).toString();
    monaco.editor.setModelLanguage(editor.getModel(), fileExtension);
    editor.setValue(data);

    tabs.on( "click", "span.ui-icon-close", function() {
        var panelId = $( this ).closest( "li" ).remove();
        // $( "#" + panelId ).remove();
        tabs.tabs( "refresh" );
      });
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
            var editor = monaco.editor.create(document.getElementById('editor'), {
                value: [
                    'function x() {',
                    '\tconsole.log("Hello world!");',
                    '}'
                ].join('\n'),
                language: 'javascript'
            });
            resolve(editor);
        });
    });
}