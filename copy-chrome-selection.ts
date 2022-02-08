import "@jxa/global-type";
import { run } from "@jxa/run";
import { GoogleChrome as Chrome } from "./Chrome";

run(() => {
  // Setup
  const chrome = Application<Chrome>("Google Chrome");
  chrome.includeStandardAdditions = true;
  const app = Application.currentApplication();
  app.includeStandardAdditions = true;
  const events = Application("System Events");
  events.keystroke("c", {
    using: "command down",
  });
  delay(0.1);
  // const activeTab = chrome.windows[0].activeTab;
  // chrome.copySelection(activeTab);
});
