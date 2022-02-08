"use strict";
exports.__esModule = true;
require("@jxa/global-type");
var run_1 = require("@jxa/run");
(0, run_1.run)(function () {
    // Setup
    var chrome = Application("Google Chrome");
    chrome.includeStandardAdditions = true;
    var app = Application.currentApplication();
    app.includeStandardAdditions = true;
    var events = Application("System Events");
    events.keystroke("c", {
        using: "command down"
    });
    delay(0.1);
    console.log(Array.from(chrome.theClipboard()));
    console.log(chrome.theClipboard());
    console.log(typeof chrome.theClipboard());
    console.log(JSON.stringify(chrome.clipboardInfo()));
    // const activeTab = chrome.windows[0].activeTab;
    // chrome.copySelection(activeTab);
});
