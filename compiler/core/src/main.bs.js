// Generated by BUCKLESCRIPT VERSION 2.1.0, PLEASE EDIT WITH CARE
'use strict';

var Fs                                   = require("fs");
var List                                 = require("bs-platform/lib/js/list.js");
var Glob                                 = require("glob");
var Path                                 = require("path");
var $$Array                              = require("bs-platform/lib/js/array.js");
var Js_exn                               = require("bs-platform/lib/js/js_exn.js");
var Process                              = require("process");
var FsExtra                              = require("fs-extra");
var Caml_array                           = require("bs-platform/lib/js/caml_array.js");
var Json_decode                          = require("bs-json/src/Json_decode.js");
var Color$LonaCompilerCore               = require("./core/color.bs.js");
var Decode$LonaCompilerCore              = require("./core/decode.bs.js");
var TextStyle$LonaCompilerCore           = require("./core/textStyle.bs.js");
var SwiftColor$LonaCompilerCore          = require("./swift/swiftColor.bs.js");
var SwiftRender$LonaCompilerCore         = require("./swift/swiftRender.bs.js");
var SwiftComponent$LonaCompilerCore      = require("./swift/swiftComponent.bs.js");
var SwiftTextStyle$LonaCompilerCore      = require("./swift/swiftTextStyle.bs.js");
var JavaScriptRender$LonaCompilerCore    = require("./javaScript/javaScriptRender.bs.js");
var JavaScriptComponent$LonaCompilerCore = require("./javaScript/javaScriptComponent.bs.js");

function exit(message) {
  console.log(message);
  return (process.exit());
}

if (Process.argv.length < 3) {
  console.log("No command given");
  ((process.exit()));
}

var command = Caml_array.caml_array_get(Process.argv, 2);

if (Process.argv.length < 4) {
  console.log("No target given");
  ((process.exit()));
}

var match = Caml_array.caml_array_get(Process.argv, 3);

var target;

switch (match) {
  case "js" : 
      target = /* JavaScript */0;
      break;
  case "swift" : 
      target = /* Swift */1;
      break;
  default:
    console.log("Unrecognized target");
    target = (process.exit());
}

function findWorkspaceDirectory(_path) {
  while(true) {
    var path = _path;
    var exists = +Fs.existsSync(Path.join(path, "colors.json"));
    if (exists !== 0) {
      return /* Some */[path];
    } else {
      var parent = Path.dirname(path);
      if (parent === "/") {
        return /* None */0;
      } else {
        _path = parent;
        continue ;
        
      }
    }
  };
}

function concat(base, addition) {
  return Path.join(base, addition);
}

function getTargetExtension(param) {
  if (param !== 0) {
    return ".swift";
  } else {
    return ".js";
  }
}

var targetExtension = getTargetExtension(target);

function renderColors(target, colors) {
  if (target !== 0) {
    return SwiftColor$LonaCompilerCore.render(colors);
  } else {
    return "";
  }
}

function renderTextStyles(target, colors, textStyles) {
  if (target !== 0) {
    return SwiftTextStyle$LonaCompilerCore.render(colors, textStyles);
  } else {
    return "";
  }
}

function convertColors(target, filename) {
  return renderColors(target, Color$LonaCompilerCore.parseFile(filename));
}

function convertTextStyles(filename) {
  var match = findWorkspaceDirectory(filename);
  if (match) {
    var colors = Color$LonaCompilerCore.parseFile(Path.join(match[0], "textStyles.json"));
    return SwiftTextStyle$LonaCompilerCore.render(colors, TextStyle$LonaCompilerCore.parseFile(filename));
  } else {
    console.log("Couldn't find workspace directory. Try specifying it as a parameter (TODO)");
    return (process.exit());
  }
}

function convertComponent(filename) {
  var content = Fs.readFileSync(filename, "utf8");
  var parsed = JSON.parse(content);
  var name = Path.basename(filename, ".component");
  if (target !== 0) {
    var match = findWorkspaceDirectory(filename);
    if (match) {
      var workspace = match[0];
      var colors = Color$LonaCompilerCore.parseFile(Path.join(workspace, "colors.json"));
      var textStyles = TextStyle$LonaCompilerCore.parseFile(Path.join(workspace, "textStyles.json"));
      return SwiftRender$LonaCompilerCore.toString(SwiftComponent$LonaCompilerCore.generate(name, colors, textStyles, parsed));
    } else {
      console.log("Couldn't find workspace directory. Try specifying it as a parameter (TODO)");
      return (process.exit());
    }
  } else {
    return JavaScriptRender$LonaCompilerCore.toString(JavaScriptComponent$LonaCompilerCore.generate(name, parsed));
  }
}

function copyStaticFiles(outputDirectory) {
  if (target !== 0) {
    var base = __dirname;
    FsExtra.copySync(Path.join(base, "../static/swift/AttributedFont.swift"), Path.join(outputDirectory, "AttributedFont.swift"));
    return /* () */0;
  } else {
    return /* () */0;
  }
}

function convertWorkspace(workspace, output) {
  var fromDirectory = Path.resolve(workspace);
  var toDirectory = Path.resolve(output);
  FsExtra.ensureDirSync(toDirectory);
  var colorsInputPath = Path.join(fromDirectory, "colors.json");
  var colorsOutputPath = Path.join(toDirectory, "Colors" + targetExtension);
  var colors = Color$LonaCompilerCore.parseFile(colorsInputPath);
  Fs.writeFileSync(colorsOutputPath, renderColors(target, colors));
  var textStylesInputPath = Path.join(fromDirectory, "textStyles.json");
  var textStylesOutputPath = Path.join(toDirectory, "TextStyles" + targetExtension);
  var textStyles = renderTextStyles(target, colors, TextStyle$LonaCompilerCore.parseFile(textStylesInputPath));
  Fs.writeFileSync(textStylesOutputPath, textStyles);
  copyStaticFiles(toDirectory);
  Glob(Path.join(fromDirectory, "**/*.component"), (function (_, files) {
          var files$1 = $$Array.to_list(files);
          var processFile = function (file) {
            var fromRelativePath = Path.relative(fromDirectory, file);
            var addition = Path.basename(fromRelativePath, ".component");
            var base = Path.dirname(fromRelativePath);
            var toRelativePath = Path.join(base, addition) + targetExtension;
            var outputPath = Path.join(toDirectory, toRelativePath);
            console.log(Path.join(workspace, fromRelativePath) + ("=>" + Path.join(output, toRelativePath)));
            var exit = 0;
            var content;
            try {
              content = convertComponent(file);
              exit = 1;
            }
            catch (raw_exn){
              var exn = Js_exn.internalToOCamlException(raw_exn);
              if (exn[0] === Json_decode.DecodeError) {
                console.log("Failed to decode " + file);
                console.log(exn[1]);
                return /* () */0;
              } else if (exn[0] === Decode$LonaCompilerCore.UnknownParameter) {
                console.log("Unknown parameter: " + exn[1]);
                return /* () */0;
              } else {
                throw exn;
              }
            }
            if (exit === 1) {
              FsExtra.ensureDirSync(Path.dirname(outputPath));
              Fs.writeFileSync(outputPath, content);
              return /* () */0;
            }
            
          };
          return List.iter(processFile, files$1);
        }));
  return /* () */0;
}

switch (command) {
  case "colors" : 
      if (Process.argv.length < 5) {
        console.log("No filename given");
        ((process.exit()));
      }
      var filename = Caml_array.caml_array_get(Process.argv, 4);
      console.log(renderColors(target, Color$LonaCompilerCore.parseFile(filename)));
      break;
  case "component" : 
      if (Process.argv.length < 5) {
        console.log("No filename given");
        ((process.exit()));
      }
      console.log(convertComponent(Caml_array.caml_array_get(Process.argv, 4)));
      break;
  case "workspace" : 
      if (Process.argv.length < 5) {
        console.log("No workspace path given");
        ((process.exit()));
      }
      if (Process.argv.length < 6) {
        console.log("No output path given");
        ((process.exit()));
      }
      convertWorkspace(Caml_array.caml_array_get(Process.argv, 4), Caml_array.caml_array_get(Process.argv, 5));
      break;
  default:
    console.log("Invalid command", command);
}

exports.exit                   = exit;
exports.command                = command;
exports.target                 = target;
exports.findWorkspaceDirectory = findWorkspaceDirectory;
exports.concat                 = concat;
exports.getTargetExtension     = getTargetExtension;
exports.targetExtension        = targetExtension;
exports.renderColors           = renderColors;
exports.renderTextStyles       = renderTextStyles;
exports.convertColors          = convertColors;
exports.convertTextStyles      = convertTextStyles;
exports.convertComponent       = convertComponent;
exports.copyStaticFiles        = copyStaticFiles;
exports.convertWorkspace       = convertWorkspace;
/*  Not a pure module */
