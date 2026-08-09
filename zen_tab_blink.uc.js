// ==UserScript==
// @name           Zen Tab Blink
// @description    Visual blink when opening a tab.
// @author         suremiur
// @include        main
// ==/UserScript==

(() => {

    function getPref(key, type, defaultValue) {
        try {
            if (type === "string") return Services.prefs.getStringPref(key);
            if (type === "int") return Services.prefs.getIntPref(key);
        } catch (e) {
            if (type === "string") Services.prefs.setStringPref(key, defaultValue);
            if (type === "int") Services.prefs.setIntPref(key, defaultValue);
            return defaultValue;
        }
    }

    function onTabOpen(event) {
        const newTab = event.target;
        if (!newTab || newTab.localName !== 'tab') return;

        const targetInt = getPref("uc.zen.blink.target", "int", 0);
        
        let targetMode = "tab";
        if (targetInt === 1) targetMode = "panel";
        else if (targetInt === 2) targetMode = "screen";
        else if (targetInt === 3) targetMode = "urlbar";

        const color = getPref("uc.zen.blink.color", "string", "#ffffff");
        let opacityStr = getPref("uc.zen.blink.opacity", "string", "0.15");
        
        let opacity = parseFloat(opacityStr.replace(',', '.'));
        if (isNaN(opacity)) opacity = 0.15;

        const flash = document.createElement("div");
        flash.className = "zen-blink-injected-flash zen-blink-" + targetMode;
        
        flash.style.setProperty('--zen-blink-color', color);
        flash.style.setProperty('--zen-blink-opacity', opacity);

        let parentNode = null;

        if (targetMode === "tab") {
            parentNode = newTab.querySelector('.tab-background') || newTab;
        } 
        else if (targetMode === "panel") {
            parentNode = gBrowser.tabContainer;
        } 
        else if (targetMode === "screen") {
            parentNode = document.getElementById("browser") || document.documentElement;
        } 
        else if (targetMode === "urlbar") {
            parentNode = document.getElementById("urlbar-background") || document.getElementById("urlbar");
            if (parentNode) parentNode.style.position = "relative"; // Гарантируем правильное наложение
        }

        if (parentNode) {
            parentNode.appendChild(flash);
            setTimeout(() => {
                if (flash.isConnected) flash.remove();
            }, 400);
        }
    }

    function init() {
        if (window.__zenTabBlinkInit) return;
        window.__zenTabBlinkInit = true;

        const tc = gBrowser.tabContainer;
        if (tc) tc.addEventListener("TabOpen", onTabOpen);
    }

    if (typeof gBrowserInit !== "undefined" && gBrowserInit.delayedStartupFinished) {
        init();
    } else {
        const obs = (subject, topic) => {
            if (topic === 'browser-delayed-startup-finished' && subject === window) {
                Services.obs.removeObserver(obs, topic);
                init();
            }
        };
        Services.obs.addObserver(obs, 'browser-delayed-startup-finished');
    }
})();
